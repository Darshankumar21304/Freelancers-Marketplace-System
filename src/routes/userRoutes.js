const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all freelancers (public)
router.get('/freelancers', userController.getFreelancers);

// Full freelancer profile (User + FreelancerProfile merged)
router.get('/profile/me', authMiddleware, userController.getMyProfile);
router.put('/profile/me', authMiddleware, userController.updateMyProfile);

// AI Profile Strength Analyzer
router.post('/profile/ai-analyze', authMiddleware, userController.aiAnalyzeProfile);

// Settings
router.get('/settings', authMiddleware, userController.getSettings);
router.put('/settings', authMiddleware, userController.updateSettings);
router.put('/kyc', authMiddleware, userController.submitKyc);

// Disputes API for Client & Freelancer
router.get('/disputes', authMiddleware, userController.getUserDisputes);
router.post('/disputes', authMiddleware, userController.fileNewDispute);
router.post('/disputes/:id/message', authMiddleware, userController.addUserDisputeMessage);

// Public user profile
router.get('/clean-work-experience', async (req, res) => {
  try {
    const { FreelancerProfile } = require('../models');
    const result = await FreelancerProfile.updateMany({}, { $set: { workExperience: [] } });
    res.json({ message: 'Cleaned work experience across all freelancer profiles in MongoDB', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/public', userController.getUserPublicProfile);
router.get('/:id', userController.getUserPublicProfile);

module.exports = router;
