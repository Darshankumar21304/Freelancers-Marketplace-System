const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { upload, validateFileSize } = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/history/:user1_id/:user2_id', authMiddleware, messageController.getChatHistory);
router.post('/send', authMiddleware, messageController.sendMessage);
router.post('/upload', authMiddleware, upload.single('file'), validateFileSize, messageController.uploadFile);
router.get('/unread-count', authMiddleware, messageController.getUnreadCount);
router.put('/read-all/:senderId', authMiddleware, messageController.markMessagesRead);
router.get('/conversations', authMiddleware, messageController.getConversations);

module.exports = router;
