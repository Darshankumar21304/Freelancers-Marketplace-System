const { calculateRecommendationScore, getRecommendationConfig } = require('./recommendationScorer');
const { buildRecommendationExplanation } = require('./explanationBuilder');

/**
 * Enforces strict eligibility criteria before ranking.
 */
function isProjectEligible(project, freelancer, options = {}) {
  const config = getRecommendationConfig();
  const eligibility = config.eligibility || {};

  if (!project) return false;

  // 1. Exclude Closed / Inactive Projects
  if (eligibility.excludeClosedProjects) {
    const st = (project.status || 'Open').toLowerCase();
    if (st === 'completed' || st === 'closed' || st === 'cancelled' || st === 'in progress') {
      // If the project is closed, not eligible
      return false;
    }
  }

  const freelancerId = (freelancer._id || freelancer.id || freelancer.user_id || '').toString();

  // 2. Exclude Projects where freelancer is already hired
  if (eligibility.excludeAlreadyHired && freelancerId) {
    if (project.hiredFreelancerId && project.hiredFreelancerId.toString() === freelancerId) {
      return false;
    }
    if (Array.isArray(project.proposals)) {
      const accepted = project.proposals.find(p => 
        (p.status === 'Accepted' || p.status === 'Hired') && 
        p.freelancer_id && p.freelancer_id.toString() === freelancerId
      );
      if (accepted) return false;
    }
  }

  // 3. Respect Freelancer Availability
  if (eligibility.respectAvailability) {
    const prof = freelancer.profile || freelancer;
    if (prof.availability === 'Unavailable') {
      return false;
    }
  }

  return true;
}

/**
 * Ranks candidate projects for a freelancer.
 */
function rankRecommendedProjects(projects = [], freelancer, options = {}) {
  const config = getRecommendationConfig();
  const minScore = options.minScore || config.limits?.minimumMatchScore || 45;
  const maxRecs = options.limit || config.limits?.maxRecommendations || 10;

  const scoredCandidates = [];

  for (const project of projects) {
    if (!isProjectEligible(project, freelancer, options)) {
      continue;
    }

    const scoreResult = calculateRecommendationScore(freelancer, project, options.historicalData || {});
    
    // Check minimum match score threshold
    if (scoreResult.matchScore >= minScore) {
      const explanation = buildRecommendationExplanation(scoreResult, project, freelancer);
      scoredCandidates.push({
        project,
        matchScore: scoreResult.matchScore,
        matchPercentage: scoreResult.matchScore,
        explanation,
        featureScores: scoreResult.featureScores,
        matchingSkills: explanation.matchingSkills,
        missingSkills: explanation.missingSkills,
        reasons: explanation.reasons
      });
    }
  }

  // Rank descending by match score
  scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

  return scoredCandidates.slice(0, maxRecs);
}

module.exports = {
  isProjectEligible,
  rankRecommendedProjects
};
