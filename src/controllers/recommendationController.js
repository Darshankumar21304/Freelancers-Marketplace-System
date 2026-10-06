const { getSmartRecommendations } = require('../ai/recommendation/recommendationService');
const { recordInteractionEvent } = require('../ai/engine/learningEngine');
const { calculateCandidateScore } = require('../ai/engine/scoreCalculator');
const { User, FreelancerProfile, Project } = require('../models');

// GET /api/recommendations/smart-match
exports.getSmartMatchedTalent = async (req, res) => {
  try {
    const clientId = req.user ? (req.user.id || req.user._id) : null;
    const projectId = req.query.projectId || null;
    const limit = parseInt(req.query.limit, 10) || 3;

    const result = await getSmartRecommendations(clientId, projectId, limit);
    res.json(result);
  } catch (error) {
    console.error('Error in getSmartMatchedTalent:', error);
    res.status(500).json({ message: 'Error computing smart recommendations', error: error.message });
  }
};

// POST /api/recommendations/events
exports.trackRecommendationEvent = async (req, res) => {
  try {
    const clientId = req.user ? (req.user.id || req.user._id) : null;
    const { projectId, freelancerId, eventType, ratingValue, matchedSkills } = req.body;

    const result = await recordInteractionEvent({
      projectId,
      clientId,
      freelancerId,
      eventType,
      ratingValue,
      matchedSkills: Array.isArray(matchedSkills) ? matchedSkills : []
    });

    res.json(result);
  } catch (error) {
    console.error('Error tracking recommendation event:', error);
    res.status(500).json({ message: 'Error tracking event', error: error.message });
  }
};

// GET /api/recommendations/explain/:freelancerId
exports.explainRecommendation = async (req, res) => {
  try {
    const { freelancerId } = req.params;
    const { projectId } = req.query;

    const freelancer = await User.findById(freelancerId);
    if (!freelancer) return res.status(404).json({ message: 'Freelancer not found' });

    const profile = await FreelancerProfile.findOne({ user_id: freelancerId });
    let project = null;
    if (projectId) {
      project = await Project.findById(projectId);
    }

    const { extractRequirements } = require('../ai/puter/requirementExtractor');
    const requirements = await extractRequirements(project);

    const scoreResult = calculateCandidateScore({ user: freelancer, profile: profile || {} }, requirements, Number(project?.budget || 0));

    res.json({
      freelancer: {
        id: freelancer._id,
        name: freelancer.name,
        avatar: freelancer.avatar || freelancer.profilePhoto,
        title: profile?.title || freelancer.title || 'Full Stack Developer'
      },
      score: scoreResult.score,
      matchPercentage: scoreResult.matchPercentage,
      confidence: scoreResult.confidence,
      explainability: scoreResult.explainability
    });
  } catch (error) {
    console.error('Error explaining recommendation:', error);
    res.status(500).json({ message: 'Error explaining recommendation', error: error.message });
  }
};

// GET /api/recommendations/projects
// Matches available marketplace projects specifically for the authenticated freelancer
exports.getRecommendedProjectsForFreelancer = async (req, res) => {
  try {
    const { getRecommendedProjectsForFreelancer } = require('../ai/recommendation/recommendationService');
    const freelancerId = req.user ? (req.user.id || req.user._id) : null;
    if (!freelancerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const result = await getRecommendedProjectsForFreelancer(freelancerId, { limit: 10 });
    res.json(result);
  } catch (error) {
    console.error('Error fetching recommended projects:', error);
    res.status(500).json({ message: 'Error fetching recommended projects', error: error.message });
  }
};

