import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserCheck, MessageSquare, Briefcase,
  CheckCircle, Clock, Calendar, Star, MapPin,
  BarChart2, ChevronRight, Eye, TrendingUp,
  AlertCircle, X, CreditCard, Award
} from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { apiFetch } from '../../utils/api';
import { getCleanAvatar } from '../../utils/avatarUtils';
import FreelancerProfileModal from '../../components/FreelancerProfileModal';
import './HiredFreelancers.css';

const STATUS_COLORS = {
  'In Progress':           { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  'Submitted for Review':  { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  'Revision Requested':    { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  'Completed':             { bg: '#e0e7ff', text: '#3730a3', dot: '#6366f1' },
  'Cancelled':             { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
  'Active':                { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
};

const getStatusColor = (s) => STATUS_COLORS[s] || STATUS_COLORS['In Progress'];

const ProgressBar = ({ value }) => (
  <div style={{ background: '#e2e8f0', borderRadius: '99px', height: '7px', width: '100%', overflow: 'hidden' }}>
    <div style={{
      width: `${Math.min(value, 100)}%`,
      height: '100%',
      background: value >= 100 ? '#10b981' : 'linear-gradient(90deg,#1a73e8,#6366f1)',
      borderRadius: '99px',
      transition: 'width 0.6s ease'
    }} />
  </div>
);

const StarRating = ({ rating, numReviews }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    <Star size={13} fill="#f59e0b" color="#f59e0b" />
    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{Number(rating || 5).toFixed(1)}</span>
    {numReviews > 0 && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({numReviews})</span>}
  </div>
);

function FreelancerCard({ item, onViewProfile, onChat, onReview }) {
  const fl  = item.freelancer || {};
  const prj = item.project   || {};
  const sc  = getStatusColor(item.status);
  const skills = (fl.skills || []).slice(0, 4);

  const hiredDate = item.hiredAt
    ? new Date(item.hiredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '\u2014';

  return (
    <div className="hf-card">
      {/* Top: avatar + name + status */}
      <div className="hf-card-top">
        <img
          src={getCleanAvatar(fl.avatar, fl.name)}
          alt={fl.name}
          className="hf-avatar"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 className="hf-fl-name">{fl.name || 'Freelancer'}</h3>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: '30px',
              background: sc.bg, color: sc.text, whiteSpace: 'nowrap'
            }}>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: sc.dot, marginRight: 5 }} />
              {item.status || 'In Progress'}
            </span>
          </div>
          <p className="hf-fl-title">{fl.title || 'Freelancer'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
            <StarRating rating={fl.rating} numReviews={fl.numReviews} />
            {fl.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: '#64748b' }}>
                <MapPin size={11} /> {fl.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
          {skills.map((s, i) => (
            <span key={i} style={{
              fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
              background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0'
            }}>{s}</span>
          ))}
          {(fl.skills || []).length > 4 && (
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>+{fl.skills.length - 4} more</span>
          )}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: '1px', background: '#f1f5f9', margin: '14px 0' }} />

      {/* Project info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="hf-meta-row">
          <Briefcase size={13} color="#94a3b8" />
          <span className="hf-meta-label">Project:</span>
          <span className="hf-meta-value">{prj.title || '\u2014'}</span>
        </div>
        <div className="hf-meta-row">
          <Calendar size={13} color="#94a3b8" />
          <span className="hf-meta-label">Hired:</span>
          <span className="hf-meta-value">{hiredDate}</span>
        </div>
        {item.deadline && (
          <div className="hf-meta-row">
            <Clock size={13} color="#94a3b8" />
            <span className="hf-meta-label">Deadline:</span>
            <span className="hf-meta-value">{new Date(item.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        )}
        <div className="hf-meta-row">
          <CreditCard size={13} color="#94a3b8" />
          <span className="hf-meta-label">Budget:</span>
          <span className="hf-meta-value" style={{ fontWeight: 800, color: '#1a73e8' }}>{formatINR(item.amount || 0)}</span>
        </div>
        {item.amountPaid > 0 && (
          <div className="hf-meta-row">
            <Award size={13} color="#10b981" />
            <span className="hf-meta-label">Paid:</span>
            <span className="hf-meta-value" style={{ fontWeight: 700, color: '#10b981' }}>{formatINR(item.amountPaid)}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div style={{ marginTop: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <BarChart2 size={12} /> Progress
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1a73e8' }}>{item.progress || 0}%</span>
        </div>
        <ProgressBar value={item.progress || 0} />
        {item.milestones && item.milestones.length > 0 ? (
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
            {item.milestones.filter(m => m.status === 'Completed').length}/{item.milestones.length} milestones completed
          </p>
        ) : (
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>No milestones set yet</p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => onViewProfile(item)} className="hf-btn-secondary">
          <Eye size={13} /> View Profile
        </button>
        <button onClick={() => onChat(item)} className="hf-btn-primary">
          <MessageSquare size={13} /> Chat
        </button>
        <button onClick={() => onReview(item)} className="hf-btn-secondary" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', fontWeight: 700 }}>
          <Star size={13} fill="#f59e0b" color="#f59e0b" /> Review
        </button>
      </div>
    </div>
  );
}

export default function HiredFreelancers() {
  const navigate = useNavigate();
  const [hiredFreelancers, setHiredFreelancers] = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState(null);
  const [profileModal, setProfileModal]             = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => { fetchHiredContracts(); }, []);

  const fetchHiredContracts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/contracts/hired');
      setHiredFreelancers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching hired contracts:', err);
      setError('Failed to load hired freelancers. Please try again.');
      setHiredFreelancers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfile = (item) => {
    setProfileModal({
      ...item.freelancer,
      projectTitle: item.project?.title,
      bidAmount: item.amount,
      hiredAt: item.hiredAt,
      progress: item.progress,
      contractStatus: item.status,
    });
    setIsProfileModalOpen(true);
  };

  const handleChat = (item) => {
    navigate('/client/dashboard/chat', {
      state: {
        partnerId: item.freelancer?._id || item.freelancer?.id,
        name:      item.freelancer?.name,
        avatar:    item.freelancer?.avatar,
        title:     item.project?.title
      }
    });
  };

  const FILTER_TABS = ['All', 'In Progress', 'Submitted for Review', 'Completed', 'Cancelled'];

  const filtered = hiredFreelancers.filter(item => {
    const name  = (item.freelancer?.name  || '').toLowerCase();
    const title = (item.project?.title    || '').toLowerCase();
    const q     = searchQuery.toLowerCase();
    const matchSearch = !q || name.includes(q) || title.includes(q);
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const kpiActive    = hiredFreelancers.filter(c => c.status === 'In Progress' || c.status === 'Active').length;
  const kpiCompleted = hiredFreelancers.filter(c => c.status === 'Completed').length;
  const kpiTotalPaid = hiredFreelancers.reduce((s, c) => s + (c.amountPaid || 0), 0);

  return (
    <div className="hf-container">
      {/* Header */}
      <div className="hf-header">
        <div>
          <div className="hf-badge"><UserCheck size={13} /> Hired Freelancers</div>
          <h1 className="hf-title">Hired Freelancers &amp; Active Contracts</h1>
          <p className="hf-subtitle">Manage ongoing project contracts, track milestone progress, and communicate with your team.</p>
        </div>
        <button className="hf-cta-btn" onClick={() => navigate('/client/dashboard/proposals')}>
          View Received Proposals <ChevronRight size={15} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="hf-kpi-grid">
        <div className="hf-kpi-card">
          <div>
            <span className="hf-kpi-label">Total Hired</span>
            <div className="hf-kpi-value">{hiredFreelancers.length}</div>
          </div>
          <div className="hf-kpi-icon" style={{ background: '#e8f0fe', color: '#1a73e8' }}><UserCheck size={20} /></div>
        </div>
        <div className="hf-kpi-card">
          <div>
            <span className="hf-kpi-label">Active Contracts</span>
            <div className="hf-kpi-value">{kpiActive}</div>
          </div>
          <div className="hf-kpi-icon" style={{ background: '#dcfce7', color: '#10b981' }}><CheckCircle size={20} /></div>
        </div>
        <div className="hf-kpi-card">
          <div>
            <span className="hf-kpi-label">Completed</span>
            <div className="hf-kpi-value">{kpiCompleted}</div>
          </div>
          <div className="hf-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Briefcase size={20} /></div>
        </div>
        <div className="hf-kpi-card">
          <div>
            <span className="hf-kpi-label">Total Amount Paid</span>
            <div className="hf-kpi-value" style={{ fontSize: '1.2rem' }}>{formatINR(kpiTotalPaid)}</div>
          </div>
          <div className="hf-kpi-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}><TrendingUp size={20} /></div>
        </div>
      </div>

      {/* Search + Filter tabs */}
      <div className="hf-toolbar">
        <div className="hf-search-box">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by freelancer name or project..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="hf-search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
              <X size={15} />
            </button>
          )}
        </div>
        <div className="hf-filter-tabs">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`hf-filter-tab${statusFilter === tab ? ' active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="hf-loading">
          <div className="hf-spinner" />
          <p>Loading hired freelancers...</p>
        </div>
      ) : error ? (
        <div className="hf-empty">
          <AlertCircle size={48} color="#ef4444" />
          <h3>{error}</h3>
          <button className="hf-cta-btn" onClick={fetchHiredContracts}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="hf-empty">
          <UserCheck size={52} color="#1a73e8" style={{ marginBottom: '12px' }} />
          <h3>
            {hiredFreelancers.length === 0
              ? 'No Hired Freelancers Yet'
              : 'No results match your filters'}
          </h3>
          <p>
            {hiredFreelancers.length === 0
              ? 'When you accept a proposal and hire a freelancer, their contract details and milestone progress will appear here.'
              : 'Try adjusting your search or status filter.'}
          </p>
          {hiredFreelancers.length === 0 && (
            <button className="hf-cta-btn" onClick={() => navigate('/client/dashboard/proposals')}>
              Review Project Proposals
            </button>
          )}
        </div>
      ) : (
        <div className="hf-grid">
          {filtered.map(item => (
            <FreelancerCard
              key={item._id || item.id}
              item={item}
              onViewProfile={handleViewProfile}
              onChat={handleChat}
              onReview={() => navigate('/client/dashboard/reviews')}
            />
          ))}
        </div>
      )}

      {/* Freelancer Profile Modal */}
      <FreelancerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        freelancer={profileModal}
        onMessage={() => {
          setIsProfileModalOpen(false);
          if (profileModal) {
            navigate('/client/dashboard/chat', {
              state: {
                partnerId: profileModal._id || profileModal.id,
                name: profileModal.name,
                avatar: profileModal.avatar
              }
            });
          }
        }}
      />
    </div>
  );
}

