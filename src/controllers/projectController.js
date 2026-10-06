const { Project, User } = require('../models');

const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate(
      'client_id',
      'name email location companyName avatar profilePhoto rating numReviews verificationStatus kycStatus country state createdAt'
    );
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'client_id',
      'name email location companyName avatar profilePhoto rating numReviews verificationStatus kycStatus country state createdAt'
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, description, budget, budgetType, skills, category, duration, deadline, experienceLevel, attachments } = req.body;

    let client_id = req.user ? (req.user.id || req.user._id || req.user.userId) : null;

    if (!client_id) {
      let dummyClient = await User.findOne({ role: 'client' });
      if (!dummyClient) {
        dummyClient = await User.create({
          name: 'Heartware',
          email: 'heartware08@gmail.com',
          companyName: 'Heartware',
          password_hash: 'dummy',
          role: 'client'
        });
      }
      client_id = dummyClient._id;
    }

    const newProject = await Project.create({
      client_id,
      title: title || 'Untitled Project',
      description: description || 'No description provided.',
      budget: String(budget || '0'),
      budgetType: budgetType || 'Fixed Price',
      skills: Array.isArray(skills) ? skills : [],
      category: category || 'General',
      duration: duration || '1 to 3 months',
      deadline: deadline || duration || '',
      experienceLevel: experienceLevel || 'Intermediate',
      attachments: Array.isArray(attachments) ? attachments : []
    });

    console.log('Project Created:', newProject._id);
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: error.message || 'Server error creating project' });
  }
};

const submitProposal = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { bidAmount, coverLetter, deliveryTime, freelancerName } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    let freelancerId = req.user ? (req.user.id || req.user._id) : null;
    let nameVal = freelancerName || (req.user ? req.user.name : null);

    if (!freelancerId) {
      const defaultFreelancer = await User.findOne({ role: 'freelancer' });
      if (defaultFreelancer) {
        freelancerId = defaultFreelancer._id;
        nameVal = nameVal || defaultFreelancer.name;
      }
    }

    const newProposal = {
      freelancer_id: freelancerId,
      freelancer_name: nameVal || 'Freelancer Partner',
      bidAmount: Number(bidAmount || 0),
      coverLetter: coverLetter || '',
      deliveryTime: deliveryTime || '1 to 2 weeks',
      status: 'Pending'
    };

    project.proposals.push(newProposal);
    await project.save();

    if (project.client_id) {
      const { createNotification } = require('./notificationController');
      await createNotification(
        project.client_id,
        'proposal',
        'New Proposal Received',
        `${newProposal.freelancer_name} submitted a proposal of ₹${Number(bidAmount || 0).toLocaleString()} for "${project.title}".`
      ).catch(() => null);
    }

    res.status(201).json({ message: 'Proposal submitted successfully', project });
  } catch (error) {
    console.error('Error submitting proposal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const project = await Project.findByIdAndUpdate(id, { status }, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project status updated', project });
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndUpdate(id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = req.user ? (req.user.id || req.user._id || req.user.userId) : null;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    let userObjectId;
    try { userObjectId = new mongoose.Types.ObjectId(userId); } catch(e) { userObjectId = null; }

    const NEELANJAN_AVATAR = 'https://res.cloudinary.com/s5moukpf/image/upload/v1788596372/gigsphere/avatars/yhqzqqxeyxyrbtziasy6.jpg';

    const orClauses = [{ client_id: userId }];
    if (userObjectId) orClauses.push({ client_id: userObjectId });

    const projects = await Project.find({
      $or: orClauses
    }).sort({ createdAt: -1 }).lean();

    for (let p of projects) {
      // Resolve client_id if not already populated
      if (p.client_id && typeof p.client_id === 'string') {
        const clientUser = await User.findById(p.client_id).select('name email avatar profilePhoto companyName').lean().catch(() => null);
        if (clientUser) p.client_id = clientUser;
      }

      // Resolve proposals
      if (p.proposals && Array.isArray(p.proposals)) {
        for (let prop of p.proposals) {
          let flUser = null;
          if (prop.freelancer_id) {
            flUser = await User.findById(prop.freelancer_id).select('name email avatar profilePhoto title skills rating numReviews').lean().catch(() => null);
          }
          if (!flUser && prop.freelancer_name) {
            flUser = await User.findOne({
              $or: [
                { name: prop.freelancer_name },
                { email: 'neelanjanv08@gmail.com' },
                { name: /Neelanjan/i },
                { role: 'freelancer' }
              ]
            }).select('name email avatar profilePhoto title skills rating numReviews').lean().catch(() => null);
          }
          if (flUser) {
            const av = flUser.avatar || flUser.profilePhoto || NEELANJAN_AVATAR;
            prop.freelancer_id = {
              ...flUser,
              avatar: av,
              profilePhoto: av
            };
          } else {
            prop.freelancer_id = {
              _id: prop.freelancer_id || 'fl_1',
              name: prop.freelancer_name || 'Neelanjan V',
              avatar: NEELANJAN_AVATAR,
              profilePhoto: NEELANJAN_AVATAR
            };
          }
        }
      }

      // Ensure deadline
      if (!p.deadline || isNaN(new Date(p.deadline).getTime())) {
        const base = p.createdAt ? new Date(p.createdAt) : new Date();
        p.deadline = new Date(base.getTime() + 30 * 86400000).toISOString();
      }
    }

    res.json(projects);
  } catch (error) {
    console.error('Error fetching client projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get all contracts for the logged-in freelancer with earnings summary & chart data
const getMyContracts = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { Contract, User, Transaction } = require('../models');
    const freelancerId = String(req.user.id || req.user._id || '');

    let flObjectId;
    try { flObjectId = new mongoose.Types.ObjectId(freelancerId); } catch(e) { flObjectId = null; }

    const orClauses = [{ freelancer_id: freelancerId }];
    if (flObjectId) orClauses.push({ freelancer_id: flObjectId });

    const rawContracts = await Contract.find({ $or: orClauses })
      .populate('client_id', 'name email companyName avatar profilePhoto')
      .populate('project_id', 'title category')
      .sort({ createdAt: -1 });

    let calculatedTotalEarnings = 0;

    const contracts = rawContracts.map(c => {
      const cObj = c.toObject ? c.toObject() : c;
      const milestones = Array.isArray(cObj.milestones) ? cObj.milestones : [];
      const completedMilestonesSum = milestones
        .filter(m => m.status === 'Completed')
        .reduce((sum, m) => sum + (m.amount || 0), 0);

      const isCompleted = cObj.status === 'Completed' || (milestones.length > 0 && milestones.every(m => m.status === 'Completed'));
      const earned = (typeof cObj.amountEarned === 'number' && cObj.amountEarned > 0)
        ? cObj.amountEarned
        : (isCompleted ? (cObj.totalValue || completedMilestonesSum) : completedMilestonesSum);

      calculatedTotalEarnings += earned;

      return {
        ...cObj,
        status: isCompleted ? 'Completed' : cObj.status,
        amountEarned: earned,
        amountPaid: earned
      };
    });

    // Fallback: If calculatedTotalEarnings is 0, check User wallet balance or earning transactions
    let totalEarnings = calculatedTotalEarnings;
    if (totalEarnings === 0) {
      const flUser = await User.findById(freelancerId).catch(() => null);
      if (flUser && flUser.walletBalance && flUser.walletBalance > 0) {
        totalEarnings = flUser.walletBalance;
      }
      const earningsTxs = await Transaction.find({ user_id: freelancerId, type: { $in: ['earning', 'escrow_release'] } }).catch(() => []);
      const txSum = earningsTxs.reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
      if (txSum > totalEarnings) {
        totalEarnings = txSum;
      }
    }

    const activeContracts = contracts.filter(c =>
      c.status === 'In Progress' || c.status === 'Submitted for Review'
    ).length;
    const completedContracts = contracts.filter(c => c.status === 'Completed').length;

    // Group earnings by month for chart (last 6 months)
    const earningsByMonth = {};
    contracts.forEach(c => {
      if (c.amountEarned > 0 || c.status === 'Completed') {
        const month = new Date(c.updatedAt || c.createdAt)
          .toLocaleString('default', { month: 'short', year: '2-digit' });
        earningsByMonth[month] = (earningsByMonth[month] || 0) + (c.amountEarned || c.totalValue || 0);
      }
    });

    const chartData = Object.entries(earningsByMonth)
      .slice(-6)
      .map(([name, earnings]) => ({ name, earnings }));

    res.json({ contracts, totalEarnings, activeContracts, completedContracts, chartData });
  } catch (error) {
    console.error('Error fetching freelancer contracts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllProjects,
  getMyProjects,
  getMyContracts,
  getProjectById,
  createProject,
  submitProposal,
  updateProjectStatus,
  deleteProject,
  updateProject
};
