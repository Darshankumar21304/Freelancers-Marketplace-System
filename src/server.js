const path = require('path');
const fs = require('fs');

const envPath = fs.existsSync(path.resolve(__dirname, '../.env'))
  ? path.resolve(__dirname, '../.env')
  : (fs.existsSync(path.resolve(__dirname, '../env')) ? path.resolve(__dirname, '../env') : undefined);

require('dotenv').config(envPath ? { path: envPath } : undefined);
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { Message } = require('./models');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.set('io', io);

const onlineUsers = new Map(); // socket.id -> userId
const userSockets = new Map(); // userId -> Set of socket.ids

const broadcastOnlineUsers = () => {
  const onlineUserIds = Array.from(userSockets.keys());
  io.emit('get_online_users', onlineUserIds);
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('user_connected', (userId) => {
    if (userId) {
      const uId = String(userId);
      onlineUsers.set(socket.id, uId);
      if (!userSockets.has(uId)) {
        userSockets.set(uId, new Set());
      }
      userSockets.get(uId).add(socket.id);
      broadcastOnlineUsers();
    }
  });

  socket.on('check_online_users', () => {
    socket.emit('get_online_users', Array.from(userSockets.keys()));
  });

  // Room id can be a combination of user1_id and user2_id like '1_2' (smaller_larger)
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });

  socket.on('send_message', async (data) => {
    try {
      let newMessage;
      if (data._id || data.id) {
        newMessage = await Message.findById(data._id || data.id).catch(() => null);
      }
      if (!newMessage) {
        newMessage = await Message.create({
          sender_id: data.sender_id,
          receiver_id: data.receiver_id,
          message_text: data.message_text || '',
          file_url: data.file_url || null,
          room: data.room
        });

        // Fetch sender details to customize notification description
        const { User } = require('./models');
        const sender = await User.findById(data.sender_id).catch(() => null);
        const senderName = sender ? sender.name : 'A user';

        // Create a database notification for the receiver
        const { createNotification } = require('./controllers/notificationController');
        await createNotification(
          data.receiver_id,
          'message',
          `New Message from ${senderName}`,
          `You received a new message: "${(data.message_text || '').substring(0, 60)}${(data.message_text || '').length > 60 ? '...' : ''}"`
        ).catch(() => null);
      }

      // Emit to room excluding sender (sender already added message locally)
      socket.to(data.room).emit('receive_message', {
        id: newMessage._id,
        _id: newMessage._id,
        sender_id: newMessage.sender_id,
        receiver_id: newMessage.receiver_id,
        message_text: newMessage.message_text,
        file_url: newMessage.file_url,
        timestamp: newMessage.createdAt,
        room: newMessage.room
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.room).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const uId = onlineUsers.get(socket.id);
    if (uId) {
      onlineUsers.delete(socket.id);
      const sockets = userSockets.get(uId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(uId);
        }
      }
      broadcastOnlineUsers();
    }
  });
});

const startServer = async () => {
  try {
    await connectDB();
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${PORT} is already in use.`);
        console.error(`Check if another terminal is already running the backend server, or terminate the process on port ${PORT}.\n`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
      }
    });
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start the server:', error);
  }
};

startServer();
// GigSphere Backend Server Initialized
