/**
 * Score Calculator Engine
 * Implements the 8-Factor Explainable Recommendation Scoring Model from PDF Section 8
 */

const fs = require('fs');
const path = require('path');
const { matchSkills } = require('./skillMatcher');

const learningModelPath = path.join(__dirname, '../models/learning-model.json');

/**
 * FIX #4: Read learning model fresh on every call so adaptive weight updates
 * from the learningEngine are picked up without needing a server restart.
 */
function getFreshLearningModel() {
  try {
    return JSON.parse(fs.readFileSync(learningModelPath, 'utf8'));
  } catch (e) {
    return { skillPerformance: {}, globalWeights: {} };
  }
}

// Weights as specified in PDF Page 3
const DEFAULT_WEIGHTS = {
  skillMatch: 0.40,
  experienceMatch: 0.15,
  rating: 0.10,
  projectSuccess: 0.10,
  relatedSkills: 0.05,
  budgetCompatibility: 0.05,
  availability: 0.05,
  learningScore: 0.10
};

/**
 * Calculate multi-factor recommendation score for a candidate freelancer against project requirements
 */
function calculateCandidateScore(freelancer, projectRequirements = {}, projectBudget = 0) {
  const profile = freelancer.profile || freelancer;
  const user = freelancer.user || freelancer;

  // FIX #4: Use fresh model on each call so learning engine updates take effect
  const learningModel = getFreshLearningModel();
  const weights = (learningModel && learningModel.globalWeights) ? { ...DEFAULT_WEIGHTS, ...learningModel.globalWeights } : DEFAULT_WEIGHTS;

  // 1. SKILL MATCH (40%) & RELATED SKILLS (5%)
  const flSkills = profile.skills || user.skills || [];
  const reqSkills = projectRequirements.skills || [];
  const skillResult = matchSkills(flSkills, reqSkills);

  const skillMatchScore = skillResult.matchRatio; // 0.0 to 1.0
  const relatedSkillsScore = skillResult.relatedRatio; // 0.0 to 1.0

  // 2. EXPERIENCE MATCH (15%)
  const reqExp = (projectRequirements.experienceLevel || 'intermediate').toLowerCase();
  const flExpRaw = (profile.experience || profile.experienceLevel || 'intermediate').toLowerCase();
  
  let expVal = 2; // default intermediate
  if (flExpRaw.includes('expert') || flExpRaw.includes('senior') || flExpRaw.includes('5+') || flExpRaw.includes('expert')) expVal = 3;
  else if (flExpRaw.includes('beginner') || flExpRaw.includes('entry') || flExpRaw.includes('junior')) expVal = 1;

  let targetVal = 2;
  if (reqExp.includes('expert') || reqExp.includes('senior')) targetVal = 3;
  else if (reqExp.includes('beginner') || reqExp.includes('junior')) targetVal = 1;

  let experienceScore = 0.85;
  if (expVal >= targetVal) {
    experienceScore = 1.0;
  } else if (expVal === targetVal - 1) {
    experienceScore = 0.70;
  } else {
    experienceScore = 0.50;
  }

  // 3. RATING (10%)
  // FIX #1: Removed artificial 0.6 floor — unrated freelancers no longer score 60% by default
  const rawRating = Number(profile.rating || user.rating || 0);
  const ratingScore = rawRating > 0 ? Math.min(1.0, rawRating / 5.0) : 0.5; // 0.5 neutral for new accounts

  // 4. PROJECT SUCCESS (10%)
  // FIX #1: Removed artificial 0.7 floor — new freelancers with 0 projects score lower
  const completedProjects = Number(profile.completedProjects || profile.successfulProjects || (profile.portfolioItems ? profile.portfolioItems.length : 0));
  const projectSuccess = completedProjects === 0 ? 0.30 : Math.min(1.0, 0.50 + (completedProjects * 0.05));

  // 5. BUDGET COMPATIBILITY (5%)
  const hourlyRate = Number(profile.hourlyRate || user.hourlyRate || 500);
  let budgetScore = 0.90;
  if (projectBudget > 0) {
    if (hourlyRate <= projectBudget) budgetScore = 1.0;
    else if (hourlyRate <= projectBudget * 1.5) budgetScore = 0.80;
    else budgetScore = 0.65;
  }

  // 6. AVAILABILITY (5%)
  const isAvailable = profile.availability !== false && profile.availability !== 'Unavailable';
  const availabilityScore = isAvailable ? 1.0 : 0.4;

  // 7. LEARNING SCORE (10%)
  // Pull adaptive weights for matched skills from learning-model.json
  let learningAccumulator = 0;
  let learningCount = 0;
  if (learningModel && learningModel.skillPerformance) {
    skillResult.directMatches.forEach(sk => {
      const perf = learningModel.skillPerformance[sk];
      if (perf && typeof perf.weight === 'number') {
        learningAccumulator += perf.weight;
        learningCount++;
      }
    });
  }
  const learningScore = learningCount > 0 ? (learningAccumulator / learningCount) : 0.92;

  // WEIGHTED SUM (0.0 to 1.0)
  const compositeScore = 
    (skillMatchScore * weights.skillMatch) +
    (experienceScore * weights.experienceMatch) +
    (ratingScore * weights.rating) +
    (projectSuccess * weights.projectSuccess) +
    (relatedSkillsScore * weights.relatedSkills) +
    (budgetScore * weights.budgetCompatibility) +
    (availabilityScore * weights.availability) +
    (learningScore * weights.learningScore);

  // FIX #2: Removed artificial 65% floor — real score can be lower if there is genuinely poor match
  // Only cap max at 99 (never show 100% — no match is perfect)
  const matchPercentage = Math.min(99, Math.round(compositeScore * 100));

  // Confidence assessment
  let confidence = 'High';
  if (skillResult.directMatches.length >= 2 && matchPercentage >= 85) {
    confidence = 'Very High';
  } else if (matchPercentage < 75) {
    confidence = 'Moderate';
  }

  // Explainability Breakdown factors (for "Why this match?" panel)
  const explainability = {
    matchPercentage,
    confidence,
    directMatches: skillResult.directMatches,
    relatedMatches: skillResult.relatedMatches,
    missingSkills: skillResult.missingSkills,
    rating: rawRating.toFixed(1),
    completedProjects: completedProjects,
    experienceLevel: expVal === 3 ? 'Expert' : (expVal === 2 ? 'Intermediate' : 'Beginner'),
    factors: [
      {
        name: 'Skill Match',
        score: Math.round(skillMatchScore * 100),
        weight: '40%',
        summary: skillResult.directMatches.length > 0 ? `Matched ${skillResult.directMatches.join(', ')}` : 'Domain alignment'
      },
      {
        name: 'Experience Match',
        score: Math.round(experienceScore * 100),
        weight: '15%',
        summary: `${expVal === 3 ? 'Expert' : 'Intermediate'} level qualification`
      },
      {
        name: 'Client Rating',
        score: Math.round(ratingScore * 100),
        weight: '10%',
        summary: `★ ${rawRating.toFixed(1)} verified marketplace rating`
      },
      {
        name: 'Project Success',
        score: Math.round(projectSuccess * 100),
        weight: '10%',
        summary: `${completedProjects}+ successfully delivered projects`
      },
      {
        name: 'Related & Adjacent Skills',
        score: Math.round(relatedSkillsScore * 100),
        weight: '5%',
        summary: skillResult.relatedMatches.length > 0 ? skillResult.relatedMatches.join(', ') : 'Complementary toolset'
      },
      {
        name: 'Adaptive Learning Score',
        score: Math.round(learningScore * 100),
        weight: '10%',
        summary: 'Historical positive hire & completion signals'
      }
    ]
  };

  return {
    score: Number(compositeScore.toFixed(3)),
    matchPercentage,
    confidence,
    explainability
  };
}

module.exports = {
  calculateCandidateScore,
  DEFAULT_WEIGHTS
};
