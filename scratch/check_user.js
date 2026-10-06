const mongoose = require('mongoose');

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gigsphere');
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const FreelancerProfile = mongoose.model('FreelancerProfile', new mongoose.Schema({}, { strict: false }));

    const users = await User.find({ email: /neelanjan/i });
    console.log('--- USERS ---');
    console.log(JSON.stringify(users, null, 2));

    if (users.length > 0) {
      for (const u of users) {
        const profiles = await FreelancerProfile.find({ user_id: u._id });
        console.log(`--- PROFILES FOR USER ${u._id} (${u.email}) ---`);
        console.log(JSON.stringify(profiles, null, 2));
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUser();
