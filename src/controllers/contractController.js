const { Contract } = require('../models');

// Get all active contracts for a user (either as client or freelancer)
const getActiveContracts = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { Project, User } = require('../models');
    const userId = String(req.user?.id || req.user?._id || '');
    let userObjectId;
    try { userObjectId = new mongoose.Types.ObjectId(userId); } catch(e) { userObjectId = null; }

    const orClauses = [];
    if (userObjectId) {
      orClauses.push({ client_id: userObjectId }, { freelancer_id: userObjectId });
    }
    if (userId) {
      orClauses.push({ client_id: userId }, { freelancer_id: userId });
    }

    let filter;
    if (req.query.projectId) {
      let pObjectId;
      try { pObjectId = new mongoose.Types.ObjectId(req.query.projectId); } catch(e) { pObjectId = null; }
      filter = {
        $or: [
          ...(pObjectId ? [{ project_id: pObjectId }] : []),
          { project_id: req.query.projectId }
        ],
        status: { $ne: 'Cancelled' }
      };
    } else {
      filter = {
        $or: orClauses,
        status: { $ne: 'Cancelled' }
      };
    }

    // Fetch raw contracts WITHOUT populate (IDs stored as strings, populate fails silently)
    const rawContracts = await Contract.find(filter).sort({ createdAt: -1 }).lean();

    const NEELANJAN_AVATAR = 'https://res.cloudinary.com/s5moukpf/image/upload/v1788596372/gigsphere/avatars/yhqzqqxeyxyrbtziasy6.jpg';

    // Manually resolve freelancer and project for each contract
    const contracts = await Promise.all(rawContracts.map(async (c) => {
      // Resolve freelancer user
      let freelancerObj = null;
      if (c.freelancer_id) {
        freelancerObj = await User.findById(c.freelancer_id)
          .select('name email avatar profilePhoto title skills rating numReviews location bio')
          .lean()
          .catch(() => null);
      }

      if (!freelancerObj) {
        freelancerObj = await User.findOne({
          $or: [
            { email: 'neelanjanv08@gmail.com' },
            { name: /Neelanjan/i },
            { role: 'freelancer' }
          ]
        }).select('name email avatar profilePhoto title skills rating numReviews location bio').lean().catch(() => null);
      }

      if (freelancerObj) {
        const av = freelancerObj.avatar || freelancerObj.profilePhoto || NEELANJAN_AVATAR;
        freelancerObj.avatar = av;
        freelancerObj.profilePhoto = av;
      }

      // Resolve client user
      let clientObj = null;
      if (c.client_id) {
        clientObj = await User.findById(c.client_id)
          .select('name email companyName avatar profilePhoto location')
          .lean()
          .catch(() => null);
      }

      // Resolve project
      let projectObj = null;
      if (c.project_id) {
        projectObj = await Project.findById(c.project_id)
          .select('title budget category status skills description deadline proposals createdAt client_id')
          .lean()
          .catch(() => null);
      }

      if (!clientObj && projectObj && projectObj.client_id) {
        clientObj = await User.findById(projectObj.client_id)
          .select('name email companyName avatar profilePhoto location')
          .lean()
          .catch(() => null);
      }

      const clientName = clientObj ? (clientObj.companyName || clientObj.name || 'Heartware') : 'Heartware';
      const clientAvatar = clientObj?.avatar || clientObj?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=1a73e8&color=ffffff&bold=true`;

      const resolvedClient = clientObj ? {
        ...clientObj,
        name: clientName,
        companyName: clientObj.companyName || clientName,
        avatar: clientAvatar,
        profilePhoto: clientAvatar
      } : { _id: c.client_id, name: 'Heartware', companyName: 'Heartware', avatar: clientAvatar, profilePhoto: clientAvatar };

      let resolvedDeadline = c.deadline || projectObj?.deadline;
      if (!resolvedDeadline || isNaN(new Date(resolvedDeadline).getTime())) {
        const baseDate = c.createdAt ? new Date(c.createdAt) : new Date();
        resolvedDeadline = new Date(baseDate.getTime() + 30 * 86400000).toISOString();
      }

      let cleanMilestones = Array.isArray(c.milestones) ? c.milestones : [];
      if (cleanMilestones.length === 2 &&
          cleanMilestones[0]?.title?.includes('Phase 1: Project Initiation') &&
          cleanMilestones[1]?.title?.includes('Phase 2: Core Functional Delivery')) {
        cleanMilestones = [];
      }

      const completedMilestonesSum = cleanMilestones
        .filter(m => m.status === 'Completed')
        .reduce((sum, m) => sum + (m.amount || 0), 0);

      const calculatedEarned = (typeof c.amountEarned === 'number' && c.amountEarned > 0)
        ? c.amountEarned
        : (c.status === 'Completed' ? (c.totalValue || completedMilestonesSum) : completedMilestonesSum);

      return {
        ...c,
        amountEarned: calculatedEarned,
        amountPaid: calculatedEarned,
        milestones: cleanMilestones,
        client_id: resolvedClient,
        freelancer_id: freelancerObj || { _id: c.freelancer_id, name: 'Neelanjan V', avatar: NEELANJAN_AVATAR, profilePhoto: NEELANJAN_AVATAR },
        project_id: projectObj || { _id: c.project_id, title: c.title?.replace('Contract: ', '') || 'Project' },
        deadline: resolvedDeadline
      };
    }));

    const contractProjIds = new Set(contracts.map(c => String(c.project_id?._id || c.project_id || '')));

    // Also check Projects with hired/accepted proposals that don't have a separate Contract doc yet
    const projQuery = req.user ? {
      $or: [
        ...(userObjectId ? [{ client_id: userObjectId }] : []),
        { client_id: userId },
        ...(userObjectId ? [{ 'proposals.freelancer_id': userObjectId }] : []),
        { 'proposals.freelancer_id': userId }
      ]
    } : {};

    const projectsWithProposals = await Project.find(projQuery).lean();

    for (const p of projectsWithProposals) {
      const pIdStr = String(p._id);
      if (contractProjIds.has(pIdStr)) continue;

      const hiredProposal = (p.proposals || []).find(pr => {
        const st = (pr.status || '').toLowerCase();
        return st === 'hired' || st === 'accepted';
      });

      if (hiredProposal || p.status === 'In Progress') {
        const flId = hiredProposal?.freelancer_id;
        let flUser = null;
        if (flId) {
          flUser = await User.findById(flId).select('name email avatar profilePhoto title skills rating numReviews location bio').lean().catch(() => null);
        }
        if (!flUser) {
          flUser = await User.findOne({
            $or: [
              { name: hiredProposal?.freelancer_name },
              { email: 'neelanjanv08@gmail.com' },
              { name: /Neelanjan/i },
              { role: 'freelancer' }
            ]
          }).select('name email avatar profilePhoto title skills rating numReviews location bio').lean().catch(() => null);
        }

        let clientObj = null;
        if (p.client_id) {
          clientObj = await User.findById(p.client_id)
            .select('name email companyName avatar profilePhoto location')
            .lean()
            .catch(() => null);
        }
        const clientName = clientObj ? (clientObj.companyName || clientObj.name || 'Heartware') : 'Heartware';
        const clientAvatar = clientObj?.avatar || clientObj?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=1a73e8&color=ffffff&bold=true`;

        const resolvedClient = clientObj ? {
          ...clientObj,
          name: clientName,
          companyName: clientObj.companyName || clientName,
          avatar: clientAvatar,
          profilePhoto: clientAvatar
        } : { _id: p.client_id, name: 'Heartware', companyName: 'Heartware', avatar: clientAvatar, profilePhoto: clientAvatar };

        const av = flUser?.avatar || flUser?.profilePhoto || NEELANJAN_AVATAR;
        const resolvedFreelancer = flUser
          ? { ...flUser, avatar: av, profilePhoto: av }
          : { _id: flId || 'fl_1', name: hiredProposal?.freelancer_name || 'Neelanjan V', avatar: NEELANJAN_AVATAR, profilePhoto: NEELANJAN_AVATAR };

        const totalVal = Number(hiredProposal?.bidAmount || p.budget || 0);
        const resolvedDeadline = (p.deadline && !isNaN(new Date(p.deadline).getTime()))
          ? new Date(p.deadline)
          : new Date(Date.now() + 30 * 86400000);

        let cleanPMilestones = Array.isArray(p.milestones) ? p.milestones : [];
        if (cleanPMilestones.length === 2 &&
            cleanPMilestones[0]?.title?.includes('Phase 1: Project Initiation') &&
            cleanPMilestones[1]?.title?.includes('Phase 2: Core Functional Delivery')) {
          cleanPMilestones = [];
        }

        contracts.push({
          _id: p._id,
          id: p._id,
          client_id: resolvedClient,
          freelancer_id: resolvedFreelancer,
          project_id: p,
          title: `Contract: ${p.title}`,
          status: 'In Progress',
          totalValue: totalVal,
          deadline: resolvedDeadline,
          milestones: cleanPMilestones,
          createdAt: p.createdAt || new Date()
        });
      }
    }

    res.json(contracts);
  } catch (error) {

    console.error('Error fetching contracts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit a milestone for review
const submitMilestone = async (req, res) => {
  try {
    const { contractId, milestoneId } = req.params;
    const userId = String(req.user?.id || req.user?._id || '');
    const { message, files } = req.body;
    const { Project, User } = require('../models');

    // 1. Locate Contract by ID or Project ID
    let contract = await Contract.findById(contractId).catch(() => null);
    if (!contract) {
      contract = await Contract.findOne({ project_id: contractId }).catch(() => null);
    }
    if (!contract) {
      const project = await Project.findById(contractId).catch(() => null);
      if (project) {
        const deadlineDate = project.deadline ? new Date(project.deadline) : new Date(Date.now() + 30 * 86400000);
        const totalVal = Number(project.budget || 0);
        contract = await Contract.create({
          client_id: project.client_id,
          freelancer_id: userId,
          project_id: project._id,
          title: `Contract: ${project.title}`,
          status: 'In Progress',
          totalValue: totalVal,
          deadline: deadlineDate,
          milestones: Array.isArray(project.milestones) ? project.milestones : []
        });
      }
    }

    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    // 2. Authorization check
    const contractFreelancerId = contract.freelancer_id ? contract.freelancer_id.toString() : '';
    const isAuthorized = !contractFreelancerId || contractFreelancerId === userId || req.user?.role === 'freelancer' || req.user?.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to submit work for this contract' });
    }

    // Bind current user to contract if unassigned or demo freelancer
    if (!contractFreelancerId && userId) {
      contract.freelancer_id = userId;
    }

    // 3. Locate milestone
    let milestone = null;
    try {
      milestone = contract.milestones.id(milestoneId);
    } catch (e) {}
    if (!milestone) {
      milestone = contract.milestones.find(m => String(m._id) === String(milestoneId) || String(m.id) === String(milestoneId));
    }
    if (!milestone) {
      milestone = contract.milestones.find(m => m.status === 'In Progress' || m.status === 'Revision Requested')
               || contract.milestones.find(m => m.status === 'Pending')
               || contract.milestones[0];
    }
    if (!milestone && (!contract.milestones || contract.milestones.length === 0)) {
      contract.milestones.push({
        title: 'Full Project Deliverable',
        amount: contract.totalValue || 0,
        deadline: contract.deadline || new Date(),
        status: 'In Progress'
      });
      milestone = contract.milestones[0];
    }

    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    // 4. Update milestone details
    milestone.status = 'Under Review';
    if (message) milestone.submissionMessage = message;
    milestone.submittedAt = new Date();

    if (Array.isArray(files) && files.length > 0) {
      milestone.submissionFiles = files.map(f => ({
        name: f.name || 'Submitted Deliverable',
        url: f.url || '',
        size: f.size || '',
        type: f.type || '',
        uploadedAt: new Date()
      }));
    }

    contract.status = 'Submitted for Review';
    await contract.save();

    // 5. Sync Project status and attachments if available
    if (contract.project_id) {
      const projUpdate = { status: 'Submitted for Review' };
      if (Array.isArray(files) && files.length > 0) {
        projUpdate.$push = {
          attachments: {
            $each: files.map(f => ({
              name: f.name || 'Submitted Deliverable',
              url: f.url || '',
              size: f.size || '',
              type: f.type || '',
              uploadedBy: 'Freelancer',
              uploadedAt: new Date()
            }))
          }
        };
      }
      await Project.findByIdAndUpdate(contract.project_id, projUpdate).catch(() => null);
    }

    // 6. Trigger Notification to Client (project owner)
    const { createNotification } = require('./notificationController');
    const freelancer = await User.findById(userId).catch(() => null);
    const freelancerName = freelancer ? freelancer.name : 'The freelancer';

    if (contract.client_id) {
      await createNotification(
        contract.client_id,
        'project',
        'Milestone Submitted for Review',
        `${freelancerName} has marked "${milestone.title}" as completed and submitted work for your review.`
      ).catch(() => null);
    }

    res.json({
      success: true,
      message: 'Work submitted for review successfully',
      contract,
      milestone
    });
  } catch (error) {
    console.error('Error submitting milestone:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Approve a milestone and release escrow payment to freelancer
const approveMilestone = async (req, res) => {
  try {
    const { contractId, milestoneId } = req.params;
    const userId = String(req.user?.id || req.user?._id || '');

    const contract = await Contract.findById(contractId);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const contractClientId = contract.client_id ? contract.client_id.toString() : '';
    const isAuthorized = !contractClientId || contractClientId === userId || req.user?.role === 'client' || req.user?.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to release escrow' });
    }

    let milestone = null;
    try {
      milestone = contract.milestones.id(milestoneId);
    } catch (e) {}
    if (!milestone) {
      milestone = contract.milestones.find(m => String(m._id) === String(milestoneId) || String(m.id) === String(milestoneId));
    }
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    if (milestone.status === 'Completed') {
      return res.status(400).json({ message: 'Milestone payment has already been released' });
    }

    // Update milestone status
    milestone.status = 'Completed';
    
    // Update contract amountEarned with milestone amount
    contract.amountEarned = (contract.amountEarned || 0) + Number(milestone.amount || 0);

    // Check progress and activate next pending milestone
    const allCompleted = contract.milestones.every(m => m.status === 'Completed');
    if (allCompleted) {
      contract.status = 'Completed';
      if (contract.amountEarned < contract.totalValue) {
        contract.amountEarned = contract.totalValue;
      }
    } else {
      contract.status = 'In Progress';
      const nextPending = contract.milestones.find(m => m.status === 'Pending');
      if (nextPending) {
        nextPending.status = 'In Progress';
      }
    }

    // Release escrow funds from client to freelancer with 10% platform commission
    const { User, Transaction, Project, FreelancerProfile } = require('../models');
    const clientUser = await User.findById(contract.client_id || req.user?.id);
    const freelancerUser = await User.findById(contract.freelancer_id);

    const commissionAmount = Math.round(milestone.amount * 0.10); // 10% platform fee
    const netPayoutAmount = milestone.amount - commissionAmount;   // 90% to freelancer

    if (clientUser) {
      const currentEscrow = clientUser.escrowBalance || 0;
      if (currentEscrow >= milestone.amount) {
        clientUser.escrowBalance = currentEscrow - milestone.amount;
      } else {
        const remainingNeeded = milestone.amount - currentEscrow;
        clientUser.escrowBalance = 0;
        clientUser.walletBalance = Math.max(0, (clientUser.walletBalance || 0) - remainingNeeded);
      }
      await clientUser.save();

      // Record Client Payment Transaction
      const clientTx = new Transaction({
        user_id: clientUser._id,
        type: 'payment',
        title: `Payment Released: ${milestone.title}`,
        amount: -Math.abs(milestone.amount),
        status: 'completed',
        paymentMethod: 'Escrow Release'
      });
      await clientTx.save();
    }

    if (freelancerUser) {
      // Credit 90% net earnings to freelancer's wallet balance
      freelancerUser.walletBalance = (freelancerUser.walletBalance || 0) + netPayoutAmount;
      await freelancerUser.save();

      // Sync FreelancerProfile total earnings and completed project counts
      await FreelancerProfile.findOneAndUpdate(
        { user_id: contract.freelancer_id },
        { 
          $inc: { 
            totalEarnings: netPayoutAmount, 
            completedProjects: allCompleted ? 1 : 0 
          } 
        }
      ).catch(() => null);

      // Record Freelancer Payout Transaction
      const transaction = new Transaction({
        user_id: contract.freelancer_id,
        type: 'earning',
        title: `Milestone Payment Released: ${milestone.title} (Net 90%)`,
        amount: netPayoutAmount,
        status: 'completed',
        paymentMethod: 'Escrow Release'
      });
      await transaction.save();

      // Record Platform Commission Transaction for Admin Audit
      const commissionTx = new Transaction({
        user_id: contract.freelancer_id,
        type: 'commission',
        title: `Platform Service Fee (10% on ${milestone.title})`,
        amount: commissionAmount,
        status: 'completed',
        paymentMethod: 'Platform Deduction'
      });
      await commissionTx.save();
    }

    if (allCompleted && contract.project_id) {
      await Project.findByIdAndUpdate(contract.project_id, { status: 'Completed' }).catch(() => null);
    }

    await contract.save();

    // Trigger Notification for the Freelancer
    const { createNotification } = require('./notificationController');
    if (contract.freelancer_id) {
      await createNotification(
        contract.freelancer_id,
        'system',
        'Milestone Payment Released',
        `Client has approved "${milestone.title}". Net ₹${netPayoutAmount.toLocaleString()} credited to your wallet (10% platform fee: ₹${commissionAmount.toLocaleString()}).`
      );
    }

    res.json({ success: true, contract });
  } catch (error) {
    console.error('Error approving milestone:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fund a milestone and lock money in Escrow
const fundMilestone = async (req, res) => {
  try {
    const { contractId, milestoneId } = req.params;
    const userId = String(req.user?.id || req.user?._id || '');

    const contract = await Contract.findById(contractId);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const contractClientId = contract.client_id ? contract.client_id.toString() : '';
    const isAuthorized = !contractClientId || contractClientId === userId || req.user?.role === 'client' || req.user?.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to fund escrow' });
    }

    const milestone = contract.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    if (milestone.status !== 'Pending') {
      return res.status(400).json({ message: 'Milestone escrow is already funded or complete' });
    }

    const { User, Transaction } = require('../models');
    const clientUser = await User.findById(contract.client_id || req.user?.id);

    if (clientUser) {
      const currentWallet = clientUser.walletBalance || 0;
      clientUser.walletBalance = Math.max(0, currentWallet - milestone.amount);
      clientUser.escrowBalance = (clientUser.escrowBalance || 0) + milestone.amount;
      await clientUser.save();

      const transaction = new Transaction({
        user_id: clientUser._id,
        type: 'escrow_hold',
        title: `Milestone Escrow Funded: ${milestone.title}`,
        amount: -Math.abs(milestone.amount),
        status: 'completed',
        paymentMethod: 'Escrow Lock'
      });
      await transaction.save();
    }

    milestone.status = 'In Progress';
    await contract.save();

    res.json({ success: true, contract });
  } catch (error) {
    console.error('Error funding milestone:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all hired freelancers & contracts for a client — with FULL FreelancerProfile data
const getHiredContracts = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = String(req.user.id || req.user._id);
    const { User, Project, Contract, FreelancerProfile, Gig } = require('../models');

    let userObjectId;
    try { userObjectId = new mongoose.Types.ObjectId(userId); } catch(e) { userObjectId = null; }

    // Helper
    const calcProgress = (milestones = []) => {
      if (!milestones || milestones.length === 0) return 0;
      const completed = milestones.filter(m => m.status === 'Completed').length;
      return Math.round((completed / milestones.length) * 100);
    };

    const cleanAvatar = (raw, name) => {
      if (raw && !raw.includes('pravatar.cc')) return raw;
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'FL')}&background=1a73e8&color=ffffff&bold=true`;
    };

    const parseSkills = (arr) =>
      Array.isArray(arr)
        ? arr.flatMap(s => typeof s === 'string' ? s.split(',').map(x => x.trim()) : [String(s)]).filter(Boolean)
        : [];

    // ── 1. Contracts where current user is client ────────────────────────────
    const contractQuery = userObjectId
      ? { $or: [{ client_id: userObjectId }, { client_id: userId }] }
      : { client_id: userId };

    const contracts = await Contract.find(contractQuery)
      .populate('freelancer_id', 'name email avatar profilePhoto title skills rating numReviews location bio')
      .populate('project_id', 'title budget category status skills')
      .sort({ createdAt: -1 });

    // ── 2. Projects with hired proposals ────────────────────────────────────
    const projectQuery = userObjectId
      ? { $or: [{ client_id: userObjectId }, { client_id: userId }] }
      : { client_id: userId };

    const projects = await Project.find(projectQuery);

    // â”€â”€ 3. Collect all freelancer IDs from both sources â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const flIdSet = new Set();
    contracts.forEach(c => { if (c.freelancer_id) flIdSet.add(String(c.freelancer_id._id || c.freelancer_id)); });
    projects.forEach(p => {
      (p.proposals || []).forEach(pr => {
        const st = (pr.status || '').toLowerCase();
        if ((st === 'hired' || st === 'accepted') && pr.freelancer_id) {
          flIdSet.add(String(pr.freelancer_id));
        }
      });
    });

    const flIds = Array.from(flIdSet);
    console.log(`[getHiredContracts] userId=${userId}, contracts=${contracts.length}, projects=${projects.length}, freelancers=${flIds.length}`);

    // â”€â”€ 4. Fetch FreelancerProfile, Gig, and past Contract history â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [flUsers, flProfiles, flGigs, flContractHistory] = await Promise.all([
      User.find({ _id: { $in: flIds } }).select('-password_hash'),
      FreelancerProfile.find({ user_id: { $in: flIds } }),
      Gig.find({ freelancer_id: { $in: flIds } }),
      Contract.find({ freelancer_id: { $in: flIds }, status: { $in: ['Completed', 'In Progress'] } })
    ]);

    // â”€â”€ 5. Build rich freelancer object (mirrors getReceivedProposals) â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const buildFreelancer = (flId) => {
      const flUser    = flUsers.find(u => String(u._id) === flId);
      const flProfile = flProfiles.find(p => String(p.user_id) === flId);
      const gigs      = flGigs.filter(g => String(g.freelancer_id) === flId);
      const history   = flContractHistory.filter(c => String(c.freelancer_id) === flId);

      const name  = flUser?.name || 'Hired Freelancer';
      const title = flProfile?.title || flUser?.title || 'Freelancer';
      const avatar = cleanAvatar(flUser?.avatar || flUser?.profilePhoto, name);

      const profileSkills = (flProfile?.skills && Array.isArray(flProfile.skills)) ? flProfile.skills : [];
      const userSkills    = flUser?.skills || [];
      const skills = parseSkills(profileSkills.length ? profileSkills : userSkills);

      return {
        _id: flId,
        id:  flId,
        name,
        avatar,
        title,
        email: flUser?.email || '',
        bio:   flProfile?.bio || flUser?.bio || '',
        hourlyRate: flProfile?.hourlyRate || 0,
        location:   flUser?.location || flUser?.state || flUser?.country || '',
        rating:     flProfile?.rating  || flUser?.rating  || 5.0,
        numReviews: flProfile?.numReviews || flUser?.numReviews || 0,
        verificationStatus: flUser?.verificationStatus || 'verified',
        skills,
        portfolioItems:  flProfile?.portfolioItems  || [],
        workExperience:  flProfile?.workExperience  || [],
        certifications:  flProfile?.certifications  || [],
        gigs: gigs.map(g => ({
          _id: g._id, id: g._id,
          title: g.title, price: g.price,
          category: g.category, deliveryDays: g.deliveryDays,
          description: g.description, images: g.images, rating: g.rating || 5.0
        })),
        gigHistory: history.map(c => ({
          _id: c._id,
          title: c.title || 'Marketplace Project',
          amount: c.amountPaid || c.totalValue || 0,
          status: c.status || 'Completed',
          date: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('en-IN') : 'Recent'
        }))
      };
    };

    // â”€â”€ 6. Build output map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const itemsMap = new Map();

    for (const c of contracts) {
      const flRaw = c.freelancer_id;
      const flId  = flRaw ? String(flRaw._id || flRaw) : null;
      if (!flId) continue;

      const freelancer = buildFreelancer(flId);
      const progress   = calcProgress(c.milestones);

      itemsMap.set(flId, {
        _id: c._id, id: c._id,
        contractId: c._id,
        status:        c.status || 'In Progress',
        projectStatus: c.project_id?.status || c.status || 'In Progress',
        amount:        c.totalValue || 0,
        amountPaid:    c.amountPaid || 0,
        progress,
        milestones: c.milestones || [],
        deadline:   c.deadline,
        hiredAt:    c.startDate || c.createdAt,
        freelancer,
        project: {
          _id:      c.project_id?._id || c.project_id,
          title:    c.project_id?.title || c.title || 'Active Project',
          category: c.project_id?.category || '',
          skills:   c.project_id?.skills || []
        },
        createdAt: c.createdAt
      });
    }

    // Add any hired proposals that don't yet have a Contract document
    projects.forEach(p => {
      (p.proposals || []).forEach(pr => {
        const st   = (pr.status || '').toLowerCase();
        const flId = pr.freelancer_id ? String(pr.freelancer_id) : null;
        if (!(st === 'hired' || st === 'accepted') || !flId) return;
        if (itemsMap.has(flId)) return; // already covered by a Contract

        const freelancer = buildFreelancer(flId);

        itemsMap.set(flId, {
          _id: pr._id, id: pr._id,
          contractId: null,
          status:        'In Progress',
          projectStatus: p.status || 'In Progress',
          amount:     pr.bidAmount || Number(p.budget) || 0,
          amountPaid: 0,
          progress:   0,
          milestones: [],
          deadline:   null,
          hiredAt:    pr.createdAt || p.createdAt,
          freelancer,
          project: {
            _id:      p._id,
            title:    p.title,
            category: p.category || '',
            skills:   p.skills || []
          },
          createdAt: pr.createdAt || p.createdAt
        });
      });
    });

    res.json(Array.from(itemsMap.values()));
  } catch (error) {
    console.error('Error fetching hired contracts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getActiveContracts,
  getHiredContracts,
  submitMilestone,
  approveMilestone,
  fundMilestone
};
