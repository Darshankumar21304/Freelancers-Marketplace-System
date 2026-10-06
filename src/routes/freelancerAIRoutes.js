const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getRecommendedProjectsForFreelancer, getProjectRecommendationExplanation } = require('../ai/recommendation/recommendationService');
const { handleRecommendationEvent } = require('../ai/recommendation/recommendationEvents');
const { analyzeProfileQuality, getSkillGapAnalysis } = require('../ai/puter/profileCoach');
const { generateProposalDraft } = require('../ai/puter/proposalAssistant');
const { User, FreelancerProfile, Project } = require('../models');

// All freelancer AI routes require authentication
router.use(authMiddleware);

// 1. GET /api/freelancer/ai/recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const minScore = parseInt(req.query.minScore, 10) || 45;
    const result = await getRecommendedProjectsForFreelancer(req.user.id, { limit, minScore });
    res.json(result);
  } catch (error) {
    console.error('Freelancer AI recommendations error:', error);
    res.status(500).json({ success: false, message: 'Error generating recommendations' });
  }
});

// 2. GET /api/freelancer/ai/recommendations/:projectId/explanation
router.get('/recommendations/:projectId/explanation', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await getProjectRecommendationExplanation(req.user.id, projectId);
    res.json(result);
  } catch (error) {
    console.error('Freelancer AI explanation error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving explanation' });
  }
});

// 3. POST /api/freelancer/ai/events
router.post('/events', async (req, res) => {
  try {
    const { projectId, eventType, score } = req.body;
    const result = await handleRecommendationEvent({
      userId: req.user.id,
      projectId,
      eventType,
      score
    });
    res.json(result);
  } catch (error) {
    console.error('Freelancer AI event tracking error:', error);
    res.status(500).json({ success: false, message: 'Error recording event' });
  }
});

// 4. POST /api/freelancer/ai/profile-coach
router.post('/profile-coach', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const profile = await FreelancerProfile.findOne({ user_id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const coachResult = analyzeProfileQuality({ user, profile: profile || {} });
    res.json({ success: true, ...coachResult });
  } catch (error) {
    console.error('Profile coach analysis error:', error);
    res.status(500).json({ success: false, message: 'Error analyzing profile' });
  }
});

// 5. GET /api/freelancer/ai/skill-gap
router.get('/skill-gap', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const profile = await FreelancerProfile.findOne({ user_id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const skillGapResult = await getSkillGapAnalysis({ user, profile: profile || {} });
    res.json({ success: true, ...skillGapResult });
  } catch (error) {
    console.error('Skill gap analysis error:', error);
    res.status(500).json({ success: false, message: 'Error analyzing skill gaps' });
  }
});

// 6. POST /api/freelancer/ai/proposal
router.post('/proposal', async (req, res) => {
  try {
    const { projectId, projectTitle, projectDescription, requiredSkills, tone, action, currentDraft } = req.body;
    const user = await User.findById(req.user.id);
    const profile = await FreelancerProfile.findOne({ user_id: req.user.id });
    
    let title = projectTitle;
    let desc = projectDescription;
    let skills = requiredSkills || [];

    if (projectId && (!title || !desc)) {
      const p = await Project.findById(projectId);
      if (p) {
        title = p.title;
        desc = p.description;
        skills = Array.isArray(p.requiredSkills) ? p.requiredSkills : (p.skills || []);
      }
    }

    const proposalResult = await generateProposalDraft({
      projectTitle: title || 'Marketplace Project',
      projectDescription: desc || '',
      requiredSkills: skills,
      freelancer: { user, profile: profile || {} },
      tone: tone || 'professional',
      action: action || 'generate',
      currentDraft: currentDraft || ''
    });

    res.json(proposalResult);
  } catch (error) {
    console.error('Proposal assistant error:', error);
    res.status(500).json({ success: false, message: 'Error generating proposal draft' });
  }
});

// 7. POST /api/freelancer/ai/learning/rebuild (Internal/Admin only)
router.post('/learning/rebuild', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Admin role required.' });
    }
    const { getLearningModel, saveLearningModel } = require('../ai/engine/learningEngine');
    const model = getLearningModel();
    model.global = model.global || {};
    model.global.rebuiltAt = new Date().toISOString();
    saveLearningModel(model);
    res.json({ success: true, message: 'Learning model synchronized successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error rebuilding learning model' });
  }
});

module.exports = router;
