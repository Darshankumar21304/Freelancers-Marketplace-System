import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, Search, 
  Filter, Eye, RefreshCw, Sparkles, UserX, UserCheck, TrendingUp,
  FileText, Activity, AlertCircle, ArrowUpRight, Check, X, ChevronRight,
  Sliders, Database, BrainCircuit
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { getCleanAvatar } from '../../utils/avatarUtils';
import './AdminTrustFraud.css';

export default function AdminTrustFraud() {
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'insights'
  const [stats, setStats] = useState({
    totalUsers: 0,
    lowRisk: 0,
    reviewRequired: 0,
    highRisk: 0,
    confirmedFraud: 0,
    falsePositives: 0,
    pendingReviews: 0
  });
  const [accounts, setAccounts] = useState([]);
  const [modelInsights, setModelInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [filterRole, setFilterRole] = useState('all'); // 'all' | 'freelancer' | 'client'

  // Investigation Modal State
  const [investigatingUser, setInvestigatingUser] = useState(null);
  const [investigationData, setInvestigationData] = useState(null);
  const [isInvestigating, setIsInvestigating] = useState(false);
  
  // Review Decision Form State
  const [reviewDecision, setReviewDecision] = useState('confirm_fraud');
  const [adminNotes, setAdminNotes] = useState('');
  const [blockUserCheck, setBlockUserCheck] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, accountsRes, insightsRes] = await Promise.all([
        apiFetch('/admin/trust/stats').catch(() => ({ stats: {} })),
        apiFetch('/admin/trust/flagged').catch(() => ({ accounts: [] })),
        apiFetch('/admin/trust/model-insights').catch(() => null)
      ]);

      if (statsRes?.stats) setStats(statsRes.stats);
      if (accountsRes?.accounts) setAccounts(accountsRes.accounts);
      if (insightsRes) setModelInsights(insightsRes);
    } catch (err) {
      console.error('Failed to load trust dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenInvestigation = async (userSummary) => {
    setInvestigatingUser(userSummary);
    setInvestigationData(null);
    setIsInvestigating(true);
    setReviewDecision(userSummary.riskLevel === 'high' ? 'confirm_fraud' : 'dismiss_false_positive');
    setAdminNotes('');
    setBlockUserCheck(userSummary.riskLevel === 'high');

    try {
      const data = await apiFetch(`/admin/trust/investigate/${userSummary.id || userSummary._id}`);
      setInvestigationData(data);
    } catch (err) {
      console.error('Error fetching investigation dossier:', err);
    }
  };

  const handleCloseInvestigation = () => {
    setIsInvestigating(false);
    setInvestigatingUser(null);
    setInvestigationData(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!investigatingUser) return;
    setIsSubmittingReview(true);

    try {
      const signalTypes = (investigationData?.trustAnalysis?.signals || []).map(s => s.type);
      const res = await apiFetch(`/admin/trust/${investigatingUser.id || investigatingUser._id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          decision: reviewDecision,
          adminNotes,
          signalTypes,
          blockUser: blockUserCheck
        })
      });

      setNotification({
        type: 'success',
        message: res.message || 'Review decision submitted and adaptive learning model updated.'
      });
      setTimeout(() => setNotification(null), 4000);

      handleCloseInvestigation();
      fetchDashboardData();
    } catch (err) {
      console.error('Review submit error:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to submit review decision.'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || acc.name.toLowerCase().includes(q) || acc.email.toLowerCase().includes(q);
    const matchRisk = filterRisk === 'all' || acc.riskLevel === filterRisk || (filterRisk === 'medium' && acc.riskLevel === 'review');
    const matchRole = filterRole === 'all' || acc.role.toLowerCase() === filterRole.toLowerCase();
    return matchSearch && matchRisk && matchRole;
  });

  return (
    <div className="tf-container">
      {/* Top Banner */}
      <div className="tf-header">
        <div>
          <div className="tf-title-badge">
            <ShieldCheck size={16} /> AI Trust & Fraud Protection Engine
          </div>
          <h1 className="tf-title">Trust & Fraud AI Management</h1>
          <p className="tf-subtitle">
            Explainable AI risk scoring, adaptive learning weights, and manual review workflows for Freelancers & Clients.
          </p>
        </div>
        <div className="tf-actions">
          <button onClick={fetchDashboardData} className="tf-refresh-btn" disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'tf-spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Notifications Toast */}
      {notification && (
        <div className={`tf-toast tf-toast-${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 4 Top KPI Stat Cards */}
      <div className="tf-kpi-grid">
        <div className="tf-kpi-card tf-kpi-green">
          <div className="tf-kpi-icon"><ShieldCheck size={24} /></div>
          <div>
            <div className="tf-kpi-label">Low Risk / Safe</div>
            <div className="tf-kpi-value">{stats.lowRisk || 0}</div>
            <span className="tf-kpi-sub">Trust Score ≥ 80%</span>
          </div>
        </div>

        <div className="tf-kpi-card tf-kpi-yellow">
          <div className="tf-kpi-icon"><AlertTriangle size={24} /></div>
          <div>
            <div className="tf-kpi-label">Review Required</div>
            <div className="tf-kpi-value">{stats.reviewRequired || 0}</div>
            <span className="tf-kpi-sub">Risk Band 30–59%</span>
          </div>
        </div>

        <div className="tf-kpi-card tf-kpi-red">
          <div className="tf-kpi-icon"><ShieldAlert size={24} /></div>
          <div>
            <div className="tf-kpi-label">High Risk Flagged</div>
            <div className="tf-kpi-value">{stats.highRisk || 0}</div>
            <span className="tf-kpi-sub">Risk Band 60–100%</span>
          </div>
        </div>

        <div className="tf-kpi-card tf-kpi-purple">
          <div className="tf-kpi-icon"><BrainCircuit size={24} /></div>
          <div>
            <div className="tf-kpi-label">Confirmed Fraud</div>
            <div className="tf-kpi-value">{stats.confirmedFraud || 0}</div>
            <span className="tf-kpi-sub">{stats.falsePositives || 0} False Positives</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tf-tabs">
        <button 
          className={`tf-tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          <Activity size={16} /> Flagged & Monitored Accounts ({filteredAccounts.length})
        </button>
        <button 
          className={`tf-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <BrainCircuit size={16} /> Adaptive AI Model Insights
        </button>
      </div>

      {/* TAB 1: ACCOUNTS TABLE */}
      {activeTab === 'accounts' && (
        <div className="tf-card">
          <div className="tf-table-toolbar">
            <div className="tf-search-wrap">
              <Search size={16} color="#64748b" />
              <input 
                type="text" 
                placeholder="Search user name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tf-search-input"
              />
            </div>

            <div className="tf-filter-group">
              <div className="tf-select-wrap">
                <Filter size={14} color="#64748b" />
                <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk (60+)</option>
                  <option value="medium">Review Required (30–59)</option>
                  <option value="low">Low Risk (&lt;30)</option>
                </select>
              </div>

              <div className="tf-select-wrap">
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                  <option value="all">All Account Roles</option>
                  <option value="freelancer">Freelancers</option>
                  <option value="client">Clients</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="tf-loading-box">
              <RefreshCw size={28} className="tf-spin" color="#1a73e8" />
              <p>Analyzing account signals and trust baselines...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="tf-empty-box">
              <ShieldCheck size={40} color="#10b981" />
              <h3>No Accounts Found</h3>
              <p>No user accounts match the current filter or search criteria.</p>
            </div>
          ) : (
            <div className="tf-table-responsive">
              <table className="tf-table">
                <thead>
                  <tr>
                    <th>User Account</th>
                    <th>Role</th>
                    <th>Trust Score</th>
                    <th>Fraud Risk</th>
                    <th>Risk Band</th>
                    <th>Key Signals</th>
                    <th>Review Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map(acc => (
                    <tr key={acc.id || acc._id}>
                      <td>
                        <div className="tf-user-cell">
                          <img 
                            src={getCleanAvatar(acc.avatar, acc.name)} 
                            alt={acc.name} 
                            className="tf-user-avatar"
                          />
                          <div>
                            <div className="tf-user-name">{acc.name}</div>
                            <div className="tf-user-email">{acc.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`tf-role-badge tf-role-${acc.role.toLowerCase()}`}>
                          {acc.role}
                        </span>
                      </td>
                      <td>
                        <div className="tf-score-cell">
                          <strong>{acc.trustScore}/100</strong>
                          <div className="tf-bar-bg">
                            <div 
                              className="tf-bar-fill" 
                              style={{ 
                                width: `${acc.trustScore}%`,
                                background: acc.trustScore >= 80 ? '#10b981' : acc.trustScore >= 50 ? '#f59e0b' : '#ef4444'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`tf-risk-pill tf-risk-${acc.riskLevel}`}>
                          {acc.fraudRiskScore}%
                        </span>
                      </td>
                      <td>
                        <span className={`tf-level-tag tf-level-${acc.riskLevel}`}>
                          {acc.badgeLabel || (acc.riskLevel === 'high' ? 'High Risk' : acc.riskLevel === 'medium' ? 'Needs Review' : 'Safe')}
                        </span>
                      </td>
                      <td>
                        <div className="tf-signals-preview">
                          {acc.mainSignals && acc.mainSignals.length > 0 ? (
                            acc.mainSignals.map((s, idx) => (
                              <span key={idx} className="tf-sig-chip" title={s.evidence}>
                                ⚠ {s.type.replace(/_/g, ' ')} ({s.confidence}%)
                              </span>
                            ))
                          ) : (
                            <span className="tf-clean-chip">✓ Clean Audit</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`tf-status-badge tf-status-${(acc.reviewStatus || 'clean').toLowerCase().replace(/\s+/g, '-')}`}>
                          {acc.reviewStatus || 'Clean'}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleOpenInvestigation(acc)} 
                          className="tf-investigate-btn"
                        >
                          <Eye size={14} /> Investigate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI MODEL INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="tf-card">
          <div className="tf-insights-header">
            <div>
              <h2 className="tf-card-title">Adaptive Learning Model Performance</h2>
              <p className="tf-card-subtitle">
                Live confidence weights and historical precision rates updated through verified administrator outcomes.
              </p>
            </div>
            <div className="tf-insights-meta">
              <span>Model Version: <strong>{modelInsights?.version || '1.0.0'}</strong></span>
              <span>Total Admin Outcomes: <strong>{modelInsights?.totalAdminDecisions || 0}</strong></span>
            </div>
          </div>

          <div className="tf-table-responsive">
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Signal Detector</th>
                  <th>Occurrences</th>
                  <th>Confirmed Fraud</th>
                  <th>False Positives</th>
                  <th>Accuracy Rate</th>
                  <th>Signal Confidence</th>
                  <th>Learned Weight Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {modelInsights?.signals?.map(sig => (
                  <tr key={sig.signalKey}>
                    <td>
                      <strong>{sig.signalName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Key: {sig.signalKey}</div>
                    </td>
                    <td>{sig.occurrences}</td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>{sig.confirmedCases}</td>
                    <td style={{ color: '#10b981', fontWeight: 700 }}>{sig.falsePositives}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700 }}>{sig.accuracyRate}%</span>
                        <div className="tf-bar-bg" style={{ width: '60px' }}>
                          <div className="tf-bar-fill" style={{ width: `${sig.accuracyRate}%`, background: '#3b82f6' }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tf-confidence-badge">
                        {sig.confidence}%
                      </span>
                    </td>
                    <td>
                      <span className="tf-weight-badge">
                        {sig.learnedWeight}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEEP-DIVE INVESTIGATION MODAL */}
      {isInvestigating && investigatingUser && (
        <div className="tf-modal-overlay">
          <div className="tf-modal">
            <div className="tf-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src={getCleanAvatar(investigatingUser.avatar, investigatingUser.name)} 
                  alt={investigatingUser.name} 
                  className="tf-modal-avatar"
                />
                <div>
                  <h2 className="tf-modal-title">{investigatingUser.name}</h2>
                  <div className="tf-modal-subtitle">
                    {investigatingUser.email} • <span style={{ textTransform: 'capitalize' }}>{investigatingUser.role}</span>
                  </div>
                </div>
              </div>
              <button onClick={handleCloseInvestigation} className="tf-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="tf-modal-body">
              {!investigationData ? (
                <div className="tf-modal-loading">
                  <RefreshCw size={28} className="tf-spin" color="#1a73e8" />
                  <p>Running multi-factor signal extraction & claims audit...</p>
                </div>
              ) : (
                <div className="tf-dossier-grid">
                  {/* Left Column: Scores & Evidence */}
                  <div className="tf-dossier-left">
                    {/* Score Bar */}
                    <div className="tf-dossier-scores">
                      <div className="tf-score-box">
                        <span className="tf-score-label">Trust Score</span>
                        <span className="tf-score-big" style={{ color: investigationData.trustAnalysis.trustScore >= 75 ? '#10b981' : '#ef4444' }}>
                          {investigationData.trustAnalysis.trustScore}/100
                        </span>
                        <span className="tf-score-tag">{investigationData.trustAnalysis.badgeLabel}</span>
                      </div>
                      <div className="tf-score-box">
                        <span className="tf-score-label">Fraud Risk</span>
                        <span className="tf-score-big" style={{ color: investigationData.trustAnalysis.fraudRiskScore >= 60 ? '#ef4444' : investigationData.trustAnalysis.fraudRiskScore >= 30 ? '#f59e0b' : '#10b981' }}>
                          {investigationData.trustAnalysis.fraudRiskScore}/100
                        </span>
                        <span className="tf-score-tag">{investigationData.trustAnalysis.riskLevel.toUpperCase()} RISK</span>
                      </div>
                    </div>

                    {/* Historical Context Metrics */}
                    <div className="tf-dossier-section">
                      <h4 className="tf-sec-title"><Database size={15} /> Marketplace History & Data Points</h4>
                      <div className="tf-metrics-mini-grid">
                        <div className="tf-mini-metric">
                          <span>Projects/Jobs</span>
                          <strong>{investigationData.dbContextSummary.projectsCount}</strong>
                        </div>
                        <div className="tf-mini-metric">
                          <span>Contracts</span>
                          <strong>{investigationData.dbContextSummary.contractsCount}</strong>
                        </div>
                        <div className="tf-mini-metric">
                          <span>Payment Disputes</span>
                          <strong style={{ color: investigationData.dbContextSummary.disputesCount > 0 ? '#ef4444' : '#0f172a' }}>
                            {investigationData.dbContextSummary.disputesCount}
                          </strong>
                        </div>
                        <div className="tf-mini-metric">
                          <span>Verified Reviews</span>
                          <strong>{investigationData.dbContextSummary.reviewsCount}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Puter AI NLP Claims Extraction */}
                    {investigationData.trustAnalysis.nlpAnalysis && (
                      <div className="tf-dossier-section">
                        <h4 className="tf-sec-title"><Sparkles size={15} color="#1a73e8" /> Natural Language Claims (Puter AI / NLP)</h4>
                        <div className="tf-nlp-card">
                          <div><strong>Detected Domain:</strong> {investigationData.trustAnalysis.nlpAnalysis.domain || 'General'}</div>
                          <div><strong>Claimed Experience:</strong> {investigationData.trustAnalysis.nlpAnalysis.claimedExperience || 'Unspecified'}</div>
                          <div><strong>Claimed Skills:</strong> {(investigationData.trustAnalysis.nlpAnalysis.claimedSkills || []).join(', ') || 'None explicit'}</div>
                          {investigationData.trustAnalysis.nlpAnalysis.hasOffPlatformHints && (
                            <div className="tf-nlp-alert">
                              ⚠ Off-Platform Signals: {investigationData.trustAnalysis.nlpAnalysis.offPlatformSignals?.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Risk Signals List */}
                    <div className="tf-dossier-section">
                      <h4 className="tf-sec-title"><AlertTriangle size={15} color="#ef4444" /> Detected Risk Signals</h4>
                      {investigationData.trustAnalysis.signals.length === 0 ? (
                        <div className="tf-no-signals">✓ No suspicious risk signals detected. Account conforms to baseline trust standards.</div>
                      ) : (
                        <div className="tf-signals-list">
                          {investigationData.trustAnalysis.signals.map((sig, i) => (
                            <div key={i} className={`tf-signal-card tf-sig-${sig.severity}`}>
                              <div className="tf-sig-head">
                                <span className="tf-sig-name">⚠ {sig.type.replace(/_/g, ' ').toUpperCase()}</span>
                                <span className="tf-sig-meta">
                                  Severity: <strong>{sig.severity}</strong> • Confidence: <strong>{sig.confidence}%</strong>
                                </span>
                              </div>
                              <p className="tf-sig-desc">{sig.evidence}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Positive Factors */}
                    {investigationData.trustAnalysis.positiveSignals.length > 0 && (
                      <div className="tf-dossier-section">
                        <h4 className="tf-sec-title"><CheckCircle size={15} color="#10b981" /> Positive Trust Signals</h4>
                        <div className="tf-positive-list">
                          {investigationData.trustAnalysis.positiveSignals.map((pos, i) => (
                            <div key={i} className="tf-positive-item">
                              ✓ {pos.evidence}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Admin Review Form */}
                  <div className="tf-dossier-right">
                    <form onSubmit={handleSubmitReview} className="tf-decision-form">
                      <h3 className="tf-form-title">Submit Administrator Decision</h3>
                      <p className="tf-form-desc">
                        Your decision will update the account standing and feed back into the adaptive learning engine weights.
                      </p>

                      <div className="tf-form-group">
                        <label className="tf-radio-option">
                          <input 
                            type="radio" 
                            name="decision" 
                            value="confirm_fraud" 
                            checked={reviewDecision === 'confirm_fraud'}
                            onChange={(e) => setReviewDecision(e.target.value)}
                          />
                          <div>
                            <strong>Confirm Fraud Risk / Policy Violation</strong>
                            <span>Flags account, marks as Confirmed Risk, and reinforces signal weights.</span>
                          </div>
                        </label>

                        <label className="tf-radio-option">
                          <input 
                            type="radio" 
                            name="decision" 
                            value="dismiss_false_positive" 
                            checked={reviewDecision === 'dismiss_false_positive'}
                            onChange={(e) => setReviewDecision(e.target.value)}
                          />
                          <div>
                            <strong>Dismiss Flag (False Positive)</strong>
                            <span>Clears security flag, restores verified status, and decreases signal weight.</span>
                          </div>
                        </label>
                      </div>

                      {reviewDecision === 'confirm_fraud' && (
                        <div className="tf-checkbox-group">
                          <label className="tf-checkbox-label">
                            <input 
                              type="checkbox" 
                              checked={blockUserCheck}
                              onChange={(e) => setBlockUserCheck(e.target.checked)}
                            />
                            <span>Immediately block user access to marketplace transactions</span>
                          </label>
                        </div>
                      )}

                      <div className="tf-form-group">
                        <label className="tf-input-label">Investigation Audit Notes</label>
                        <textarea 
                          rows="4" 
                          placeholder="Provide context or rationale for this decision (recorded in immutable audit log)..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="tf-textarea"
                          required
                        />
                      </div>

                      <div className="tf-modal-actions">
                        <button 
                          type="button" 
                          onClick={handleCloseInvestigation} 
                          className="tf-btn-cancel"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={isSubmittingReview} 
                          className={`tf-btn-submit ${reviewDecision === 'confirm_fraud' ? 'tf-btn-red' : 'tf-btn-green'}`}
                        >
                          {isSubmittingReview ? (
                            <>
                              <RefreshCw size={14} className="tf-spin" /> Submitting...
                            </>
                          ) : (
                            <>
                              <Check size={15} /> {reviewDecision === 'confirm_fraud' ? 'Confirm Risk & Flag' : 'Dismiss Flag & Clear'}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
