const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/gigsphere_v3')
  .then(async () => {
    const res = await User.updateMany({ role: 'client' }, { $set: { companyName: 'Heartware' } });
    console.log('Updated users:', res.modifiedCount);
    mongoose.disconnect();
  })
  .catch(console.error);
