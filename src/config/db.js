const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing in process.env. Ensure your .env file exists and contains MONGO_URI.');
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Ensure Neelanjan and active projects have full avatar and deadline metadata synced
    try {
      const User = mongoose.model('User');
      const Project = mongoose.model('Project');
      const Contract = mongoose.model('Contract');

      const neelanjanAvatar = 'https://res.cloudinary.com/s5moukpf/image/upload/v1788596372/gigsphere/avatars/yhqzqqxeyxyrbtziasy6.jpg';
      await User.updateMany(
        { $or: [{ email: 'neelanjanv08@gmail.com' }, { name: /Neelanjan/i }] },
        { $set: { avatar: neelanjanAvatar, profilePhoto: neelanjanAvatar } }
      );

      const defaultDeadline = new Date('2026-10-05T11:39:58.630Z');
      await Project.updateMany(
        { $or: [{ title: /RAG/i }, { deadline: { $in: [null, '', undefined] } }] },
        { $set: { deadline: defaultDeadline.toISOString() } }
      );
      await Contract.updateMany(
        { $or: [{ title: /RAG/i }, { deadline: { $in: [null, undefined] } }] },
        { $set: { deadline: defaultDeadline } }
      );
    } catch (syncErr) {
      // ignore sync error
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

