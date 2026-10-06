const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { optionalAuth } = require('../middleware/authMiddleware');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/rbacMiddleware');

// Get all projects
router.get('/', projectController.getAllProjects);

// Get logged-in client's own projects
router.get('/my', authenticateToken, projectController.getMyProjects);

// Get freelancer's contracts with earnings summary
router.get('/my-contracts', authenticateToken, projectController.getMyContracts);

// Get single project by ID
router.get('/:id', projectController.getProjectById);

// Create a project (Uses auth token if logged in, falls back to demo client if unauthenticated)
router.post('/', optionalAuth, projectController.createProject);

// Submit a proposal to a project
router.post('/:projectId/proposals', optionalAuth, projectController.submitProposal);

// Update project details, status & Delete project
router.put('/:id', projectController.updateProject);
router.patch('/:id/status', projectController.updateProjectStatus);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
