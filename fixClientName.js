const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/gigsphere_v3')
  .then(async () => {
    // Update the dummy client users to have a realistic company name
    const result = await User.updateMany(
      { role: 'client', $or: [{ name: 'Client User' }, { name: 'Demo Client' }] },
      { $set: { companyName: 'Heartware' } }
    );
    console.log(`Updated ${result.modifiedCount} dummy client(s) to Heartware.`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error updating DB:', err);
    process.exit(1);
  });
