/**
 * Proposal Assistant Engine
 * Generates, refines, and formats proposal drafts based on project requirements,
 * freelancer profile, and portfolio evidence.
 */

async function generateProposalDraft({ projectTitle, projectDescription, requiredSkills = [], freelancer, tone = 'professional', action = 'generate', currentDraft = '' }) {
  const profile = freelancer.profile || freelancer;
  const user = freelancer.user || freelancer;

  const freelancerName = user.name || 'Freelancer';
  const flTitle = profile.title || 'Full Stack Engineer';
  const flBio = profile.bio || '';
  const flSkills = profile.skills || [];
  const flExp = profile.experience || 'Experienced Specialist';
  const portfolio = profile.portfolioItems || [];

  const topPortfolio = portfolio.length > 0 ? portfolio[0] : null;
  const matchedSkillsList = requiredSkills.filter(s => flSkills.some(fs => fs.toLowerCase() === s.toLowerCase()));

  if (action === 'shorten' && currentDraft) {
    // Generate concise version
    const lines = currentDraft.split('\n').filter(l => l.trim().length > 0);
    const shortDraft = `Hi! I reviewed your requirements for "${projectTitle}". As a ${flTitle} with expertise in ${flSkills.slice(0, 3).join(', ')}, I can deliver this efficiently with high code quality and clear milestones.\n\nKey plan:\n• Clean architecture and fast turnaround\n• Full testing and reliable deliverables\n\nI am ready to start immediately and look forward to discussing the next steps!`;
    return {
      success: true,
      proposalText: shortDraft,
      action: 'shorten'
    };
  }

  if (action === 'professional' && currentDraft) {
    const formalDraft = `Dear Hiring Team,\n\nI am writing to express my strong interest in your project, "${projectTitle}". Having specialized as a ${flTitle} with deep proficiency in ${flSkills.slice(0, 4).join(', ')}, I am well-positioned to execute your technical and business objectives with precision.\n\n${topPortfolio ? `In previous initiatives such as "${topPortfolio.title}", I successfully delivered similar outcomes adhering to industry best practices.\n\n` : ''}I ensure transparent communication, punctual milestone deliveries, and clean documentation throughout the project lifecycle.\n\nBest regards,\n${freelancerName}`;
    return {
      success: true,
      proposalText: formalDraft,
      action: 'professional'
    };
  }

  // Standard Generate / Regenerate
  const skillsMention = matchedSkillsList.length > 0 
    ? matchedSkillsList.join(', ') 
    : flSkills.slice(0, 4).join(', ');

  const proposalText = `Hi there,\n\nI'm excited to submit my proposal for "${projectTitle}". With proven experience as a ${flTitle} and hands-on expertise in ${skillsMention}, I can deliver a robust, high-performance solution tailored to your exact specifications.\n\nWhy I'm a great fit for this project:\n• Extensive background in ${flSkills.slice(0, 3).join(' and ')}.\n${topPortfolio ? `• Delivered relevant projects like "${topPortfolio.title}" (${topPortfolio.description.slice(0, 80)}...)\n` : '• Strong focus on clean, scalable code and responsive user interfaces.\n'}• Direct, proactive communication with regular progress updates and test builds.\n\nI can start right away and provide complete milestone tracking through GigSphere's workspace.\n\nLooking forward to collaborating with you!\n\nBest,\n${freelancerName}`;

  return {
    success: true,
    proposalText,
    action,
    highlightedSkills: matchedSkillsList
  };
}

module.exports = {
  generateProposalDraft
};
