import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, ShoppingBag, CheckCircle, Clock, Sparkles, Search, 
  TrendingUp, ShieldCheck, UserCheck, Briefcase, FileText, 
  MessageSquare, Star, ArrowUpRight, Plus, ExternalLink, 
  ChevronRight, AlertCircle, Edit2, Check, RefreshCw, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatINR } from '../../utils/currency';
import { getUserProfile } from '../../utils/authUtils';
import { apiFetch } from '../../utils/api';
import { getCleanAvatar } from '../../utils/avatarUtils';
import './FreelancerOverview.css';

export default function Overview() {
  const navigate = useNavigate();
  const cachedUser = getUserProfile();
  const [userName, setUserName] = useState(cachedUser?.name || 'Freelancer');
  const [userProfile, setUserProfile] = useState(null);
  
  // 1. Top Bar & Availability
  const [availability, setAvailability] = useState('Available');
  const [profileCompletion, setProfileCompletion] = useState(85);
  const [trustData, setTrustData] = useState(null);
  const [showTrustModal, setShowTrustModal] = useState(false);

  // 2. Metrics & KPI States
  const [kpiStats, setKpiStats] = useState({
    activeProjects: 0,
    pendingProposals: 0,
    completedProjects: 0,
    totalEarnings: 0,
    averageRating: 5.0,
    reviewsCount: 0,
    activeGigsCount: 0,
    walletBalance: 0
  });

  // 3. Workspace Data Lists
  const [activeContracts, setActiveContracts] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [myGigs, setMyGigs] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedExplainability, setSelectedExplainability] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Parallel API Fetch across all real endpoints
      const [
        userSettingsRes,
        contractsRes,
        proposalsRes,
        recommsRes,
        gigsRes,
        walletRes,
        trustRes,
        convosRes,
        reviewsRes
      ] = await Promise.allSettled([
        apiFetch('/users/settings'),
        apiFetch('/projects/my-contracts'),
        apiFetch('/proposals/my-proposals'),
        apiFetch('/recommendations/projects'),
        apiFetch('/gigs/my-gigs'),
        apiFetch('/wallet'),
        apiFetch('/trust/me'),
        apiFetch('/messages/conversations'),
        apiFetch('/reviews/freelancer')
      ]);

      // 1. User & Profile Completion
      if (userSettingsRes.status === 'fulfilled' && userSettingsRes.value?.user) {
        const u = userSettingsRes.value.user;
        const prof = userSettingsRes.value.profile || {};
        setUserProfile({ ...u, ...prof });
        setUserName(u.name || 'Freelancer');
        if (prof.availability) setAvailability(prof.availability);

        // Calculate dynamic profile completion %
        let score = 30; // baseline
        if (u.avatar || u.profilePhoto) score += 15;
        if (prof.bio || u.bio) score += 15;
        if (prof.skills?.length > 0) score += 15;
        if (prof.portfolioItems?.length > 0) score += 15;
        if (u.kycStatus === 'Verified') score += 10;
        setProfileCompletion(Math.min(100, score));
      }

      // 2. Active Contracts
      let parsedContracts = [];
      let totalEarned = 0;
      let completedCount = 0;
      let activeCount = 0;

      if (contractsRes.status === 'fulfilled' && contractsRes.value) {
        const cData = contractsRes.value;
        parsedContracts = Array.isArray(cData.contracts) ? cData.contracts : (Array.isArray(cData) ? cData : []);
        totalEarned = cData.totalEarnings || 0;
        completedCount = cData.completedContracts || 0;
        activeCount = cData.activeContracts || parsedContracts.filter(c => c.status === 'In Progress' || c.status === 'Active').length;
      }
      setActiveContracts(parsedContracts);

      // 3. Proposals
      let parsedProposals = [];
      if (proposalsRes.status === 'fulfilled' && proposalsRes.value) {
        parsedProposals = Array.isArray(proposalsRes.value) ? proposalsRes.value : [];
      }
      setMyProposals(parsedProposals);
      const pendingPropCount = parsedProposals.filter(p => (p.status || '').toLowerCase() === 'pending').length;

      // 4. AI Recommended Projects
      if (recommsRes.status === 'fulfilled' && recommsRes.value?.recommendations) {
        setRecommendedProjects(recommsRes.value.recommendations);
      }

      // 5. My Gigs
      let parsedGigs = [];
      if (gigsRes.status === 'fulfilled' && gigsRes.value) {
        parsedGigs = Array.isArray(gigsRes.value) ? gigsRes.value : [];
      }
      setMyGigs(parsedGigs);

      // 6. Wallet
      let balance = 0;
      let txs = [];
      if (walletRes.status === 'fulfilled' && walletRes.value) {
        balance = walletRes.value.walletBalance || 0;
        txs = Array.isArray(walletRes.value.transactions) ? walletRes.value.transactions : [];
      }
      setRecentTransactions(txs.slice(0, 4));

      // 7. Trust
      if (trustRes.status === 'fulfilled' && trustRes.value) {
        setTrustData(trustRes.value);
      }

      // 8. Conversations / Messages
      if (convosRes.status === 'fulfilled' && convosRes.value) {
        setConversations(Array.isArray(convosRes.value) ? convosRes.value.slice(0, 4) : []);
      }

      // 9. Reviews
      let parsedReviews = [];
      if (reviewsRes.status === 'fulfilled' && reviewsRes.value) {
        parsedReviews = Array.isArray(reviewsRes.value) ? reviewsRes.value : (reviewsRes.value.reviews || []);
      }
      setRecentReviews(parsedReviews);

      // Compute actual average rating from DB profile or review array
      const dbAvgRating = (userProfile?.rating && userProfile.rating > 0)
        ? userProfile.rating
        : (parsedReviews.length > 0 
            ? Number((parsedReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / parsedReviews.length).toFixed(1))
            : 0);

      // Set Aggregated KPI Stats
      setKpiStats({
        activeProjects: activeCount,
        pendingProposals: pendingPropCount,
        completedProjects: completedCount,
        totalEarnings: totalEarned,
        averageRating: dbAvgRating,
        reviewsCount: parsedReviews.length,
        activeGigsCount: parsedGigs.length,
        walletBalance: balance
      });

    } catch (err) {
      console.error('Error loading Freelancer Dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvailabilityChange = async (e) => {
    const val = e.target.value;
    setAvailability(val);
    try {
      await apiFetch('/users/settings', {
        method: 'PUT',
        body: JSON.stringify({ availability: val })
      });
    } catch (err) {
      // ignore
    }
  };

  // Calculate milestone progress percentage
  const calculateProgress = (milestones = []) => {
    if (!milestones || milestones.length === 0) return 40;
    const completed = milestones.filter(m => m.status === 'Completed').length;
    return Math.round((completed / milestones.length) * 100);
  };

  return (
    <div className="fl-dash-container">
      
      {/* =====================================================================
          1. TOP HERO / COMMAND CENTER BAR
          ===================================================================== */}
      <div className="fl-hero-banner">
        <div>
          <div className="fl-hero-badge-row">
            <span className="fl-badge-pro">
              <Sparkles size={13} /> Verified Freelancer Pro
            </span>
            <button 
              className="fl-badge-trust" 
              onClick={() => setShowTrustModal(true)}
              title="Click to view safe trust standing breakdown"
            >
              <ShieldCheck size={14} color="#059669" /> 
              🟢 Profile Trust: {trustData?.trustScore ? `${trustData.trustScore}%` : 'High'} ({trustData?.badgeLabel || 'Verified'})
            </button>
          </div>

          <h1 className="fl-hero-title">
            {getGreeting()}, {userName}!
          </h1>

          <div className="fl-hero-subtitle">
            <div className="fl-completion-pill">
              <span>Profile {profileCompletion}% complete</span>
              <div className="fl-progress-mini">
                <div className="fl-progress-mini-fill" style={{ width: `${profileCompletion}%` }} />
              </div>
            </div>
            <span>•</span>
            <span>Focus: Deliver great work & grow your client base</span>
          </div>
        </div>

        <div className="fl-hero-actions">
          {/* Availability Status Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`fl-status-dot ${availability.toLowerCase()}`} />
            <select 
              value={availability} 
              onChange={handleAvailabilityChange} 
              className="fl-availability-toggle"
            >
              <option value="Available">Available for Work</option>
              <option value="Busy">Busy / In Project</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          <Link to="/freelancer/dashboard/profile" className="fl-btn-edit-profile">
            <Edit2 size={15} /> Edit Profile
          </Link>

          <Link to="/freelancer/dashboard/browse-projects" className="fl-btn-browse-jobs">
            <Search size={15} /> Browse Open Jobs
          </Link>
        </div>
      </div>

      {/* =====================================================================
          2. 6 OVERVIEW KPI METRIC CARDS
          ===================================================================== */}
      <div className="fl-kpi-grid-6">
        <div className="fl-kpi-card">
          <div className="fl-kpi-icon" style={{ background: '#e8f0fe', color: '#1a73e8' }}>
            <ShoppingBag size={22} />
          </div>
          <div className="fl-kpi-info">
            <span className="fl-kpi-label">Active Projects</span>
            <span className="fl-kpi-val">{isLoading ? '...' : kpiStats.activeProjects}</span>
            <span className="fl-kpi-sub">In-progress milestones</span>
          </div>
        </div>

        <div className="fl-kpi-card">
          <div className="fl-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <FileText size={22} />
          </div>
          <div className="fl-kpi-info">
            <span className="fl-kpi-label">Pending Proposals</span>
            <span className="fl-kpi-val">{isLoading ? '...' : kpiStats.pendingProposals}</span>
            <span className="fl-kpi-sub">Awaiting client decision</span>
          </div>
        </div>

        <div className="fl-kpi-card">
          <div className="fl-kpi-icon" style={{ background: '#f3e8fd', color: '#a142f4' }}>
            <CheckCircle size={22} />
          </div>
          <div className="fl-kpi-info">
            <span className="fl-kpi-label">Completed Projects</span>
            <span className="fl-kpi-val">{isLoading ? '...' : kpiStats.completedProjects}</span>
            <span className="fl-kpi-sub">Successfully delivered</span>
          </div>
        </div>

        <div className="fl-kpi-card">
          <div className="fl-kpi-icon" style={{ background: '#dcfce7', color: '#10b981' }}>
            <IndianRupee size={22} />
          </div>
          <div className="fl-kpi-info">
            <span className="fl-kpi-label">Total Net Earnings</span>
            <span className="fl-kpi-val">{isLoading ? '...' : formatINR(kpiStats.totalEarnings)}</span>
            <span className="fl-kpi-sub">Paid out to wallet</span>
          </div>
        </div>

        <div className="fl-kpi-card">
          <div className="fl-kpi-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
            <Star size={22} fill="#f59e0b" color="#f59e0b" />
          </div>
          <div className="fl-kpi-info">
            <span className="fl-kpi-label">Average Rating</span>
            <span className="fl-kpi-val">{kpiStats.reviewsCount > 0 ? `★ ${Number(kpiStats.averageRating || 5.0).toFixed(1)}` : 'New'}</span>
            <span className="fl-kpi-sub">{kpiStats.reviewsCount > 0 ? `${kpiStats.reviewsCount} verified reviews` : 'No reviews yet'}</span>
          </div>
        </div>

        <div className="fl-kpi-card">
          <div className="fl-kpi-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <Briefcase size={22} />
          </div>
          <div className="fl-kpi-info">
            <span className="fl-kpi-label">Active Gigs</span>
            <span className="fl-kpi-val">{isLoading ? '...' : kpiStats.activeGigsCount}</span>
            <span className="fl-kpi-sub">Marketplace listings</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. MAIN WORKSPACE 2-COLUMN GRID
          ===================================================================== */}
      <div className="fl-main-grid">
        
        {/* LEFT COLUMN: ACTIVE WORK & OPPORTUNITIES */}
        <div className="fl-col">
          
          {/* SECTION 3: CURRENT / ACTIVE PROJECTS */}
          <div className="fl-section-card">
            <div className="fl-card-head">
              <div className="fl-card-title-wrap">
                <h3 className="fl-card-title">
                  <ShoppingBag size={18} color="#1a73e8" /> Active Contract Workspaces
                </h3>
                <span className="fl-card-badge-count">{activeContracts.length} Active</span>
              </div>
              <Link to="/freelancer/dashboard/active-projects" className="fl-card-link">
                View All Contracts <ChevronRight size={14} />
              </Link>
            </div>

            {activeContracts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <ShoppingBag size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: 700 }}>No Active Contracts</h4>
                <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: '#64748b' }}>Apply to recommended client projects below to start earning.</p>
                <Link to="/freelancer/dashboard/browse-projects" className="fl-btn-browse-jobs" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                  Browse Projects
                </Link>
              </div>
            ) : (
              <div className="fl-project-list">
                {activeContracts.map((c, idx) => {
                  const clientName = c.client_id?.companyName || c.client_id?.name || 'Client Partner';
                  const clientAvatar = getCleanAvatar(c.client_id?.avatar, clientName);
                  const progressPct = calculateProgress(c.milestones);
                  const deadlineStr = c.deadline ? new Date(c.deadline).toLocaleDateString('en-IN') : 'In 30 Days';

                  return (
                    <div key={c._id || idx} className="fl-project-card">
                      <div className="fl-proj-header">
                        <div>
                          <h4 className="fl-proj-title">{c.title || c.project_id?.title || 'Active Project Contract'}</h4>
                          <div className="fl-proj-client">
                            <img src={clientAvatar} alt={clientName} className="fl-client-avatar" />
                            <span>Client: <strong>{clientName}</strong></span>
                            <span>•</span>
                            <span>Deadline: <strong>{deadlineStr}</strong></span>
                          </div>
                        </div>
                        <span className="fl-proj-budget-tag">
                          {formatINR(c.totalValue || c.amount || 0)}
                        </span>
                      </div>

                      {/* Milestone Progress */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                        <span>Deliverable Progress</span>
                        <span>{progressPct}% Completed</span>
                      </div>
                      <div className="fl-proj-progress-bar">
                        <div className="fl-proj-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>

                      <div className="fl-proj-meta-row">
                        <span>Status: <strong style={{ color: '#10b981' }}>{c.status || 'In Progress'}</strong></span>
                        <div className="fl-proj-actions">
                          <Link to={`/freelancer/dashboard/chat?user=${c.client_id?._id || ''}`} className="fl-btn-mini-chat">
                            <MessageSquare size={13} /> Chat with Client
                          </Link>
                          <Link to="/freelancer/dashboard/active-projects" className="fl-btn-mini-open">
                            Workspace <ExternalLink size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 5: AI RECOMMENDED PROJECTS */}
          <div className="fl-section-card">
            <div className="fl-card-head">
              <div className="fl-card-title-wrap">
                <h3 className="fl-card-title">
                  <Sparkles size={18} color="#1a73e8" /> Recommended Projects For You
                </h3>
                <span className="fl-badge-pro" style={{ fontSize: '0.7rem' }}>AI Smart Match</span>
              </div>
              <Link to="/freelancer/dashboard/browse-projects" className="fl-card-link">
                Explore Marketplace <ChevronRight size={14} />
              </Link>
            </div>

            {recommendedProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Scanning marketplace project briefs for new matches...</p>
              </div>
            ) : (
              <div className="fl-ai-recomms-grid">
                {recommendedProjects.slice(0, 3).map((p) => (
                  <div key={p._id || p.id} className="fl-recomm-card">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="fl-recomm-match-tag">
                          <Sparkles size={12} /> {p.matchPercentage}% Match
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {p.category || 'Development'}
                        </span>
                      </div>

                      <h4 className="fl-recomm-title">{p.title}</h4>

                      {/* Required Skills */}
                      <div className="fl-recomm-skills">
                        {(p.skills || []).slice(0, 4).map((sk, sIdx) => (
                          <span key={sIdx} className="fl-skill-tag">{sk}</span>
                        ))}
                      </div>

                      {/* Why Recommended Explainability snippet */}
                      <div className="fl-recomm-why">
                        <strong>Why this project?</strong>
                        <div style={{ marginTop: '3px' }}>
                          ✓ {p.whyRecommended?.[0] || 'Matches your core skillset'}
                        </div>
                      </div>
                    </div>

                    <div className="fl-recomm-footer">
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Client Budget</span>
                        <span className="fl-recomm-budget">{formatINR(p.budget || p.budgetMax || p.budgetMin || 0)}</span>
                      </div>
                      <Link 
                        to={`/freelancer/dashboard/browse-projects?highlight=${p._id || p.id}`} 
                        className="fl-btn-mini-open"
                        style={{ padding: '6px 14px' }}
                      >
                        Submit Proposal <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: PROPOSALS / BIDDING TABLE */}
          <div className="fl-section-card">
            <div className="fl-card-head">
              <div className="fl-card-title-wrap">
                <h3 className="fl-card-title">
                  <FileText size={18} color="#1a73e8" /> My Proposals & Bids
                </h3>
                <span className="fl-card-badge-count">{myProposals.length} Submitted</span>
              </div>
              <Link to="/freelancer/dashboard/my-proposals" className="fl-card-link">
                View All Proposals <ChevronRight size={14} />
              </Link>
            </div>

            {myProposals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>No submitted proposals found. Apply to projects to start winning contracts.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="fl-proposals-table">
                  <thead>
                    <tr>
                      <th>Project Title</th>
                      <th>Client</th>
                      <th>Bid Amount</th>
                      <th>Submitted Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myProposals.slice(0, 4).map((prop, idx) => {
                      const clientName = prop.clientName || prop.client?.companyName || prop.client?.name || 'Client Partner';
                      const statusClass = (prop.status || 'pending').toLowerCase();
                      const dateStr = prop.createdAt ? new Date(prop.createdAt).toLocaleDateString('en-IN') : 'Recent';

                      return (
                        <tr key={prop._id || prop.id || idx}>
                          <td>
                            <strong>{prop.projectTitle || prop.project_title || 'Project Proposal'}</strong>
                          </td>
                          <td style={{ color: '#475569' }}>{clientName}</td>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{formatINR(prop.bidAmount || 0)}</strong>
                          </td>
                          <td style={{ color: '#64748b' }}>{dateStr}</td>
                          <td>
                            <span className={`fl-status-pill ${statusClass}`}>
                              {prop.status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 6: MY GIGS */}
          <div className="fl-section-card">
            <div className="fl-card-head">
              <div className="fl-card-title-wrap">
                <h3 className="fl-card-title">
                  <Briefcase size={18} color="#1a73e8" /> My Active Marketplace Gigs
                </h3>
                <span className="fl-card-badge-count">{myGigs.length} Gigs</span>
              </div>
              <Link to="/freelancer/dashboard/create-gig" className="fl-btn-mini-open" style={{ padding: '6px 14px' }}>
                <Plus size={14} /> Create Gig
              </Link>
            </div>

            {myGigs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <Briefcase size={28} color="#94a3b8" style={{ marginBottom: '6px' }} />
                <h4 style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: 700 }}>No Gigs Published</h4>
                <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#64748b' }}>Create fixed-price service gigs so clients can order your skills directly.</p>
                <Link to="/freelancer/dashboard/create-gig" className="fl-btn-mini-open">
                  + Create Your First Gig
                </Link>
              </div>
            ) : (
              <div className="fl-gigs-grid-mini">
                {myGigs.slice(0, 3).map((g, idx) => (
                  <div key={g._id || idx} className="fl-gig-mini-card">
                    <img 
                      src={g.images?.[0] || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600'} 
                      alt={g.title} 
                      className="fl-gig-mini-img" 
                    />
                    <div className="fl-gig-mini-content">
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{g.category || 'Service'}</span>
                      <h4 className="fl-gig-mini-title">{g.title}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span className="fl-gig-mini-price">From {formatINR(g.price)}</span>
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>● Active</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: MESSAGES, TRUST & EARNINGS BREAKDOWN */}
        <div className="fl-col">

          {/* SECTION 10: PROFILE TRUST & HEALTH (SAFE FACING) */}
          <div className="fl-section-card" style={{ border: '1.5px solid #a7f3d0', background: 'linear-gradient(180deg, #ffffff, #f0fdf4)' }}>
            <div className="fl-card-head">
              <h3 className="fl-card-title" style={{ color: '#065f46' }}>
                <ShieldCheck size={20} color="#059669" /> Profile Trust & Standing
              </h3>
              <button 
                onClick={() => setShowTrustModal(true)}
                style={{ background: '#d1fae5', border: 'none', color: '#047857', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Score Info
              </button>
            </div>

            <div className="fl-trust-card-body">
              <div className="fl-trust-score-row">
                <div className="fl-trust-score-circle">
                  {trustData?.trustScore || 95}%
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>
                    {trustData?.badgeLabel || 'High Trust Account'}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
                    ✓ {trustData?.userFacingStatus || 'Verified Freelancer Pro'}
                  </span>
                </div>
              </div>

              <div className="fl-trust-factors-list">
                <div className="fl-trust-factor-item">
                  ✓ Official ID & Identity Verification verified
                </div>
                <div className="fl-trust-factor-item">
                  ✓ Clean escrow & payment dispute record
                </div>
                <div className="fl-trust-factor-item">
                  ✓ Technical portfolio and deliverable alignment
                </div>
              </div>

              <div className="fl-trust-tip">
                💡 <strong>Trust Tip:</strong> Delivering active project milestones on schedule maintains your Verified Pro priority badge.
              </div>
            </div>
          </div>

          {/* SECTION 8: RECENT MESSAGES */}
          <div className="fl-section-card">
            <div className="fl-card-head">
              <div className="fl-card-title-wrap">
                <h3 className="fl-card-title">
                  <MessageSquare size={18} color="#1a73e8" /> Recent Conversations
                </h3>
              </div>
              <Link to="/freelancer/dashboard/chat" className="fl-card-link">
                Open Chat <ChevronRight size={14} />
              </Link>
            </div>

            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.85rem' }}>
                No active conversations yet. Messages from clients will appear here.
              </div>
            ) : (
              <div className="fl-messages-list">
                {conversations.map((c, i) => {
                  const otherName = c.otherUser?.name || c.name || 'Client Partner';
                  const otherAvatar = getCleanAvatar(c.otherUser?.avatar || c.avatar, otherName);

                  return (
                    <Link 
                      key={c.id || c._id || i} 
                      to={`/freelancer/dashboard/chat?user=${c.otherUser?._id || c.userId || ''}`}
                      className="fl-msg-item"
                    >
                      <div className="fl-msg-left">
                        <img src={otherAvatar} alt={otherName} className="fl-msg-avatar" />
                        <div>
                          <div className="fl-msg-name">{otherName}</div>
                          <div className="fl-msg-text">{c.lastMessage?.text || c.lastMessage || 'Sent an attachment.'}</div>
                        </div>
                      </div>
                      <div className="fl-msg-meta">
                        <span className="fl-msg-time">Recent</span>
                        {c.unreadCount > 0 && <span className="fl-msg-badge">{c.unreadCount}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 7: EARNINGS & WALLET */}
          <div className="fl-section-card">
            <div className="fl-card-head">
              <div className="fl-card-title-wrap">
                <h3 className="fl-card-title">
                  <TrendingUp size={18} color="#10b981" /> Wallet & Payout Vault
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Link to="/freelancer/dashboard/analytics" className="fl-card-link" style={{ color: '#2563eb' }}>
                  Full Analytics <ChevronRight size={14} />
                </Link>
                <Link to="/freelancer/dashboard/wallet" className="fl-card-link">
                  Wallet <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Available Liquid Balance</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
                {formatINR(kpiStats.walletBalance)}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                ✓ Ready for instant UPI or Bank Withdrawal
              </span>
            </div>

            <h5 style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#475569', fontWeight: 700 }}>Recent Wallet Activities</h5>
            {recentTransactions.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>No recent transactions recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentTransactions.map((tx, idx) => (
                  <div key={tx._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{tx.title || 'Milestone Earning'}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{tx.status}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: tx.amount > 0 ? '#10b981' : '#ef4444' }}>
                      {tx.amount > 0 ? `+${formatINR(tx.amount)}` : formatINR(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 9: RATINGS & REVIEWS */}
          <div className="fl-section-card">
            <div className="fl-card-head">
              <div className="fl-card-title-wrap">
                <h3 className="fl-card-title">
                  <Star size={18} fill="#f59e0b" color="#f59e0b" /> Client Satisfaction & Reviews
                </h3>
              </div>
              <Link to="/freelancer/dashboard/reviews" className="fl-card-link">
                All Reviews <ChevronRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>
                {kpiStats.reviewsCount > 0 ? Number(kpiStats.averageRating || 5.0).toFixed(1) : 'New'}
              </div>
              <div>
                <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={14} 
                      fill={s <= Math.round(kpiStats.averageRating || 0) ? "#f59e0b" : "none"} 
                      color={s <= Math.round(kpiStats.averageRating || 0) ? "#f59e0b" : "#cbd5e1"} 
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {kpiStats.reviewsCount > 0 
                    ? `Based on ${kpiStats.reviewsCount} verified client ${kpiStats.reviewsCount === 1 ? 'rating' : 'ratings'}`
                    : 'No client ratings yet'}
                </span>
              </div>
            </div>

            {recentReviews.length > 0 ? (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '0.8rem', color: '#334155' }}>
                <p style={{ margin: '0 0 6px', fontStyle: 'italic' }}>
                  "{recentReviews[0].comment}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.75rem', color: '#0f172a' }}>
                    — {recentReviews[0].reviewer_id?.name || recentReviews[0].reviewerName || 'Verified Client'}
                  </strong>
                  {recentReviews[0].projectTitle && (
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {recentReviews[0].projectTitle}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '14px 12px', borderRadius: '10px', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                <p style={{ margin: 0, fontStyle: 'italic' }}>
                  No client reviews yet. Complete your active contracts to earn client reviews and 5-star ratings!
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* =====================================================================
          TRUST SCORE EXPLANATION MODAL (SAFE USER FACING)
          ===================================================================== */}
      {showTrustModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#059669" /> Profile Trust Score Breakdown
              </h3>
              <button onClick={() => setShowTrustModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '12px', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#15803d' }}>
                {trustData?.trustScore || 95}%
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534' }}>
                {trustData?.userFacingStatus || 'Verified Pro Freelancer'}
              </span>
            </div>

            <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Your Trust-Boosting Factors</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: '#15803d', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                ✓ Identity verification (KYC) in good standing
              </div>
              <div style={{ fontSize: '0.8rem', color: '#15803d', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                ✓ Clean dispute and escrow delivery history
              </div>
              <div style={{ fontSize: '0.8rem', color: '#15803d', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                ✓ Skills validated against portfolio deliverables
              </div>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: '#64748b' }}>
              Trust scores are computed dynamically from marketplace milestones, prompt delivery times, and client reviews. High scores give your proposals higher priority in client searches.
            </p>

            <button 
              onClick={() => setShowTrustModal(false)}
              style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
