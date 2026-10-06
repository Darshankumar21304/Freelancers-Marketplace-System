require('dotenv').config();
const connectDB = require('../src/config/db');
const { getFreelancerAnalytics } = require('../src/controllers/analyticsController');
const { User } = require('../src/models');

async function test() {
  await connectDB();
  const u = await User.findOne({ email: 'neelanjanv08@gmail.com' });
  const req = { user: { id: u._id, role: u.role } };
  const res = {
    json: (data) => {
      console.log('ANALYTICS CONTROLLER OUTPUT:', JSON.stringify(data, null, 2));
      process.exit(0);
    },
    status: (code) => {
      console.log('STATUS CODE:', code);
      return {
        json: (data) => {
          console.error('ERROR JSON:', data);
          process.exit(1);
        }
      };
    }
  };

  await getFreelancerAnalytics(req, res);
}
test();
