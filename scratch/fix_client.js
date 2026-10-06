require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Contract = require('../src/models/Contract');
const Project = require('../src/models/Project');

async function updateClient() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    // 1. Update Sarah Jenkins / demo client users to Heartware
    const res1 = await User.updateMany(
      { role: 'client', $or: [{ name: 'Sarah Jenkins' }, { email: 'heartware08@gmail.com' }] },
      { $set: { name: 'Heartware', companyName: 'Heartware' } }
    );
    console.log('Updated Sarah Jenkins client users:', res1.modifiedCount);

    const res2 = await User.updateMany(
      { role: 'client', $or: [{ name: 'Client User' }, { name: 'Demo Client' }] },
      { $set: { companyName: 'Heartware' } }
    );
    console.log('Updated dummy client users:', res2.modifiedCount);

    // 2. Also ensure all client users have companyName set to Heartware if unset or generic
    const res3 = await User.updateMany(
      { role: 'client', $or: [{ companyName: { $in: [null, '', undefined] } }, { companyName: 'Apex Innovations' }] },
      { $set: { companyName: 'Heartware' } }
    );
    console.log('Updated client companyNames:', res3.modifiedCount);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  }
}

updateClient();
