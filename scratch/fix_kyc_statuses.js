require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function fixKycStatuses() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gigsphere';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Find users with verificationStatus 'verified' but whose kycStatus is NOT 'Verified'
    const unverifiedUsers = await User.find({
      verificationStatus: 'verified',
      kycStatus: { $ne: 'Verified' }
    });

    console.log(`Found ${unverifiedUsers.length} users with unverified KYC but legacy verified status.`);

    for (const u of unverifiedUsers) {
      u.verificationStatus = 'unverified';
      await u.save();
      console.log(`Updated user ${u.name} (${u.email}) -> verificationStatus: 'unverified' (kycStatus: '${u.kycStatus}')`);
    }

    console.log('KYC Status normalization completed successfully.');
  } catch (error) {
    console.error('Error fixing KYC statuses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

fixKycStatuses();
