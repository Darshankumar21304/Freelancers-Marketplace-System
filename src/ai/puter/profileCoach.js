const fs = require('fs');
const path = require('path');
const { Project } = require('../../models');

const coachModelPath = path.join(__dirname, '../models/profile-coach-model.json');

function getCoachModel() {
  try {
    return JSON.parse(fs.readFileSync(coachModelPath, 'utf8'));
  } catch (e) {
    return { qualityWeights: {}, highDemandMarketplaceSkills: [] };
  }
}

/**
 * Analyzes freelancer profile quality and generates constructive coaching suggestions.
 */
function analyzeProfileQuality(freelancer) {
  const profile = freelancer.profile || freelancer;
  const user = freelancer.user || freelancer;

  const strengths = [];
  const improvements = [];
  const portfolioSuggestions = [];
  let qualityScore = 0;

  // 1. Title Assessment (15 pts)
  const title = (profile.title || user.title || '').trim();
  if (title.length >= 10) {
    qualityScore += 15;
    strengths.push('Clear, professional role title');
  } else if (title.length > 0) {
    qualityScore += 8;
    improvements.push('Make your headline more specific (e.g., "Full-Stack React & Node.js Developer")');
  } else {
    improvements.push('Add a professional headline describing your primary expertise');
  }

  // 2. Bio Completeness (20 pts)
  const bio = (profile.bio || user.bio || '').trim();
  if (bio.length >= 120) {
    qualityScore += 20;
    strengths.push('Comprehensive overview explaining your value proposition and stack');
  } else if (bio.length >= 40) {
    qualityScore += 12;
    improvements.push('Expand your bio to highlight recent project outcomes and client benefits');
  } else {
    improvements.push('Write a detailed bio (at least 3-4 sentences) outlining your tech skills and experience');
  }

  // 3. Skills Depth (25 pts)
  const skills = profile.skills || user.skills || [];
  if (skills.length >= 5) {
    qualityScore += 25;
    strengths.push(`Strong core skill set (${skills.length} skills listed)`);
  } else if (skills.length >= 2) {
    qualityScore += 15;
    improvements.push('Add at least 5 relevant technical skills to maximize AI project match rate');
  } else {
    improvements.push('Add key skills to your profile so matching projects can be discovered');
  }

  // 4. Portfolio Showcase (25 pts)
  const portfolio = profile.portfolioItems || profile.portfolio || [];
  if (portfolio.length >= 3) {
    qualityScore += 25;
    strengths.push(`Rich portfolio showcase (${portfolio.length} verified projects with live links)`);
  } else if (portfolio.length >= 1) {
    qualityScore += 15;
    improvements.push('Add 2 more portfolio case studies to demonstrate breadth across different client projects');
    portfolioSuggestions.push('Add live demonstration URLs and measurable client results to existing items');
  } else {
    improvements.push('Add project screenshots, demo links, and descriptions to your portfolio');
    portfolioSuggestions.push('Publish 2-3 project showcases with live demos to boost conversion');
  }

  // 5. Work Experience / Certifications (15 pts)
  const workExp = profile.workExperience || profile.experience || [];
  const certs = profile.certifications || [];
  const hasExp = (Array.isArray(workExp) && workExp.length > 0) || (typeof workExp === 'string' && workExp.length > 10) || (certs.length > 0);
  if (hasExp) {
    qualityScore += 15;
    strengths.push('Documented professional experience history');
  } else {
    qualityScore += 5;
    improvements.push('Add past employment history or technical certifications to build instant trust');
  }

  return {
    qualityScore: Math.min(100, qualityScore),
    profileQualityScore: Math.min(100, qualityScore),
    strengths,
    improvements,
    suggestions: improvements,
    portfolioSuggestions
  };
}

/**
 * Compares freelancer's current skills against real open projects in MongoDB.
 */
async function getSkillGapAnalysis(freelancer) {
  const profile = freelancer.profile || freelancer;
  const user = freelancer.user || freelancer;
  const mySkills = (profile.skills || user.skills || []).map(s => s.toLowerCase());

  // Fetch real open marketplace projects
  const openProjects = await Project.find({ status: { $in: ['Open', 'Active', 'open', 'active', null] } }).limit(20);
  const skillCountMap = {};

  openProjects.forEach(p => {
    const pSkills = Array.isArray(p.requiredSkills) ? p.requiredSkills : (Array.isArray(p.skills) ? p.skills : []);
    pSkills.forEach(s => {
      const clean = s.toLowerCase().trim();
      if (clean) {
        if (!skillCountMap[clean]) skillCountMap[clean] = { name: s, count: 0, examples: [], budget: p.budget || 30000 };
        skillCountMap[clean].count += 1;
        if (skillCountMap[clean].examples.length < 2) {
          skillCountMap[clean].examples.push({ id: p._id, title: p.title, budget: p.budget });
        }
      }
    });
  });

  // Identify in-demand marketplace skills that freelancer doesn't have yet
  const gaps = [];
  Object.keys(skillCountMap).forEach(sk => {
    if (!mySkills.includes(sk)) {
      gaps.push({
        skill: skillCountMap[sk].name,
        demandCount: skillCountMap[sk].count,
        whyRelevant: `Featured in ${skillCountMap[sk].count} active client briefs in the marketplace`,
        whyItMatters: `Featured in ${skillCountMap[sk].count} active client briefs in the marketplace`,
        avgBudget: skillCountMap[sk].budget,
        matchingOpenProjects: skillCountMap[sk].count,
        exampleProjects: skillCountMap[sk].examples
      });
    }
  });

  // Fallback to high demand model if DB has few open projects
  if (gaps.length === 0) {
    const coachModel = getCoachModel();
    (coachModel.highDemandMarketplaceSkills || []).forEach(hd => {
      if (!mySkills.includes(hd.skill.toLowerCase())) {
        gaps.push({
          skill: hd.skill,
          demandCount: 3,
          whyRelevant: `High market demand in ${hd.category.replace('_', ' ')} with average budget of ₹${hd.avgBudget.toLocaleString('en-IN')}`,
          whyItMatters: `High market demand in ${hd.category.replace('_', ' ')} with average budget of ₹${hd.avgBudget.toLocaleString('en-IN')}`,
          avgBudget: hd.avgBudget,
          matchingOpenProjects: 3,
          exampleProjects: []
        });
      }
    });
  }

  // Sort by demand count descending
  gaps.sort((a, b) => b.demandCount - a.demandCount);

  return {
    currentSkillsCount: mySkills.length,
    currentSkills: profile.skills || user.skills || [],
    skillGaps: gaps.slice(0, 5),
    recommendedSkillsToLearn: gaps.slice(0, 5),
    highDemandMarketSkills: gaps.slice(0, 5)
  };
}

module.exports = {
  analyzeProfileQuality,
  assessProfileCoach: analyzeProfileQuality,
  getSkillGapAnalysis,
  analyzeMarketplaceSkillGaps: getSkillGapAnalysis
};
