const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/active', authMiddleware, contractController.getActiveContracts);
router.get('/my-contracts', authMiddleware, contractController.getActiveContracts);
router.get('/hired', authMiddleware, contractController.getHiredContracts);
router.put('/:contractId/milestones/:milestoneId/submit', authMiddleware, contractController.submitMilestone);
router.put('/:contractId/milestones/:milestoneId/approve', authMiddleware, contractController.approveMilestone);
router.put('/:contractId/milestones/:milestoneId/fund', authMiddleware, contractController.fundMilestone);

module.exports = router;
