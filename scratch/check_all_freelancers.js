require('dotenv').config();
const mongoose = require('mongoose');

async function checkAllFreelancers() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://darshanmca2024_db_user:zhwlwmY4s993ZdBB@cluster0.4fmgmto.mongodb.net/gigsphere?retryWrites=true&w=majority';
    console.log(`Connecting to MongoDB Atlas...`);
    await mongoose.connect(mongoUri);

    const { User, FreelancerProfile } = require('../src/models');

    const freelancers = await User.find({ role: 'freelancer' }).select('-password_hash');
    console.log(`\nFound ${freelancers.length} Freelancer Account(s) in DB:\n`);

    for (const f of freelancers) {
      const profile = await FreelancerProfile.findOne({ user_id: f._id });
      console.log(`========================================`);
      console.log(`ID:       ${f._id}`);
      console.log(`Name:     ${f.name}`);
      console.log(`Email:    ${f.email}`);
      console.log(`Role:     ${f.role}`);
      console.log(`Location: ${f.location || f.country || 'N/A'}`);
      console.log(`Created:  ${f.createdAt}`);
      console.log(`\n--- PROFILE ---`);
      if (profile) {
        const skillsDisplay = Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || '(none)');
        console.log(`Title:              ${profile.title || '(none)'}`);
        console.log(`Bio:                ${profile.bio || '(none)'}`);
        console.log(`Skills:             ${skillsDisplay}`);
        console.log(`Experience:         ${profile.experience}`);
        console.log(`Availability:       ${profile.availability}`);
        console.log(`Completion %:       ${profile.profileCompletion}%`);
        console.log(`Portfolio Items:    ${(profile.portfolioItems || []).length}`);
        if ((profile.portfolioItems || []).length > 0) {
          profile.portfolioItems.forEach((p, idx) => {
            console.log(`  [${idx + 1}] Title: ${p.title} | Link/URL: ${p.link || p.url} | Image: ${p.imageUrl ? 'Yes' : 'No'}`);
          });
        }
      } else {
        console.log(`(No FreelancerProfile document found!)`);
      }
      console.log(`========================================\n`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error running check:', err);
    process.exit(1);
  }
}

checkAllFreelancers();
