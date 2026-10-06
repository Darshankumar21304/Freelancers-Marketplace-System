/**
 * Trust & Fraud API Controller
 * Provides clean, secure, role-differentiated endpoints for trust & fraud verification.
 */

const mongoose = require('mongoose');
const { User, FreelancerProfile, Contract, Project, Review, Dispute, TrustEvent, TrustReview } = require('../models');
const { calculateUserTrustScore } = require('../ai/trust/trustEngine');

/**
 * Helper to build DB context for a target user
 */
async function buildUserDbContext(userId, role) {
  let userObjectId;
  try { userObjectId = new mongoose.Types.ObjectId(String(userId)); } catch (e) { userObjectId = null; }

  const uStr = String(userId);
  const orUser = userObjectId ? [{ _id: userObjectId }, { user_id: userObjectId }, { client_id: userObjectId }, { freelancer_id: userObjectId }] : [];

  if (role === 'freelancer') {
    const [allProfiles, contracts, projects, disputes, reviews] = await Promise.all([
      FreelancerProfile.find({}).select('user_id bio skills portfolioItems').lean(),
      Contract.find({
        $or: [
          ...(userObjectId ? [{ freelancer_id: userObjectId }] : []),
          { freelancer_id: uStr }
        ]
      }).lean(),
      Project.find({ 'proposals.freelancer_id': { $in: [userObjectId, uStr].filter(Boolean) } }).lean(),
      Dispute.find({
        $or: [
          ...(userObjectId ? [{ freelancer_id: userObjectId }, { raisedBy: userObjectId }] : []),
          { freelancer_id: uStr },
          { raisedBy: uStr }
        ]
      }).lean(),
      Review.find({
        $or: [
          ...(userObjectId ? [{ reviewee_id: userObjectId }] : []),
          { reviewee_id: uStr }
        ]
      }).lean()
    ]);

    return { allProfiles, contracts, projects, disputes, reviews };
  } else {
    // Client Context
    const [clientProjects, contracts, disputes, reviews] = await Promise.all([
      Project.find({
        $or: [
          ...(userObjectId ? [{ client_id: userObjectId }] : []),
          { client_id: uStr }
        ]
      }).lean(),
      Contract.find({
        $or: [
          ...(userObjectId ? [{ client_id: userObjectId }] : []),
          { client_id: uStr }
        ]
      }).lean(),
      Dispute.find({
        $or: [
          ...(userObjectId ? [{ client_id: userObjectId }, { raisedBy: userObjectId }] : []),
          { client_id: uStr },
          { raisedBy: uStr }
        ]
      }).lean(),
      Review.find({
        $or: [
          ...(userObjectId ? [{ reviewer_id: userObjectId }] : []),
          { reviewer_id: uStr }
        ]
      }).lean()
    ]);

    return { clientProjects, contracts, disputes, reviews };
  }
}

/**
 * GET /api/trust/freelancer/:id
 * Client-facing safe trust assessment of a freelancer
 */
exports.getFreelancerTrust = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password_hash').lean();
    if (!user) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }

    const profile = await FreelancerProfile.findOne({ user_id: id }).lean();
    const dbContext = await buildUserDbContext(id, 'freelancer');
    const scoreData = await calculateUserTrustScore(user, profile, dbContext);

    // Client-safe response (Hides internal raw fraud math to prevent gaming)
    res.json({
      success: true,
      freelancerId: id,
      name: user.name,
      avatar: user.avatar || user.profilePhoto,
      trustScore: scoreData.trustScore,
      verificationStatus: user.verificationStatus || 'verified',
      badgeLabel: scoreData.badgeLabel,
      userFacingStatus: scoreData.userFacingStatus,
      isVerified: user.kycStatus === 'Verified' || user.verificationStatus === 'verified',
      completedProjects: scoreData.historyStats.completedProjects || 0,
      averageRating: scoreData.historyStats.averageRating || 5.0,
      positiveHighlights: scoreData.positiveSignals.map(p => p.evidence)
    });
  } catch (error) {
    console.error('Error fetching freelancer trust:', error);
    res.status(500).json({ message: 'Error analyzing trust score' });
  }
};

/**
 * GET /api/trust/client/:id
 * Freelancer-facing safe trust assessment of a client
 */
exports.getClientTrust = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password_hash').lean();
    if (!user) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const dbContext = await buildUserDbContext(id, 'client');
    const scoreData = await calculateUserTrustScore(user, null, dbContext);

    res.json({
      success: true,
      clientId: id,
      name: user.companyName || user.name,
      trustScore: scoreData.trustScore,
      badgeLabel: scoreData.badgeLabel,
      userFacingStatus: scoreData.userFacingStatus,
      isCompanyVerified: Boolean(user.gstin || user.kycStatus === 'Verified'),
      totalProjectsPosted: scoreData.historyStats.totalProjects || 0,
      completedContracts: scoreData.historyStats.completedContracts || 0,
      positiveHighlights: scoreData.positiveSignals.map(p => p.evidence)
    });
  } catch (error) {
    console.error('Error fetching client trust:', error);
    res.status(500).json({ message: 'Error analyzing client trust score' });
  }
};

/**
 * GET /api/trust/me
 * Full private trust breakdown for the authenticated user
 */
exports.getMyTrust = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password_hash').lean();
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    const role = (user.role || 'freelancer').toLowerCase();
    const profile = role === 'freelancer' ? await FreelancerProfile.findOne({ user_id: userId }).lean() : null;
    const dbContext = await buildUserDbContext(userId, role);

    const scoreData = await calculateUserTrustScore(user, profile, dbContext, true);

    // Save/update user's score in DB for fast indexing
    await User.findByIdAndUpdate(userId, {
      aiRiskScore: scoreData.fraudRiskScore,
      aiReason: scoreData.evidenceSummary,
      aiAuditedAt: new Date()
    });

    res.json({
      success: true,
      trustScore: scoreData.trustScore,
      fraudRiskScore: scoreData.fraudRiskScore,
      riskLevel: scoreData.riskLevel,
      badgeLabel: scoreData.badgeLabel,
      userFacingStatus: scoreData.userFacingStatus,
      isColdStart: scoreData.isColdStart,
      positiveSignals: scoreData.positiveSignals,
      evidenceSummary: scoreData.evidenceSummary,
      historyStats: scoreData.historyStats
    });
  } catch (error) {
    console.error('Error fetching my trust:', error);
    res.status(500).json({ message: 'Error calculating personal trust score' });
  }
};

/**
 * POST /api/trust/events
 * Record a lifecycle trust event
 */
exports.recordTrustEvent = async (req, res) => {
  try {
    const { eventType, metadata } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!eventType || !userId) {
      return res.status(400).json({ message: 'eventType and userId are required' });
    }

    const event = await TrustEvent.create({
      user_id: userId,
      eventType,
      metadata: metadata || {},
      actor_id: req.user?.id
    });

    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error('Error recording trust event:', error);
    res.status(500).json({ message: 'Error recording event' });
  }
};
