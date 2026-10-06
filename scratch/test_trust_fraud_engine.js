/**
 * Comprehensive Automated 16-Test Suite for GigSphere Trust & Fraud AI System
 */

const assert = require('assert');
const { extractProfileClaims, extractClaimsDeterministic } = require('../src/ai/puter/claimsExtractor');
const { evaluateFreelancerSignals, calculateTextSimilarity } = require('../src/ai/trust/freelancerSignals');
const { evaluateClientSignals } = require('../src/ai/trust/clientSignals');
const {
  calculateUserTrustScore,
  recordAdminReviewDecision,
  getPredefinedModel,
  getLearningModel,
  clearScoreCache
} = require('../src/ai/trust/trustEngine');

async function runAllTests() {
  console.log('================================================================');
  console.log('       GIGSPHERE TRUST & FRAUD AI ENGINE - 16 TEST SUITE        ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`[PASS] Test ${passed + failed + 1}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] Test ${passed + failed + 1}: ${name}`);
      console.error(`       Error: ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`[PASS] Test ${passed + failed + 1}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] Test ${passed + failed + 1}: ${name}`);
      console.error(`       Error: ${err.message}`);
      failed++;
    }
  }

  // 1. New Freelancer (Cold Start)
  await asyncTest('New Freelancer (Cold Start - Account age < 14 days, 0 contracts)', async () => {
    clearScoreCache();
    const user = {
      _id: 'freelancer_new_1',
      name: 'Alice Fresh',
      role: 'freelancer',
      createdAt: new Date(),
      isVerified: false
    };
    const profile = {
      bio: 'Junior web developer eager to work with React and Node.',
      skills: ['React', 'Node.js'],
      category: 'Web Development',
      hourlyRate: 25,
      profileCompletion: 70
    };
    const dbContext = {
      contracts: [],
      projects: [],
      disputes: [],
      reviews: []
    };

    const res = await calculateUserTrustScore(user, profile, dbContext, true);
    assert.strictEqual(res.isColdStart, true, 'Should be marked cold start');
    assert.strictEqual(res.trustScore, 80, 'Cold start trust should be 80');
    assert.strictEqual(res.fraudRiskScore, 10, 'Cold start fraud risk should be 10');
    assert.strictEqual(res.riskLevel, 'low', 'Risk level should be low');
  });

  // 2. Established Genuine Freelancer
  await asyncTest('Established Genuine Freelancer (High reputation & portfolio)', async () => {
    clearScoreCache();
    const user = {
      _id: 'freelancer_est_1',
      name: 'Bob Masterson',
      role: 'freelancer',
      createdAt: new Date(Date.now() - 180 * 24 * 3600 * 1000), // 6 months old
      isVerified: true,
      kycStatus: 'Verified'
    };
    const profile = {
      bio: 'Senior Full Stack Engineer with 7 years specializing in MERN stack, GraphQL, and microservices.',
      skills: ['React', 'Node.js', 'MongoDB', 'GraphQL', 'Docker'],
      category: 'Software Development',
      hourlyRate: 65,
      profileCompletion: 95,
      portfolioItems: [
        { title: 'E-commerce React Store', description: 'Built with React and Node.js microservices' },
        { title: 'Logistics SaaS', description: 'MongoDB and GraphQL real-time tracking' }
      ]
    };
    const dbContext = {
      contracts: [
        { status: 'Completed', amount: 1500 },
        { status: 'Completed', amount: 2200 },
        { status: 'Completed', amount: 800 }
      ],
      projects: [],
      disputes: [],
      reviews: [
        { rating: 5, comment: 'Flawless execution and great communicator.' },
        { rating: 5, comment: 'Delivered ahead of schedule!' }
      ]
    };

    const res = await calculateUserTrustScore(user, profile, dbContext, true);
    assert.strictEqual(res.isColdStart, false, 'Should not be cold start');
    assert(res.trustScore >= 85, `Trust score should be >= 85, got ${res.trustScore}`);
    assert(res.fraudRiskScore <= 20, `Fraud risk should be <= 20, got ${res.fraudRiskScore}`);
    assert.strictEqual(res.riskLevel, 'low', 'Risk level should be low');
  });

  // 3. Suspicious Freelancer
  await asyncTest('Suspicious Freelancer (Off-platform contact, high cancellations, disputes)', async () => {
    clearScoreCache();
    const user = {
      _id: 'freelancer_sus_1',
      name: 'Spammy Bot',
      role: 'freelancer',
      createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000),
      isVerified: false
    };
    const profile = {
      bio: 'Fast delivery! Contact me on telegram @cheatpay or whatsapp me for payment outside platform.',
      skills: ['Python', 'Machine Learning', 'Deep Learning'],
      category: 'Data Science',
      hourlyRate: 15,
      profileCompletion: 25,
      portfolioItems: []
    };
    const dbContext = {
      contracts: [
        { status: 'Cancelled' },
        { status: 'Cancelled' },
        { status: 'Cancelled' },
        { status: 'Completed' }
      ],
      projects: [],
      disputes: [
        { status: 'Active', reason: 'Failed to deliver source code' }
      ],
      reviews: [
        { rating: 1, comment: 'Total scammer, requested crypto outside.' }
      ]
    };

    const res = await calculateUserTrustScore(user, profile, dbContext, true);
    assert.strictEqual(res.isColdStart, false);
    assert(res.fraudRiskScore >= 60, `Fraud risk score should be >= 60, got ${res.fraudRiskScore}`);
    assert(res.trustScore <= 40, `Trust score should be <= 40, got ${res.trustScore}`);
    assert.strictEqual(res.riskLevel, 'high', 'Risk level should be high');
  });

  // 4. New Client (Cold Start)
  await asyncTest('New Client (Cold Start - Account age < 14 days, 0 contracts)', async () => {
    clearScoreCache();
    const user = {
      _id: 'client_new_1',
      name: 'Fresh Ventures LLC',
      role: 'client',
      createdAt: new Date(),
      isVerified: false,
      companyName: 'Fresh Ventures LLC'
    };
    const dbContext = {
      clientProjects: [
        { title: 'Landing page revamp', proposals: [], status: 'Open' }
      ],
      contracts: [],
      disputes: [],
      reviews: []
    };

    const res = await calculateUserTrustScore(user, {}, dbContext, true);
    assert.strictEqual(res.isColdStart, true, 'Should be marked cold start');
    assert.strictEqual(res.trustScore, 80, 'Cold start client trust should be 80');
    assert.strictEqual(res.fraudRiskScore, 10, 'Cold start client fraud risk should be 10');
    assert.strictEqual(res.riskLevel, 'low', 'Risk level should be low');
  });

  // 5. Established Genuine Client
  await asyncTest('Established Genuine Client (Verified, high escrow spending, high hire rate)', async () => {
    clearScoreCache();
    const user = {
      _id: 'client_est_1',
      name: 'Acme Enterprise',
      role: 'client',
      createdAt: new Date(Date.now() - 365 * 24 * 3600 * 1000),
      isVerified: true,
      kycStatus: 'Verified',
      companyName: 'Acme Global Solutions',
      website: 'https://acme.example.com',
      industry: 'Enterprise Software',
      companyDesc: 'Premier enterprise software vendor hiring worldwide talent.'
    };
    const dbContext = {
      clientProjects: [
        { title: 'Project 1', proposals: [{ status: 'hired' }], status: 'Completed' },
        { title: 'Project 2', proposals: [{ status: 'hired' }], status: 'Completed' },
        { title: 'Project 3', proposals: [{ status: 'hired' }], status: 'In Progress' }
      ],
      contracts: [
        { status: 'Completed', amount: 8000 },
        { status: 'Completed', amount: 12000 },
        { status: 'Completed', amount: 5000 }
      ],
      disputes: [],
      reviews: [
        { rating: 5, comment: 'Great client, clear specs and prompt approval.' }
      ]
    };

    const res = await calculateUserTrustScore(user, {}, dbContext, true);
    assert.strictEqual(res.isColdStart, false);
    assert(res.trustScore >= 85, `Trust score should be >= 85, got ${res.trustScore}`);
    assert(res.fraudRiskScore <= 20, `Fraud risk should be <= 20, got ${res.fraudRiskScore}`);
    assert.strictEqual(res.riskLevel, 'low');
  });

  // 6. Suspicious Client
  await asyncTest('Suspicious Client (Zero hires over multiple jobs, off-platform payment, cancellations)', async () => {
    clearScoreCache();
    const user = {
      _id: 'client_sus_1',
      name: 'Ghost Post LLC',
      role: 'client',
      createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000),
      isVerified: false,
      companyDesc: 'Contact telegram @ghost_hiring. Direct wire transfer available.'
    };
    const dbContext = {
      clientProjects: [
        { title: 'Job 1', description: 'Wire transfer outside platform', proposals: [], status: 'Open' },
        { title: 'Job 2', description: 'Crypto only', proposals: [], status: 'Open' },
        { title: 'Job 3', description: 'Pay via paypal outside', proposals: [], status: 'Open' },
        { title: 'Job 4', description: 'Telegram contact @test', proposals: [], status: 'Open' },
        { title: 'Job 5', description: 'Another unfulfilled post', proposals: [], status: 'Open' }
      ],
      contracts: [
        { status: 'Cancelled' },
        { status: 'Cancelled' }
      ],
      disputes: [
        { status: 'Active', reason: 'Refused to fund milestone' }
      ],
      reviews: [
        { rating: 1, comment: 'Fake client trying to take work off platform without payment' }
      ]
    };

    const res = await calculateUserTrustScore(user, {}, dbContext, true);
    assert.strictEqual(res.isColdStart, false);
    assert(res.fraudRiskScore >= 60, `Fraud risk score should be >= 60, got ${res.fraudRiskScore}`);
    assert(res.trustScore <= 40, `Trust score should be <= 40, got ${res.trustScore}`);
    assert.strictEqual(res.riskLevel, 'high', 'Risk level should be high');
  });

  // 7. Duplicate Profile Text Similarity Evaluator
  test('Duplicate Profile Text Similarity Detection', () => {
    const bio1 = 'Expert full stack developer with 5 years experience in building web applications with react and nodejs.';
    const bio2 = 'Expert full stack developer with 5 years experience in building web applications with react and nodejs.';
    const bio3 = 'A creative graphic designer skilled in Figma, Illustrator, typography, branding, and modern poster art.';

    const simIdentical = calculateTextSimilarity(bio1, bio2);
    const simDistinct = calculateTextSimilarity(bio1, bio3);

    assert(simIdentical >= 0.95, `Identical text similarity should be ~1.0, got ${simIdentical}`);
    assert(simDistinct < 0.20, `Distinct text similarity should be < 0.20, got ${simDistinct}`);
  });

  // 8. Repeated Cancellations
  await asyncTest('Repeated Cancellations Flagging and Penalty', async () => {
    const user = { _id: 'f_cancel', role: 'freelancer', createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000) };
    const profile = { bio: 'Standard bio', skills: ['CSS'] };
    const dbContext = {
      contracts: [
        { status: 'Cancelled' },
        { status: 'Cancelled' },
        { status: 'Cancelled' },
        { status: 'Completed' }
      ],
      projects: [],
      disputes: [],
      reviews: []
    };

    const signals = await evaluateFreelancerSignals(user, profile, dbContext);
    const cancelSignal = signals.signals.find(s => s.type === 'repeated_contract_cancellations');
    assert(cancelSignal !== undefined, 'repeated_contract_cancellations signal should be triggered');
  });

  // 9. Payment Disputes Signal
  await asyncTest('Payment Disputes Signal & Penalty', async () => {
    const user = { _id: 'c_dispute', role: 'client', createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000) };
    const dbContext = {
      clientProjects: [{ title: 'P1', proposals: [] }],
      contracts: [{ status: 'Completed' }],
      disputes: [{ client_id: 'c_dispute', status: 'Active', reason: 'Chargeback requested' }],
      reviews: []
    };

    const signals = await evaluateClientSignals(user, dbContext);
    const disputeSignal = signals.signals.find(s => s.type === 'frequent_payment_disputes');
    assert(disputeSignal !== undefined, 'frequent_payment_disputes signal should be triggered');
  });

  // 10. Missing Data Resilience (Nulls, undefineds, missing arrays)
  await asyncTest('Missing Data Resilience (No throw/crash on empty or null inputs)', async () => {
    const resFreelancer = await calculateUserTrustScore({ _id: 'f_empty', role: 'freelancer' }, null, {}, true);
    assert(typeof resFreelancer.trustScore === 'number', 'Trust score must be a number');
    assert(typeof resFreelancer.fraudRiskScore === 'number', 'Fraud risk score must be a number');

    const resClient = await calculateUserTrustScore({ _id: 'c_empty', role: 'client' }, null, {}, true);
    assert(typeof resClient.trustScore === 'number', 'Trust score must be a number');
    assert(typeof resClient.fraudRiskScore === 'number', 'Fraud risk score must be a number');
  });

  // 11. Puter AI Fallback (Extracts claims deterministically)
  test('Puter AI Fallback Mode Extraction', () => {
    const text = 'Expert React developer with 5 years experience. Reach me on telegram or whatsapp me.';
    const result = extractClaimsDeterministic(text, 'freelancer');
    assert(Array.isArray(result.claimedSkills), 'Skills should be an array');
    assert(result.hasOffPlatformHints === true, 'Should flag off-platform contact');
    assert(result.offPlatformSignals.length > 0, 'Should list off-platform signals');
  });

  // 12. Invalid Puter Response Handling
  test('Invalid / Empty Text Handling Resilience', () => {
    const res1 = extractClaimsDeterministic('', 'freelancer');
    assert.strictEqual(res1.hasOffPlatformHints, false);
    assert.strictEqual(res1.claimedSkills.length, 0);

    const res2 = extractClaimsDeterministic(null, 'client');
    assert.strictEqual(res2.hasOffPlatformHints, false);
  });

  // 13. Admin Confirms Fraud
  test('Admin Confirms Fraud (Increases learned weight with clamp)', () => {
    const beforeModel = getLearningModel();
    const beforeWeight = beforeModel.riskSignals?.telegram_or_offplatform_contact?.learnedWeight || 1.0;

    recordAdminReviewDecision({
      decision: 'CONFIRMED_FRAUD',
      signals: [{ type: 'telegram_or_offplatform_contact' }]
    });

    const afterModel = getLearningModel();
    const afterWeight = afterModel.riskSignals?.telegram_or_offplatform_contact?.learnedWeight;

    assert(afterWeight >= beforeWeight, 'Confirmed fraud should increase or maintain signal weight');
    assert(afterWeight <= 1.70, `Learned weight must be clamped <= 1.70, got ${afterWeight}`);
  });

  // 14. Admin Dismisses False Positive
  test('Admin Dismisses False Positive (Decreases learned weight with clamp)', () => {
    const beforeModel = getLearningModel();
    const beforeWeight = beforeModel.riskSignals?.repeated_posting_without_hiring?.learnedWeight || 1.0;

    recordAdminReviewDecision({
      decision: 'DISMISSED_FALSE_POSITIVE',
      signals: [{ type: 'repeated_posting_without_hiring' }]
    });

    const afterModel = getLearningModel();
    const afterWeight = afterModel.riskSignals?.repeated_posting_without_hiring?.learnedWeight;

    assert(afterWeight <= beforeWeight, 'Dismissed false positive should decrease signal weight');
    assert(afterWeight >= 0.30, `Learned weight must be clamped >= 0.30, got ${afterWeight}`);
  });

  // 15. Learning Model Updates & Bounded Weights Check
  test('Adaptive Learning Model Bounded Range Verification [0.30, 1.70]', () => {
    // Rapidly confirm 30 times
    for (let i = 0; i < 30; i++) {
      recordAdminReviewDecision({
        decision: 'CONFIRMED_FRAUD',
        signals: [{ type: 'unrealistic_budget' }]
      });
    }
    let model = getLearningModel();
    assert.strictEqual(model.riskSignals?.unrealistic_budget?.learnedWeight, 1.70, 'Weight must clamp at max 1.70');

    // Rapidly dismiss 40 times
    for (let i = 0; i < 40; i++) {
      recordAdminReviewDecision({
        decision: 'DISMISSED_FALSE_POSITIVE',
        signals: [{ type: 'unrealistic_budget' }]
      });
    }
    model = getLearningModel();
    assert.strictEqual(model.riskSignals?.unrealistic_budget?.learnedWeight, 0.30, 'Weight must clamp at min 0.30');
  });

  // 16. Score Boundaries [0, 100] Clamping Test
  await asyncTest('Score Boundaries [0, 100] Strict Integer Clamping Test', async () => {
    clearScoreCache();
    // Extreme malicious scenario
    const superMalicious = {
      user: { _id: 'f_extreme_bad', role: 'freelancer', createdAt: new Date(Date.now() - 300 * 24 * 3600 * 1000) },
      profile: { bio: 'telegram @hack telegram wire transfer paypal outside', skills: [], profileCompletion: 10 },
      dbContext: {
        contracts: [{ status: 'Cancelled' }, { status: 'Cancelled' }, { status: 'Cancelled' }, { status: 'Cancelled' }],
        disputes: [{ status: 'Active' }, { status: 'Active' }],
        reviews: [{ rating: 1 }, { rating: 1 }]
      }
    };
    const resBad = await calculateUserTrustScore(superMalicious.user, superMalicious.profile, superMalicious.dbContext, true);
    assert(resBad.trustScore >= 0 && resBad.trustScore <= 100, `Bad trust score ${resBad.trustScore} out of bounds`);
    assert(resBad.fraudRiskScore >= 0 && resBad.fraudRiskScore <= 100, `Bad fraud risk ${resBad.fraudRiskScore} out of bounds`);
    assert(Number.isInteger(resBad.trustScore), 'Trust score must be integer');
    assert(Number.isInteger(resBad.fraudRiskScore), 'Fraud risk score must be integer');

    // Extreme positive scenario
    const superGood = {
      user: { _id: 'c_extreme_good', role: 'client', createdAt: new Date(Date.now() - 500 * 24 * 3600 * 1000), isVerified: true, kycStatus: 'Verified', companyName: 'Mega Corp', website: 'https://mega.corp' },
      dbContext: {
        clientProjects: [{ title: 'P1', proposals: [{ status: 'hired' }], status: 'Completed' }, { title: 'P2', proposals: [{ status: 'hired' }], status: 'Completed' }],
        contracts: [{ status: 'Completed', amount: 50000 }, { status: 'Completed', amount: 100000 }],
        disputes: [],
        reviews: [{ rating: 5 }, { rating: 5 }]
      }
    };
    const resGood = await calculateUserTrustScore(superGood.user, {}, superGood.dbContext, true);
    assert(resGood.trustScore >= 0 && resGood.trustScore <= 100, `Good trust score ${resGood.trustScore} out of bounds`);
    assert(resGood.fraudRiskScore >= 0 && resGood.fraudRiskScore <= 100, `Good fraud risk ${resGood.fraudRiskScore} out of bounds`);
    assert(Number.isInteger(resGood.trustScore), 'Trust score must be integer');
    assert(Number.isInteger(resGood.fraudRiskScore), 'Fraud risk score must be integer');
  });

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
