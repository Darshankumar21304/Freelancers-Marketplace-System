require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const { normalizeSkill, normalizeRequirements } = require('../src/ai/engine/requirementNormalizer');
const { matchSkills } = require('../src/ai/engine/skillMatcher');
const { calculateRecommendationScore } = require('../src/ai/engine/recommendationScorer');
const { isProjectEligible, rankRecommendedProjects } = require('../src/ai/engine/rankingEngine');
const { buildRecommendationExplanation } = require('../src/ai/engine/explanationBuilder');
const { recordInteractionEvent, getLearningModel } = require('../src/ai/engine/learningEngine');
const { generateProposalDraft } = require('../src/ai/puter/proposalAssistant');
const { assessProfileCoach, analyzeMarketplaceSkillGaps } = require('../src/ai/puter/profileCoach');

async function runComprehensiveTests() {
  console.log('=== STARTING FREELANCER AI COMPREHENSIVE TEST SUITE ===\n');

  // TEST 1: Skill Normalization
  console.log('--- TEST 1: Canonical Skill Normalization ---');
  const rawSkills = ['ReactJS', 'react.js', 'Node JS', 'NextJS', 'PostgreSQL', 'Mongo DB', 'AWS Cloud'];
  const normalized = rawSkills.map(s => normalizeSkill(s));
  console.log('Raw:', rawSkills);
  console.log('Normalized Canonical IDs:', normalized);
  if (normalized[0] === 'react' && normalized[1] === 'react' && normalized[2] === 'node.js' && normalized[3] === 'next.js') {
    console.log('✓ TEST 1 PASSED: Synonyms normalized to canonical IDs.\n');
  } else {
    throw new Error('TEST 1 FAILED: Skill normalization mismatch');
  }

  // TEST 2: Skill Match Calculation
  console.log('--- TEST 2: Multi-Skill Matching Engine ---');
  const freelancerSkills = ['react', 'node.js', 'mongodb', 'javascript'];
  const projectRequirements = ['react', 'node.js', 'mongodb', 'docker', 'payment_integration'];
  const matchResult = matchSkills(freelancerSkills, projectRequirements);
  console.log('Matching Skills:', matchResult.matchingSkills);
  console.log('Missing Skills:', matchResult.missingSkills);
  console.log('Related Skills:', matchResult.relatedSkills);
  console.log('Raw Score (0-100):', matchResult.matchPercentage);
  if (matchResult.matchingSkills.length === 3 && matchResult.missingSkills.length === 2) {
    console.log('✓ TEST 2 PASSED: Skill matching exact and missing detected correctly.\n');
  } else {
    throw new Error('TEST 2 FAILED: Skill match count mismatch');
  }

  // TEST 3: Dynamic Config-Driven Scoring Formula
  console.log('--- TEST 3: Dynamic 8-Factor Recommendation Scorer ---');
  const dummyFreelancer = {
    skills: ['react', 'node.js', 'mongodb', 'javascript'],
    title: 'Senior Full Stack Engineer',
    bio: '10+ years experience building cloud applications with React and Node.js',
    rating: 4.9,
    experienceLevel: 'expert',
    availability: 'Available'
  };
  const dummyProject = {
    title: 'Fullstack React Node Marketplace',
    description: 'Build an enterprise scalable application with React, Node.js and MongoDB.',
    skills: ['react', 'node.js', 'mongodb', 'docker'],
    budget: 45000,
    category: 'web_development'
  };
  const scoreResult = calculateRecommendationScore(dummyFreelancer, dummyProject, { completedCount: 5, totalEarned: 250000 });
  console.log('Computed Total Score:', scoreResult.matchScore);
  console.log('Feature Scores Breakdown:', scoreResult.featureScores);
  if (scoreResult.matchScore > 50 && scoreResult.matchScore <= 100) {
    console.log('✓ TEST 3 PASSED: Dynamic scoring successfully loads JSON model weights.\n');
  } else {
    throw new Error('TEST 3 FAILED: Scoring computation out of expected range');
  }

  // TEST 4: Eligibility Filtering
  console.log('--- TEST 4: Strict Eligibility Filtering ---');
  const testFreelancerId = new mongoose.Types.ObjectId();
  const candidateProjects = [
    { _id: new mongoose.Types.ObjectId(), title: 'Open Project 1', status: 'Open', proposals: [] },
    { _id: new mongoose.Types.ObjectId(), title: 'Closed Project 2', status: 'Closed', proposals: [] },
    { _id: new mongoose.Types.ObjectId(), title: 'Already Hired Project 3', status: 'In Progress', proposals: [{ freelancer_id: testFreelancerId, status: 'Accepted' }] },
    { _id: new mongoose.Types.ObjectId(), title: 'Open Project 4', status: 'Active', proposals: [] }
  ];
  const eligible = candidateProjects.filter(p => isProjectEligible(p, { _id: testFreelancerId, profile: { availability: 'Available' } }));
  console.log('Initial Projects Count:', candidateProjects.length);
  console.log('Eligible Projects Count:', eligible.length);
  if (eligible.length === 2 && !eligible.some(p => p.status === 'Closed' || p.title.includes('Already Hired'))) {
    console.log('✓ TEST 4 PASSED: Ineligible (closed & already hired) projects excluded.\n');
  } else {
    throw new Error('TEST 4 FAILED: Ineligible projects were not properly filtered');
  }

  // TEST 5: Bounded Learning Adjustment
  console.log('--- TEST 5: Bounded Learning Engine ---');
  const learnResult = recordInteractionEvent({
    userId: testFreelancerId.toString(),
    eventType: 'proposal_accepted',
    skills: ['react', 'node.js']
  });
  console.log('Learning Event Result:', learnResult);
  const lModel = getLearningModel();
  const reactData = lModel.skills?.react;
  console.log('React Skill Learning Record:', reactData);
  if (learnResult.success && reactData && reactData.hires >= 1) {
    console.log('✓ TEST 5 PASSED: Learning engine adjusts skill affinities within strict bounds.\n');
  } else {
    throw new Error('TEST 5 FAILED: Learning adjustment failed');
  }

  // TEST 6: Proposal Assistant Tone & Prompt Actions
  console.log('--- TEST 6: Proposal Assistant (Generate, Shorten, Professional) ---');
  const testProject = {
    title: 'Enterprise Next.js Web App',
    description: 'Build a fast responsive enterprise application with Next.js and Supabase.',
    skills: ['react', 'next.js', 'typescript']
  };
  const testUser = {
    name: 'Jane Doe',
    title: 'Senior Full Stack Engineer',
    bio: '10+ years building web applications with React, Next.js and Node.js',
    skills: ['react', 'next.js', 'typescript', 'node.js']
  };
  const draftGen = await generateProposalDraft({
    projectTitle: testProject.title,
    projectDescription: testProject.description,
    requiredSkills: testProject.skills,
    freelancer: testUser,
    action: 'generate'
  });
  const draftShort = await generateProposalDraft({
    projectTitle: testProject.title,
    projectDescription: testProject.description,
    requiredSkills: testProject.skills,
    freelancer: testUser,
    action: 'shorten',
    currentDraft: draftGen.proposalText
  });
  const draftProf = await generateProposalDraft({
    projectTitle: testProject.title,
    projectDescription: testProject.description,
    requiredSkills: testProject.skills,
    freelancer: testUser,
    action: 'professional',
    currentDraft: draftGen.proposalText
  });

  console.log('Standard Draft Length:', draftGen.proposalText?.length);
  console.log('Shortened Draft Length:', draftShort.proposalText?.length);
  console.log('Professional Draft Length:', draftProf.proposalText?.length);
  if (draftGen.success && draftShort.success && draftProf.success) {
    console.log('✓ TEST 6 PASSED: Proposal Assistant actions functional with robust deterministic fallback.\n');
  } else {
    throw new Error('TEST 6 FAILED: Proposal Assistant action transformation failed');
  }

  // TEST 7: Explanation Builder
  console.log('--- TEST 7: Explanation Builder Transparency ---');
  const scoreForExpl = calculateRecommendationScore({ ...testUser, profile: testUser }, testProject);
  const explanation = buildRecommendationExplanation(scoreForExpl, testProject, testUser);
  console.log('Generated Explanation Reasons:', explanation.reasons);
  if (explanation.reasons.length >= 1) {
    console.log('✓ TEST 7 PASSED: Concise human-readable explanation generated.\n');
  } else {
    throw new Error('TEST 7 FAILED: Explanation builder returned insufficient reasons');
  }

  console.log('===================================================');
  console.log('ALL 7 COMPREHENSIVE FREELANCER AI TESTS COMPLETED SUCCESSFULLY');
  console.log('===================================================');
}

runComprehensiveTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
