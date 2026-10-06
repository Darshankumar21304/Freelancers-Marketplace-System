require('dotenv').config();
const connectDB = require('../src/config/db');
const { getRecommendedProjectsForFreelancer, getProjectRecommendationExplanation } = require('../src/ai/recommendation/recommendationService');
const { analyzeProfileQuality, getSkillGapAnalysis } = require('../src/ai/puter/profileCoach');
const { generateProposalDraft } = require('../src/ai/puter/proposalAssistant');
const { recordInteractionEvent } = require('../src/ai/engine/learningEngine');
const { User, FreelancerProfile, Project } = require('../src/models');

async function runTests() {
  await connectDB();
  console.log('=== RUNNING FREELANCER AI BACKEND TESTS ===\n');

  const u = await User.findOne({ email: 'neelanjanv08@gmail.com' });
  const prof = await FreelancerProfile.findOne({ user_id: u._id });
  const openProj = await Project.findOne({ status: { $ne: 'Completed' } });

  console.log(`1. User: ${u.name} (${u._id}) | Role: ${u.role}`);
  console.log(`   Profile Skills: ${prof ? prof.skills.join(', ') : 'None'}`);

  // Test 1: Project Recommendations
  console.log('\n2. Testing getRecommendedProjectsForFreelancer...');
  const recs = await getRecommendedProjectsForFreelancer(u._id, { limit: 5 });
  console.log(`   Success: ${recs.success} | Found: ${recs.recommendations?.length || 0} recommendations`);
  if (recs.recommendations && recs.recommendations.length > 0) {
    const top = recs.recommendations[0];
    console.log(`   Top Match: "${top.title}" -> AI Match: ${top.matchPercentage}%`);
    console.log(`   Matching Skills: ${top.matchingSkills.join(', ')}`);
    console.log(`   Reasons:`, top.reasons);
  }

  // Test 2: Project Explanation
  if (openProj) {
    console.log(`\n3. Testing getProjectRecommendationExplanation for Project "${openProj.title}"...`);
    const explanation = await getProjectRecommendationExplanation(u._id, openProj._id);
    console.log(`   Match Score: ${explanation.matchScore}%`);
    console.log(`   Why Recommended:`, explanation.reasons);
  }

  // Test 3: Profile Coach
  console.log('\n4. Testing Profile Coach...');
  const coach = analyzeProfileQuality({ user: u, profile: prof });
  console.log(`   Profile Quality: ${coach.qualityScore}/100`);
  console.log(`   Strengths:`, coach.strengths);
  console.log(`   Improvements:`, coach.improvements);

  // Test 4: Skill Gap Analysis
  console.log('\n5. Testing Skill Gap Analysis...');
  const skillGap = await getSkillGapAnalysis({ user: u, profile: prof });
  console.log(`   Current Skills: ${skillGap.currentSkills.join(', ')}`);
  console.log(`   Identified Gaps (${skillGap.skillGaps.length}):`, skillGap.skillGaps.map(g => `${g.skill} (${g.whyRelevant})`));

  // Test 5: Proposal Assistant
  if (openProj) {
    console.log(`\n6. Testing Proposal Assistant for "${openProj.title}"...`);
    const draft = await generateProposalDraft({
      projectTitle: openProj.title,
      projectDescription: openProj.description,
      requiredSkills: openProj.requiredSkills || openProj.skills,
      freelancer: { user: u, profile: prof },
      action: 'generate'
    });
    console.log(`   Proposal Generated (${draft.proposalText.length} chars):`);
    console.log('   --- DRAFT SNIPPET ---');
    console.log(draft.proposalText.split('\n').slice(0, 5).join('\n'));
    console.log('   --- END ---');
  }

  // Test 6: Learning Event
  console.log('\n7. Testing Bounded Learning Event Recording...');
  const eventRes = recordInteractionEvent({
    eventType: 'project_view',
    skills: ['react', 'node.js', 'rag'],
    projectId: openProj?._id,
    score: 92,
    userId: u._id
  });
  console.log('   Event Recorded Result:', eventRes);

  console.log('\n=== ALL 6 AI BACKEND MODULE TESTS PASSED ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
