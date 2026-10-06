const fs = require('fs');
const path = require('path');
const { matchSkills } = require('./skillMatcher');
const { normalizeProjectRequirements } = require('./requirementNormalizer');

const recModelPath = path.join(__dirname, '../models/recommendation-model.json');
const learningModelPath = path.join(__dirname, '../models/learning-model.json');

function getRecommendationConfig() {
  try {
    return JSON.parse(fs.readFileSync(recModelPath, 'utf8'));
  } catch (e) {
    return {
      weights: {
        skillMatch: 0.30,
        requirementMatch: 0.15,
        experience: 0.10,
        pastSuccess: 0.10,
        rating: 0.08,
        budgetCompatibility: 0.07,
        availability: 0.05,
        relatedSkills: 0.05,
        learningAdjustment: 0.10
      },
      limits: {
        maxRecommendations: 10,
        minimumMatchScore: 45,
        maxLearningAdjustment: 0.10
      }
    };
  }
}

function getLearningModel() {
  try {
    return JSON.parse(fs.readFileSync(learningModelPath, 'utf8'));
  } catch (e) {
    return { skills: {}, projectSignals: {}, limits: { maxSkillBoost: 0.10, maxSkillPenalty: -0.10 } };
  }
}

/**
 * Calculates a multi-factor recommendation match score (0 - 100)
 * for a project given a freelancer's profile and marketplace history.
 */
function calculateRecommendationScore(freelancer, project, options = {}) {
  const config = getRecommendationConfig();
  const learning = getLearningModel();
  const weights = options.customWeights || options.weights || config.weights || {};

  const profile = freelancer.profile || freelancer;
  const user = freelancer.user || freelancer;

  const req = normalizeProjectRequirements(project);
  const flSkills = profile.skills || user.skills || [];

  // 1. Skill Match (0 - 100)
  const skillResult = matchSkills(flSkills, req.skills);
  const rawRatio = skillResult.matchRatio;
  const matchCount = skillResult.matchingSkills?.length || 0;
  // Account for depth of matching skills as well as coverage ratio
  const skillMatchScore = rawRatio === 0 
    ? 0 
    : Math.min(100, Math.round((rawRatio * 80) + Math.min(20, matchCount * 5)));

  // 2. Requirement / Category Match (0 - 100)
  const flCategory = (profile.category || '').toLowerCase().replace(/\s+/g, '_');
  let requirementMatchScore = 75;
  if (flCategory && req.category) {
    if (flCategory === req.category) requirementMatchScore = 100;
    else if ((flCategory.includes('web') || flCategory.includes('backend')) && (req.category.includes('web') || req.category.includes('backend'))) {
      requirementMatchScore = 85;
    } else {
      requirementMatchScore = 40;
    }
  } else if (req.category) {
    // Infer category affinity from freelancer skills
    const isWebStack = flSkills.some(s => ['react', 'node.js', 'mongodb', 'express', 'javascript', 'next.js', 'typescript'].includes(s.toLowerCase()));
    if (isWebStack && (req.category.includes('web') || req.category.includes('backend'))) {
      requirementMatchScore = 90;
    } else if (isWebStack && (req.category.includes('design') || req.category.includes('marketing'))) {
      requirementMatchScore = 40;
    }
  }

  // 3. Experience Match (0 - 100)
  const rawExp = `${profile.experienceLevel || ''} ${profile.experience || ''} ${user.experienceLevel || ''} ${user.experience || ''}`.toLowerCase();
  const reqExp = (req.experienceLevel || 'intermediate').toLowerCase();
  let expScore = 75;
  if (rawExp.includes('expert') || rawExp.includes('senior') || rawExp.includes('5+')) {
    expScore = 100;
  } else if (rawExp.includes('intermediate') || rawExp.includes('mid') || rawExp.includes('3')) {
    expScore = reqExp.includes('expert') ? 70 : 85;
  } else if (rawExp.includes('entry') || rawExp.includes('beginner') || rawExp.includes('junior')) {
    expScore = reqExp.includes('expert') ? 40 : 60;
  } else {
    expScore = 75;
  }

  // 4. Past Success / Completed Projects (0 - 100)
  const historicalData = (options && (options.historicalData || (options.completedContracts !== undefined ? options : null))) 
    || freelancer.historicalData 
    || {};
  const completedProjects = Number(profile.completedProjects || user.completedProjects || historicalData.completedContracts || 0);
  const pastSuccessScore = completedProjects > 0 
    ? Math.min(100, 60 + (completedProjects * 10))
    : (profile.portfolioItems?.length > 0 ? 70 : 40);

  // 5. Rating (0 - 100)
  const ratingVal = Number(profile.rating || user.rating || 0);
  const ratingScore = ratingVal > 0 ? Math.min(100, Math.round((ratingVal / 5.0) * 100)) : 80;

  // 6. Budget Compatibility (0 - 100)
  const hourlyRate = Number(profile.hourlyRate || user.hourlyRate || 0);
  const projBudget = req.budget;
  let budgetScore = 85;
  if (projBudget > 0 && hourlyRate > 0) {
    if (hourlyRate <= projBudget) budgetScore = 100;
    else if (hourlyRate <= projBudget * 1.3) budgetScore = 80;
    else budgetScore = 60;
  }

  // 7. Availability (0 - 100)
  const isAvailable = profile.availability !== 'Unavailable' && user.availability !== 'Unavailable';
  const availabilityScore = isAvailable ? 100 : 30;

  // 8. Related Skills (0 - 100)
  const relatedSkillsScore = (skillResult.relatedRatio || 0) * 100;

  // 9. Adaptive Learning Adjustment (0 - 100, centered around 50)
  let skillBoost = 0;
  if (learning && learning.skills) {
    skillResult.matchingSkills.forEach(sk => {
      const skData = learning.skills[sk];
      if (skData && skData.successRate) {
        skillBoost += (skData.successRate - 0.5) * 0.2;
      }
    });
  }
  const maxAdj = config.limits?.maxLearningAdjustment || 0.10;
  const clampedBoost = Math.max(-maxAdj, Math.min(maxAdj, skillBoost));
  const learningAdjustmentScore = Math.max(0, Math.min(100, (0.5 + clampedBoost) * 100));

  // Compute final weighted score (0 - 100)
  const rawScore = 
    (skillMatchScore * (weights.skillMatch ?? 0.30)) +
    (requirementMatchScore * (weights.requirementMatch ?? 0.15)) +
    (expScore * (weights.experience ?? 0.10)) +
    (pastSuccessScore * (weights.pastSuccess ?? 0.10)) +
    (ratingScore * (weights.rating ?? 0.08)) +
    (budgetScore * (weights.budgetCompatibility ?? 0.07)) +
    (availabilityScore * (weights.availability ?? 0.05)) +
    (relatedSkillsScore * (weights.relatedSkills ?? 0.05)) +
    (learningAdjustmentScore * (weights.learningAdjustment ?? 0.10));

  const finalMatchScore = Math.round(Math.max(10, Math.min(99, rawScore)));

  const featureScoresObj = {
    skillMatch: Math.round(skillMatchScore),
    requirementMatch: Math.round(requirementMatchScore),
    experience: Math.round(expScore),
    pastSuccess: Math.round(pastSuccessScore),
    rating: Math.round(ratingScore),
    budgetCompatibility: Math.round(budgetScore),
    availability: Math.round(availabilityScore),
    relatedSkills: Math.round(relatedSkillsScore),
    learningAdjustment: Math.round(learningAdjustmentScore)
  };

  return {
    matchScore: finalMatchScore,
    finalScore: finalMatchScore,
    featureScores: featureScoresObj,
    factors: featureScoresObj,
    skillAnalysis: skillResult,
    requirements: req
  };
}

module.exports = {
  calculateRecommendationScore,
  getRecommendationConfig,
  getLearningModel
};
