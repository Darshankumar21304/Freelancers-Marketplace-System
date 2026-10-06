require('dotenv').config();
const mongoose = require('mongoose');

async function fixNeelanjanProfile() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://darshanmca2024_db_user:zhwlwmY4s993ZdBB@cluster0.4fmgmto.mongodb.net/gigsphere?retryWrites=true&w=majority';
    console.log(`Connecting to MongoDB Atlas...`);
    await mongoose.connect(mongoUri);

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const FreelancerProfile = mongoose.model('FreelancerProfile', new mongoose.Schema({}, { strict: false }));

    const user = await User.findOne({ email: 'neelanjanv08@gmail.com' });
    if (!user) {
      console.error('User neelanjanv08@gmail.com not found!');
      process.exit(1);
    }

    console.log(`Found User: ${user.name} (${user.email}), Role: ${user.role}`);

    // Ensure user role is freelancer
    user.role = 'freelancer';
    user.location = user.location || 'Udupi';
    user.country = user.country || 'India';
    await user.save();

    let profile = await FreelancerProfile.findOne({ user_id: user._id });
    if (!profile) {
      profile = new FreelancerProfile({ user_id: user._id });
    }

    profile.title = profile.title || 'Full Stack Developer';
    profile.bio = profile.bio || 'Passionate Full Stack Developer with expertise in building responsive web apps using React, Node.js, and Cloudinary CDN integration.';
    profile.skills = ['React', 'Node.js', 'MongoDB', 'UI/UX Design', 'JavaScript'];
    profile.category = 'Web Development';
    profile.experience = 'Intermediate (2-5 years)';
    profile.availability = 'Full-time (30+ hrs/wk)';
    profile.hourlyRate = 500;
    profile.location = 'Udupi';

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

    // Calculate completion score
    let score = 0;
    if (profile.title) score += 20;
    if (profile.bio) score += 20;
    if (profile.skills && profile.skills.length > 0) score += 20;
    if (profile.experience || profile.availability) score += 10;
    if (profile.portfolioItems && profile.portfolioItems.length > 0) score += 10;
    if (profile.certifications && profile.certifications.length > 0) score += 10;
    if (profile.workExperience && profile.workExperience.length > 0) score += 10;
    profile.profileCompletion = Math.min(score, 100);

    await profile.save();
    console.log(`\nSuccessfully updated profile for ${user.email}!`);
    console.log(`Title: ${profile.title}`);
    console.log(`Bio: ${profile.bio}`);
    console.log(`Skills: ${profile.skills.join(', ')}`);
    console.log(`Completion %: ${profile.profileCompletion}%`);
    console.log(`Portfolio Projects Count: ${profile.portfolioItems.length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error fixing profile:', err);
    process.exit(1);
  }
}

fixNeelanjanProfile();
