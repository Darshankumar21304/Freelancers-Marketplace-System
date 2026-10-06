const { normalizeSkill, normalizeSkills, getSkillModel } = require('./requirementNormalizer');

/**
 * Matches a freelancer's normalized skills against a project's required skills.
 * 
 * Returns:
 * - matchingSkills: canonical skills present in both
 * - missingSkills: required skills the freelancer lacks
 * - relatedSkills: skills the freelancer has that are related to the missing skills
 * - matchRatio: 0.0 - 1.0 (proportion of required skills matched)
 * - relatedRatio: 0.0 - 1.0 (related bonus)
 */
function matchSkills(freelancerSkills = [], requiredSkills = []) {
  const normFreelancerSkills = normalizeSkills(freelancerSkills);
  const normRequiredSkills = normalizeSkills(requiredSkills);

  if (normRequiredSkills.length === 0) {
    return {
      matchingSkills: normFreelancerSkills.slice(0, 3),
      missingSkills: [],
      relatedSkills: [],
      matchRatio: 1.0,
      relatedRatio: 1.0,
      matchPercentage: 100
    };
  }

  const skillModel = getSkillModel();
  const flSet = new Set(normFreelancerSkills);

  const matchingSkills = [];
  const missingSkills = [];
  const foundRelated = new Set();

  normRequiredSkills.forEach(reqSkill => {
    if (flSet.has(reqSkill)) {
      matchingSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);

      // Check if freelancer has any related skills to this missing requirement
      const skillDef = skillModel.skills && skillModel.skills[reqSkill];
      if (skillDef && Array.isArray(skillDef.relatedSkills)) {
        skillDef.relatedSkills.forEach(rel => {
          const normRel = normalizeSkill(rel);
          if (flSet.has(normRel)) {
            foundRelated.add(normRel);
          }
        });
      }
    }
  });

  const matchRatio = matchingSkills.length / normRequiredSkills.length;
  const relatedRatio = normRequiredSkills.length > 0 
    ? Math.min(1.0, (foundRelated.size * 0.5) / normRequiredSkills.length)
    : 0;

  return {
    matchingSkills,
    missingSkills,
    relatedSkills: Array.from(foundRelated),
    matchRatio,
    relatedRatio,
    matchPercentage: Math.round(matchRatio * 100)
  };
}

module.exports = {
  matchSkills
};
