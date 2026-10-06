/**
 * Builds human-readable explainability metadata for recommended projects.
 */
function buildRecommendationExplanation(scoreResult, project, freelancer) {
  const { matchScore, featureScores, skillAnalysis, requirements } = scoreResult;
  const reasons = [];

  // 1. Skill Reason
  const totalReq = (requirements.skills || []).length;
  const matchCount = (skillAnalysis.matchingSkills || []).length;
  if (totalReq > 0) {
    if (matchCount === totalReq) {
      reasons.push(`All ${totalReq} required skills match your profile`);
    } else if (matchCount > 0) {
      reasons.push(`${matchCount} of ${totalReq} required skills match your profile`);
    }
  }

  // 2. Related skills
  if (skillAnalysis.relatedSkills && skillAnalysis.relatedSkills.length > 0) {
    reasons.push(`Your experience in ${skillAnalysis.relatedSkills.slice(0, 2).join(' & ')} provides a strong foundation`);
  }

  // 3. Category / Experience Reason
  if (featureScores.requirementMatch >= 90) {
    reasons.push('Directly matches your primary specialization');
  }

  // 4. Budget Reason
  if (featureScores.budgetCompatibility >= 80 && requirements.budget > 0) {
    reasons.push('Client budget is within your preferred range');
  }

  // 5. Portfolio / Past Success
  if (featureScores.pastSuccess >= 70) {
    reasons.push('Similar to your past work and portfolio achievements');
  }

  if (reasons.length === 0) {
    reasons.push('Matches open marketplace opportunity for your skill set');
  }

  return {
    matchScore,
    matchPercentage: matchScore,
    matchingSkills: skillAnalysis.matchingSkills || [],
    missingSkills: skillAnalysis.missingSkills || [],
    relatedSkills: skillAnalysis.relatedSkills || [],
    reasons: reasons.slice(0, 3),
    whyRecommended: reasons.slice(0, 3),
    featureScores
  };
}

module.exports = {
  buildRecommendationExplanation
};
