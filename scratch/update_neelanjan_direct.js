require('dotenv').config();
const mongoose = require('mongoose');

async function updateDirect() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://darshanmca2024_db_user:zhwlwmY4s993ZdBB@cluster0.4fmgmto.mongodb.net/gigsphere?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);

    const { User, FreelancerProfile } = require('../src/models');

    const user = await User.findOne({ email: 'neelanjanv08@gmail.com' });
    console.log('Found user:', user._id, user.name);

    user.role = 'freelancer';
    user.location = user.location || 'Udupi';
    user.country = user.country || 'India';
    await user.save();

    let profile = await FreelancerProfile.findOne({ user_id: user._id });
    if (!profile) {
      profile = new FreelancerProfile({ user_id: user._id });
    }

    profile.title = 'Full Stack Developer';
    profile.bio = 'Passionate Full Stack Developer with expertise in building modern, responsive web applications using React, Node.js, and Cloudinary CDN integration.';
    profile.skills = ['React', 'Node.js', 'MongoDB', 'UI/UX Design', 'JavaScript'];
    profile.category = 'Web Development';
    profile.experience = 'Intermediate (2-5 years)';
    profile.availability = 'Full-time (30+ hrs/wk)';
    profile.hourlyRate = 500;

    profile.portfolioItems = [
      {
        title: 'GigSphere Freelance Marketplace System',
        description: 'A modern, full-stack freelance marketplace featuring real-time chat, escrow payments, Cloudinary media CDN, and AI security insights.',
        category: 'Web Development',
        skills: ['React', 'Node.js', 'Express', 'MongoDB'],
        link: 'https://github.com/Darshankumar21304/GigSphere-Freelancers-marketplace-system',
        url: 'https://github.com/Darshankumar21304/GigSphere-Freelancers-marketplace-system',
        imageUrl: 'https://res.cloudinary.com/s5moukpf/image/upload/v1788584761/gigsphere/images/1788584759560_WhatsApp_Image_2026-08-16_at_8_14_15_PM.jpeg.jpg'
      },
      {
        title: 'AI Analytics & Management Dashboard',
        description: 'SaaS analytics platform with live data visualizations, customizable widget layouts, and responsive dark mode UI design.',
        category: 'UI/UX Design',
        skills: ['React', 'TailwindCSS', 'Figma', 'Chart.js'],
        link: 'https://gigsphere-analytics.example.com',
        url: 'https://gigsphere-analytics.example.com',
        imageUrl: 'https://res.cloudinary.com/s5moukpf/image/upload/v1788584761/gigsphere/images/1788584759560_WhatsApp_Image_2026-08-16_at_8_14_15_PM.jpeg.jpg'
      }
    ];

    profile.workExperience = [
      {
        company: 'TechSphere Solutions',
        role: 'Senior Software Engineer',
        startDate: '2023-01',
        endDate: 'Present',
        isCurrent: true,
        description: 'Developed scalable MERN stack web apps and integrated REST APIs.'
      }
    ];

    profile.certifications = [
      {
        name: 'Full Stack Web Developer Certification',
        issuer: 'Google Antigravity Learning',
        issueDate: '2024',
        credentialUrl: 'https://gigsphere.com/certs/verify'
      }
    ];

    await profile.save();

    console.log('\nUPDATED AND SAVED PROFILE ON DB FOR:', user.email);

    const verified = await FreelancerProfile.findOne({ user_id: user._id });
    console.log('VERIFIED IN DB:');
    console.log('Title:', verified.title);
    console.log('Bio:', verified.bio);
    console.log('Skills:', verified.skills);
    console.log('Completion %:', verified.profileCompletion);
    console.log('Portfolio Items:', verified.portfolioItems.length);
    verified.portfolioItems.forEach((item, idx) => {
      console.log(`  [${idx + 1}] Title: ${item.title} | Link: ${item.link} | Image: ${item.imageUrl ? 'Yes' : 'No'}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error updating:', err);
    process.exit(1);
  }
}

updateDirect();
