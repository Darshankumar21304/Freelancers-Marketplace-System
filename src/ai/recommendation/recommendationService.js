const { Project, User, FreelancerProfile, Contract } = require('../../models');
const { rankRecommendedProjects } = require('../engine/rankingEngine');
const { calculateRecommendationScore } = require('../engine/recommendationScorer');
const { buildRecommendationExplanation } = require('../engine/explanationBuilder');

/**
 * Primary Recommendation Service for Freelancers
 */
async function getRecommendedProjectsForFreelancer(freelancerId, options = {}) {
  try {
    const [user, profile, openProjects, completedContractsCount] = await Promise.all([
      User.findById(freelancerId),
      FreelancerProfile.findOne({ user_id: freelancerId }),
      Project.find({ status: { $in: ['Open', 'Active', null] } })
        .populate('client_id', 'name firstName lastName companyName avatar profilePhoto location')
        .sort({ createdAt: -1 })
        .limit(options.candidateLimit || 50),
      Contract.countDocuments({ freelancer_id: freelancerId, status: 'Completed' })
    ]);

    if (!user) {
      return { success: false, message: 'Freelancer user not found', recommendations: [] };
    }

    const freelancerContext = {
      _id: user._id,
      id: user._id,
      user,
      profile: profile || {},
      skills: profile?.skills || user.skills || []
    };

    const historicalData = {
      completedContracts: completedContractsCount
    };

    const rankedResults = rankRecommendedProjects(openProjects, freelancerContext, {
      minScore: options.minScore || 45,
      limit: options.limit || 10,
      historicalData
    });

    const formattedRecommendations = rankedResults.map(item => {
      const p = item.project;
      return {
        _id: p._id,
        id: p._id,
        title: p.title,
        description: p.description,
        category: p.category,
        budget: p.budget || p.budgetMax || 0,
        budgetMin: p.budgetMin || 0,
        budgetMax: p.budgetMax || p.budget || 0,
        deadline: p.deadline,
        skills: Array.isArray(p.requiredSkills) ? p.requiredSkills : (Array.isArray(p.skills) ? p.skills : []),
        matchScore: item.matchScore,
        matchPercentage: item.matchPercentage,
        matchingSkills: item.matchingSkills,
        missingSkills: item.missingSkills,
        reasons: item.reasons,
        whyRecommended: item.reasons,
        client: p.client_id,
        proposalsCount: p.proposals ? p.proposals.length : 0,
        createdAt: p.createdAt
      };
    });

    return {
      success: true,
      count: formattedRecommendations.length,
      recommendations: formattedRecommendations
    };
  } catch (error) {
    console.error('Error generating project recommendations for freelancer:', error);
    return {
      success: false,
      error: error.message,
      recommendations: []
    };
  }
}

/**
 * Returns detailed match explanation for a single project
 */
async function getProjectRecommendationExplanation(freelancerId, projectId) {
  try {
    const [user, profile, project, completedContractsCount] = await Promise.all([
      User.findById(freelancerId),
      FreelancerProfile.findOne({ user_id: freelancerId }),
      Project.findById(projectId).populate('client_id', 'name companyName avatar'),
      Contract.countDocuments({ freelancer_id: freelancerId, status: 'Completed' })
    ]);

    if (!user || !project) {
      return { success: false, message: 'Resource not found' };
    }

    const freelancerContext = {
      _id: user._id,
      id: user._id,
      user,
      profile: profile || {},
      skills: profile?.skills || user.skills || []
    };

    const scoreResult = calculateRecommendationScore(freelancerContext, project, {
      completedContracts: completedContractsCount
    });

    const explanation = buildRecommendationExplanation(scoreResult, project, freelancerContext);

    return {
      success: true,
      projectId: project._id,
      projectTitle: project.title,
      ...explanation
    };
  } catch (error) {
    console.error('Error fetching project explanation:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getRecommendedProjectsForFreelancer,
  getProjectRecommendationExplanation
};
