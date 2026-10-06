const fs = require('fs');
const path = require('path');

const REC_MODEL_PATH = path.join(__dirname, '../models/recommendation-model.json');
const VERSIONS_PATH = path.join(__dirname, '../models/ai-model-versions.json');

function getProductionModel() {
  try {
    return JSON.parse(fs.readFileSync(REC_MODEL_PATH, 'utf8'));
  } catch (e) {
    return {
      version: '1.0',
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
      limits: { maxRecommendations: 10, minimumMatchScore: 45, maxLearningAdjustment: 0.10 },
      eligibility: { excludeClosedProjects: true, excludeAlreadyHired: true, respectAvailability: true }
    };
  }
}

function getModelVersions() {
  try {
    if (!fs.existsSync(VERSIONS_PATH)) {
      const initial = [
        {
          id: 'v1.0.0-prod',
          version: '1.0.0',
          title: 'GigSphere Baseline Ensemble Model',
          creator: 'System Administrator',
          createdAt: new Date('2026-08-01T00:00:00Z').toISOString(),
          status: 'active',
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
          limits: { maxRecommendations: 10, minimumMatchScore: 45, maxLearningAdjustment: 0.10 },
          notes: 'Production default validated across initial talent pool'
        }
      ];
      fs.writeFileSync(VERSIONS_PATH, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    return JSON.parse(fs.readFileSync(VERSIONS_PATH, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveModelVersions(versions) {
  try {
    fs.writeFileSync(VERSIONS_PATH, JSON.stringify(versions, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to write ai-model-versions.json:', e);
    return false;
  }
}

function activateModelVersion(versionId) {
  const versions = getModelVersions();
  const target = versions.find(v => v.id === versionId || v.version === versionId);
  if (!target) return { success: false, message: 'Version not found' };

  versions.forEach(v => {
    v.status = (v.id === target.id) ? 'active' : 'archived';
  });
  saveModelVersions(versions);

  // Sync to recommendation-model.json
  const current = getProductionModel();
  current.version = target.version;
  current.weights = target.weights;
  if (target.limits) current.limits = target.limits;
  fs.writeFileSync(REC_MODEL_PATH, JSON.stringify(current, null, 2), 'utf8');

  return { success: true, activatedVersion: target };
}

module.exports = {
  getProductionModel,
  getModelVersions,
  saveModelVersions,
  activateModelVersion
};
