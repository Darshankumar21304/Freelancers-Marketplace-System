import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle, Clock, XCircle, Search, Filter,
  MoreVertical, Eye, MessageSquare, Edit2, Trash2, ShieldCheck, FileSearch, Check, X,
  FolderPlus
} from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { apiFetch } from '../../utils/api';
import './MyProposals.css';

const STATUS_COLORS = {
  Pending: { bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e', border: '#f59e0b' },
  Shortlisted: { bg: 'linear-gradient(135deg, #f3e8fd, #e9d5ff)', color: '#6b21a8', border: '#a142f4' },
  Accepted: { bg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', color: '#14532d', border: '#10b981' },
  Hired: { bg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', color: '#14532d', border: '#10b981' },
  Declined: { bg: 'linear-gradient(135deg, #fee2e2, #fecaca)', color: '#7f1d1d', border: '#ef4444' },
  Rejected: { bg: 'linear-gradient(135deg, #fee2e2, #fecaca)', color: '#7f1d1d', border: '#ef4444' }
};

const KPICard = ({ label, value, icon: Icon, gradient, iconColor }) => (
  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.3s, box-shadow 0.3s' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.07)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div>
      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>{label}</span>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{value}</div>
    </div>
    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
      <Icon size={22} />
    </div>
  </div>
);

export default function MyProposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [offers, setOffers] = useState([]);
  const [activeTab, setActiveTab] = useState('All Proposals');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubmittedProposals();
  }, []);

  const fetchSubmittedProposals = async () => {
    setIsLoading(true);
    try {
      const fetched = await apiFetch('/proposals/my-proposals').catch(() => []);
      if (Array.isArray(fetched)) {
        setProposals(fetched);
      } else {
        setProposals([]);
      }
    } catch (err) {
      console.error('Error fetching submitted proposals:', err);
      setProposals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProposals = proposals.filter(prop => {
    const matchesStatus = activeStatusFilter === 'All' || (prop.status || 'Pending').toLowerCase() === activeStatusFilter.toLowerCase();
    const title = prop.projectTitle || prop.project?.title || '';
    const client = prop.clientName || prop.client?.name || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || client.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusCount = (status) => {
    if (status === 'All') return proposals.length;
    return proposals.filter(p => (p.status || 'Pending').toLowerCase() === status.toLowerCase()).length;
  };

  const kpiData = [
    { label: 'Total Submitted', value: proposals.length, icon: FileText, gradient: 'linear-gradient(135deg, #e8f0fe, #c7d7fd)', iconColor: '#1a73e8' },
    { label: 'Pending Review', value: getStatusCount('Pending'), icon: Clock, gradient: 'linear-gradient(135deg, #fef3c7, #fde68a)', iconColor: '#d97706' },
    { label: 'Accepted & Hired', value: getStatusCount('Accepted'), icon: CheckCircle, gradient: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', iconColor: '#10b981' },
    { label: 'Shortlisted', value: getStatusCount('Shortlisted'), icon: FileSearch, gradient: 'linear-gradient(135deg, #f3e8fd, #e9d5ff)', iconColor: '#a142f4' }
  ];

  return (
    <div className="my-proposals-container" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>My Submitted Proposals</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Track bid statuses, client responses, and acceptance rates for all your proposals.</p>
        </div>

        <button
          onClick={() => navigate('/explore')}
          style={{ padding: '0.65rem 1.4rem', borderRadius: '40px', background: 'linear-gradient(135deg, #1a73e8, #a142f4)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(26,115,232,0.3)', whiteSpace: 'nowrap' }}
        >
          Browse Open Jobs
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpiData.map((k, i) => <KPICard key={i} {...k} />)}
      </div>

      {/* Filter Bar */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All', 'Pending', 'Shortlisted', 'Accepted', 'Declined'].map(st => (
            <button
              key={st}
              onClick={() => setActiveStatusFilter(st)}
              style={{
                padding: '7px 16px', borderRadius: '999px', border: '1px solid',
                borderColor: activeStatusFilter === st ? '#1a73e8' : '#e2e8f0',
                background: activeStatusFilter === st ? '#1a73e8' : '#f8fafc',
                color: activeStatusFilter === st ? '#fff' : '#64748b',
                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {st} <span style={{ opacity: 0.8 }}>({getStatusCount(st)})</span>
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #e2e8f0', borderRadius: '999px', fontSize: '0.85rem', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Empty / Loading / List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading proposals...</div>
      ) : filteredProposals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', border: '2px dashed #e2e8f0', borderRadius: '20px', color: '#64748b' }}>
          <FolderPlus size={48} color="#1a73e8" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontWeight: 800, fontSize: '1.15rem' }}>
            {searchQuery || activeStatusFilter !== 'All' ? 'No proposals match your filters' : 'No Submitted Proposals Yet'}
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.875rem', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Explore open client projects in the marketplace and submit your first proposal.
          </p>
          <button
            onClick={() => navigate('/explore')}
            style={{ padding: '0.65rem 1.4rem', borderRadius: '40px', background: '#1a73e8', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
          >
            Explore Gigs Marketplace
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredProposals.map(prop => {
            const status = prop.status || 'Pending';
            const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.Pending;

            return (
              <div key={prop._id || prop.id} style={{ background: '#fff', border: `1px solid ${statusStyle.border}22`, borderRadius: '16px', padding: '20px', transition: 'box-shadow 0.3s, transform 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        {prop.projectTitle || prop.project?.title || 'Project Proposal'}
                      </h4>
                      <span style={{
                        padding: '3px 12px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                        background: statusStyle.bg, color: statusStyle.color
                      }}>
                        {status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        Client: <strong style={{ color: '#0f172a' }}>{prop.clientName || prop.client?.companyName || prop.client?.name || 'Client'}</strong>
                      </span>
                      {prop.deliveryTime && (
                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          Delivery: <strong style={{ color: '#0f172a' }}>{prop.deliveryTime}</strong>
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {prop.createdAt ? new Date(prop.createdAt).toLocaleDateString('en-IN') : ''}
                      </span>
                    </div>
                    {prop.coverLetter && (
                      <p style={{ margin: '10px 0 0', fontSize: '0.83rem', color: '#475569', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {prop.coverLetter}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10b981' }}>{formatINR(prop.bidAmount || 0)}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Bid Amount</div>
                    </div>
                    <button
                      onClick={() => {
                        const targetId = prop.client_id?._id || prop.client_id || prop.client?.id;
                        navigate('/freelancer/dashboard/chat', {
                          state: {
                            partnerId: targetId,
                            name: prop.clientName || prop.client?.name || prop.client?.companyName || 'Client Partner',
                            avatar: prop.client?.avatar || prop.client?.profilePhoto,
                            title: prop.projectTitle || prop.project_title
                          }
                        });
                      }}
                      style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '30px', background: '#e8f0fe', color: '#1a73e8', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      <MessageSquare size={14} /> Send Message
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
