const fs = require('fs');
const path = require('path');
const { normalizeSkill } = require('./requirementNormalizer');

const learningModelPath = path.join(__dirname, '../models/learning-model.json');

function getLearningModel() {
  try {
    return JSON.parse(fs.readFileSync(learningModelPath, 'utf8'));
  } catch (e) {
    return {
      version: '1.0',
      skills: {},
      projectSignals: {},
      global: { lastUpdated: new Date().toISOString() },
      limits: { maxSkillBoost: 0.10, maxSkillPenalty: -0.10 }
    };
  }
}

function saveLearningModel(model) {
  try {
    model.global = model.global || {};
    model.global.lastUpdated = new Date().toISOString();
    fs.writeFileSync(learningModelPath, JSON.stringify(model, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to persist learning-model.json:', e);
    return false;
  }
}

/**
 * Records a verified recommendation outcome / interaction event
 * and applies bounded adaptive adjustments to skill performance.
 */
function recordInteractionEvent({ eventType, skills = [], projectId, score, userId }) {
  const model = getLearningModel();
  model.skills = model.skills || {};

  const validEvents = [
    'project_impression',
    'project_view',
    'project_bookmark',
    'proposal_submitted',
    'proposal_accepted',
    'project_completed',
    'good_review',
    'proposal_rejected'
  ];

  if (!validEvents.includes(eventType)) {
    return { success: false, message: 'Invalid event type' };
  }

  skills.forEach(rawSk => {
    const canonical = normalizeSkill(rawSk);
    if (!canonical) return;

    if (!model.skills[canonical]) {
      model.skills[canonical] = {
        views: 0,
        bookmarks: 0,
        proposals: 0,
        hires: 0,
        completions: 0,
        successRate: 0.50
      };
    }

    const skData = model.skills[canonical];

    switch (eventType) {
      case 'project_impression':
        break;
      case 'project_view':
        skData.views += 1;
        break;
      case 'project_bookmark':
        skData.bookmarks += 1;
        break;
      case 'proposal_submitted':
        skData.proposals += 1;
        break;
      case 'proposal_accepted':
        skData.hires += 1;
        break;
      case 'project_completed':
      case 'good_review':
        skData.completions += 1;
        break;
      case 'proposal_rejected':
        break;
    }

    // Recompute bounded success rate (strictly between 0.10 and 0.90, baseline 0.50)
    const positiveSignal = (skData.hires * 1.5) + (skData.completions * 2.0) + (skData.bookmarks * 0.3);
    const negativeOrBase = Math.max(1, (skData.proposals * 1.5) + (skData.views * 0.2));
    const delta = Math.max(-0.4, Math.min(0.4, (positiveSignal - negativeOrBase) * 0.05));
    skData.successRate = Number(Math.max(0.10, Math.min(0.90, 0.50 + delta)).toFixed(2));
  });

  saveLearningModel(model);
  return { success: true, eventType, recordedSkills: skills.length };
}

module.exports = {
  getLearningModel,
  saveLearningModel,
  recordInteractionEvent
};
