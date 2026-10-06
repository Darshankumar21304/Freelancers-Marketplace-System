const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/freelancer', authMiddleware, analyticsController.getFreelancerAnalytics);

module.exports = router;
