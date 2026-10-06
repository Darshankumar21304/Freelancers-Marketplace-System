const mongoose = require('mongoose');
require('dotenv').config();

async function syncHeartwareData() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gigsphere';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const { User, Project, Contract } = require('../src/models');

  const heartwareClient = await User.findOne({ email: 'heartware08@gmail.com' });
  if (heartwareClient) {
    console.log('Found Heartware client:', heartwareClient._id);

    // Update Project client_id & status to 'In Progress' or 'Open'
    await Project.updateMany(
      { title: 'RAG CHATBOT' },
      { 
        $set: { 
          client_id: heartwareClient._id,
          status: 'In Progress'
        } 
      }
    );

    // Update Contract client_id
    await Contract.updateMany(
      { title: /RAG CHATBOT/i },
      { 
        $set: { 
          client_id: heartwareClient._id,
          status: 'In Progress'
        } 
      }
    );

    console.log('Synced RAG CHATBOT project and contract to Heartware Client!');
  }

  await mongoose.disconnect();
}

syncHeartwareData().catch(console.error);
