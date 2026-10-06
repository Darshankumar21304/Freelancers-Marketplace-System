const express = require('express');
const router = express.Router();
const trustController = require('../controllers/trustController');
const authMiddleware = require('../middleware/authMiddleware');

// Public / Client-safe & Freelancer-safe trust lookups
router.get('/freelancer/:id', trustController.getFreelancerTrust);
router.get('/client/:id', trustController.getClientTrust);

// Authenticated user's private trust breakdown
router.get('/me', authMiddleware, trustController.getMyTrust);

// Internal trust event logging
router.post('/events', authMiddleware, trustController.recordTrustEvent);

module.exports = router;
