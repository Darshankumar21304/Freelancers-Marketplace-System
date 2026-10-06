require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User, FreelancerProfile } = require('./src/models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://darshanmca2024_db_user:zhwlwmY4s993ZdBB@cluster0.4fmgmto.mongodb.net/gigsphere?retryWrites=true&w=majority';

async function seedAccounts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    const defaultPassword = 'Admin@123';
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(defaultPassword, salt);

    const accounts = [
      {
        name: 'Sarah Jenkins',
        email: 'q@q.com',
        role: 'client',
        companyName: 'Apex Innovations',
        location: 'San Francisco, USA',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
        profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'
      },
      {
        name: 'Robert Vance',
        email: 'client@q.com',
        role: 'client',
        companyName: 'Vance Technologies',
        location: 'New York, USA',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250',
        profilePhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250'
      },
      {
        name: 'Freelancer User',
        email: 'freelancer@q.com',
        role: 'freelancer',
        location: 'San Francisco, USA',
        profile: {
          title: 'Full Stack React & Node.js Developer',
          bio: 'Experienced developer specializing in modern full-stack web applications.',
          skills: 'React, Node.js, Express, MongoDB, TailwindCSS',
          hourlyRate: 50
        }
      },
      {
        name: 'Alex Freelancer',
        email: 'f@q.com',
        role: 'freelancer',
        location: 'London, UK',
        profile: {
          title: 'UI/UX Designer & Frontend Engineer',
          bio: 'Designing and building intuitive interfaces that users love.',
          skills: 'Figma, React, UI/UX, JavaScript',
          hourlyRate: 45
        }
      },
      {
        name: 'System Admin',
        email: 'admin@q.com',
        role: 'admin',
        location: 'Global'
      }
    ];

    console.log('\n--- CREATING / UPDATING USER ACCOUNTS ---');
    for (const acc of accounts) {
      const normalizedEmail = acc.email.toLowerCase().trim();
      
      let user = await User.findOne({ email: normalizedEmail });
      if (user) {
        user.password_hash = password_hash;
        user.role = acc.role;
        user.name = acc.name;
        user.location = acc.location;
        if (acc.companyName) user.companyName = acc.companyName;
        if (acc.avatar) user.avatar = acc.avatar;
        if (acc.profilePhoto) user.profilePhoto = acc.profilePhoto;
        await user.save();
        console.log(`[UPDATED] ${acc.role.toUpperCase()} -> Email: ${acc.email} | Password: ${defaultPassword}`);
      } else {
        user = await User.create({
          name: acc.name,
          email: normalizedEmail,
          password_hash,
          role: acc.role,
          location: acc.location,
          companyName: acc.companyName,
          avatar: acc.avatar,
          profilePhoto: acc.profilePhoto
        });
        console.log(`[CREATED] ${acc.role.toUpperCase()} -> Email: ${acc.email} | Password: ${defaultPassword}`);
      }

      if (acc.role === 'freelancer' && acc.profile) {
        await FreelancerProfile.findOneAndUpdate(
          { user_id: user._id },
          {
            user_id: user._id,
            title: acc.profile.title,
            bio: acc.profile.bio,
            skills: acc.profile.skills,
            hourlyRate: acc.profile.hourlyRate
          },
          { upsert: true, new: true }
        );
      }
    }

    console.log('\nAll user accounts are ready!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding accounts:', error);
    process.exit(1);
  }
}

seedAccounts();
