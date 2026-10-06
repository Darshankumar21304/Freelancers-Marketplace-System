const { recordInteractionEvent } = require('../engine/learningEngine');
const { Project } = require('../../models');

/**
 * Validates and records a recommendation event triggered from the UI
 */
async function handleRecommendationEvent({ userId, projectId, eventType, score }) {
  // Only allow client-triggered view, bookmark, and impression events directly
  const allowedClientEvents = ['project_impression', 'project_view', 'project_bookmark'];
  
  if (!allowedClientEvents.includes(eventType)) {
    return {
      success: false,
      message: `Event type "${eventType}" can only be generated through verified system workflow.`
    };
  }

  let skills = [];
  if (projectId) {
    const project = await Project.findById(projectId);
    if (project) {
      skills = Array.isArray(project.requiredSkills) ? project.requiredSkills : (project.skills || []);
    }
  }

  const result = recordInteractionEvent({
    eventType,
    skills,
    projectId,
    score,
    userId
  });

  return result;
}

module.exports = {
  handleRecommendationEvent
};
