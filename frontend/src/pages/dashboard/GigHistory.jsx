import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, CheckCircle, Star, Briefcase, Search, Filter, 
  DollarSign, TrendingUp, Calendar, ArrowUpRight, Award, ShieldCheck
} from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { apiFetch } from '../../utils/api';
import { getCleanAvatar } from '../../utils/avatarUtils';
import './GigHistory.css';

export default function GigHistory() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGigHistory();
  }, []);

  const fetchGigHistory = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch real contracts for freelancer
      const fetchedContracts = await apiFetch('/contracts/my-contracts').catch(() => []);
      const fetchedReviews = await apiFetch('/reviews').catch(() => []);

      let historyItems = [];
      if (Array.isArray(fetchedContracts) && fetchedContracts.length > 0) {
        historyItems = fetchedContracts.map(c => {
          const clientObj = c.client_id || c.client || {};
          const projectObj = c.project_id || c.project || {};
          const clientName = clientObj.name || c.clientName || 'Client Partner';
          const projTitle = projectObj.title || c.title || 'Marketplace Gig & Project';

          // Match real review if client reviewed this project
          const realReview = Array.isArray(fetchedReviews) ? fetchedReviews.find(r => 
            (r.project_id && String(r.project_id._id || r.project_id) === String(projectObj._id || projectObj)) ||
            (r.reviewer_id && String(r.reviewer_id._id || r.reviewer_id) === String(clientObj._id || clientObj))
          ) : null;

          const milestones = Array.isArray(c.milestones) ? c.milestones : [];
          const milestonesEarned = milestones.filter(m => m.status === 'Completed').reduce((sum, m) => sum + (m.amount || 0), 0);
          const isCompleted = c.status === 'Completed' || (milestones.length > 0 && milestones.every(m => m.status === 'Completed'));
          const earnedAmount = (typeof c.amountEarned === 'number' && c.amountEarned > 0)
            ? c.amountEarned
            : (c.amountPaid || c.totalValue || c.totalBudget || c.amount || milestonesEarned || 0);

          return {
            _id: c._id || c.id,
            title: projTitle,
            clientName: clientName,
            clientAvatar: getCleanAvatar(clientObj.avatar || clientObj.profilePhoto, clientName),
            amount: earnedAmount,
            status: isCompleted ? 'Completed' : (c.status || 'In Progress'),
            rating: realReview ? realReview.rating : (c.rating || null),
            review: realReview ? realReview.comment : (c.reviewText || null),
            completedDate: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('en-IN') : 'Recent'
          };
        });
      }

      setContracts(historyItems);
    } catch (err) {
      console.error('Error loading gig history:', err);
      setContracts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = contracts.filter(item => {
    const matchesFilter = activeFilter === 'All' || item.status.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const completedContracts = contracts.filter(c => c.status === 'Completed' || c.amount > 0);
  const totalCompleted = completedContracts.length;
  const totalEarnings = contracts.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const itemsWithRatings = contracts.filter(c => typeof c.rating === 'number' && c.rating > 0);
  const avgRating = itemsWithRatings.length > 0 
    ? (itemsWithRatings.reduce((acc, c) => acc + c.rating, 0) / itemsWithRatings.length).toFixed(1)
    : '—';

  return (
    <div className="gig-history-container" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="gh-header">
        <div>
          <h1 className="gh-title">Gig History & Completed Works</h1>
          <p className="gh-subtitle">Track your milestone history, client reviews, and earnings timeline.</p>
        </div>

        <button 
          onClick={() => navigate('/freelancer/dashboard/active-projects')}
          className="gh-btn-primary"
        >
          View Active Workspaces
        </button>
      </div>

      {/* Stats Summary */}
      <div className="gh-stats-grid">
        <div className="gh-stat-card">
          <div className="gh-stat-icon green">
            <CheckCircle size={22} />
          </div>
          <div>
            <span className="gh-stat-label">Total Completed Gigs</span>
            <div className="gh-stat-value">{totalCompleted}</div>
          </div>
        </div>

        <div className="gh-stat-card">
          <div className="gh-stat-icon blue">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="gh-stat-label">Total Earned</span>
            <div className="gh-stat-value">{formatINR(totalEarnings)}</div>
          </div>
        </div>

        <div className="gh-stat-card">
          <div className="gh-stat-icon amber">
            <Star size={22} />
          </div>
          <div>
            <span className="gh-stat-label">Average Client Rating</span>
            <div className="gh-stat-value">{avgRating !== '—' ? `${avgRating} / 5.0` : 'No Reviews Yet'}</div>
          </div>
        </div>

        <div className="gh-stat-card">
          <div className="gh-stat-icon purple">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="gh-stat-label">Active Gigs</span>
            <div className="gh-stat-value">{contracts.length - totalCompleted}</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="gh-filter-bar">
        <div className="gh-filter-tabs">
          {['All', 'Completed', 'In Progress'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`gh-filter-btn ${activeFilter === f ? 'active' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="gh-search-wrapper">
          <Search size={15} className="gh-search-icon" />
          <input 
            type="text"
            placeholder="Search gig title or client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="gh-search-input"
          />
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading gig history...</div>
      ) : filteredItems.length === 0 ? (
        <div className="gh-empty-box">
          <Clock size={48} color="#1a73e8" style={{ marginBottom: '12px' }} />
          <h3>No Gig History Found</h3>
          <p>Complete project milestones with clients to build your gig history timeline.</p>
        </div>
      ) : (
        <div className="gh-history-list">
          {filteredItems.map(item => (
            <div key={item._id} className="gh-item-card">
              <div className="gh-card-top">
                <div className="gh-client-info">
                  <img src={item.clientAvatar} alt={item.clientName} className="gh-client-avatar" />
                  <div>
                    <h3 className="gh-gig-title">{item.title}</h3>
                    <span className="gh-client-name">Client: <strong>{item.clientName}</strong></span>
                  </div>
                </div>

                <div className="gh-price-tag">
                  {formatINR(item.amount)}
                </div>
              </div>

              {item.review ? (
                <div className="gh-review-box">
                  <div className="gh-stars-row">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < (item.rating || 5) ? '#f59e0b' : '#e2e8f0'} color={i < (item.rating || 5) ? '#f59e0b' : '#e2e8f0'} />
                    ))}
                    <span className="gh-review-date">• {item.completedDate}</span>
                  </div>
                  <p className="gh-review-text">"{item.review}"</p>
                </div>
              ) : null}

              <div className="gh-card-footer">
                <span className={`gh-badge ${item.status === 'Completed' ? 'completed' : 'in-progress'}`}>
                  <CheckCircle size={13} /> {item.status}
                </span>

                <button 
                  onClick={() => navigate('/freelancer/dashboard/wallet')}
                  className="gh-btn-link"
                >
                  View Earnings Receipt <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
