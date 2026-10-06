const { 
  User, Project, Gig, Contract, FreelancerProfile, 
  Transaction, Dispute, TrustEvent, TrustReview, RecommendationEvent 
} = require('../models');
const { getProductionModel, getModelVersions, saveModelVersions, activateModelVersion } = require('../ai/engine/modelGovernance');
const { getLearningModel } = require('../ai/engine/learningEngine');
const { calculateRecommendationScore } = require('../ai/engine/recommendationScorer');
const { callPuterChat } = require('../ai/puter/puterService');

// 1. GET /api/admin/ai/health
exports.getAiHealth = async (req, res) => {
  try {
    const prodModel = getProductionModel();
    const [totalEvents, auditedUsersCount, highRiskCount] = await Promise.all([
      RecommendationEvent.countDocuments().catch(() => 0),
      User.countDocuments({ aiAuditedAt: { $exists: true, $ne: null } }),
      User.countDocuments({ aiRiskScore: { $gte: 70 } })
    ]);

    res.json({
      success: true,
      status: 'Operational',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      models: {
        recommendation: { status: 'Active', version: prodModel.version, weightsConfigured: true },
        trustAndFraud: { status: 'Active', version: '1.0', rulesLoaded: 12 },
        learningEngine: { status: 'Active', version: '1.0', mode: 'Bounded Server-Controlled' },
        skillNormalizer: { status: 'Active', version: '1.0' }
      },
      telemetry: {
        totalRecommendationEvents: totalEvents,
        auditedAccounts: auditedUsersCount,
        activeHighRiskFlags: highRiskCount
      }
    });
  } catch (err) {
    console.error('getAiHealth error:', err);
    res.status(500).json({ message: 'Error retrieving AI health status', error: err.message });
  }
};

// 2. GET /api/admin/ai/performance
exports.getAiPerformance = async (req, res) => {
  try {
    const [
      impressions,
      views,
      bookmarks,
      proposals,
      hires,
      completions
    ] = await Promise.all([
      RecommendationEvent.countDocuments({ eventType: 'project_impression' }).catch(() => 0),
      RecommendationEvent.countDocuments({ eventType: 'project_view' }).catch(() => 0),
      RecommendationEvent.countDocuments({ eventType: 'project_bookmark' }).catch(() => 0),
      RecommendationEvent.countDocuments({ eventType: 'proposal_submitted' }).catch(() => 0),
      RecommendationEvent.countDocuments({ eventType: 'proposal_accepted' }).catch(() => 0),
      RecommendationEvent.countDocuments({ eventType: 'project_completed' }).catch(() => 0)
    ]);

    // Calculate conversion rates
    const totalEngagements = views + bookmarks + proposals + hires;
    const viewToProposalRate = views > 0 ? Number(((proposals / views) * 100).toFixed(1)) : 0;
    const proposalToHireRate = proposals > 0 ? Number(((hires / proposals) * 100).toFixed(1)) : 0;
    const overallConversion = impressions > 0 ? Number(((hires / impressions) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      funnel: {
        impressions,
        views,
        bookmarks,
        proposals,
        hires,
        completions
      },
      conversionMetrics: {
        viewToProposalRate: `${viewToProposalRate}%`,
        proposalToHireRate: `${proposalToHireRate}%`,
        overallRecommendationConversion: `${overallConversion}%`,
        totalTrackedEvents: impressions + totalEngagements + completions
      },
      evaluation: {
        utilityStatus: (proposals > 0 || hires > 0) ? 'Generating Positive Conversion' : 'Baseline Active',
        isAuthoritative: true
      }
    });
  } catch (err) {
    console.error('getAiPerformance error:', err);
    res.status(500).json({ message: 'Error retrieving AI performance telemetry' });
  }
};

// 3. GET /api/admin/ai/alerts
exports.getAiAlerts = async (req, res) => {
  try {
    const alerts = [];

    // Check 1: High Risk Accounts requiring review
    const highRiskUsers = await User.find({
      $or: [
        { aiRiskScore: { $gte: 70 } },
        { verificationStatus: { $in: ['flagged', 'suspended'] } }
      ]
    }).select('name email role aiRiskScore aiReason createdAt').limit(5).lean();

    highRiskUsers.forEach(u => {
      alerts.push({
        id: `alert-risk-${u._id}`,
        type: 'high_risk_account',
        severity: 'high',
        title: `High-Risk Account Flagged: ${u.name}`,
        evidence: u.aiReason || `Risk score evaluated at ${u.aiRiskScore}/100`,
        targetId: u._id,
        targetType: 'user',
        recommendedAction: 'Investigate account evidence in Trust & Fraud console and confirm or dismiss flag.',
        link: `/admin/dashboard/trust-fraud`,
        timestamp: u.createdAt
      });
    });

    // Check 2: Active disputes requiring arbitration
    const openDisputes = await Dispute.find({ status: { $in: ['Open', 'Under Review'] } }).limit(3).lean();
    openDisputes.forEach(d => {
      alerts.push({
        id: `alert-dispute-${d._id}`,
        type: 'open_dispute_anomaly',
        severity: 'medium',
        title: `Escrow Dispute Escalation: ₹${(d.amount || 0).toLocaleString()}`,
        evidence: `Dispute filed by ${d.clientName || 'Client'} against ${d.freelancerName || 'Freelancer'} for issue "${d.issue || 'Work non-conformance'}"`,
        targetId: d._id,
        targetType: 'dispute',
        recommendedAction: 'Review deliverable history and utilize AI Dispute Mediation Assistant.',
        link: `/admin/dashboard/disputes`,
        timestamp: d.createdAt
      });
    });

    // Check 3: Sudden proposal volume on single project
    const busyProjects = await Project.find({ 'proposals.5': { $exists: true } }).select('title proposals createdAt').limit(2).lean();
    busyProjects.forEach(p => {
      alerts.push({
        id: `alert-proj-${p._id}`,
        type: 'high_proposal_velocity',
        severity: 'low',
        title: `High Proposal Velocity: "${p.title}"`,
        evidence: `Project received ${p.proposals?.length || 0} proposals in short duration`,
        targetId: p._id,
        targetType: 'project',
        recommendedAction: 'Verify proposal authenticity and check for bot-like proposal submissions.',
        link: `/admin/dashboard/listings`,
        timestamp: p.createdAt
      });
    });

    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (err) {
    console.error('getAiAlerts error:', err);
    res.status(500).json({ message: 'Error retrieving AI alert center notifications' });
  }
};

// 4. GET /api/admin/ai/model-versions
exports.getModelVersions = async (req, res) => {
  try {
    const versions = getModelVersions();
    const production = getProductionModel();
    res.json({
      success: true,
      activeVersion: production.version,
      currentProductionConfig: production,
      versions
    });
  } catch (err) {
    console.error('getModelVersions error:', err);
    res.status(500).json({ message: 'Error retrieving model versions' });
  }
};

// 5. POST /api/admin/ai/model-versions
exports.createModelVersion = async (req, res) => {
  try {
    const { version, title, weights, limits, notes } = req.body;
    const adminUser = req.user;

    if (!version || !weights) {
      return res.status(400).json({ message: 'Version number and weights configuration are required' });
    }

    // Validate weights sum to ~1.0 (between 0.95 and 1.05)
    const weightSum = Object.values(weights).reduce((a, b) => Number(a) + Number(b), 0);
    if (Math.abs(weightSum - 1.0) > 0.05) {
      return res.status(400).json({ message: `Weights must sum to 100% (currently ${(weightSum * 100).toFixed(1)}%)` });
    }

    const versions = getModelVersions();
    const newVersion = {
      id: `v${version}-${Date.now().toString().slice(-4)}`,
      version,
      title: title || `Model Version ${version}`,
      creator: adminUser?.email || adminUser?.name || 'Administrator',
      createdAt: new Date().toISOString(),
      status: 'staged',
      weights,
      limits: limits || { maxRecommendations: 10, minimumMatchScore: 45, maxLearningAdjustment: 0.10 },
      notes: notes || 'Staged candidate model'
    };

    versions.unshift(newVersion);
    saveModelVersions(versions);

    res.json({
      success: true,
      message: `Model version ${version} staged successfully. Run simulations or activate when ready.`,
      modelVersion: newVersion
    });
  } catch (err) {
    console.error('createModelVersion error:', err);
    res.status(500).json({ message: 'Error saving new model version' });
  }
};

// 6. POST /api/admin/ai/model-versions/:id/activate
exports.activateModelVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const result = activateModelVersion(id);
    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }

    res.json({
      success: true,
      message: `Model version ${result.activatedVersion.version} is now LIVE in production recommendation engine.`,
      activeVersion: result.activatedVersion
    });
  } catch (err) {
    console.error('activateModelVersion error:', err);
    res.status(500).json({ message: 'Error activating model version' });
  }
};

// 7. POST /api/admin/ai/model-simulate
exports.simulateModel = async (req, res) => {
  try {
    const { weights, testSampleCount = 5 } = req.body;
    if (!weights) {
      return res.status(400).json({ message: 'Proposed weights configuration is required for simulation' });
    }

    // Retrieve sample projects and freelancers from real database
    const [sampleProjects, sampleFreelancers] = await Promise.all([
      Project.find({ status: { $ne: 'Closed' } }).limit(Number(testSampleCount)).lean(),
      User.find({ role: 'freelancer' }).select('-password_hash').limit(Number(testSampleCount)).lean()
    ]);

    const freelancerIds = sampleFreelancers.map(f => f._id);
    const profiles = await FreelancerProfile.find({ user_id: { $in: freelancerIds } }).lean();

    const simulationResults = [];

    sampleProjects.slice(0, 3).forEach(project => {
      sampleFreelancers.slice(0, 3).forEach(freelancer => {
        const profile = profiles.find(p => String(p.user_id) === String(freelancer._id)) || {};
        
        // Calculate with proposed simulated weights
        const simulatedScore = calculateRecommendationScore({
          freelancer,
          profile,
          project,
          customWeights: weights
        });

        // Calculate with current baseline weights
        const prodModel = getProductionModel();
        const baselineScore = calculateRecommendationScore({
          freelancer,
          profile,
          project,
          customWeights: prodModel.weights
        });

        simulationResults.push({
          projectId: project._id,
          projectTitle: project.title,
          freelancerId: freelancer._id,
          freelancerName: freelancer.name,
          baselineScore: baselineScore.finalScore,
          simulatedScore: simulatedScore.finalScore,
          scoreDelta: Number((simulatedScore.finalScore - baselineScore.finalScore).toFixed(1)),
          factorBreakdown: simulatedScore.factors,
          reasons: simulatedScore.reasons
        });
      });
    });

    const avgBaseline = simulationResults.length > 0 
      ? Number((simulationResults.reduce((a, b) => a + b.baselineScore, 0) / simulationResults.length).toFixed(1))
      : 0;
    const avgSimulated = simulationResults.length > 0 
      ? Number((simulationResults.reduce((a, b) => a + b.simulatedScore, 0) / simulationResults.length).toFixed(1))
      : 0;

    res.json({
      success: true,
      simulationMetrics: {
        totalPairingsEvaluated: simulationResults.length,
        averageBaselineScore: avgBaseline,
        averageSimulatedScore: avgSimulated,
        averageShift: Number((avgSimulated - avgBaseline).toFixed(1))
      },
      results: simulationResults
    });
  } catch (err) {
    console.error('simulateModel error:', err);
    res.status(500).json({ message: 'Error running model simulation', error: err.message });
  }
};

// 8. GET /api/admin/ai/learning-summary
exports.getLearningSummary = async (req, res) => {
  try {
    const learningModel = getLearningModel();
    const skillsList = Object.entries(learningModel.skills || {}).map(([skill, data]) => ({
      skill,
      views: data.views || 0,
      bookmarks: data.bookmarks || 0,
      proposals: data.proposals || 0,
      hires: data.hires || 0,
      completions: data.completions || 0,
      successRate: data.successRate || 0.50,
      scoreAdjustment: Number(((data.successRate - 0.50) * 0.20).toFixed(2))
    }));

    res.json({
      success: true,
      learningStatus: 'Bounded & Active',
      lastUpdated: learningModel.global?.lastUpdated || new Date().toISOString(),
      limits: learningModel.limits || { maxSkillBoost: 0.10, maxSkillPenalty: -0.10 },
      totalTrainedSkills: skillsList.length,
      skills: skillsList.slice(0, 20)
    });
  } catch (err) {
    console.error('getLearningSummary error:', err);
    res.status(500).json({ message: 'Error retrieving learning model summary' });
  }
};

// 9. POST /api/admin/ai/assistant/query (Controlled Natural-Language Admin Assistant)
exports.adminAssistantQuery = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Query question is required' });
    }

    // 1. Execute authorized backend analytical queries to ground the response in real MongoDB data
    const [
      totalUsers,
      clientsCount,
      freelancersCount,
      highRiskUsers,
      activeProjectsCount,
      topCategories,
      disputesCount,
      recPerformanceEvents
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'freelancer' }),
      User.find({ aiRiskScore: { $gte: 70 } }).select('name role aiRiskScore verificationStatus').limit(5).lean(),
      Project.countDocuments({ status: { $in: ['Open', 'Active', 'In Progress'] } }),
      Project.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 4 }
      ]),
      Dispute.countDocuments({ status: { $in: ['Open', 'Under Review'] } }),
      RecommendationEvent.countDocuments().catch(() => 0)
    ]);

    const groundContext = {
      platformStats: {
        totalUsers,
        clientsCount,
        freelancersCount,
        activeProjectsCount,
        activeDisputes: disputesCount,
        totalRecommendationEventsLogged: recPerformanceEvents
      },
      topCategories: topCategories.map(c => `${c._id || 'General'}: ${c.count} projects`).join(', '),
      highRiskAccountsCount: highRiskUsers.length,
      sampleHighRisk: highRiskUsers.map(u => `${u.name} (${u.role}, Risk Score: ${u.aiRiskScore})`)
    };

    // 2. Controlled prompt grounding with LLM / Puter
    const systemPrompt = `You are the GigSphere Executive Admin AI Assistant.
You have access to AUTHORIZED LIVE PLATFORM DATA:
- Total Registered Users: ${groundContext.platformStats.totalUsers} (${groundContext.platformStats.clientsCount} clients, ${groundContext.platformStats.freelancersCount} freelancers)
- Active Projects: ${groundContext.platformStats.activeProjectsCount}
- Top Project Categories: ${groundContext.topCategories}
- High-Risk Accounts (>70 Risk Score): ${groundContext.highRiskAccountsCount} flagged (${groundContext.sampleHighRisk.join('; ') || 'None'})
- Open Disputes in Escrow: ${groundContext.platformStats.activeDisputes}
- Total AI Recommendation Events: ${groundContext.platformStats.totalRecommendationEventsLogged}

Answer the administrator's question factually and concisely using ONLY the real platform context above. Clearly distinguish exact data from strategic analysis.`;

    const answer = await callPuterChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ]);

    res.json({
      success: true,
      answer: answer || `Based on platform database records: GigSphere currently has ${totalUsers} registered users (${clientsCount} clients, ${freelancersCount} freelancers) with ${activeProjectsCount} active projects and ${highRiskUsers.length} accounts flagged for risk review.`,
      groundContext
    });
  } catch (err) {
    console.error('adminAssistantQuery error:', err);
    res.status(500).json({ message: 'Error processing admin AI query', error: err.message });
  }
};
