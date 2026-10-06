/**
 * Client Trust & Fraud Signal Evaluator
 * Extracts signals from live MongoDB collections: User, Project, Contract, Dispute, Review
 */

const { extractProfileClaims } = require('../puter/claimsExtractor');

/**
 * Evaluate all signals for a Client candidate
 */
async function evaluateClientSignals(userData = {}, dbContext = {}) {
  const { clientProjects = [], contracts = [], disputes = [], reviews = [] } = dbContext;
  const user = userData || {};

  const signals = [];
  const positiveSignals = [];

  const userIdStr = String(user._id || user.id || '');
  const totalProjects = clientProjects.length;
  const totalContracts = contracts.length;
  const completedContracts = contracts.filter(c => c.status === 'Completed').length;
  const cancelledContracts = contracts.filter(c => c.status === 'Cancelled').length;

  // 1. NLP Claims Analysis on Client Description / Company Description
  const companyDesc = user.companyDesc || user.bio || '';
  const nlpAnalysis = await extractProfileClaims(companyDesc, 'client');

  // 2. SIGNAL: Incomplete Company Profile
  const hasCompany = Boolean(user.companyName && user.companyName.trim().length > 2);
  const hasIndustry = Boolean(user.industry || user.state || user.location);
  if (!hasCompany && totalProjects > 2) {
    signals.push({
      type: 'incomplete_company_profile',
      severity: 'low',
      confidence: 0.85,
      evidence: 'Client has posted multiple projects without registering company details or verification info.',
      impact: 'negative'
    });
  } else if (hasCompany && (user.gstin || user.website || user.kycStatus === 'Verified')) {
    positiveSignals.push({
      type: 'verified_company',
      trustBoost: 14,
      evidence: `Verified corporate entity profile (${user.companyName}).`,
      impact: 'positive'
    });
  }

  // 3. SIGNAL: Repeated Project Posting Without Hiring
  if (totalProjects >= 4) {
    let projectsWithHires = 0;
    clientProjects.forEach(p => {
      const hasHired = (p.proposals || []).some(pr => {
        const st = (pr.status || '').toLowerCase();
        return st === 'hired' || st === 'accepted';
      }) || (p.status === 'In Progress' || p.status === 'Completed');
      if (hasHired) projectsWithHires++;
    });

    const hireRatio = projectsWithHires / totalProjects;
    if (hireRatio < 0.25) {
      signals.push({
        type: 'repeated_posting_without_hiring',
        severity: 'medium',
        confidence: 0.80,
        evidence: `Client has posted ${totalProjects} projects but hired talent on only ${projectsWithHires} project(s) (${Math.round(hireRatio * 100)}% hire rate).`,
        impact: 'negative',
        hireRatio,
        totalProjects,
        projectsWithHires
      });
    } else if (hireRatio >= 0.70 && totalProjects >= 3) {
      positiveSignals.push({
        type: 'high_hire_rate',
        trustBoost: 12,
        evidence: `Consistent hiring history on ${Math.round(hireRatio * 100)}% of posted project briefs.`,
        impact: 'positive'
      });
    }
  }

  // 4. SIGNAL: Repeated Project / Contract Cancellations
  const totalStarted = completedContracts + cancelledContracts;
  if (totalStarted >= 3 && (cancelledContracts / totalStarted) >= 0.45) {
    const cancelRate = Math.round((cancelledContracts / totalStarted) * 100);
    signals.push({
      type: 'repeated_project_cancellations',
      severity: cancelRate > 65 ? 'high' : 'medium',
      confidence: 0.85,
      evidence: `Client cancelled ${cancelledContracts} out of ${totalStarted} started contracts (${cancelRate}% cancellation rate).`,
      impact: 'negative',
      cancelRate
    });
  }

  // 5. SIGNAL: Unrealistic Budget Pattern
  let unrealisticBudgetCount = 0;
  clientProjects.forEach(p => {
    const b = Number(p.budget || 0);
    const desc = (p.description || '').toLowerCase();
    // Complex keywords with trivial budget (< ₹500)
    if (b > 0 && b < 500 && (desc.includes('full stack') || desc.includes('mobile app') || desc.includes('blockchain') || desc.includes('machine learning'))) {
      unrealisticBudgetCount++;
    }
  });

  if (unrealisticBudgetCount >= 2) {
    signals.push({
      type: 'unrealistic_budget_pattern',
      severity: 'low',
      confidence: 0.75,
      evidence: `${unrealisticBudgetCount} project(s) posted with budgets disproportionately low for enterprise scope requirements.`,
      impact: 'negative'
    });
  }

  // 6. SIGNAL: Payment Disputes & Escrow Clawbacks
  const clientDisputes = Array.isArray(disputes) ? disputes.filter(d => 
    String(d.client_id || d.raisedBy || '') === userIdStr || String(d.contract_id?.client_id || '') === userIdStr
  ) : [];

  if (clientDisputes.length > 0) {
    signals.push({
      type: 'frequent_payment_disputes',
      severity: clientDisputes.length >= 2 ? 'critical' : 'high',
      confidence: 0.92,
      evidence: `${clientDisputes.length} active or contested escrow payment dispute(s) filed.`,
      impact: 'negative',
      disputeCount: clientDisputes.length
    });
  }

  // 7. SIGNAL: Off-Platform Communications / Outside Payments
  if (nlpAnalysis.hasOffPlatformHints) {
    signals.push({
      type: 'off_platform_payment_attempt',
      severity: 'high',
      confidence: 0.82,
      evidence: `Project description contains off-platform transaction solicitations: ${nlpAnalysis.offPlatformSignals.join(', ')}`,
      impact: 'negative'
    });
  }

  // 8. POSITIVE SIGNALS: Completed projects, Escrow history
  if (completedContracts >= 3) {
    positiveSignals.push({
      type: 'established_escrow_history',
      trustBoost: Math.min(18, 10 + completedContracts * 2),
      evidence: `Completed and successfully funded ${completedContracts} milestone contracts.`,
      impact: 'positive',
      completedCount: completedContracts
    });
  }

  return {
    signals,
    positiveSignals,
    nlpAnalysis,
    historyStats: {
      totalProjects,
      totalContracts,
      completedContracts,
      cancelledContracts,
      disputesCount: clientDisputes.length
    }
  };
}

module.exports = {
  evaluateClientSignals
};
