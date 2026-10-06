require('dotenv').config();
const mongoose = require('mongoose');

async function removeDummyData() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://darshanmca2024_db_user:zhwlwmY4s993ZdBB@cluster0.4fmgmto.mongodb.net/gigsphere?retryWrites=true&w=majority';
    console.log(`Connecting to MongoDB Atlas...`);
    await mongoose.connect(mongoUri);

    const { User, FreelancerProfile } = require('../src/models');

    const user = await User.findOne({ email: 'neelanjanv08@gmail.com' });
    if (!user) {
      console.error('User neelanjanv08@gmail.com not found!');
      process.exit(1);
    }

    console.log(`Found User: ${user.name} (${user.email})`);

    const profile = await FreelancerProfile.findOne({ user_id: user._id });
    if (profile) {
      profile.portfolioItems = [];
      profile.certifications = [];
      profile.workExperience = [];

      // Calculate completion score
      let score = 0;
      if (profile.title && profile.title.trim()) score += 20;
      if (profile.bio && profile.bio.trim()) score += 20;
      if (profile.skills && profile.skills.length > 0) score += 20;
      if (profile.experience || profile.availability) score += 10;
      if (profile.portfolioItems && profile.portfolioItems.length > 0) score += 10;
      if (profile.certifications && profile.certifications.length > 0) score += 10;
      if (profile.workExperience && profile.workExperience.length > 0) score += 10;
      profile.profileCompletion = Math.min(score, 100);

      await profile.save();

      console.log(`\nSuccessfully removed dummy portfolio, certs, and work experience for ${user.email}!`);
      console.log(`Updated Completion %: ${profile.profileCompletion}%`);
      console.log(`Projects: ${profile.portfolioItems.length}`);
      console.log(`Certs: ${profile.certifications.length}`);
      console.log(`Experience: ${profile.workExperience.length}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error removing dummy data:', err);
    process.exit(1);
  }
}

removeDummyData();
