// Utility for managing proposals, received offers, and syncing accepted proposals into Active Projects

const PROPOSALS_KEY = 'gigsphere_proposals';
const OFFERS_KEY = 'gigsphere_offers';

export const INITIAL_PROPOSALS = [
  {
    id: 'PROP-101',
    projectId: 'prj-1',
    projectTitle: 'E-commerce App React Native',
    clientName: 'TechNova Solutions',
    clientVerified: true,
    freelancer: {
      name: 'Alex Rivera',
      title: 'Senior UI/UX Designer',
      avatar: 'https://i.pravatar.cc/150?img=11',
      verified: true,
      rating: 4.9,
      reviews: 124,
      location: 'New Delhi, India',
      completedProjects: 85
    },
    submittedDate: 'Oct 24, 2023',
    status: 'Pending',
    bidAmount: 45000,
    deliveryTime: '3 Weeks',
    coverLetter: 'Hi, I have extensive experience building React Native applications for e-commerce. I recently completed a very similar project for a retail client, resulting in a 30% increase in mobile conversions.',
    skills: ['React Native', 'Redux', 'Stripe Integration'],
    projectBudget: '₹40,000 - ₹50,000',
    lastActivity: '2 hours ago'
  },
  {
    id: 'PROP-102',
    projectId: 'prj-1',
    projectTitle: 'Custom WordPress Theme Development',
    clientName: 'Studio Creative',
    clientVerified: true,
    freelancer: {
      name: 'Sarah Chen',
      title: 'Product Designer',
      avatar: 'https://i.pravatar.cc/150?img=5',
      verified: true,
      rating: 4.7,
      reviews: 42,
      location: 'Mumbai, India',
      completedProjects: 31
    },
    submittedDate: 'Oct 20, 2023',
    status: 'Shortlisted',
    bidAmount: 28000,
    deliveryTime: '2 Weeks',
    coverLetter: 'I am a WordPress expert with 5 years of experience creating custom themes from scratch. I reviewed your Figma files and I can build a pixel-perfect, responsive theme.',
    skills: ['WordPress', 'PHP', 'CSS3', 'Figma'],
    projectBudget: '₹25,000 - ₹35,000',
    lastActivity: '1 day ago'
  },
  {
    id: 'PROP-103',
    projectId: 'prj-2',
    projectTitle: 'Node.js Backend Microservices',
    clientName: 'GlobalFin Inc',
    clientVerified: false,
    freelancer: {
      name: 'Priya Sharma',
      title: 'Backend Specialist',
      avatar: 'https://i.pravatar.cc/150?img=44',
      verified: true,
      rating: 5.0,
      reviews: 89,
      location: 'Bangalore, India',
      completedProjects: 120
    },
    submittedDate: 'Oct 15, 2023',
    status: 'Accepted',
    bidAmount: 85000,
    deliveryTime: '1 Month',
    coverLetter: 'I specialize in Node.js backend architectures. I will design your microservices using Express, Redis for caching, and MongoDB.',
    skills: ['Node.js', 'MongoDB', 'Microservices', 'AWS'],
    projectBudget: '₹80,000 - ₹1,00,000',
    lastActivity: 'Oct 18, 2023'
  },
  {
    id: 'PROP-104',
    projectId: 'prj-1',
    projectTitle: 'Logo and Brand Identity Design',
    clientName: 'StartUp Hub',
    clientVerified: true,
    freelancer: {
      name: 'Rohan Mehta',
      title: 'Brand Designer',
      avatar: 'https://i.pravatar.cc/150?img=12',
      verified: false,
      rating: 4.6,
      reviews: 18,
      location: 'Pune, India',
      completedProjects: 14
    },
    submittedDate: 'Oct 10, 2023',
    status: 'Declined',
    bidAmount: 15000,
    deliveryTime: '1 Week',
    coverLetter: 'As a visual designer, I can create a unique and memorable brand identity for StartUp Hub.',
    skills: ['Illustrator', 'Branding', 'Graphic Design'],
    projectBudget: '₹10,000 - ₹20,000',
    lastActivity: 'Oct 12, 2023'
  },
  {
    id: 'PROP-105',
    projectId: 'prj-2',
    projectTitle: 'SEO Content Writing',
    clientName: 'Marketing Pro',
    clientVerified: true,
    freelancer: {
      name: 'Vikram Verma',
      title: 'SEO Content Writer',
      avatar: 'https://i.pravatar.cc/150?img=33',
      verified: true,
      rating: 4.8,
      reviews: 55,
      location: 'Hyderabad, India',
      completedProjects: 40
    },
    submittedDate: 'Oct 05, 2023',
    status: 'Withdrawn',
    bidAmount: 5000,
    deliveryTime: '3 Days',
    coverLetter: 'I can write high-converting SEO articles for your tech blog.',
    skills: ['SEO', 'Content Writing', 'Tech Writing'],
    projectBudget: '₹5,000',
    lastActivity: 'Oct 06, 2023'
  }
];

export const INITIAL_OFFERS = [
  {
    id: 'OFF-201',
    projectTitle: 'Senior Frontend Developer for SaaS',
    clientName: 'CloudScale Inc',
    clientVerified: true,
    receivedDate: 'Oct 25, 2023',
    status: 'Pending',
    offerAmount: 120000,
    deliveryTime: '2 Months',
    projectDescription: 'We are looking for a senior frontend developer to help us migrate our legacy dashboard to React. You will be working with a team of 3 backend developers.',
    skills: ['React', 'Redux', 'Tailwind CSS'],
    clientStats: { hireRate: '85%', totalSpent: '₹12,00,000+', rating: 4.8 }
  },
  {
    id: 'OFF-202',
    projectTitle: 'UI/UX Design for Fintech App',
    clientName: 'FinTrust',
    clientVerified: true,
    receivedDate: 'Oct 22, 2023',
    status: 'Pending',
    offerAmount: 60000,
    deliveryTime: '3 Weeks',
    projectDescription: 'We need a complete redesign of our mobile banking app. The current app has usability issues. We want a modern, clean, and trustworthy design.',
    skills: ['Figma', 'UI/UX', 'Mobile Design'],
    clientStats: { hireRate: '100%', totalSpent: '₹4,50,000+', rating: 5.0 }
  }
];

export const getStoredProposals = () => {
  const stored = localStorage.getItem(PROPOSALS_KEY);
  if (!stored) {
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(INITIAL_PROPOSALS));
    return INITIAL_PROPOSALS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_PROPOSALS;
  }
};

export const saveStoredProposals = (proposals) => {
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
};

export const getStoredOffers = () => {
  const stored = localStorage.getItem(OFFERS_KEY);
  if (!stored) {
    localStorage.setItem(OFFERS_KEY, JSON.stringify(INITIAL_OFFERS));
    return INITIAL_OFFERS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_OFFERS;
  }
};

export const saveStoredOffers = (offers) => {
  localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
};

// Convert accepted proposal or offer into an Active Project structure
export const convertAcceptedToProject = (item) => {
  const value = item.bidAmount || item.offerAmount || 50000;
  const earned = Math.round(value * 0.3);
  
  return {
    id: item.id,
    _id: item.id,
    title: item.projectTitle,
    clientName: item.clientName,
    clientAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.clientName || 'C')}&background=2563eb&color=fff`,
    status: 'In Progress',
    totalValue: value,
    amountEarned: earned,
    progress: 35,
    daysRemaining: 14,
    milestonesTotal: 3,
    milestonesCompleted: 1,
    currentMilestone: 'Core Features Implementation',
    nextDeadline: item.deliveryTime || '14 Days',
    startDate: item.submittedDate || item.receivedDate || new Date().toLocaleDateString(),
    deadline: 'In 30 Days',
    milestones: [
      { id: `${item.id}-m1`, _id: `${item.id}-m1`, title: 'Planning & Architecture setup', amount: Math.round(value * 0.3), deadline: new Date(Date.now() - 5 * 86400000).toISOString(), status: 'Completed' },
      { id: `${item.id}-m2`, _id: `${item.id}-m2`, title: 'Core Features & API Integration', amount: Math.round(value * 0.4), deadline: new Date(Date.now() + 10 * 86400000).toISOString(), status: 'In Progress' },
      { id: `${item.id}-m3`, _id: `${item.id}-m3`, title: 'Testing, QA & Final Handover', amount: Math.round(value * 0.3), deadline: new Date(Date.now() + 25 * 86400000).toISOString(), status: 'Pending' }
    ]
  };
};

// Get all accepted projects (from accepted proposals and accepted offers)
export const getAcceptedProjects = () => {
  const proposals = getStoredProposals();
  const offers = getStoredOffers();

  const acceptedProposals = proposals.filter(p => p.status === 'Accepted' || p.status === 'Hired');
  const acceptedOffers = offers.filter(o => o.status === 'Accepted' || o.status === 'Hired');

  const combined = [...acceptedProposals, ...acceptedOffers];
  return combined.map(convertAcceptedToProject);
};
