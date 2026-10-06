const { Pitch, Project, User, Contract, Message } = require('../models');
const { createNotification } = require('./notificationController');

// POST /api/pitches — Client pitches a project to a freelancer
const createPitch = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { freelancerId, projectId, message, offeredBudget } = req.body;

    if (!freelancerId || !projectId || !message) {
      return res.status(400).json({ message: 'Freelancer, Project, and Pitch message are required.' });
    }

    // Verify Project exists and belongs to this client
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.client_id.toString() !== clientId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only pitch projects you have created.' });
    }

    // Check if freelancer is already hired for this project
    const existingContract = await Contract.findOne({
      project_id: projectId,
      freelancer_id: freelancerId
    });

    const isAlreadyHiredProposal = project.proposals && project.proposals.some(
      p => p.freelancer_id && p.freelancer_id.toString() === freelancerId.toString() && (p.status === 'Hired' || p.status === 'Accepted')
    );

    if (existingContract || isAlreadyHiredProposal) {
      return res.status(400).json({ message: 'This freelancer is already hired for this project.' });
    }

    // Check if an active pitch already exists
    const existingPitch = await Pitch.findOne({
      project_id: projectId,
      freelancer_id: freelancerId,
      status: { $in: ['Pending', 'Bid Submitted'] }
    });

    if (existingPitch) {
      return res.status(400).json({ message: 'You have already pitched this project to this freelancer.' });
    }

    // Create new Pitch
    const pitch = new Pitch({
      client_id: clientId,
      freelancer_id: freelancerId,
      project_id: projectId,
      message,
      offeredBudget: offeredBudget || project.budget,
      status: 'Pending'
    });

    await pitch.save();

    // Fetch Client and Freelancer Info for Notifications
    const clientUser = await User.findById(clientId);
    const clientName = clientUser ? clientUser.name : 'A client';

    // 1. Send Notification to Freelancer
    await createNotification(
      freelancerId,
      'project',
      '🌟 Direct Project Pitch Received!',
      `${clientName} invited you to work on "${project.title}" (Budget: ₹${offeredBudget || project.budget}).`
    );

    // 2. Send Invitation in Chat Message
    try {
      const chatMsg = new Message({
        sender_id: clientId,
        receiver_id: freelancerId,
        content: `🎯 [Direct Project Pitch: ${project.title}]\n\n${message}\n\nOffered Budget: ₹${offeredBudget || project.budget}`,
        read: false
      });
      await chatMsg.save();
    } catch (msgErr) {
      console.warn('Could not auto-generate chat message for pitch:', msgErr.message);
    }

    const populatedPitch = await Pitch.findById(pitch._id)
      .populate('project_id')
      .populate('freelancer_id', 'name email avatar profilePhoto');

    res.status(201).json({
      success: true,
      message: 'Project pitch sent successfully!',
      pitch: populatedPitch
    });
  } catch (error) {
    console.error('Error creating pitch:', error);
    res.status(500).json({ message: 'Server error while sending pitch.' });
  }
};

// GET /api/pitches/client — Get all pitches sent by client
const getClientPitches = async (req, res) => {
  try {
    const clientId = req.user.id;
    const pitches = await Pitch.find({ client_id: clientId })
      .populate('freelancer_id', 'name email avatar profilePhoto title skills hourlyRate rating numReviews')
      .populate('project_id')
      .sort({ createdAt: -1 });

    res.json(pitches);
  } catch (error) {
    console.error('Error fetching client pitches:', error);
    res.status(500).json({ message: 'Server error fetching pitches.' });
  }
};

// GET /api/pitches/freelancer — Get all incoming pitches for freelancer
const getFreelancerPitches = async (req, res) => {
  try {
    const freelancerId = req.user.id;
    const pitches = await Pitch.find({ freelancer_id: freelancerId })
      .populate('client_id', 'name email avatar profilePhoto companyName location rating numReviews')
      .populate('project_id')
      .sort({ createdAt: -1 });

    res.json(pitches);
  } catch (error) {
    console.error('Error fetching freelancer pitches:', error);
    res.status(500).json({ message: 'Server error fetching pitches.' });
  }
};

// POST /api/pitches/:id/submit-bid — Freelancer submits a bid/proposal on a pitched project
const submitBidForPitch = async (req, res) => {
  try {
    const freelancerId = req.user.id;
    const { id } = req.params;
    const { bidAmount, deliveryTime, coverLetter } = req.body;

    const pitch = await Pitch.findById(id).populate('project_id');
    if (!pitch) {
      return res.status(404).json({ message: 'Pitch invitation not found.' });
    }

    if (pitch.freelancer_id.toString() !== freelancerId.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this pitch.' });
    }

    const project = await Project.findById(pitch.project_id._id || pitch.project_id);
    if (!project) {
      return res.status(404).json({ message: 'Associated project no longer exists.' });
    }

    const freelancerUser = await User.findById(freelancerId);
    const freelancerName = freelancerUser ? freelancerUser.name : 'Freelancer';

    // Add proposal to project if not already present
    const alreadyProposed = project.proposals.some(p => p.freelancer_id && p.freelancer_id.toString() === freelancerId.toString());
    if (!alreadyProposed) {
      project.proposals.push({
        freelancer_id: freelancerId,
        freelancer_name: freelancerName,
        bidAmount: Number(bidAmount) || Number(pitch.offeredBudget) || 0,
        coverLetter: coverLetter || 'Proposal submitted in response to direct project pitch.',
        deliveryTime: deliveryTime || '7 Days',
        status: 'Pending',
        createdAt: new Date()
      });
      await project.save();
    }

    // Update Pitch status
    pitch.status = 'Bid Submitted';
    pitch.bidDetails = {
      bidAmount: Number(bidAmount) || Number(pitch.offeredBudget) || 0,
      deliveryTime: deliveryTime || '7 Days',
      coverLetter: coverLetter || '',
      submittedAt: new Date()
    };
    await pitch.save();

    // Send Notification to Client
    await createNotification(
      pitch.client_id,
      'proposal',
      '💼 Bid Submitted for Pitched Project!',
      `${freelancerName} accepted your pitch and submitted a bid of ₹${bidAmount || pitch.offeredBudget} for "${project.title}".`
    );

    res.json({
      success: true,
      message: 'Bid submitted successfully!',
      pitch
    });
  } catch (error) {
    console.error('Error submitting bid for pitch:', error);
    res.status(500).json({ message: 'Server error while submitting bid.' });
  }
};

// PUT /api/pitches/:id/decline — Freelancer declines pitch
const declinePitch = async (req, res) => {
  try {
    const freelancerId = req.user.id;
    const { id } = req.params;

    const pitch = await Pitch.findById(id).populate('project_id');
    if (!pitch) {
      return res.status(404).json({ message: 'Pitch invitation not found.' });
    }

    if (pitch.freelancer_id.toString() !== freelancerId.toString()) {
      return res.status(403).json({ message: 'Not authorized to decline this pitch.' });
    }

    pitch.status = 'Declined';
    await pitch.save();

    const freelancerUser = await User.findById(freelancerId);
    const freelancerName = freelancerUser ? freelancerUser.name : 'Freelancer';

    // Notify Client
    await createNotification(
      pitch.client_id,
      'system',
      'Pitch Declined',
      `${freelancerName} politely declined the pitch for "${pitch.project_id?.title || 'your project'}".`
    );

    res.json({
      success: true,
      message: 'Pitch declined.',
      pitch
    });
  } catch (error) {
    console.error('Error declining pitch:', error);
    res.status(500).json({ message: 'Server error declining pitch.' });
  }
};

module.exports = {
  createPitch,
  getClientPitches,
  getFreelancerPitches,
  submitBidForPitch,
  declinePitch
};
