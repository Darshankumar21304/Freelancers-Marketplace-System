const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAiController = require('../controllers/adminAiController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/rbacMiddleware');

// All admin routes require token authentication + admin role authorization
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Analytics & Overview
router.get('/stats', adminController.getDashboardStats);
router.get('/dashboard/overview', adminController.getDashboardStats);
router.get('/dashboard/trends', adminController.getDashboardStats);
router.get('/dashboard/activity', adminController.getDashboardStats);
router.get('/dashboard/actions', adminController.getDashboardStats);

// AI Monitoring, Governance & Performance
router.get('/ai/health', adminAiController.getAiHealth);
router.get('/ai/performance', adminAiController.getAiPerformance);
router.get('/ai/alerts', adminAiController.getAiAlerts);
router.get('/ai/model-versions', adminAiController.getModelVersions);
router.post('/ai/model-simulate', adminAiController.simulateModel);
router.post('/ai/model-versions', adminAiController.createModelVersion);
router.post('/ai/model-versions/:id/activate', adminAiController.activateModelVersion);
router.get('/ai/learning-summary', adminAiController.getLearningSummary);
router.post('/ai/assistant/query', adminAiController.adminAssistantQuery);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id/details', adminController.getUserDetailsAndPosts);
router.post('/users/auto-audit-all', adminController.autoAuditAllUsers);
router.put('/users/:id/block', adminController.toggleUserBlock);
router.put('/users/:id/flag-permanently', adminController.flagUserPermanently);
router.delete('/users/:id', adminController.deleteUser);

// Listing & Project Moderation
router.get('/listings', adminController.getAllListings);
router.delete('/projects/:id', adminController.deleteProject);

// Complaints & Dispute Resolution
router.get('/disputes', adminController.getDisputes);
router.post('/disputes/:id/resolve', adminController.resolveDispute);
router.post('/disputes/:id/message', adminController.addDisputeMessage);
router.post('/disputes/:id/ai-mediate', adminController.analyzeDisputeWithAi);

// AI Security & Fake Profile Detection Logs
router.get('/ai-security', adminController.getAiSecurityLogs);

// Live AI Analysis & Support Endpoints
router.post('/ai/scan-profile', adminController.scanProfileWithAi);
router.post('/ai/extract-skills', adminController.extractSkillsWithAi);
router.post('/ai/support-chat', adminController.askAiSupportAssistant);

// Trust & Fraud AI System Endpoints
router.get('/trust/stats', adminController.getTrustFraudStats);
router.get('/trust-fraud/summary', adminController.getTrustFraudStats);
router.get('/trust/flagged', adminController.getFlaggedAccounts);
router.get('/trust/investigate/:id', adminController.investigateAccount);
router.post('/trust/:id/review', adminController.submitTrustReview);
router.get('/trust/model-insights', adminController.getModelInsights);

// Freelancer Payout Withdrawal Approvals
router.get('/withdrawals', adminController.getAllWithdrawals);
router.put('/withdrawals/:id/approve', adminController.approveWithdrawal);

// KYC Verification Reviews
router.get('/kyc', adminController.getKycList);
router.put('/users/:id/kyc-review', adminController.reviewKycStatus);

module.exports = router;
