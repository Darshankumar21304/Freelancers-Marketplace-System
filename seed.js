require('dotenv').config();
const mongoose = require('mongoose');
const { User, FreelancerProfile } = require('./src/models');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB');

  // Clear existing freelancers
  await User.deleteMany({ role: 'freelancer' });
  await FreelancerProfile.deleteMany({});

  // Seed 3 freelancers
  const freelancers = [
    {
      name: 'Alice Developer',
      email: 'alice@example.com',
      password_hash: 'dummy',
      role: 'freelancer'
    },
    {
      name: 'Bob Designer',
      email: 'bob@example.com',
      password_hash: 'dummy',
      role: 'freelancer'
    },
    {
      name: 'Charlie Marketing',
      email: 'charlie@example.com',
      password_hash: 'dummy',
      role: 'freelancer'
    }
  ];

  const createdUsers = await User.insertMany(freelancers);

  const profiles = [
    {
      user_id: createdUsers[0]._id,
      title: 'Senior Full Stack Developer',
      bio: 'Expert in React, Node.js, and modern web apps.',
      skills: 'React, Node.js, MongoDB',
      hourlyRate: '1500'
    },
    {
      user_id: createdUsers[1]._id,
      title: 'UI/UX Designer',
      bio: 'Creating beautiful, intuitive, and modern interfaces.',
      skills: 'Figma, UI/UX, Design',
      hourlyRate: '1200'
    },
    {
      user_id: createdUsers[2]._id,
      title: 'Digital Marketing Specialist',
      bio: 'Helping your business grow with data-driven marketing.',
      skills: 'SEO, Marketing, Copywriting',
      hourlyRate: '1000'
    }
  ];

  await FreelancerProfile.insertMany(profiles);

  console.log('Seeded 3 freelancers successfully!');
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
