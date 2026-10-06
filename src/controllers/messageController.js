const { Message } = require('../models');
const { uploadToCloudinary } = require('../config/cloudinary');

exports.getChatHistory = async (req, res) => {
  try {
    const { user1_id, user2_id } = req.params;

    if (!Message) {
      return res.json([]);
    }

    const u1Str = String(user1_id);
    const u2Str = String(user2_id);
    const authUserId = req.user ? String(req.user.id || req.user._id) : null;

    const possibleUser1 = [u1Str];
    const possibleUser2 = [u2Str];
    if (authUserId) {
      if (u1Str === 'client' || u1Str === 'freelancer') possibleUser1.push(authUserId);
      if (u2Str === 'client' || u2Str === 'freelancer') possibleUser2.push(authUserId);
    }
    possibleUser1.push('client', 'freelancer');
    possibleUser2.push('client', 'freelancer');

    const roomIds = [];
    possibleUser1.forEach(id1 => {
      possibleUser2.forEach(id2 => {
        roomIds.push([id1, id2].sort().join('_'));
      });
    });

    let chatMessages = await Message.find({
      $or: [
        { room: { $in: roomIds } },
        { sender_id: { $in: possibleUser1 }, receiver_id: { $in: possibleUser2 } },
        { sender_id: { $in: possibleUser2 }, receiver_id: { $in: possibleUser1 } }
      ]
    })
    .sort({ createdAt: 1, _id: 1 })
    .catch(() => []);

    const formattedMessages = (chatMessages || []).map(m => {
      const msgObj = typeof m.toObject === 'function' ? m.toObject() : m;
      return {
        ...msgObj,
        id: String(msgObj._id),
        _id: String(msgObj._id),
        sender_id: String(msgObj.sender_id),
        receiver_id: String(msgObj.receiver_id),
        timestamp: msgObj.timestamp || msgObj.createdAt,
        createdAt: msgObj.createdAt
      };
    });

    res.json(formattedMessages);
  } catch (error) {
    console.error('Chat history fetch error:', error);
    res.json([]);
  }
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const mime = req.file.mimetype;
    let folder = 'gigsphere/chat/files';
    let resource_type = 'auto';

    if (mime.startsWith('image/')) {
      folder = 'gigsphere/chat/images';
      resource_type = 'image';
    } else if (mime.startsWith('video/') || mime.startsWith('audio/')) {
      folder = 'gigsphere/chat/videos';
      resource_type = 'video';
    } else if (mime.includes('pdf') || mime.includes('word') || mime.includes('text')) {
      folder = 'gigsphere/chat/documents';
      resource_type = 'raw';
    }

    const result = await uploadToCloudinary(req.file.buffer, { folder, resource_type });

    res.status(200).json({ 
      fileUrl: result.secure_url,
      publicId: result.public_id,
      fileName: req.file.originalname,
      resourceType: result.resource_type,
      format: result.format || mime.split('/')[1]
    });
  } catch (error) {
    console.error('Chat Cloudinary upload error:', error);
    res.status(500).json({ message: error.message || 'Server error uploading chat attachment to Cloudinary' });
  }
};

// GET /api/messages/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Message.countDocuments({ receiver_id: userId, read: false });
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error fetching unread message count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/messages/read-all/:senderId
exports.markMessagesRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { senderId } = req.params;
    
    await Message.updateMany(
      { receiver_id: userId, sender_id: senderId, read: false },
      { read: true }
    );
    
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/messages/conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = String(req.user.id || req.user._id);
    const { User } = require('../models');

    const messages = await Message.find({
      $or: [
        { sender_id: userId },
        { receiver_id: userId },
        { sender_id: 'client' },
        { receiver_id: 'client' },
        { sender_id: 'freelancer' },
        { receiver_id: 'freelancer' }
      ]
    }).sort({ createdAt: -1 });

    const partnersMap = new Map();

    for (const msg of messages) {
      const sId = String(msg.sender_id);
      const rId = String(msg.receiver_id);
      let partnerId = null;

      if (sId === userId) partnerId = rId;
      else if (rId === userId) partnerId = sId;

      if (!partnerId || partnerId === 'client' || partnerId === 'freelancer') continue;

      if (!partnersMap.has(partnerId)) {
        partnersMap.set(partnerId, {
          lastMessage: msg.message_text || (msg.file_url ? 'Attachment sent' : ''),
          lastMessageTime: msg.createdAt
        });
      }
    }

    const conversationsList = [];
    for (const [partnerId, data] of partnersMap.entries()) {
      const partnerUser = await User.findById(partnerId).catch(() => null);
      if (!partnerUser) continue;

      const unreadCount = await Message.countDocuments({
        sender_id: partnerId,
        receiver_id: userId,
        read: false
      });

      const rawAvatar = partnerUser.avatar || partnerUser.profilePhoto;
      const cleanAvatar = (rawAvatar && !rawAvatar.includes('pravatar.cc'))
        ? rawAvatar 
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerUser.name)}&background=1a73e8&color=ffffff&bold=true`;

      conversationsList.push({
        partnerId: partnerUser._id,
        partnerName: partnerUser.name,
        partnerAvatar: cleanAvatar,
        avatar: cleanAvatar,
        partnerRole: partnerUser.role,
        lastMessage: data.lastMessage,
        lastMessageTime: new Date(data.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount
      });
    }

    res.json(conversationsList);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/messages/send
exports.sendMessage = async (req, res) => {
  try {
    const sender_id = String(req.user.id || req.user._id);
    const { receiver_id, message_text, file_url, room } = req.body;

    if (!receiver_id || (!message_text && !file_url)) {
      return res.status(400).json({ message: 'Receiver ID and message or file are required' });
    }

    const recId = String(receiver_id);
    const roomId = room || [sender_id, recId].sort().join('_');

    const newMessage = await Message.create({
      sender_id,
      receiver_id: recId,
      message_text: message_text || '',
      file_url: file_url || null,
      room: roomId
    });

    const { User } = require('../models');
    const sender = await User.findById(sender_id).catch(() => null);
    const senderName = sender ? sender.name : 'A user';

    const { createNotification } = require('./notificationController');
    await createNotification(
      recId,
      'message',
      `New Message from ${senderName}`,
      `You received a new message: "${(message_text || '').substring(0, 60)}"`
    ).catch(() => null);

    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('receive_message', {
        id: newMessage._id,
        _id: newMessage._id,
        sender_id: newMessage.sender_id,
        receiver_id: newMessage.receiver_id,
        message_text: newMessage.message_text,
        file_url: newMessage.file_url,
        timestamp: newMessage.createdAt,
        room: roomId
      });
    }

    res.status(201).json({
      success: true,
      message: {
        id: String(newMessage._id),
        _id: String(newMessage._id),
        sender_id: String(newMessage.sender_id),
        receiver_id: String(newMessage.receiver_id),
        message_text: newMessage.message_text,
        file_url: newMessage.file_url,
        timestamp: newMessage.createdAt,
        room: roomId
      }
    });
  } catch (error) {
    console.error('SendMessage error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// POST /api/messages/upload
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    let fileUrl = '';
    if (req.file.path) {
      fileUrl = req.file.path;
    } else if (req.file.filename) {
      fileUrl = `/uploads/${req.file.filename}`;
    }
    res.json({
      success: true,
      fileUrl,
      url: fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Error uploading message file:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
};

// GET /api/messages/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?._id || '');
    const count = await Message.countDocuments({
      receiver_id: userId,
      read: false
    });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ unreadCount: 0 });
  }
};

