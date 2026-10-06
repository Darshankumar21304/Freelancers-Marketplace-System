require('dotenv').config();
const mongoose = require('mongoose');

async function debugContractDetails() {
  const mongoUri = process.env.MONGO_URI || 'mongodb+srv://darshanmca2024_db_user:zhwlwmY4s993ZdBB@cluster0.4fmgmto.mongodb.net/gigsphere?retryWrites=true&w=majority';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB\n');

  const Contract = mongoose.model('Contract', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));

  // Get full contract with all fields
  const contracts = await Contract.find({})
    .populate('freelancer_id')
    .populate('project_id');

  for (const c of contracts) {
    console.log('=== CONTRACT FULL FIELDS ===');
    console.log(JSON.stringify({
      _id: c._id,
      title: c.title,
      status: c.status,
      deadline: c.deadline,
      totalValue: c.totalValue,
      project_id: c.project_id ? {
        _id: c.project_id._id,
        title: c.project_id.title,
        deadline: c.project_id.deadline,
        budget: c.project_id.budget,
      } : null,
      freelancer_id: c.freelancer_id ? {
        _id: c.freelancer_id._id,
        name: c.freelancer_id.name,
        avatar: c.freelancer_id.avatar,
        profilePhoto: c.freelancer_id.profilePhoto,
        profilePicture: c.freelancer_id.profilePicture,
        photo: c.freelancer_id.photo,
      } : null,
    }, null, 2));
  }

  // Also check the User model directly for all photo-related fields
  const fl = await User.findById('6a9ba344ca22ebce9a663f47');
  console.log('\n=== FREELANCER USER ALL FIELDS ===');
  const flObj = fl?.toObject() || {};
  const photoFields = {};
  for (const [k, v] of Object.entries(flObj)) {
    if (typeof v === 'string' && (k.toLowerCase().includes('avatar') || k.toLowerCase().includes('photo') || k.toLowerCase().includes('pic') || k.toLowerCase().includes('image'))) {
      photoFields[k] = v;
    }
  }
  console.log('Photo-related fields:', JSON.stringify(photoFields, null, 2));
  console.log('name:', fl?.name);
  console.log('All keys:', Object.keys(flObj).join(', '));

  await mongoose.disconnect();
  process.exit(0);
}
debugContractDetails().catch(console.error);
