const { Project, Contract, User, FreelancerProfile, Gig } = require('../models');
const { createNotification } = require('./notificationController');

// GET /api/proposals/received
exports.getReceivedProposals = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = String(req.user?.id || req.user?._id || '');
    let userObjectId;
    try { userObjectId = new mongoose.Types.ObjectId(userId); } catch(e) { userObjectId = null; }

    const orClauses = [{ client_id: userId }];
    if (userObjectId) orClauses.push({ client_id: userObjectId });

    // Find all projects owned by this client
    const projects = await Project.find({
      $or: orClauses
    });
    
    // Collect all freelancer IDs across proposals
    const freelancerIds = [];
    projects.forEach(p => {
      if (p.proposals && Array.isArray(p.proposals)) {
        p.proposals.forEach(pr => {
          if (pr.freelancer_id) freelancerIds.push(pr.freelancer_id);
        });
      }
    });

    const freelancers = await User.find({ _id: { $in: freelancerIds } }).select('-password_hash');
    const profiles = await FreelancerProfile.find({ user_id: { $in: freelancerIds } });
    const gigs = await Gig.find({ freelancer_id: { $in: freelancerIds } });
    const contracts = await Contract.find({ freelancer_id: { $in: freelancerIds } });

    // Aggregate proposals and inject parent project details & freelancer details
    const allProposals = [];
    projects.forEach(project => {
      if (project.proposals && Array.isArray(project.proposals)) {
        project.proposals.forEach(prop => {
          const flUser = freelancers.find(f => f._id.toString() === (prop.freelancer_id ? prop.freelancer_id.toString() : ''));
          const flProfile = profiles.find(p => p.user_id.toString() === (prop.freelancer_id ? prop.freelancer_id.toString() : ''));
          const flGigs = gigs.filter(g => g.freelancer_id.toString() === (prop.freelancer_id ? prop.freelancer_id.toString() : ''));
          const flContracts = contracts.filter(c => c.freelancer_id.toString() === (prop.freelancer_id ? prop.freelancer_id.toString() : ''));

          const realName = flUser?.name || prop.freelancer_name || 'Freelancer';
          const realTitle = flProfile?.title || flUser?.title || 'Freelancer';
          const realSkills = (flProfile?.skills && Array.isArray(flProfile.skills)) ? flProfile.skills : [];

          allProposals.push({
            _id: prop._id,
            id: prop._id,
            freelancer_id: prop.freelancer_id,
            freelancerName: realName,
            freelancer: {
              id: prop.freelancer_id || flUser?._id,
              _id: prop.freelancer_id || flUser?._id,
              name: realName,
              avatar: flUser?.avatar || flUser?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(realName)}&background=1a73e8&color=fff`,
              email: flUser?.email || '',
              title: realTitle,
              bio: flProfile?.bio || flUser?.bio || '',
              skills: realSkills,
              hourlyRate: flProfile?.hourlyRate || 0,
              category: flProfile?.category || '',
              experience: flProfile?.experience || '',
              availability: flProfile?.availability || '',
              rating: flProfile?.rating || 5.0,
              numReviews: flProfile?.numReviews || 0,
              totalEarnings: flProfile?.totalEarnings || 0,
              completedProjects: flProfile?.completedProjects || flContracts.filter(c => c.status === 'Completed').length,
              location: flUser?.location || flUser?.city || flUser?.state || flUser?.country || '',
              verificationStatus: flUser?.verificationStatus || 'Verified Pro',
              portfolioItems: flProfile?.portfolioItems || [],
              workExperience: flProfile?.workExperience || [],
              certifications: flProfile?.certifications || [],
              gigs: flGigs.map(g => ({
                _id: g._id,
                id: g._id,
                title: g.title,
                price: g.price,
                category: g.category,
                deliveryDays: g.deliveryDays,
                description: g.description,
                images: g.images,
                rating: g.rating || 5.0
              })),
              gigHistory: flContracts.map(c => ({
                _id: c._id,
                title: c.title || 'Marketplace Project',
                amount: c.amountEarned || c.amountPaid || c.totalValue || c.amount || 0,
                status: c.status || 'Completed',
                date: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('en-IN') : 'Recent'
              }))
            },
            bidAmount: prop.bidAmount,
            coverLetter: prop.coverLetter,
            deliveryTime: prop.deliveryTime,
            status: prop.status || 'Pending',
            createdAt: prop.createdAt,
            project_id: project._id,
            projectId: project._id,
            projectTitle: project.title,
            project_title: project.title,
            project_budget: project.budget,
            project: {
              _id: project._id,
              id: project._id,
              title: project.title,
              budget: project.budget,
              category: project.category
            }
          });
        });
      }
    });

    res.json(allProposals);
  } catch (error) {
    console.error('Error fetching received proposals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/proposals/my-proposals
exports.getMyProposals = async (req, res) => {
  try {
    const userId = req.user.id;
    // Find projects where the current user submitted a proposal
    const projects = await Project.find({ 'proposals.freelancer_id': userId }).populate('client_id', 'name email companyName avatar profilePhoto location');
    
    const myProposals = [];
    projects.forEach(project => {
      const prop = project.proposals.find(p => p.freelancer_id && p.freelancer_id.toString() === userId.toString());
      if (prop) {
        myProposals.push({
          _id: prop._id,
          id: prop._id,
          bidAmount: prop.bidAmount,
          coverLetter: prop.coverLetter,
          deliveryTime: prop.deliveryTime,
          status: prop.status || 'Pending',
          createdAt: prop.createdAt,
          project_id: project._id,
          projectId: project._id,
          project_title: project.title,
          projectTitle: project.title,
          project_budget: project.budget,
          client_id: project.client_id,
          clientName: project.client_id?.companyName || project.client_id?.name || 'Client Partner',
          client: project.client_id
        });
      }
    });

    res.json(myProposals);
  } catch (error) {
    console.error('Error fetching my proposals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/proposals/:id/status
exports.updateProposalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Pending', 'Shortlisted', 'Accepted', 'Hired', 'Rejected'
    const userId = req.user?.id || req.user?._id;

    // Find the project containing this proposal
    let project = await Project.findOne({ 'proposals._id': id });
    if (!project) {
      // Try string search across all projects if exact subdocument id lookup needed fallback
      const allProjects = await Project.find({ 'proposals.0': { $exists: true } });
      project = allProjects.find(p => (p.proposals || []).some(pr => String(pr._id) === String(id) || String(pr.id) === String(id)));
    }

    if (!project) return res.status(404).json({ message: 'Proposal not found' });

    // Ensure project is associated with the active client user if unassigned
    if (!project.client_id && userId) {
      project.client_id = userId;
    }

    let proposal = null;
    try {
      proposal = project.proposals.id(id);
    } catch (e) {}
    if (!proposal) {
      proposal = (project.proposals || []).find(pr => String(pr._id) === String(id) || String(pr.id) === String(id));
    }

    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

    proposal.status = status;

    if (status === 'Accepted' || status === 'Hired') {
      project.status = 'In Progress';
    }

    await project.save();

    // Trigger Notification for the Freelancer & manage contract
    if (proposal.freelancer_id) {
      let notifTitle = 'Proposal Updated';
      let notifDesc = `Your proposal status for "${project.title}" has been set to ${status}.`;

      if (status === 'Accepted' || status === 'Hired') {
        notifTitle = 'Proposal Accepted / Hired!';
        notifDesc = `Congratulations! You have been hired by the client for "${project.title}".`;

        try {
          // Create or update the active Contract document automatically for workspace mapping!
          const deadlineDate = (project.deadline && !isNaN(new Date(project.deadline).getTime())) 
            ? new Date(project.deadline) 
            : new Date(Date.now() + 30 * 86400000);

          const totalVal = Number(proposal.bidAmount) || Number(project.budget) || 1000;

          let existingContract = await Contract.findOne({
            $or: [
              { project_id: project._id, freelancer_id: proposal.freelancer_id },
              { project_id: project._id }
            ]
          });

          if (existingContract) {
            existingContract.status = 'In Progress';
            existingContract.freelancer_id = proposal.freelancer_id;
            if (project.client_id) existingContract.client_id = project.client_id;
            existingContract.totalValue = totalVal;
            if (existingContract.milestones && existingContract.milestones.length > 0) {
              const allComp = existingContract.milestones.every(m => m.status === 'Completed');
              if (allComp && existingContract.milestones[0]) {
                existingContract.milestones[0].status = 'In Progress';
              }
            }
            await existingContract.save();
          } else {
            await Contract.create({
              client_id: project.client_id || userId,
              freelancer_id: proposal.freelancer_id,
              project_id: project._id,
              title: `Contract: ${project.title}`,
              status: 'In Progress',
              totalValue: totalVal,
              deadline: deadlineDate,
              milestones: Array.isArray(project.milestones) ? project.milestones : []
            });
          }
        } catch (contractErr) {
          console.error('Contract sync error during hiring:', contractErr);
        }
      }

      await createNotification(proposal.freelancer_id, 'project', notifTitle, notifDesc).catch(() => null);
    }

    res.json({ message: 'Proposal status updated successfully', proposal, projectStatus: project.status });
  } catch (error) {
    console.error('Error updating proposal status:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
