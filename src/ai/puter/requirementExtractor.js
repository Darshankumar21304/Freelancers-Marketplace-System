/**
 * Requirement Extractor — Smart NLP Engine
 * Converts natural-language project descriptions into structured requirement JSON:
 * { category, skills, experienceLevel, projectType }
 *
 * FIX #7: Removed dead global.puter backend code. Puter AI is a browser-only SDK —
 * global.puter is never available in Node.js, so that code path never executed.
 * The deterministic NLP extractor below is accurate and production-ready.
 */

const fs = require('fs');
const path = require('path');

// Load canonical skill model for mapping
let skillModel = null;
try {
  const modelPath = path.join(__dirname, '../models/skill-model.json');
  skillModel = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
} catch (e) {
  skillModel = { skills: {}, categories: {} };
}

/**
 * Rule-Based NLP Extractor
 * Processes project title, description, and existing skills to produce structured requirements.
 */
function extractRequirementsDeterministic(title = '', description = '', existingSkills = []) {
  const text = `${title} ${description}`.toLowerCase();
  const extractedSkills = new Set();

  // 1. Process explicitly provided project skills
  if (Array.isArray(existingSkills)) {
    existingSkills.forEach(s => {
      if (typeof s === 'string') {
        s.split(',').forEach(sub => {
          const trimmed = sub.trim().toLowerCase();
          if (trimmed) extractedSkills.add(trimmed);
        });
      }
    });
  }

  // 2. Match against Canonical Skills and Synonyms from skill-model.json
  if (skillModel && skillModel.skills) {
    Object.keys(skillModel.skills).forEach(canonical => {
      const entry = skillModel.skills[canonical];
      if (text.includes(canonical)) {
        extractedSkills.add(canonical);
      }
      if (Array.isArray(entry.synonyms)) {
        entry.synonyms.forEach(syn => {
          if (text.includes(syn)) {
            extractedSkills.add(canonical);
          }
        });
      }
    });
  }

  // 3. Fallback keyword patterns
  if (text.includes('chatbot') || text.includes('rag') || text.includes('pdf')) {
    extractedSkills.add('rag');
    extractedSkills.add('python');
  }
  if (text.includes('frontend') || text.includes('react')) extractedSkills.add('react');
  if (text.includes('backend') || text.includes('node')) extractedSkills.add('node.js');
  if (text.includes('database') || text.includes('mongo')) extractedSkills.add('mongodb');
  if (text.includes('design') || text.includes('figma') || text.includes('ui/ux')) extractedSkills.add('ui/ux design');

  // Default skills if none detected (generic web project)
  if (extractedSkills.size === 0) {
    extractedSkills.add('react');
    extractedSkills.add('node.js');
  }

  // Determine Category
  let category = 'web_development';
  if (extractedSkills.has('rag') || extractedSkills.has('machine learning') || text.includes('ai') || text.includes('ml')) {
    category = 'ai_ml';
  } else if (extractedSkills.has('ui/ux design') || extractedSkills.has('figma') || text.includes('design')) {
    category = 'design';
  } else if (extractedSkills.has('flutter') || extractedSkills.has('react native') || text.includes('mobile')) {
    category = 'mobile';
  }

  // Experience level detection
  let experienceLevel = 'intermediate';
  if (text.includes('expert') || text.includes('senior') || text.includes('lead') || text.includes('advanced')) {
    experienceLevel = 'expert';
  } else if (text.includes('junior') || text.includes('beginner') || text.includes('entry')) {
    experienceLevel = 'beginner';
  }

  // Project Type detection
  let projectType = 'custom_solution';
  if (text.includes('ecommerce') || text.includes('e-commerce') || text.includes('shop')) projectType = 'ecommerce';
  else if (text.includes('chatbot') || text.includes('bot') || text.includes('ai app')) projectType = 'ai_chatbot';
  else if (text.includes('landing') || text.includes('portfolio')) projectType = 'landing_page';
  else if (text.includes('dashboard') || text.includes('saas') || text.includes('portal')) projectType = 'saas_dashboard';

  return {
    category,
    skills: Array.from(extractedSkills),
    experienceLevel,
    projectType,
    engine: 'Smart-NLP'
  };
}

/**
 * Main Extract Requirements Function
 */
async function extractRequirements(project) {
  if (!project) {
    return extractRequirementsDeterministic('', '', []);
  }

  const title = project.title || '';
  const description = project.description || '';
  const existingSkills = project.skills || [];

  return extractRequirementsDeterministic(title, description, existingSkills);
}

module.exports = {
  extractRequirements,
  extractRequirementsDeterministic
};
