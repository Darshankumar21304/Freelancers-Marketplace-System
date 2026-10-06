require('dotenv').config();
const mongoose = require('mongoose');
const { User, Project, Gig, Contract, Dispute, Transaction, TrustEvent, TrustReview } = require('../src/models');

async function testAdminData() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const [
    totalUsers,
    totalClients,
    totalFreelancers,
    blockedUsers,
    pendingKyc,
    totalProjects,
    activeProjects,
    completedProjects,
    totalGigs,
    totalContracts,
    activeContracts,
    completedContracts,
    totalDisputes,
    pendingDisputes,
    pendingPayouts,
    highRiskUsers,
    pendingTrustReviews
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'client' }),
    User.countDocuments({ role: 'freelancer' }),
    User.countDocuments({ isBlocked: true }),
    User.countDocuments({ kycStatus: { $in: ['Pending Approval', 'Pending', 'Action Required'] } }),
    Project.countDocuments(),
    Project.countDocuments({ status: { $in: ['Open', 'Active', 'In Progress'] } }),
    Project.countDocuments({ status: 'Completed' }),
    Gig.countDocuments(),
    Contract.countDocuments(),
    Contract.countDocuments({ status: { $in: ['In Progress', 'Submitted for Review', 'Revision Requested'] } }),
    Contract.countDocuments({ status: 'Completed' }),
    Dispute.countDocuments(),
    Dispute.countDocuments({ status: { $in: ['Open', 'Under Review'] } }),
    Transaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
    User.countDocuments({ $or: [{ aiRiskScore: { $gte: 70 } }, { verificationStatus: { $in: ['flagged', 'suspended'] } }] }),
    TrustReview.countDocuments({ status: 'pending' }).catch(() => 0)
  ]);

  // Financial calculations
  const contractGmvRes = await Contract.aggregate([
    { $group: { _id: null, total: { $sum: '$totalValue' } } }
  ]);
  const contractGmv = contractGmvRes.length > 0 ? contractGmvRes[0].total : 0;

  const escrowRes = await User.aggregate([
    { $group: { _id: null, total: { $sum: '$escrowBalance' } } }
  ]);
  const totalEscrow = escrowRes.length > 0 ? escrowRes[0].total : 0;

  // Monthly trends aggregation
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const monthlySignups = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const monthlyProjects = await Project.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  console.log({
    users: { totalUsers, totalClients, totalFreelancers, blockedUsers, pendingKyc, highRiskUsers },
    marketplace: { totalProjects, activeProjects, completedProjects, totalGigs, totalContracts, activeContracts, completedContracts },
    moderation: { totalDisputes, pendingDisputes, pendingPayouts, pendingTrustReviews },
    finances: { contractGmv, totalEscrow, platformRevenue: Math.round(contractGmv * 0.10) },
    monthlySignups,
    monthlyProjects
  });

  process.exit(0);
}

testAdminData().catch(err => {
  console.error(err);
  process.exit(1);
});
