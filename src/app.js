const express = require('express');
const cors = require('cors');
const app = express();
const authRoutes = require('./routes/authRoutes');
const gigRoutes = require('./routes/gigRoutes');
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const contractRoutes = require('./routes/contractRoutes');
// Other routes like orderRoutes, etc.

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads directory for static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/proposals', require('./routes/proposalRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/pitches', require('./routes/pitchRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/trust', require('./routes/trustRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/freelancer/ai', require('./routes/freelancerAIRoutes'));

// Base route
app.get('/', (req, res) => {
  res.send('Welcome to GigSphere API');
});

app.get('/api/debug/clean-seed-profile', async (req, res) => {
  try {
    const { FreelancerProfile } = require('./models');
    const res1 = await FreelancerProfile.updateMany(
      {},
      { $set: { workExperience: [] } }
    );
    res.json({ success: true, message: 'Reset workExperience in MongoDB to empty array', updated: res1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
