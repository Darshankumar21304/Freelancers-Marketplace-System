require('dotenv').config();
const mongoose = require('mongoose');
const { Project, User } = require('../src/models');

async function seedRealMarketplaceProjects() {
  await mongoose.connect(process.env.MONGO_URI);
  const client = await User.findOne({ role: 'client' });
  if (!client) {
    console.log('No client found in database');
    process.exit(1);
  }

  const sampleOpenProjects = [
    {
      client_id: client._id,
      title: 'E-Commerce Marketplace Web Platform',
      description: 'We need a senior full-stack developer to build an e-commerce platform using React frontend, Node.js and Express backend, and MongoDB database with Razorpay payment integration.',
      category: 'web_development',
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'Express', 'Payment Integration'],
      budget: '45000',
      skills: ['React', 'Node.js', 'MongoDB', 'Express', 'Payment Integration'],
      status: 'Open',
      experienceLevel: 'Intermediate',
      deadline: new Date(Date.now() + 25 * 86400000).toISOString()
    },
    {
      client_id: client._id,
      title: 'Enterprise Next.js SaaS Analytics Dashboard',
      description: 'Looking for an expert React and Next.js developer to build high-performance data analytics dashboards with Tailwind CSS and REST API integrations.',
      category: 'web_development',
      skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'REST API'],
      budget: '50000',
      status: 'Open',
      experienceLevel: 'Expert',
      deadline: new Date(Date.now() + 20 * 86400000).toISOString()
    },
    {
      client_id: client._id,
      title: 'Mobile Delivery Application with React Native',
      description: 'Develop a cross-platform mobile delivery app for iOS and Android using React Native and Firebase real-time database.',
      category: 'mobile_development',
      skills: ['React Native', 'JavaScript', 'Firebase', 'Mobile Development'],
      budget: '40000',
      status: 'Open',
      experienceLevel: 'Intermediate',
      deadline: new Date(Date.now() + 30 * 86400000).toISOString()
    },
    {
      client_id: client._id,
      title: 'AI Document Intelligence & RAG Chatbot',
      description: 'Build a LangChain and Python powered RAG chatbot that indexes PDF documentation into Pinecone vector store with FastAPI backend.',
      category: 'ai_ml',
      skills: ['Python', 'RAG', 'Machine Learning', 'FastAPI'],
      budget: '60000',
      status: 'Open',
      experienceLevel: 'Expert',
      deadline: new Date(Date.now() + 15 * 86400000).toISOString()
    }
  ];

  for (const p of sampleOpenProjects) {
    const existing = await Project.findOne({ title: p.title });
    if (!existing) {
      await Project.create(p);
      console.log('Created Open Project:', p.title);
    } else {
      await Project.updateOne({ _id: existing._id }, { $set: { status: 'Open' } });
      console.log('Updated to Open:', p.title);
    }
  }

  console.log('Marketplace projects sync complete.');
  process.exit(0);
}

seedRealMarketplaceProjects().catch(err => {
  console.error(err);
  process.exit(1);
});
