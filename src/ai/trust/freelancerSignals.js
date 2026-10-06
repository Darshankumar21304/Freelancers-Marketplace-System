/**
 * Freelancer Trust & Fraud Signal Evaluator
 * Extracts signals from live MongoDB collections: User, FreelancerProfile, Contract, Project, Review, Dispute
 */

const { extractProfileClaims } = require('../puter/claimsExtractor');

/**
 * Calculate Jaccard text similarity ratio between two strings
 */
function calculateTextSimilarity(str1 = '', str2 = '') {
  if (!str1 || !str2) return 0;
  const set1 = new Set(str1.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const set2 = new Set(str2.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  if (set1.size === 0 || set2.size === 0) return 0;
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

/**
 * Evaluate all signals for a Freelancer candidate
 */
async function evaluateFreelancerSignals(userData = {}, profileData = {}, dbContext = {}) {
  const { allProfiles = [], contracts = [], projects = [], disputes = [], reviews = [] } = dbContext;
  const user = userData || {};
  const profile = profileData || {};

  const signals = [];
  const positiveSignals = [];

  const userIdStr = String(user._id || user.id || '');
  const bio = profile.bio || user.bio || '';
  const skills = Array.isArray(profile.skills) ? profile.skills : (Array.isArray(user.skills) ? user.skills : []);
  const portfolio = Array.isArray(profile.portfolioItems) ? profile.portfolioItems : [];
  const completedProjects = contracts.filter(c => c.status === 'Completed').length;
  const cancelledContracts = contracts.filter(c => c.status === 'Cancelled').length;

  // 1. NLP Claims Analysis via Puter AI / Deterministic
  const nlpAnalysis = await extractProfileClaims(bio, 'freelancer');

  // 2. SIGNAL: Incomplete Profile
  const completenessScore = profile.profileCompletion || 0;
  if (completenessScore > 0 && completenessScore < 30) {
    signals.push({
      type: 'incomplete_profile',
      severity: 'low',
      confidence: 0.90,
      evidence: `Profile completion is currently low at ${completenessScore}%.`,
      impact: 'negative',
      value: completenessScore
    });
  } else if (completenessScore >= 80) {
    positiveSignals.push({
      type: 'profile_complete',
      trustBoost: 12,
      evidence: `High profile completeness (${completenessScore}%).`,
      impact: 'positive'
    });
  }

  // 3. SIGNAL: Duplicate Profile Text Check across all other profiles
  if (bio.length > 40 && Array.isArray(allProfiles)) {
    let highestSim = 0;
    let duplicateWithId = null;

    for (const other of allProfiles) {
      const otherUserId = String(other.user_id || other._id);
      if (otherUserId !== userIdStr && other.bio && other.bio.length > 40) {
        const sim = calculateTextSimilarity(bio, other.bio);
        if (sim > highestSim) {
          highestSim = sim;
          duplicateWithId = otherUserId;
        }
      }
    }

    if (highestSim >= 0.75) {
      signals.push({
        type: 'duplicate_profile_text',
        severity: highestSim > 0.88 ? 'high' : 'medium',
        confidence: Math.min(0.95, highestSim),
        evidence: `Bio description has ${(highestSim * 100).toFixed(0)}% similarity match with another account (ID: ${duplicateWithId ? duplicateWithId.slice(-6) : 'N/A'}).`,
        impact: 'negative',
        similarity: highestSim,
        matchedWith: duplicateWithId
      });
    }
  }

  // 4. SIGNAL: Off-Platform Communications solicitation
  if (nlpAnalysis.hasOffPlatformHints) {
    signals.push({
      type: 'unusual_messaging_pattern',
      severity: 'medium',
      confidence: 0.80,
      evidence: `Detected off-platform communication hints: ${nlpAnalysis.offPlatformSignals.join(', ')}`,
      impact: 'negative'
    });
  }

  // 5. SIGNAL: Skills vs Portfolio Consistency
  if (skills.length > 0 && portfolio.length > 0) {
    const portfolioText = portfolio.map(p => `${p.title} ${p.description} ${(p.skills || []).join(' ')}`).join(' ').toLowerCase();
    const matchedCount = skills.filter(s => portfolioText.includes(String(s).toLowerCase())).length;
    const matchRatio = matchedCount / skills.length;

    if (matchRatio < 0.2 && skills.length >= 4) {
      signals.push({
        type: 'skills_portfolio_mismatch',
        severity: 'medium',
        confidence: 0.70,
        evidence: `Only ${matchedCount} of ${skills.length} listed skills are reflected in portfolio deliverables.`,
        impact: 'negative',
        matchRatio
      });
    } else if (matchRatio >= 0.6) {
      positiveSignals.push({
        type: 'consistent_portfolio',
        trustBoost: 10,
        evidence: `Portfolio strongly validates core listed skills (${(matchRatio * 100).toFixed(0)}% alignment).`,
        impact: 'positive'
      });
    }
  }

  // 6. SIGNAL: Proposal Spam / Frequency (if projects context is available)
  let totalProposalsSubmitted = 0;
  let acceptedProposals = 0;
  if (Array.isArray(projects)) {
    projects.forEach(p => {
      (p.proposals || []).forEach(prop => {
        if (String(prop.freelancer_id) === userIdStr || String(prop.freelancer_id?._id) === userIdStr) {
          totalProposalsSubmitted++;
          const st = (prop.status || '').toLowerCase();
          if (st === 'accepted' || st === 'hired') acceptedProposals++;
        }
      });
    });

    if (totalProposalsSubmitted >= 20 && acceptedProposals === 0) {
      signals.push({
        type: 'unusual_proposal_frequency',
        severity: 'medium',
        confidence: 0.72,
        evidence: `High volume of ${totalProposalsSubmitted} submitted proposals with 0 accepted engagements.`,
        impact: 'negative',
        totalProposals: totalProposalsSubmitted
      });
    }
  }

  // 7. SIGNAL: Contract Cancellations
  const totalStartedContracts = completedProjects + cancelledContracts;
  if (totalStartedContracts >= 3 && (cancelledContracts / totalStartedContracts) >= 0.5) {
    const cancelRate = Math.round((cancelledContracts / totalStartedContracts) * 100);
    signals.push({
      type: 'repeated_contract_cancellations',
      severity: cancelRate > 70 ? 'high' : 'medium',
      confidence: 0.85,
      evidence: `Cancellation rate of ${cancelRate}% (${cancelledContracts} cancelled out of ${totalStartedContracts} contracts).`,
      impact: 'negative',
      cancelRate
    });
  }

  // 8. SIGNAL: Payment & Escrow Disputes
  const userDisputes = Array.isArray(disputes) ? disputes.filter(d => 
    String(d.freelancer_id || d.raisedBy || '') === userIdStr || String(d.contract_id?.freelancer_id || '') === userIdStr
  ) : [];

  if (userDisputes.length > 0) {
    signals.push({
      type: 'payment_disputes',
      severity: userDisputes.length >= 2 ? 'high' : 'medium',
      confidence: 0.90,
      evidence: `${userDisputes.length} active or unresolved dispute(s) recorded against contract deliverables.`,
      impact: 'negative',
      disputeCount: userDisputes.length
    });
  }

  // 9. POSITIVE SIGNALS: KYC, Reputation, Ratings
  if (user.kycStatus === 'Verified' || user.verificationStatus === 'verified') {
    positiveSignals.push({
      type: 'kyc_verified',
      trustBoost: 15,
      evidence: 'Identity and documentation verified by marketplace administrator.',
      impact: 'positive'
    });
  }

  if (completedProjects >= 5) {
    positiveSignals.push({
      type: 'high_completion_rate',
      trustBoost: Math.min(18, 10 + completedProjects),
      evidence: `Successfully completed ${completedProjects} marketplace projects.`,
      impact: 'positive',
      completedCount: completedProjects
    });
  }

  const avgRating = Number(profile.rating || user.rating || 5.0);
  const numReviews = Number(profile.numReviews || user.numReviews || reviews.length || 0);
  if (numReviews >= 3 && avgRating >= 4.7) {
    positiveSignals.push({
      type: 'top_rated_reviews',
      trustBoost: 12,
      evidence: `High client satisfaction average rating of ${avgRating.toFixed(1)}/5.0 across ${numReviews} review(s).`,
      impact: 'positive'
    });
  }

  return {
    signals,
    positiveSignals,
    nlpAnalysis,
    historyStats: {
      completedProjects,
      cancelledContracts,
      totalProposals: totalProposalsSubmitted,
      disputesCount: userDisputes.length,
      reviewsCount: numReviews,
      averageRating: avgRating
    }
  };
}

module.exports = {
  evaluateFreelancerSignals,
  calculateTextSimilarity
};
