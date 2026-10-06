import React, { useState, useEffect } from 'react';
import {
  Star, MessageSquare, ShieldCheck, Award, TrendingUp, ThumbsUp, Search, Plus
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import './Reviews.css';

const StarRow = ({ rating, size = 16 }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[...Array(5)].map((_, i) => (
      <Star key={i} size={size} fill={i < rating ? '#f59e0b' : '#e2e8f0'} color={i < rating ? '#f59e0b' : '#e2e8f0'} />
    ))}
  </div>
);

export default function Reviews() {
  const [directionTab, setDirectionTab] = useState('received'); // 'received' | 'given'
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [givenReviews, setGivenReviews] = useState([]);
  
  const [activeRatingFilter, setActiveRatingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Review Client Modal state
  const [showModal, setShowModal] = useState(false);
  const [activeContracts, setActiveContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const fetchAllReviews = async () => {
    setIsLoading(true);
    try {
      const [receivedData, givenData] = await Promise.all([
        apiFetch('/reviews?type=received').catch(() => []),
        apiFetch('/reviews?type=given').catch(() => [])
      ]);
      setReceivedReviews(Array.isArray(receivedData) ? receivedData : []);
      setGivenReviews(Array.isArray(givenData) ? givenData : []);
    } catch (err) {
      console.error('Error fetching freelancer reviews:', err);
      setReceivedReviews([]);
      setGivenReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openReviewModal = async () => {
    setShowModal(true);
    setRating(5);
    setComment('');
    setSelectedContractId('');
    setLoadingContracts(true);
    try {
      const contracts = await apiFetch('/contracts/active').catch(() => []);
      setActiveContracts(Array.isArray(contracts) ? contracts : []);
    } catch (err) {
      console.error('Error loading contracts for review:', err);
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !selectedContractId) return;

    setSubmitting(true);
    try {
      const selectedContract = activeContracts.find(c => c._id === selectedContractId || c.id === selectedContractId);
      const res = await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          contractId: selectedContractId,
          clientId: selectedContract?.client_id?._id || selectedContract?.client_id || selectedContract?.client?.id,
          projectTitle: selectedContract?.title || selectedContract?.project?.title,
          rating,
          comment: comment.trim()
        })
      });

      setMsg(res.message || 'Review for client submitted successfully!');
      setTimeout(() => setMsg(null), 4000);
      setShowModal(false);
      fetchAllReviews();
    } catch (err) {
      alert(err.message || 'Failed to submit review for client');
    } finally {
      setSubmitting(false);
    }
  };

  const currentList = directionTab === 'received' ? receivedReviews : givenReviews;
  const totalReviews = currentList.length;
  const avgRating = totalReviews > 0
    ? (currentList.reduce((acc, r) => acc + r.rating, 0) / totalReviews)
    : 0;

  const satisfactionScore = totalReviews > 0
    ? Math.round((currentList.filter(r => r.rating >= 4).length / totalReviews) * 100)
    : 0;

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: currentList.filter(r => r.rating === star).length,
    pct: totalReviews > 0 ? Math.round((currentList.filter(r => r.rating === star).length / totalReviews) * 100) : 0
  }));

  const filteredReviews = currentList.filter(rev => {
    const matchRating = activeRatingFilter === 'all' || rev.rating === parseInt(activeRatingFilter);
    const targetUser = directionTab === 'received' ? rev.reviewer_id : (rev.client_id || rev.reviewee_id);
    const userName = targetUser?.companyName || targetUser?.name ||
      `${targetUser?.firstName || ''} ${targetUser?.lastName || ''}`.trim() || '';
    const matchSearch = !searchQuery || userName.toLowerCase().includes(searchQuery.toLowerCase())
      || (rev.comment || '').toLowerCase().includes(searchQuery.toLowerCase())
      || (rev.projectTitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchRating && matchSearch;
  });

  const kpiCardStyle = {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px',
    padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    transition: 'transform 0.3s, box-shadow 0.3s'
  };

  const iconCircle = (bg, color) => ({
    width: '48px', height: '48px', borderRadius: '50%',
    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color
  });

  return (
    <div className="reviews-container" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
            Reviews &amp; Client Feedback
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Authentic client ratings, performance reviews, and feedback submitted for your contracts.
          </p>
        </div>

        <button
          onClick={openReviewModal}
          style={{ padding: '0.65rem 1.4rem', borderRadius: '40px', background: 'linear-gradient(135deg, #1a73e8, #059669)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(26,115,232,0.25)' }}
        >
          <Plus size={18} /> Write Review for Client
        </button>
      </div>

      {/* Direction Switcher Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveRatingFilter('all') || setDirectionTab('received')}
          style={{
            padding: '10px 22px', borderRadius: '30px', fontWeight: 800, fontSize: '0.88rem', border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
            background: directionTab === 'received' ? '#1a73e8' : '#fff',
            color: directionTab === 'received' ? '#fff' : '#64748b',
            borderColor: directionTab === 'received' ? '#1a73e8' : '#e2e8f0'
          }}
        >
          Reviews Received from Clients ({receivedReviews.length})
        </button>
        <button
          onClick={() => setActiveRatingFilter('all') || setDirectionTab('given')}
          style={{
            padding: '10px 22px', borderRadius: '30px', fontWeight: 800, fontSize: '0.88rem', border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
            background: directionTab === 'given' ? '#1a73e8' : '#fff',
            color: directionTab === 'given' ? '#fff' : '#64748b',
            borderColor: directionTab === 'given' ? '#1a73e8' : '#e2e8f0'
          }}
        >
          Reviews Given to Clients ({givenReviews.length})
        </button>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={kpiCardStyle}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Overall Rating</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {totalReviews > 0 ? avgRating.toFixed(1) : '—'}
              {totalReviews > 0 && <Star size={20} fill="#f59e0b" color="#f59e0b" />}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
              {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </div>
          </div>
          <div style={iconCircle('linear-gradient(135deg, #fef3c7, #fde68a)', '#d97706')}>
            <Award size={22} />
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Total Reviews</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{totalReviews}</div>
          </div>
          <div style={iconCircle('linear-gradient(135deg, #e8f0fe, #c7d7fd)', '#1a73e8')}>
            <MessageSquare size={22} />
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Satisfaction Score</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: satisfactionScore >= 80 ? '#10b981' : satisfactionScore >= 60 ? '#f59e0b' : '#ef4444', marginTop: '4px' }}>
              {totalReviews > 0 ? `${satisfactionScore}%` : '—'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>4+ star reviews</div>
          </div>
          <div style={iconCircle('linear-gradient(135deg, #dcfce7, #bbf7d0)', '#10b981')}>
            <ThumbsUp size={22} />
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>5-Star Reviews</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
              {ratingBreakdown.find(r => r.star === 5)?.count || 0}
            </div>
          </div>
          <div style={iconCircle('linear-gradient(135deg, #f3e8fd, #e9d5ff)', '#a142f4')}>
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by client or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '999px', border: '1px solid #e2e8f0', fontSize: '0.875rem', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', '5', '4', '3', '2', '1'].map(f => (
            <button key={f} onClick={() => setActiveRatingFilter(f)} style={{
              padding: '7px 14px', borderRadius: '999px', border: '1px solid',
              borderColor: activeRatingFilter === f ? '#1a73e8' : '#e2e8f0',
              background: activeRatingFilter === f ? '#1a73e8' : '#f8fafc',
              color: activeRatingFilter === f ? '#fff' : '#64748b',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}>
              {f === 'all' ? 'All' : `${f}★`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading reviews...</div>
      ) : filteredReviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', border: '2px dashed #e2e8f0', borderRadius: '20px', color: '#64748b' }}>
          <Star size={48} color="#f59e0b" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontWeight: 800, fontSize: '1.15rem' }}>
            {searchQuery || activeRatingFilter !== 'all' ? 'No reviews match your filters' : (directionTab === 'received' ? 'No Client Reviews Received Yet' : 'No Reviews Given to Clients Yet')}
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            {directionTab === 'received'
              ? 'When clients submit feedback for completed contracts, their reviews will appear here.'
              : 'You can review clients for completed or ongoing contracts directly using the button above.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredReviews.map(rev => {
            const partnerUser = directionTab === 'received' ? rev.reviewer_id : (rev.client_id || rev.reviewee_id);
            const clientName = partnerUser?.companyName || partnerUser?.name ||
              `${partnerUser?.firstName || ''} ${partnerUser?.lastName || ''}`.trim() || 'Client Partner';
            const avatar = partnerUser?.avatar
              ? (partnerUser.avatar.startsWith('http') ? partnerUser.avatar : `http://localhost:5001${partnerUser.avatar}`)
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=1a73e8&color=fff`;

            return (
              <div key={rev._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', transition: 'box-shadow 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={avatar} alt={clientName} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
                    <div>
                      <h4 style={{ margin: '0 0 2px', fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{clientName}</h4>
                      {rev.projectTitle && (
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#1a73e8', fontWeight: 600 }}>
                          Project: {rev.projectTitle}
                        </p>
                      )}
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <StarRow rating={rev.rating} />
                </div>

                {(rev.comment || rev.text) && (
                  <p style={{ margin: '14px 0 0', fontSize: '0.9rem', color: '#475569', lineHeight: 1.7, fontStyle: 'italic', borderLeft: '3px solid #e2e8f0', paddingLeft: '16px' }}>
                    "{rev.comment || rev.text}"
                  </p>
                )}

                {rev.response?.text && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.825rem' }}>
                    <span style={{ fontWeight: 800, color: '#1a73e8', display: 'block', marginBottom: '2px' }}>Response:</span>
                    <p style={{ margin: 0, color: '#334155', fontStyle: 'normal' }}>{rev.response.text}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Review for Client Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '500px', width: '100%', padding: '1.75rem', color: '#0f172a', margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justify: 'center' }}>
                  <Star size={20} color="#059669" fill="#10b981" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Review Client Partner</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Rate client communication &amp; payment experience</span>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justify: 'center', color: '#64748b', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Select Contract / Client *</label>
                {loadingContracts ? (
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#64748b' }}>Loading active contracts...</div>
                ) : activeContracts.length === 0 ? (
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#ef4444' }}>No active contracts found to review.</div>
                ) : (
                  <select 
                    value={selectedContractId} 
                    onChange={(e) => setSelectedContractId(e.target.value)} 
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', background: '#fff' }}
                    required
                  >
                    <option value="">— Select active contract —</option>
                    {activeContracts.map(c => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.client?.name || c.client_id?.name || 'Client'} — {c.title || c.project?.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Rating (1 to 5 Stars) *</label>
                <div style={{ display: 'flex', gap: '6px', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star 
                      key={s} 
                      size={28} 
                      onClick={() => setRating(s)} 
                      fill={s <= rating ? "#f59e0b" : "none"} 
                      color={s <= rating ? "#f59e0b" : "#cbd5e1"} 
                      style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
                    />
                  ))}
                  <span style={{ marginLeft: '10px', fontSize: '1rem', fontWeight: 800, color: '#0f172a', alignSelf: 'center' }}>{rating} / 5</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Client Feedback &amp; Experience *</label>
                <textarea 
                  rows={4} 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)} 
                  placeholder="Share details about client clarity, response time, milestone approvals, and overall working relationship..."
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '40px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting || !selectedContractId} style={{ padding: '0.65rem 1.5rem', borderRadius: '40px', background: '#10b981', border: '1px solid #10b981', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', opacity: (!selectedContractId || submitting) ? 0.6 : 1 }}>
                  {submitting ? 'Submitting...' : 'Submit Client Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
