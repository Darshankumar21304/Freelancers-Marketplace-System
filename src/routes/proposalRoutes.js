const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/received', proposalController.getReceivedProposals);
router.get('/my-proposals', proposalController.getMyProposals);
router.patch('/:id/status', proposalController.updateProposalStatus);

module.exports = router;
