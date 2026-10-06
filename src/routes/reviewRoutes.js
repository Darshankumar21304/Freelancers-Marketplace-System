const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, reviewController.createReview);
router.get('/', authMiddleware, reviewController.getReviews);
router.get('/client', authMiddleware, reviewController.getClientReviews);
router.get('/freelancer', authMiddleware, reviewController.getFreelancerReviews);
router.get('/freelancer/:freelancerId', reviewController.getFreelancerReviews);
router.post('/:id/respond', authMiddleware, reviewController.respondToReview);

module.exports = router;
