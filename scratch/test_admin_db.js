const mongoose = require('mongoose');
const { User, Project, Gig, Contract, Transaction, Dispute, TrustReview, RecommendationEvent } = require('../src/models');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gigsphere');
  console.log('MongoDB Connected!');

  const [
    totalUsers,
    totalClients,
    totalFreelancers,
    totalProjects,
    activeProjects,
    totalGigs,
    activeGigs,
    totalContracts,
    totalDisputes,
    totalTransactions,
    pendingKyc,
    highRisk
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'client' }),
    User.countDocuments({ role: 'freelancer' }),
    Project.countDocuments(),
    Project.countDocuments({ status: { $in: ['Open', 'Active', 'In Progress', 'open', 'active'] } }),
    Gig.countDocuments(),
    Gig.countDocuments({ status: { $ne: 'Paused' } }),
    Contract.countDocuments(),
    Dispute.countDocuments(),
    Transaction.countDocuments(),
    User.countDocuments({ kycStatus: { $in: ['Pending Approval', 'Pending', 'Action Required'] } }),
    User.countDocuments({ $or: [{ aiRiskScore: { $gte: 70 } }, { verificationStatus: { $in: ['flagged', 'suspended'] } }] })
  ]);

  const contractGmvRes = await Contract.aggregate([
    { $group: { _id: null, total: { $sum: '$totalValue' } } }
  ]);
  const totalVolume = contractGmvRes.length > 0 ? contractGmvRes[0].total : 0;

  console.log('--- ACTUAL LIVE MONGODB STATS ---');
  console.log({
    totalUsers,
    totalClients,
    totalFreelancers,
    totalProjects,
    activeProjects,
    totalGigs,
    activeGigs,
    totalContracts,
    totalVolume,
    totalDisputes,
    totalTransactions,
    pendingKyc,
    highRisk
  });

  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
