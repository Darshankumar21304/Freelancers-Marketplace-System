const fs = require('fs');
const path = require('path');

const skillModelPath = path.join(__dirname, '../models/skill-model.json');

function getSkillModel() {
  try {
    return JSON.parse(fs.readFileSync(skillModelPath, 'utf8'));
  } catch (err) {
    return { skills: {}, normalization: { caseInsensitive: true, trimWhitespace: true } };
  }
}

/**
 * Normalizes a single skill string to its canonical skill ID / Name
 */
function normalizeSkill(rawSkill) {
  if (!rawSkill || typeof rawSkill !== 'string') return '';
  const skillModel = getSkillModel();
  const clean = rawSkill.toLowerCase().trim().replace(/[-_]/g, ' ');

  // 1. Direct match with canonical skill keys
  if (skillModel.skills && skillModel.skills[clean]) {
    return skillModel.skills[clean].id || clean;
  }

  // 2. Exact match against synonyms
  if (skillModel.skills) {
    for (const [canonicalId, skillDef] of Object.entries(skillModel.skills)) {
      if (canonicalId.toLowerCase() === clean) return canonicalId;
      if (Array.isArray(skillDef.synonyms)) {
        for (const syn of skillDef.synonyms) {
          const cleanSyn = syn.toLowerCase().trim().replace(/[-_]/g, ' ');
          if (cleanSyn === clean) {
            return canonicalId;
          }
        }
      }
    }

    // 3. Substring / Word boundaries match for phrases (e.g. "React developer", "frontend React", "Node developer")
    for (const [canonicalId, skillDef] of Object.entries(skillModel.skills)) {
      const allAliases = [canonicalId, ...(skillDef.synonyms || [])];
      for (const alias of allAliases) {
        const cleanAlias = alias.toLowerCase().trim().replace(/[-_]/g, ' ');
        if (cleanAlias.length > 2) {
          const regex = new RegExp(`\\b${cleanAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (regex.test(clean)) {
            return canonicalId;
          }
        }
      }
    }
  }

  return clean.replace(/\s+/g, '_');
}

/**
 * Normalizes an array of skills
 */
function normalizeSkills(skillsList = []) {
  if (!Array.isArray(skillsList)) return [];
  const normalizedSet = new Set();
  skillsList.forEach(s => {
    const norm = normalizeSkill(s);
    if (norm) normalizedSet.add(norm);
  });
  return Array.from(normalizedSet);
}

/**
 * Extracts and normalizes requirements from a project document
 */
function normalizeProjectRequirements(project) {
  if (!project) return { skills: [], category: 'web_development', budget: 0, experienceLevel: 'intermediate' };

  const rawSkills = Array.isArray(project.requiredSkills) 
    ? project.requiredSkills 
    : (Array.isArray(project.skills) ? project.skills : []);

  const normalizedSkills = normalizeSkills(rawSkills);
  const text = `${project.title || ''} ${project.description || ''}`.toLowerCase();

  // Composite stacks expansion
  if (text.includes('mern')) {
    normalizedSkills.push('react', 'node.js', 'mongodb', 'express');
  }
  if (text.includes('mean')) {
    normalizedSkills.push('angular', 'node.js', 'mongodb', 'express');
  }
  if (text.includes('payment gateway') || text.includes('payment integration') || text.includes('stripe') || text.includes('razorpay')) {
    normalizedSkills.push('payment integration');
  }
  if (text.includes('authentication') || text.includes('auth') || text.includes('jwt') || text.includes('login')) {
    normalizedSkills.push('authentication');
  }

  // Scan text for canonical skill mentions
  const skillModel = getSkillModel();
  if (skillModel.skills) {
    for (const [canonicalId, skillDef] of Object.entries(skillModel.skills)) {
      const aliases = [canonicalId, ...(skillDef.synonyms || [])];
      for (const alias of aliases) {
        const cleanAlias = alias.toLowerCase().trim().replace(/[-_]/g, ' ');
        if (cleanAlias.length > 2) {
          const regex = new RegExp(`\\b${cleanAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (regex.test(text)) {
            normalizedSkills.push(canonicalId);
            break;
          }
        }
      }
    }
  }

  const budget = Number(project.budget || project.budgetMax || project.totalBudget || 0);
  const category = (project.category || 'web_development').toLowerCase().replace(/\s+/g, '_');
  const experienceLevel = (project.experienceLevel || project.experience || 'intermediate').toLowerCase();

  return {
    skills: Array.from(new Set(normalizedSkills)),
    category,
    budget,
    experienceLevel,
    title: project.title || '',
    description: project.description || ''
  };
}

module.exports = {
  getSkillModel,
  normalizeSkill,
  normalizeSkills,
  normalizeProjectRequirements,
  normalizeRequirements: normalizeProjectRequirements
};
