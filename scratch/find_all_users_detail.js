require('dotenv').config();
const mongoose = require('mongoose');

async function checkDuplicates() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://darshanmca2024_db_user:zhwlwmY4s993ZdBB@cluster0.4fmgmto.mongodb.net/gigsphere?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const FreelancerProfile = mongoose.model('FreelancerProfile', new mongoose.Schema({}, { strict: false }));

    const allUsers = await User.find({});
    console.log(`TOTAL USERS IN DB: ${allUsers.length}`);
    for (const u of allUsers) {
      const profiles = await FreelancerProfile.find({ user_id: u._id });
      console.log(`User ID: ${u._id} | Email: ${u.email} | Role: ${u.role} | Name: ${u.name}`);
      console.log(`   Profiles Count: ${profiles.length}`);
      profiles.forEach(p => {
        console.log(`   -> Profile ID: ${p._id} | Title: "${p.title}" | Bio: "${p.bio}" | Projects: ${p.portfolioItems ? p.portfolioItems.length : 0}`);
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDuplicates();
