import React, { useState, useEffect } from 'react';
import { CreditCard, Clock, Briefcase, CheckCircle, ShieldCheck, Plus, Sparkles, TrendingUp, FolderPlus, ArrowUpRight, ArrowDownLeft, RefreshCw, FileText, Users, ChevronRight, Zap, Star, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { formatINR } from '../../utils/currency';
import { getUserProfile } from '../../utils/authUtils';
import { apiFetch } from '../../utils/api';
import './Dashboard.css';
import './ClientDashboard.css';

export default function ClientOverview() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  const [activeProjects, setActiveProjects] = useState([]);
  const [recentProposals, setRecentProposals] = useState([]);
  const [hiredFreelancers, setHiredFreelancers] = useState([]);
  const [recommendedFreelancers, setRecommendedFreelancers] = useState([]);
  const [selectedExplainability, setSelectedExplainability] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [counts, setCounts] = useState({
    activeProjectsCount: 0,
    newProposalsCount: 0,
    hiredFreelancersCount: 0,
    completedProjectsCount: 0
  });
  const [profileData, setProfileData] = useState({
    walletBalance: 0,
    escrowBalance: 0,
    activeProjectsCount: 0,
    completedProjectsCount: 0,
    payments: [],
    chartData: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Track recommendation interaction events for adaptive learning
  const trackEvent = async (freelancerId, eventType, skills = []) => {
    try {
      await apiFetch('/recommendations/events', {
        method: 'POST',
        body: JSON.stringify({
          freelancerId,
          eventType,
          matchedSkills: skills
        })
      });
    } catch (e) {
      // ignore
    }
  };

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchUserData = async () => {
    const cachedProfile = getUserProfile();
    if (cachedProfile?.name || cachedProfile?.companyName) {
      setUserName(cachedProfile.name || cachedProfile.companyName);
    }
    try {
      const data = await apiFetch('/users/profile/me');
      if (data?.user?.name || data?.user?.companyName) {
        setUserName(data.user.name || data.user.companyName);
      }
    } catch (e) { }
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // 1. Fetch wallet details (balances & transactions)
      const wallet = await apiFetch('/wallet').catch(() => ({ walletBalance: 0, escrowBalance: 0, transactions: [] }));

      // 2. Fetch projects count
      const projects = await apiFetch('/projects/my').catch(() => []);
      const activeCount = Array.isArray(projects) ? projects.filter(p => p.status === 'Open' || p.status === 'In Progress').length : 0;
      const completedCount = Array.isArray(projects) ? projects.filter(p => p.status === 'Completed').length : 0;

      // 3. Generate chart data from last 6 months transaction history
      const monthlyData = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const currentMonthIdx = new Date().getMonth();
      for (let i = 5; i >= 0; i--) {
        const mIdx = (currentMonthIdx - i + 12) % 12;
        monthlyData[months[mIdx]] = { name: months[mIdx], projectSpending: 0, milestonePayments: 0 };
      }

      if (wallet.transactions && Array.isArray(wallet.transactions)) {
        wallet.transactions.forEach(t => {
          const date = new Date(t.createdAt);
          const mName = months[date.getMonth()];
          if (monthlyData[mName]) {
            const amount = Math.abs(t.amount || 0);
            if (t.type === 'deposit') {
              monthlyData[mName].projectSpending += amount;
            } else if (t.type === 'escrow_fund' || t.type === 'escrow_release') {
              monthlyData[mName].milestonePayments += amount;
            }
          }
        });
      }

      setProfileData({
        walletBalance: wallet.walletBalance || 0,
        escrowBalance: wallet.escrowBalance || 0,
        activeProjectsCount: activeCount,
        completedProjectsCount: completedCount,
        payments: wallet.transactions || [],
        chartData: Object.values(monthlyData)
      });

      // Fetch proposals, contracts, freelancers
      const proposalsRes = await apiFetch('/proposals/received').catch(() => []);
      const proposalsList = (Array.isArray(proposalsRes) ? proposalsRes : []).map(pr => ({
        id: pr._id || pr.id,
        freelancerName: pr.freelancer?.name || pr.freelancerName || 'Freelancer',
        freelancerAvatar: pr.freelancer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pr.freelancer?.name || 'FL')}`,
        skills: pr.skills || ['Web Development'],
        rating: pr.freelancer?.rating || 5.0,
        proposedPrice: pr.bidAmount || pr.proposedPrice || 0,
        projectTitle: pr.projectTitle || pr.project_id?.title || 'Project Proposal'
      }));
      setRecentProposals(proposalsList);

      const contractsRes = await apiFetch('/contracts/active').catch(() => []);
      const contractsList = (Array.isArray(contractsRes) ? contractsRes : []).map(c => ({
        id: c._id,
        title: c.title?.replace('Contract: ', '') || c.project_id?.title || 'Active Project',
        freelancerName: c.freelancer_id?.name || 'Freelancer',
        freelancerAvatar: c.freelancer_id?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.freelancer_id?.name || 'FL')}`,
        progress: c.milestones?.length ? Math.round((c.milestones.filter(m => m.status === 'Completed').length / c.milestones.length) * 100) : 50,
        budget: c.totalValue || 0,
        dueDate: c.deadline ? new Date(c.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '30 Days',
        status: c.status || 'In Progress'
      }));
      setActiveProjects(contractsList);

      const freelancersRes = await apiFetch('/users/freelancers').catch(() => []);
      const recList = (Array.isArray(freelancersRes) ? freelancersRes : []).slice(0, 3).map((f, idx) => ({
        id: f._id || f.id || `rec_${idx}`,
        name: f.name || 'Top Freelancer',
        avatar: f.avatar || f.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name || 'FL')}`,
        skills: Array.isArray(f.skills) ? f.skills : ['Web Development'],
        rating: f.rating || 5.0,
        matchPercent: 95 - idx * 3,
        confidence: 'High'
      }));
      setRecommendedFreelancers(recList);

      setCounts({
        activeProjectsCount: contractsList.length,
        newProposalsCount: proposalsList.length,
        hiredFreelancersCount: contractsList.length,
        completedProjectsCount: completedCount
      });
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchDashboardData();
  }, []);

  const handleAcceptProposal = async (propId, name) => {
    try {
      await apiFetch(`/proposals/${propId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Accepted' })
      });
      alert(`Proposal from ${name} accepted! Contract created.`);
      fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to accept proposal');
    }
  };

  const handleRejectProposal = async (propId) => {
    try {
      await apiFetch(`/proposals/${propId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Rejected' })
      });
    } catch (e) { }
    setRecentProposals(prev => prev.filter(p => p.id !== propId));
    setCounts(prev => ({ ...prev, newProposalsCount: Math.max(0, prev.newProposalsCount - 1) }));
  };

    if (isLoading) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={32} className="spin-icon" color="#1a73e8" style={{ marginBottom: '12px', display: 'inline-block' }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Loading your real-time client workspace...</p>
        </div>
      );
    }

    return (
      <div className="client-dashboard-container" style={{ minHeight: '100vh' }}>

        {/* 1. WELCOME MESSAGE */}
        <div className="overview-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '24px 28px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div>
            <h1 className="overview-title" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              {getGreeting()}, {userName} 👋
            </h1>
            <p className="overview-subtitle" style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
              Here’s an overview of your projects and hiring activity.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/client/dashboard/post-project" style={{ padding: '10px 22px', background: '#0f172a', color: '#ffffff', borderRadius: '30px', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Post a Project
            </Link>
            <Link to="/client/dashboard/wallet" style={{ padding: '10px 22px', background: '#e8f0fe', color: '#1a73e8', border: '1px solid #bfdbfe', borderRadius: '30px', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} /> Deposit Funds
            </Link>
          </div>
        </div>

        {/* 2. QUICK SUMMARY (4 NUMBERS) */}
        <div className="grid-responsive-4" style={{ gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>Active Projects</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>{counts.activeProjectsCount}</span>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f3e8fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={22} color="#a142f4" />
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>New Proposals</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1a73e8' }}>{counts.newProposalsCount}</span>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} color="#1a73e8" />
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>Hired Freelancers</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981' }}>{counts.hiredFreelancersCount}</span>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} color="#10b981" />
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>Completed Projects</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#d97706' }}>{counts.completedProjectsCount}</span>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={22} color="#d97706" />
            </div>
          </div>
        </div>

        {/* 3. ACTIVE PROJECTS (MAIN SECTION) */}
        <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '24px', marginBottom: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={20} color="#1a73e8" /> Active Projects
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Currently active contracts and milestone progress.</p>
            </div>
            <Link to="/client/dashboard/my-projects" style={{ color: '#1a73e8', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All Projects <ChevronRight size={16} />
            </Link>
          </div>

          {activeProjects.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <Briefcase size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
              <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>No Active Projects Currently</h4>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#64748b' }}>Post a project to start receiving proposals and hiring top freelancer talent.</p>
              <Link to="/client/dashboard/post-project" style={{ padding: '8px 20px', background: '#0f172a', color: '#fff', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Post Your First Project
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeProjects.map(proj => (
                <div key={proj.id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: '1 1 240px' }}>
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{proj.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={proj.freelancerAvatar}
                        alt={proj.freelancerName}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://res.cloudinary.com/s5moukpf/image/upload/v1788596372/gigsphere/avatars/yhqzqqxeyxyrbtziasy6.jpg';
                        }}
                        style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #cbd5e1' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Freelancer: <strong style={{ color: '#0f172a' }}>{proj.freelancerName}</strong></span>
                    </div>
                  </div>

                  <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      <span>Progress</span>
                      <span style={{ color: '#1a73e8' }}>{proj.progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${proj.progress}%`, height: '100%', background: '#1a73e8', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Budget</span>
                      <strong style={{ fontSize: '0.95rem', color: '#10b981', fontWeight: 800 }}>{formatINR(proj.budget)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Due Date</span>
                      <strong style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 700 }}>{proj.dueDate}</strong>
                    </div>
                    <Link to="/client/dashboard/my-projects" style={{ padding: '8px 18px', background: '#1a73e8', color: '#ffffff', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      View Project
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TWO COLUMN GRID FOR RECENT PROPOSALS & HIRED FREELANCERS */}
        <div className="grid-responsive-2" style={{ gap: '24px', marginBottom: '28px' }}>

          {/* 4. RECENT PROPOSALS */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#1a73e8" /> Recent Proposals
              </h3>
              <Link to="/client/dashboard/proposals" style={{ color: '#1a73e8', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
                View All
              </Link>
            </div>

            {recentProposals.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <FileText size={28} color="#94a3b8" style={{ marginBottom: '6px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>No Proposals Received Yet</h4>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Proposals submitted by freelancers for your projects will appear here.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {recentProposals.map(prop => (
                  <div key={prop.id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: '4px 10px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                      <Briefcase size={13} color="#1a73e8" />
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Project:</span>
                      <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>{prop.projectTitle || 'Project Proposal'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <img src={prop.freelancerAvatar} alt={prop.freelancerName} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{prop.freelancerName}</h4>
                          <span style={{ fontSize: '0.75rem', color: '#eab308', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            ★ {prop.rating}
                          </span>
                        </div>
                      </div>
                      <strong style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 800 }}>Proposed: {formatINR(prop.proposedPrice)}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {prop.skills.map((skill, idx) => (
                        <span key={idx} style={{ padding: '2px 8px', background: '#e8f0fe', color: '#1a73e8', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                      <Link to="/client/dashboard/proposals" style={{ padding: '5px 12px', background: '#f1f5f9', color: '#475569', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>
                        View Proposal
                      </Link>
                      <button onClick={() => handleAcceptProposal(prop.id, prop.freelancerName)} style={{ padding: '5px 14px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                        Accept
                      </button>
                      <button onClick={() => handleRejectProposal(prop.id)} style={{ padding: '5px 10px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. HIRED FREELANCERS */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#10b981" /> Hired Freelancers
              </h3>
              <Link to="/client/dashboard/hired" style={{ color: '#1a73e8', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
                View Hired Hub
              </Link>
            </div>

            <div style={{ width: '100%', height: '280px', minWidth: 0, minHeight: '280px' }}>
              {profileData.chartData.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px dashed #cbd5e1', borderRadius: '16px', background: '#f8fafc', color: '#64748b' }}>
                  <TrendingUp size={36} color="#1a73e8" style={{ marginBottom: '8px' }} />
                  <h4 style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: 800 }}>No Analytics Data Recorded</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Analytics will generate automatically once you post a project and fund milestone escrow.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                  <AreaChart data={profileData.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#1a73e8" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorMilestones" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => formatINR(val)} />
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                    <Tooltip
                      formatter={(value, name) => [
                        formatINR(value),
                        name === 'projectSpending' ? 'Monthly Project Spending' : 'Milestone Payments'
                      ]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
                    />
                    <Area type="monotone" dataKey="projectSpending" stroke="#1a73e8" strokeWidth={2} fillOpacity={1} fill="url(#colorSpending)" />
                    <Area type="monotone" dataKey="milestonePayments" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMilestones)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

        {/* 6. RECOMMENDED FREELANCERS (AI FEATURE - 8-FACTOR EXPLAINABLE SYSTEM) */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', background: '#f3e8fd', color: '#7c3aed', borderRadius: '20px', fontSize: '11px', fontWeight: 800, marginBottom: '4px' }}>
                <Zap size={12} color="#7c3aed" /> AI Recommended for your projects
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Top Smart Matched Talent</h3>
            </div>
            <Link to="/client/dashboard/browse-freelancers" style={{ color: '#1a73e8', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
              Browse All Freelancers
            </Link>
          </div>

          {recommendedFreelancers.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <Sparkles size={28} color="#94a3b8" style={{ marginBottom: '6px' }} />
              <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>No Freelancer Profiles Available</h4>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>AI recommendations will generate once freelancers register and set up their profiles.</span>
            </div>
          ) : (
            <div className="grid-responsive-3" style={{ gap: '16px' }}>
              {recommendedFreelancers.map(rf => (
                <div key={rf.id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <img src={rf.avatar} alt={rf.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{rf.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: '#eab308', fontWeight: 700 }}>★ {rf.rating}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedExplainability(rf)}
                        title="Click to view full AI Match Explainability factors"
                        style={{ padding: '3px 10px', background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)', color: '#ffffff', border: 'none', borderRadius: '20px', fontSize: '11px', fontWeight: 800, boxShadow: '0 2px 6px rgba(124,58,237,0.25)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        ⚡ {rf.matchPercent}% Match <ChevronRight size={12} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {rf.skills.slice(0, 4).map((s, idx) => (
                        <span key={idx} style={{ padding: '2px 8px', background: '#e2e8f0', color: '#334155', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                          {s}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => setSelectedExplainability(rf)}
                      style={{ background: 'transparent', border: 'none', color: '#7c3aed', fontSize: '0.75rem', fontWeight: 700, padding: 0, marginBottom: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Sparkles size={12} /> Why this match?
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      to={`/freelancer/${rf.id}`}
                      onClick={() => trackEvent(rf.id, 'profileViewed', rf.skills)}
                      style={{ flex: 1, padding: '7px', textAlign: 'center', background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}
                    >
                      View Profile
                    </Link>
                    <Link
                      to="/client/dashboard/post-project"
                      onClick={() => trackEvent(rf.id, 'contacted', rf.skills)}
                      style={{ flex: 1, padding: '7px', textAlign: 'center', background: '#1a73e8', color: '#ffffff', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}
                    >
                      Hire
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EXPLAINABILITY MODAL (PDF Section 14) */}
        {selectedExplainability && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#ffffff', borderRadius: '18px', maxWidth: '540px', width: '100%', padding: '26px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button
                onClick={() => setSelectedExplainability(null)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <img src={selectedExplainability.avatar} alt={selectedExplainability.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{selectedExplainability.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, padding: '2px 8px', background: '#f3e8fd', color: '#7c3aed', borderRadius: '12px' }}>
                      ⚡ {selectedExplainability.matchPercent}% Match
                    </span>
                    <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>
                      Match Confidence: {selectedExplainability.confidence || 'High'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>Why this {selectedExplainability.matchPercent}% Match?</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={15} color="#16a34a" /> <strong>Core Skill & Domain Match</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={15} color="#eab308" /> <span><strong>{selectedExplainability.rating} rating</strong> on verified projects</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  to={`/freelancer/${selectedExplainability.id}`}
                  onClick={() => {
                    trackEvent(selectedExplainability.id, 'profileViewed', selectedExplainability.skills);
                    setSelectedExplainability(null);
                  }}
                  style={{ flex: 1, padding: '10px', textAlign: 'center', background: '#f1f5f9', color: '#334155', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  View Full Profile
                </Link>
                <Link
                  to="/client/dashboard/post-project"
                  onClick={() => {
                    trackEvent(selectedExplainability.id, 'contacted', selectedExplainability.skills);
                    setSelectedExplainability(null);
                  }}
                  style={{ flex: 1, padding: '10px', textAlign: 'center', background: '#1a73e8', color: '#ffffff', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  Hire Freelancer
                </Link>
              </div>
            </div>
          </div>
        )}


          {/* 7. RECENT ACTIVITY */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '22px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#64748b" /> Recent Activity Log
            </h3>

            {recentActivities.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                <Clock size={24} color="#94a3b8" style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>No recent activity recorded yet.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentActivities.map(act => (
                  <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: act.type === 'proposal' ? '#1a73e8' : act.type === 'update' ? '#10b981' : act.type === 'payment' ? '#7c3aed' : '#f59e0b' }}></div>
                      <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>{act.text}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{act.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      );
    }

