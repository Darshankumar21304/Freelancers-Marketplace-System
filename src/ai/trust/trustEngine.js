/**
 * Central Trust & Fraud Scoring Engine
 * Combines Predefined Knowledge, Adaptive Learning, Signal Evaluators, and Puter NLP.
 * Produces deterministic, explainable Trust Score (0-100) and Fraud Risk (0-100).
 */

const fs = require('fs');
const path = require('path');
const { evaluateFreelancerSignals } = require('./freelancerSignals');
const { evaluateClientSignals } = require('./clientSignals');

const PREDEFINED_MODEL_PATH = path.join(__dirname, '../models/trust-risk-model.json');
const LEARNING_MODEL_PATH = path.join(__dirname, '../models/trust-learning-model.json');

// In-memory cache of score results with short TTL (60s) to prevent spamming DB on high-traffic lists
const scoreCache = new Map();
const SCORE_CACHE_TTL = 60 * 1000;

function getPredefinedModel() {
  try {
    return JSON.parse(fs.readFileSync(PREDEFINED_MODEL_PATH, 'utf8'));
  } catch (e) {
    return { freelancerSignals: {}, clientSignals: {}, positiveSignals: {} };
  }
}

function getLearningModel() {
  try {
    return JSON.parse(fs.readFileSync(LEARNING_MODEL_PATH, 'utf8'));
  } catch (e) {
    return { riskSignals: {}, totalAdminDecisions: 0 };
  }
}

function saveLearningModel(model) {
  try {
    fs.writeFileSync(LEARNING_MODEL_PATH, JSON.stringify(model, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error saving trust learning model:', e);
    return false;
  }
}

/**
 * Severity Multipliers
 */
const SEVERITY_MULTIPLIERS = {
  low: 0.8,
  medium: 1.0,
  high: 1.3,
  critical: 1.6
};

/**
 * Calculate Trust & Fraud Scores
 */
async function calculateUserTrustScore(user, profile, dbContext = {}, bypassCache = false) {
  if (!user) {
    return {
      trustScore: 80,
      fraudRiskScore: 10,
      riskLevel: 'low',
      isColdStart: true,
      signals: [],
      positiveSignals: [],
      evidenceSummary: 'Cold-start user profile with baseline trust.'
    };
  }

  const userIdStr = String(user._id || user.id || '');
  if (!bypassCache && userIdStr) {
    const cached = scoreCache.get(userIdStr);
    if (cached && (Date.now() - cached.timestamp < SCORE_CACHE_TTL)) {
      return cached.result;
    }
  }

  const predefinedModel = getPredefinedModel();
  const learningModel = getLearningModel();
  const role = (user.role || 'freelancer').toLowerCase();

  // 1. Evaluate role-specific signals
  let signalResults;
  if (role === 'freelancer') {
    signalResults = await evaluateFreelancerSignals(user, profile, dbContext);
  } else {
    signalResults = await evaluateClientSignals(user, dbContext);
  }

  const { signals = [], positiveSignals = [], nlpAnalysis = {}, historyStats = {} } = signalResults;

  // 2. Cold-Start Check (Account age < 14 days and 0 completed contracts)
  const createdAtDate = user.createdAt ? new Date(user.createdAt) : new Date();
  const accountAgeDays = Math.max(0, Math.round((Date.now() - createdAtDate.getTime()) / (1000 * 86400)));
  const totalCompleted = historyStats.completedProjects || historyStats.completedContracts || 0;
  const isColdStart = accountAgeDays <= 14 && totalCompleted === 0;

  // 3. Initial Baseline Scores
  let trustScore = isColdStart ? 80 : 85;
  let fraudRiskScore = 10;

  // 4. Calculate Negative Signal Penalties with Bounded Learned Weights
  const evaluatedSignals = [];

  for (const sig of signals) {
    const predefinedConf = (role === 'freelancer' ? predefinedModel.freelancerSignals : predefinedModel.clientSignals)?.[sig.type] || {};
    const learnedConf = learningModel.riskSignals?.[sig.type] || {};

    const baseRisk = sig.baseRisk || predefinedConf.baseRisk || 15;
    const severity = sig.severity || predefinedConf.severity || 'medium';
    const severityMult = SEVERITY_MULTIPLIERS[severity] || 1.0;

    // Learned weight clamped between 0.3x and 1.7x to prevent model distortion
    const learnedWeight = Math.min(1.7, Math.max(0.3, learnedConf.learnedWeight || 1.0));
    const confidence = Math.min(1.0, Math.max(0.1, sig.confidence || learnedConf.confidence || predefinedConf.initialConfidence || 0.75));

    const riskPenalty = Math.round(baseRisk * severityMult * learnedWeight * confidence);
    fraudRiskScore += riskPenalty;
    trustScore -= Math.round(riskPenalty * 0.85);

    evaluatedSignals.push({
      type: sig.type,
      category: predefinedConf.category || 'behavior',
      severity,
      confidence: Math.round(confidence * 100),
      riskImpact: riskPenalty,
      evidence: sig.evidence || predefinedConf.description || 'Suspicious marketplace pattern detected.',
      impact: 'negative',
      raw: sig
    });
  }

  // 5. Apply Positive Trust Boosts
  const evaluatedPositiveSignals = [];
  for (const pos of positiveSignals) {
    const predefinedPos = predefinedModel.positiveSignals?.[pos.type] || {};
    const boost = pos.trustBoost || predefinedPos.trustBoost || 10;
    const riskReduction = pos.riskReduction || predefinedPos.riskReduction || 6;

    trustScore += boost;
    fraudRiskScore -= riskReduction;

    evaluatedPositiveSignals.push({
      type: pos.type,
      trustBoost: boost,
      evidence: pos.evidence || predefinedPos.description || 'Positive marketplace history verified.',
      impact: 'positive'
    });
  }

  // 6. Normalization and Boundaries Clamping [0, 100]
  if (isNaN(trustScore) || !isFinite(trustScore)) trustScore = 80;
  if (isNaN(fraudRiskScore) || !isFinite(fraudRiskScore)) fraudRiskScore = 10;

  trustScore = Math.min(100, Math.max(0, Math.round(trustScore)));
  fraudRiskScore = Math.min(100, Math.max(0, Math.round(fraudRiskScore)));

  // 7. Determine Risk Band
  let riskLevel = 'low';
  let badgeLabel = 'Trusted Account';
  let userFacingStatus = 'Verified';

  if (fraudRiskScore >= 60) {
    riskLevel = 'high';
    badgeLabel = 'High Risk';
    userFacingStatus = 'Under Security Review';
  } else if (fraudRiskScore >= 30) {
    riskLevel = 'medium';
    badgeLabel = 'Review Required';
    userFacingStatus = 'Verification In Progress';
  } else if (trustScore >= 85) {
    badgeLabel = 'High Trust';
    userFacingStatus = 'Verified Pro';
  }

  // 8. Generate Summary Explanations
  let evidenceSummary = '';
  if (evaluatedSignals.length === 0) {
    evidenceSummary = isColdStart
      ? 'New account in good standing. Cold-start baseline active with clean audit.'
      : 'No suspicious signals detected. Authentic marketplace history and clean verification.';
  } else {
    evidenceSummary = evaluatedSignals.map(s => s.evidence).join(' ');
  }

  const result = {
    userId: userIdStr,
    userName: user.name,
    email: user.email,
    role,
    trustScore,
    fraudRiskScore,
    riskLevel,
    badgeLabel,
    userFacingStatus,
    isColdStart,
    signals: evaluatedSignals,
    positiveSignals: evaluatedPositiveSignals,
    nlpAnalysis,
    historyStats,
    evidenceSummary,
    analyzedAt: new Date().toISOString()
  };

  if (userIdStr) {
    scoreCache.set(userIdStr, { result, timestamp: Date.now() });
  }

  return result;
}

/**
 * Adaptive Learning Model Update Hook
 * Called when an administrator submits a review outcome ('confirm_fraud' | 'dismiss_false_positive' | 'confirmed' | 'CONFIRMED_FRAUD')
 */
function recordAdminReviewDecision(arg1 = [], arg2 = 'confirm_fraud') {
  let signalTypes = [];
  let decision = 'confirm_fraud';

  if (Array.isArray(arg1)) {
    signalTypes = arg1;
    decision = arg2 || 'confirm_fraud';
  } else if (arg1 && typeof arg1 === 'object') {
    decision = arg1.decision || arg1.outcome || 'confirm_fraud';
    const rawSignals = arg1.signals || arg1.signalTypes || [];
    signalTypes = Array.isArray(rawSignals)
      ? rawSignals.map(s => (typeof s === 'string' ? s : (s.type || s.code || ''))).filter(Boolean)
      : [];
  }

  if (!Array.isArray(signalTypes) || signalTypes.length === 0) return false;

  const model = getLearningModel();
  if (!model.riskSignals) model.riskSignals = {};
  model.totalAdminDecisions = (model.totalAdminDecisions || 0) + 1;
  model.lastUpdated = new Date().toISOString();

  const decisionStr = String(decision).toLowerCase();
  const isConfirmed = decisionStr.includes('confirm');

  signalTypes.forEach(sigType => {
    if (!model.riskSignals[sigType]) {
      model.riskSignals[sigType] = {
        occurrences: 0,
        confirmedCases: 0,
        falsePositives: 0,
        confidence: 0.70,
        learnedWeight: 1.0
      };
    }

    const item = model.riskSignals[sigType];
    item.occurrences = (item.occurrences || 0) + 1;

    if (isConfirmed) {
      item.confirmedCases = (item.confirmedCases || 0) + 1;
    } else {
      item.falsePositives = (item.falsePositives || 0) + 1;
    }

    // Update confidence ratio
    const totalCases = item.confirmedCases + item.falsePositives;
    if (totalCases > 0) {
      item.confidence = Number((item.confirmedCases / totalCases).toFixed(2));
    }

    // Bounded weight adjustments (Step of 0.05, clamped between 0.30 and 1.70)
    let currentWeight = item.learnedWeight || 1.0;
    if (isConfirmed) {
      currentWeight = Math.min(1.70, currentWeight + 0.05);
    } else {
      currentWeight = Math.max(0.30, currentWeight - 0.08);
    }
    item.learnedWeight = Number(currentWeight.toFixed(2));
  });

  saveLearningModel(model);
  scoreCache.clear(); // Invalidate cached scores
  return true;
}

function clearScoreCache() {
  scoreCache.clear();
}

module.exports = {
  calculateUserTrustScore,
  recordAdminReviewDecision,
  clearScoreCache,
  getPredefinedModel,
  getLearningModel
};
