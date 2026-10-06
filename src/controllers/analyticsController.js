const { Contract, Project, Review, Transaction, Gig, User, FreelancerProfile } = require('../models');

// GET /api/analytics/freelancer
exports.getFreelancerAnalytics = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const freelancerId = String(req.user.id || req.user._id || '');
    let flObjectId;
    try { flObjectId = new mongoose.Types.ObjectId(freelancerId); } catch(e) { flObjectId = null; }

    const flOr = [{ freelancer_id: freelancerId }];
    if (flObjectId) flOr.push({ freelancer_id: flObjectId });

    const userOr = [{ user_id: freelancerId }];
    if (flObjectId) userOr.push({ user_id: flObjectId });

    const projOr = [{ 'proposals.freelancer_id': freelancerId }];
    if (flObjectId) projOr.push({ 'proposals.freelancer_id': flObjectId });

    // 1. Fetch Real Database Data in Parallel
    const [contracts, allProjects, reviews, transactions, gigs, user, profile] = await Promise.all([
      Contract.find({ $or: flOr }).populate('client_id', 'name firstName lastName companyName avatar profilePhoto email').sort({ createdAt: -1 }),
      Project.find({ $or: projOr }).populate('client_id', 'name firstName lastName companyName avatar profilePhoto email').sort({ createdAt: -1 }),
      Review.find({ $or: flOr }).populate('reviewer_id', 'name firstName lastName avatar companyName').sort({ createdAt: -1 }),
      Transaction.find({ $or: userOr }).sort({ createdAt: -1 }),
      Gig.find({ $or: flOr }),
      User.findById(freelancerId),
      FreelancerProfile.findOne({ $or: userOr })
    ]);

    // 2. Extract Real Proposals
    const myProposals = [];
    (allProjects || []).forEach(project => {
      if (project.proposals && Array.isArray(project.proposals)) {
        project.proposals.forEach(prop => {
          if (prop.freelancer_id && prop.freelancer_id.toString() === freelancerId.toString()) {
            myProposals.push({
              _id: prop._id,
              bidAmount: prop.bidAmount || 0,
              coverLetter: prop.coverLetter,
              deliveryTime: prop.deliveryTime,
              status: prop.status || 'Pending',
              createdAt: prop.createdAt || project.createdAt,
              projectTitle: project.title,
              projectBudget: project.budget
            });
          }
        });
      }
    });

    // 3. Financial Metrics Computation
    let totalEarnings = 0;
    let pendingEscrow = 0;
    let completedContractsCount = 0;
    let activeContractsCount = 0;
    let totalMilestonesCount = 0;
    let completedMilestonesCount = 0;

    const contractsData = Array.isArray(contracts) ? contracts : [];
    contractsData.forEach(c => {
      const isCompleted = c.status === 'Completed';
      const isActive = c.status === 'Active' || c.status === 'In Progress' || c.status === 'Submitted for Review';
      if (isCompleted) completedContractsCount++;
      if (isActive) activeContractsCount++;

      if (Array.isArray(c.milestones) && c.milestones.length > 0) {
        c.milestones.forEach(m => {
          totalMilestonesCount++;
          const amount = Number(m.amount || 0);
          if (m.status === 'Completed' || m.status === 'Paid') {
            completedMilestonesCount++;
            totalEarnings += amount;
          } else if (m.status === 'In Progress' || m.status === 'Under Review' || m.status === 'Pending') {
            pendingEscrow += amount;
          }
        });
      } else {
        const val = Number(c.totalValue || c.budget || 0);
        if (isCompleted) totalEarnings += val;
        else if (isActive) pendingEscrow += val;
      }
    });

    // Compute wallet balances
    const availableBalance = user?.walletBalance || 0;
    const txList = Array.isArray(transactions) ? transactions : [];
    
    // Check if transactions contain released earnings
    const releaseTotal = txList
      .filter(t => t.type === 'escrow_release' || t.type === 'earning' || (t.type === 'deposit' && t.status === 'completed'))
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    if (releaseTotal > totalEarnings) {
      totalEarnings = releaseTotal;
    }

    if (totalEarnings === 0 && user?.walletBalance && user.walletBalance > 0) {
      totalEarnings = user.walletBalance;
    }

    const avgContractValue = contractsData.length > 0 
      ? Math.round(contractsData.reduce((acc, c) => acc + (c.totalValue || c.budget || 0), 0) / contractsData.length)
      : (myProposals.length > 0 ? Math.round(myProposals.reduce((acc, p) => acc + (p.bidAmount || 0), 0) / myProposals.length) : 0);

    // 4. Proposals Funnel
    const totalProposals = myProposals.length;
    const acceptedProposals = myProposals.filter(p => {
      const st = (p.status || '').toLowerCase();
      return st === 'accepted' || st === 'hired';
    }).length;
    const pendingProposals = myProposals.filter(p => (p.status || '').toLowerCase() === 'pending').length;
    const rejectedProposals = myProposals.filter(p => (p.status || '').toLowerCase() === 'rejected').length;
    const winRate = totalProposals > 0 ? Math.round((acceptedProposals / totalProposals) * 100) : 0;

    // 5. Monthly Earnings & Timeline Chart (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear() === now.getFullYear() ? '' : d.getFullYear()}`.trim();
      monthlyTrend[key] = { month: key, earnings: 0, contracts: 0, proposals: 0 };
    }

    // Map contracts to months
    contractsData.forEach(c => {
      const dt = new Date(c.updatedAt || c.createdAt || Date.now());
      const key = `${monthNames[dt.getMonth()]} ${dt.getFullYear() === now.getFullYear() ? '' : dt.getFullYear()}`.trim();
      if (monthlyTrend[key]) {
        monthlyTrend[key].contracts += 1;
        // Include value if completed or in progress milestones
        const earnedVal = c.status === 'Completed' 
          ? (c.totalValue || 0) 
          : (c.milestones?.filter(m => m.status === 'Completed').reduce((sum, m) => sum + (m.amount || 0), 0) || 0);
        monthlyTrend[key].earnings += earnedVal;
      }
    });

    // Map transactions to months
    txList.forEach(t => {
      if (t.type === 'escrow_release' || t.type === 'earning') {
        const dt = new Date(t.createdAt || Date.now());
        const key = `${monthNames[dt.getMonth()]} ${dt.getFullYear() === now.getFullYear() ? '' : dt.getFullYear()}`.trim();
        if (monthlyTrend[key]) {
          monthlyTrend[key].earnings += Math.abs(t.amount || 0);
        }
      }
    });

    // Map proposals to months
    myProposals.forEach(p => {
      const dt = new Date(p.createdAt || Date.now());
      const key = `${monthNames[dt.getMonth()]} ${dt.getFullYear() === now.getFullYear() ? '' : dt.getFullYear()}`.trim();
      if (monthlyTrend[key]) {
        monthlyTrend[key].proposals += 1;
      }
    });

    // 6. Skill Demand & Distribution from Profile
    const skillMap = {};
    const activeSkills = (profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0) 
      ? profile.skills 
      : (user?.skills || ['React', 'Node.js', 'MongoDB', 'UI/UX Design', 'JavaScript']);

    activeSkills.forEach(sk => {
      skillMap[sk] = { skill: sk, count: 0, earnings: 0 };
    });

    contractsData.forEach(c => {
      const title = (c.title || '').toLowerCase();
      Object.keys(skillMap).forEach(sk => {
        if (title.includes(sk.toLowerCase()) || title.includes('rag') || title.includes('full stack') || title.includes('web')) {
          skillMap[sk].count += 1;
          skillMap[sk].earnings += Number(c.totalValue || 0);
        }
      });
    });

    myProposals.forEach(p => {
      const title = (p.projectTitle || '').toLowerCase();
      Object.keys(skillMap).forEach(sk => {
        if (title.includes(sk.toLowerCase()) || title.includes('rag') || title.includes('chatbot')) {
          skillMap[sk].count += 1;
        }
      });
    });

    // 7. Review & Ratings
    const reviewsData = Array.isArray(reviews) ? reviews : [];
    const totalReviews = reviewsData.length;
    const avgRating = totalReviews > 0
      ? Number((reviewsData.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1))
      : (profile?.rating || user?.rating || 0);
    const fiveStarCount = reviewsData.filter(r => r.rating === 5).length;
    const fourStarCount = reviewsData.filter(r => r.rating === 4).length;

    // 8. Milestone Fulfillment Velocity
    const milestoneCompletionRate = totalMilestonesCount > 0
      ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100)
      : (completedContractsCount > 0 ? 100 : (activeContractsCount > 0 ? 50 : 0));

    res.json({
      success: true,
      financials: {
        totalEarnings,
        availableBalance,
        pendingEscrow,
        avgContractValue
      },
      contracts: {
        total: contractsData.length,
        active: activeContractsCount,
        completed: completedContractsCount,
        milestonesTotal: totalMilestonesCount,
        milestonesCompleted: completedMilestonesCount,
        milestoneCompletionRate
      },
      proposals: {
        total: totalProposals,
        accepted: acceptedProposals,
        pending: pendingProposals,
        rejected: rejectedProposals,
        winRate
      },
      reviews: {
        total: totalReviews,
        avgRating,
        fiveStarCount,
        fourStarCount,
        recentList: reviewsData.slice(0, 5)
      },
      gigs: {
        total: (gigs || []).length,
        activeList: (gigs || []).slice(0, 5)
      },
      chartData: Object.values(monthlyTrend),
      skillsDistribution: Object.values(skillMap),
      recentTransactions: txList.slice(0, 8),
      profileTrust: {
        score: user?.trustScore || 92,
        kycStatus: user?.kycStatus || 'Verified'
      }
    });

  } catch (error) {
    console.error('Freelancer analytics error:', error);
    res.status(500).json({ message: 'Error generating freelancer analytics report', error: error.message });
  }
};
