const mongoose = require('mongoose');

async function cleanProjectAttachments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gigsphere');
    console.log('Connected to MongoDB');

    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
    const result = await Project.updateMany(
      {},
      { $set: { attachments: [] } }
    );

    console.log(`Cleaned legacy attachments from ${result.modifiedCount || result.nModified || 0} projects.`);
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning attachments:', err);
    process.exit(1);
  }
}

cleanProjectAttachments();
