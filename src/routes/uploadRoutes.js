const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { upload, validateFileSize } = require('../middleware/uploadMiddleware');
const authenticateToken = require('../middleware/authMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');

const uploadSingleMiddleware = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files.find(f => f.fieldname === 'file' || f.fieldname === 'image') || req.files[0];
    }
    next();
  });
};

const uploadMultipleMiddleware = (req, res, next) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Files upload error' });
    }
    next();
  });
};

const uploadAvatarMiddleware = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Avatar upload error' });
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files.find(f => f.fieldname === 'avatar' || f.fieldname === 'file' || f.fieldname === 'image') || req.files[0];
    }
    next();
  });
};

// General Single File Upload (Image, PDF document, Video)
router.post('/single', optionalAuth, uploadSingleMiddleware, validateFileSize, uploadController.uploadSingleFile);

// General Multiple Files Upload (Max 5 files)
router.post('/multiple', optionalAuth, uploadMultipleMiddleware, validateFileSize, uploadController.uploadMultipleFiles);

// User Profile Avatar Upload
router.post('/avatar', authenticateToken, uploadAvatarMiddleware, validateFileSize, uploadController.uploadAvatar);

// PDF In-App Stream Viewer Proxy
router.get('/view-pdf', uploadController.viewPdf);

module.exports = router;


