import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { formatINR } from '../../utils/currency';
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
  Building2,
  FileCheck,
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  Server,
  Activity,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export default function AdminOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('6months');
  const [activeTab, setActiveTab] = useState('projects');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData(timeRange);
  }, [timeRange]);

  const fetchDashboardData = async (range) => {
    try {
      if (!data) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const response = await apiFetch(`/admin/dashboard/overview?range=${range}`);
      if (response && response.success) {
        setData(response);
      } else {
        throw new Error(response.message || 'Failed to retrieve dashboard analytics');
      }
    } catch (err) {
      console.error('Admin Overview fetch error:', err);
      setError(err.message || 'Unable to load dashboard data. Please verify backend server and MongoDB connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const stats = data?.stats;
  const actionCenter = data?.actionCenter;
  const revenueData = data?.revenueData || [];
  const recentActivity = data?.recentActivity;
  const aiStatus = data?.aiStatus;

  // Custom Recharts Tooltip for Financials
  const CustomFinancialTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '0.75rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          fontSize: '0.8rem'
        }}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>{label}</div>
          {payload.map((entry, index) => (
            <div key={index} style={{ color: entry.color, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color }}></span>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 700 }}>
                {entry.dataKey === 'volume' || entry.dataKey === 'revenue' ? formatINR(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ width: 220, height: 28, background: '#e2e8f0', borderRadius: 6, marginBottom: 8 }}></div>
            <div style={{ width: 340, height: 16, background: '#f1f5f9', borderRadius: 4 }}></div>
          </div>
          <div style={{ width: 120, height: 36, background: '#e2e8f0', borderRadius: 6 }}></div>
        </div>

        {/* Skeleton KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ height: 110, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', padding: '1rem' }}>
              <div style={{ width: '40%', height: 14, background: '#e2e8f0', borderRadius: 4, marginBottom: 12 }}></div>
              <div style={{ width: '60%', height: 26, background: '#cbd5e1', borderRadius: 4, marginBottom: 8 }}></div>
              <div style={{ width: '80%', height: 12, background: '#f1f5f9', borderRadius: 4 }}></div>
            </div>
          ))}
        </div>

        <div style={{ height: 300, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          <Activity className="animate-spin" size={24} style={{ marginRight: '0.5rem' }} />
          Aggregating live platform metrics from MongoDB...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '50%', marginBottom: '1rem' }}>
          <AlertCircle size={36} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Unable to Load Dashboard Data</h2>
        <p style={{ color: '#64748b', maxWidth: 500, margin: '0 auto 1.5rem auto', fontSize: '0.875rem' }}>{error}</p>
        <button 
          onClick={() => fetchDashboardData(timeRange)}
          className="min-btn min-btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
        >
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  const activeListingCount = (stats?.totalProjects || 0) + (stats?.totalGigs || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header & Controls Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Executive Platform Control Center
            </h1>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              padding: '0.2rem 0.6rem', 
              borderRadius: '20px', 
              background: '#dcfce7', 
              color: '#15803d',
              border: '1px solid #bbf7d0'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
              MongoDB Connected
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.825rem', margin: '0.25rem 0 0 0' }}>
            Live platform aggregates, financial volume, security signals & operational workflows
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Time Filter */}
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="min-input"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem', fontWeight: 600 }}
          >
            <option value="7days">Past 7 Days</option>
            <option value="30days">Past 30 Days</option>
            <option value="6months">Past 6 Months</option>
            <option value="1year">Past 1 Year</option>
          </select>

          {/* Refresh Action */}
          <button 
            onClick={() => fetchDashboardData(timeRange)}
            className="min-btn"
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
            title="Refresh database metrics"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Executive KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
        
        {/* Total Users */}
        <div className="min-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard/users')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div className="stat-label" style={{ margin: 0 }}>Total Users</div>
            <div style={{ padding: '0.35rem', borderRadius: '6px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="#1a73e8" />
            </div>
          </div>
          <div className="stat-value">{stats?.totalUsers || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', display: 'flex', gap: '0.35rem' }}>
            <span style={{ color: '#1a73e8', fontWeight: 600 }}>{stats?.totalClients || 0} Clients</span> • 
            <span style={{ color: '#15803d', fontWeight: 600 }}>{stats?.totalFreelancers || 0} Freelancers</span>
          </div>
        </div>

        {/* Active Listings */}
        <div className="min-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard/listings')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div className="stat-label" style={{ margin: 0 }}>Market Listings</div>
            <div style={{ padding: '0.35rem', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={16} color="#475569" />
            </div>
          </div>
          <div className="stat-value">{activeListingCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            <span>{stats?.activeProjects || 0} Projects</span> • <span>{stats?.activeGigs || 0} Gigs</span>
          </div>
        </div>

        {/* Platform Revenue */}
        <div className="min-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div className="stat-label" style={{ margin: 0 }}>Platform Revenue</div>
            <div style={{ padding: '0.35rem', borderRadius: '6px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} color="#15803d" />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#15803d' }}>
            {formatINR(stats?.platformRevenue || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span>10% Platform Fee / Commissions</span>
          </div>
        </div>

        {/* Platform GMV */}
        <div className="min-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div className="stat-label" style={{ margin: 0 }}>Platform GMV</div>
            <div style={{ padding: '0.35rem', borderRadius: '6px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} color="#4f46e5" />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#4f46e5' }}>
            {formatINR(stats?.totalVolume || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            Total Contract Volume ({stats?.totalContracts || 0} contracts)
          </div>
        </div>

        {/* Escrow Balance */}
        <div className="min-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div className="stat-label" style={{ margin: 0 }}>Escrow In Custody</div>
            <div style={{ padding: '0.35rem', borderRadius: '6px', background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} color="#0891b2" />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#0891b2' }}>
            {formatINR(stats?.escrowBalance || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            {stats?.escrowBalance > 0 ? 'Active In-Flight Escrow Funds' : 'Secured Client Escrow Funds'}
          </div>
        </div>

        {/* Disputes Status */}
        <div className="min-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard/disputes')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div className="stat-label" style={{ margin: 0 }}>Dispute Cases</div>
            <div style={{ padding: '0.35rem', borderRadius: '6px', background: stats?.activeDisputes > 0 ? '#fef3c7' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} color={stats?.activeDisputes > 0 ? '#b45309' : '#64748b'} />
            </div>
          </div>
          <div className="stat-value" style={{ color: stats?.activeDisputes > 0 ? '#b45309' : '#0f172a' }}>
            {stats?.activeDisputes || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            {stats?.resolvedDisputes || 0} Resolved Cases
          </div>
        </div>

      </div>

      {/* 3. Admin Action Required Center */}
      <div className="min-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#1a73e8" />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
              Action Required & Moderation Queue
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Real-time pending administrative queue
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
          
          {/* KYC Approvals */}
          <div 
            onClick={() => navigate('/admin/dashboard/kyc')}
            style={{ 
              background: '#ffffff', 
              padding: '0.85rem 1rem', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
            className="action-card-hover"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ padding: '0.45rem', borderRadius: '6px', background: '#eff6ff', color: '#1a73e8' }}>
                <FileCheck size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a' }}>KYC Approvals</div>
                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Identity Verification</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className={`pill-badge ${actionCenter?.pendingKyc?.count > 0 ? 'review' : 'clean'}`}>
                {actionCenter?.pendingKyc?.count || 0} Pending
              </span>
              <ArrowRight size={14} color="#94a3b8" />
            </div>
          </div>

          {/* Open Disputes */}
          <div 
            onClick={() => navigate('/admin/dashboard/disputes')}
            style={{ 
              background: '#ffffff', 
              padding: '0.85rem 1rem', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
            className="action-card-hover"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ padding: '0.45rem', borderRadius: '6px', background: '#fef3c7', color: '#b45309' }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a' }}>Open Disputes</div>
                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Arbitration Queue</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className={`pill-badge ${actionCenter?.pendingDisputes?.count > 0 ? 'review' : 'clean'}`}>
                {actionCenter?.pendingDisputes?.count || 0} Open
              </span>
              <ArrowRight size={14} color="#94a3b8" />
            </div>
          </div>

          {/* Payout Withdrawals */}
          <div 
            onClick={() => navigate('/admin/dashboard/payouts')}
            style={{ 
              background: '#ffffff', 
              padding: '0.85rem 1rem', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
            className="action-card-hover"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ padding: '0.45rem', borderRadius: '6px', background: '#f0fdf4', color: '#15803d' }}>
                <Building2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a' }}>Payout Requests</div>
                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Bank Withdrawals</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className={`pill-badge ${actionCenter?.pendingPayouts?.count > 0 ? 'review' : 'clean'}`}>
                {actionCenter?.pendingPayouts?.count || 0} Pending
              </span>
              <ArrowRight size={14} color="#94a3b8" />
            </div>
          </div>

          {/* High-Risk Accounts */}
          <div 
            onClick={() => navigate('/admin/dashboard/trust-fraud')}
            style={{ 
              background: '#ffffff', 
              padding: '0.85rem 1rem', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
            className="action-card-hover"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ padding: '0.45rem', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c' }}>
                <ShieldAlert size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a' }}>Trust & Fraud</div>
                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>High-Risk Flags</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className={`pill-badge ${actionCenter?.highRiskAccounts?.count > 0 ? 'blocked' : 'clean'}`}>
                {actionCenter?.highRiskAccounts?.count || 0} Flagged
              </span>
              <ArrowRight size={14} color="#94a3b8" />
            </div>
          </div>

        </div>
      </div>

      {/* 4. Platform Trends & Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1rem' }}>
        
        {/* Chart 1: Revenue & GMV Trajectory */}
        <div className="min-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700, color: '#0f172a' }}>
              Financial Volume & Platform Revenue
            </h3>
            <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Live MongoDB Aggregation</span>
          </div>
          
          <div style={{ width: '100%', height: 230, minHeight: 230 }}>
            <ResponsiveContainer width="100%" height={230} minWidth={0} minHeight={230}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip content={<CustomFinancialTooltip />} />
                <Area type="monotone" name="GMV (Volume)" dataKey="volume" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorVol)" />
                <Area type="monotone" name="Platform Revenue" dataKey="revenue" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, backgroundColor: '#4f46e5', borderRadius: 2 }}></span> GMV Contract Volume
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, backgroundColor: '#16a34a', borderRadius: 2 }}></span> Platform Revenue (10%)
            </span>
          </div>
        </div>

        {/* Chart 2: Platform Activity & User Growth */}
        <div className="min-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700, color: '#0f172a' }}>
              Marketplace Activity & User Registrations
            </h3>
            <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Registrations & Projects</span>
          </div>

          <div style={{ width: '100%', height: 230, minHeight: 230 }}>
            <ResponsiveContainer width="100%" height={230} minWidth={0} minHeight={230}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomFinancialTooltip />} />
                <Bar name="New Users" dataKey="users" fill="#1a73e8" radius={[4, 4, 0, 0]} />
                <Bar name="Projects Posted" dataKey="projects" fill="#0891b2" radius={[4, 4, 0, 0]} />
                <Bar name="Contracts Created" dataKey="contracts" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, backgroundColor: '#1a73e8', borderRadius: 2 }}></span> New Users
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, backgroundColor: '#0891b2', borderRadius: 2 }}></span> Projects Posted
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, backgroundColor: '#f59e0b', borderRadius: 2 }}></span> Contracts
            </span>
          </div>
        </div>

      </div>

      {/* 5. Marketplace Activity & Platform Streams */}
      <div className="min-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="#1a73e8" />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
              Recent Platform Activity & Event Logs
            </h3>
          </div>

          {/* Activity Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: '8px' }}>
            <button 
              onClick={() => setActiveTab('projects')}
              style={{
                border: 'none',
                background: activeTab === 'projects' ? '#ffffff' : 'transparent',
                color: activeTab === 'projects' ? '#1a73e8' : '#64748b',
                fontWeight: activeTab === 'projects' ? 700 : 500,
                fontSize: '0.75rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'projects' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Projects ({recentActivity?.projects?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              style={{
                border: 'none',
                background: activeTab === 'users' ? '#ffffff' : 'transparent',
                color: activeTab === 'users' ? '#1a73e8' : '#64748b',
                fontWeight: activeTab === 'users' ? 700 : 500,
                fontSize: '0.75rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'users' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Users ({recentActivity?.users?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('transactions')}
              style={{
                border: 'none',
                background: activeTab === 'transactions' ? '#ffffff' : 'transparent',
                color: activeTab === 'transactions' ? '#1a73e8' : '#64748b',
                fontWeight: activeTab === 'transactions' ? 700 : 500,
                fontSize: '0.75rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'transactions' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Transactions ({recentActivity?.transactions?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('disputes')}
              style={{
                border: 'none',
                background: activeTab === 'disputes' ? '#ffffff' : 'transparent',
                color: activeTab === 'disputes' ? '#1a73e8' : '#64748b',
                fontWeight: activeTab === 'disputes' ? 700 : 500,
                fontSize: '0.75rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'disputes' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Disputes ({recentActivity?.disputes?.length || 0})
            </button>
          </div>
        </div>

        {/* Tab Content: Projects */}
        {activeTab === 'projects' && (
          <div className="min-table-container">
            <table className="min-table">
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Client</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity?.projects && recentActivity.projects.length > 0 ? (
                  recentActivity.projects.map((proj) => (
                    <tr key={proj.id}>
                      <td style={{ fontWeight: 600 }}>{proj.title}</td>
                      <td style={{ color: '#64748b' }}>{proj.clientName}</td>
                      <td style={{ fontWeight: 700, color: '#15803d' }}>{formatINR(proj.budget || 0)}</td>
                      <td>
                        <span className={`pill-badge ${proj.status === 'Completed' ? 'active' : 'pending'}`}>
                          {proj.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {new Date(proj.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Link to="/admin/dashboard/listings" className="min-btn" style={{ textDecoration: 'none', fontSize: '0.7rem' }}>
                          Moderate
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      No recent projects recorded in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content: Users */}
        {activeTab === 'users' && (
          <div className="min-table-container">
            <table className="min-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>KYC Status</th>
                  <th>Joined Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity?.users && recentActivity.users.length > 0 ? (
                  recentActivity.users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ color: '#64748b' }}>{u.email}</td>
                      <td>
                        <span className={`pill-badge ${u.role === 'admin' ? 'blocked' : u.role === 'client' ? 'active' : 'clean'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`pill-badge ${u.kycStatus === 'Verified' ? 'verified' : 'review'}`}>
                          {u.kycStatus || 'Unverified'}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Link to="/admin/dashboard/users" className="min-btn" style={{ textDecoration: 'none', fontSize: '0.7rem' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      No recent users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content: Transactions */}
        {activeTab === 'transactions' && (
          <div className="min-table-container">
            <table className="min-table">
              <thead>
                <tr>
                  <th>User / Entity</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity?.transactions && recentActivity.transactions.length > 0 ? (
                  recentActivity.transactions.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.userName}</td>
                      <td>
                        <span className={`pill-badge ${t.type === 'deposit' ? 'active' : t.type === 'commission' ? 'verified' : 'review'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: t.type === 'withdrawal' ? '#dc2626' : '#15803d' }}>
                        {formatINR(t.amount || 0)}
                      </td>
                      <td>
                        <span className={`pill-badge ${t.status === 'completed' ? 'active' : 'review'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      No financial transaction records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content: Disputes */}
        {activeTab === 'disputes' && (
          <div className="min-table-container">
            <table className="min-table">
              <thead>
                <tr>
                  <th>Project / Case</th>
                  <th>Parties Involved</th>
                  <th>Disputed Amount</th>
                  <th>Status</th>
                  <th>Filed Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity?.disputes && recentActivity.disputes.length > 0 ? (
                  recentActivity.disputes.map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.projectTitle || `Dispute #${d.id.slice(-6)}`}</td>
                      <td style={{ color: '#64748b' }}>
                        {d.clientName || 'Client'} vs {d.freelancerName || 'Freelancer'}
                      </td>
                      <td style={{ fontWeight: 700, color: '#b45309' }}>
                        {formatINR(d.amount || 0)}
                      </td>
                      <td>
                        <span className={`pill-badge ${d.status === 'Resolved' ? 'active' : 'review'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Link to="/admin/dashboard/disputes" className="min-btn min-btn-primary" style={{ textDecoration: 'none', fontSize: '0.7rem' }}>
                          Arbitrate
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      No open or recent dispute records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* 6. Trust, Fraud & AI Executive Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        
        {/* Trust & Fraud Risk Breakdown */}
        <div className="min-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#1a73e8" />
              <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700, color: '#0f172a' }}>
                Trust & Fraud Risk Intelligence
              </h3>
            </div>
            <Link to="/admin/dashboard/trust-fraud" className="min-btn" style={{ textDecoration: 'none', fontSize: '0.725rem' }}>
              Manage →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ padding: '0.65rem', background: '#fee2e2', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#b91c1c' }}>{stats?.highRiskAccounts || 0}</div>
              <div style={{ fontSize: '0.675rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>High Risk</div>
            </div>
            <div style={{ padding: '0.65rem', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#b45309' }}>{stats?.mediumRiskAccounts || 0}</div>
              <div style={{ fontSize: '0.675rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>Medium Risk</div>
            </div>
            <div style={{ padding: '0.65rem', background: '#dcfce7', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d' }}>{stats?.lowRiskAccounts || 0}</div>
              <div style={{ fontSize: '0.675rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Low Risk</div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderTop: '1px solid #f1f5f9' }}>
            <span>Total AI-Audited Accounts:</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{stats?.totalTrustAudits || 0} Users</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
            <span>Pending Human Reviews:</span>
            <span style={{ fontWeight: 700, color: stats?.pendingTrustReviews > 0 ? '#b45309' : '#15803d' }}>
              {stats?.pendingTrustReviews || 0} Cases
            </span>
          </div>
        </div>

        {/* AI & Security System Telemetry */}
        <div className="min-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#7c3aed" />
              <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700, color: '#0f172a' }}>
                AI Infrastructure & Security
              </h3>
            </div>
            <Link to="/admin/dashboard/ai-security" className="min-btn" style={{ textDecoration: 'none', fontSize: '0.725rem' }}>
              Security Center →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <CheckCircle size={16} color="#15803d" />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>AI Recommendation</div>
                <div style={{ fontSize: '0.675rem', color: '#15803d' }}>{aiStatus?.recommendationEngine || 'Active'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <CheckCircle size={16} color="#15803d" />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>Trust & Risk Model</div>
                <div style={{ fontSize: '0.675rem', color: '#15803d' }}>{aiStatus?.trustFraudDetection || 'Active'}</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderTop: '1px solid #f1f5f9' }}>
            <span>Recommendation Telemetry:</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{stats?.totalRecommendationEvents || 0} Events Logged</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
            <span>Registered ML Models:</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>Skill v1.0 • Rec v1.0 • Trust v1.0 • Learn v1.0</span>
          </div>
        </div>

      </div>

    </div>
  );
}
