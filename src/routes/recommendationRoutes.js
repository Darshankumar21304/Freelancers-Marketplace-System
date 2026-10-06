const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Get AI Smart Matched Candidates
router.get('/smart-match', optionalAuth, recommendationController.getSmartMatchedTalent);

// Track feedback / interaction events
router.post('/events', optionalAuth, recommendationController.trackRecommendationEvent);

// Explain recommendation factors
router.get('/explain/:freelancerId', optionalAuth, recommendationController.explainRecommendation);

// Get AI Recommended Projects for Freelancer
router.get('/projects', optionalAuth, recommendationController.getRecommendedProjectsForFreelancer);

module.exports = router;
