import React, { useState, useEffect } from 'react';
import { 
  Star, MessageCircle, Search, Shield,
  ChevronLeft, ChevronRight, MessageSquare, ThumbsUp, Award, UserCheck
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import './Reviews.css';

export default function ClientReviews() {
  const [directionTab, setDirectionTab] = useState('given'); // 'given' | 'received'
  const [givenReviews, setGivenReviews] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  
  const [activeTab, setActiveTab] = useState('All Reviews');
  const [sortOption, setSortOption] = useState('Newest');
  const [isLoading, setIsLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  
  // Submit Review Modal state
  const [showModal, setShowModal] = useState(false);
  const [hiredContracts, setHiredContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  const tabs = ['All Reviews', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];

  const parseReview = (rev) => {
    const isGiven = directionTab === 'given';
    const targetUser = isGiven ? (rev.freelancer_id || rev.reviewee_id) : rev.reviewer_id;
    const name = targetUser?.name || `${targetUser?.firstName || ''} ${targetUser?.lastName || ''}`.trim() || targetUser?.companyName || 'User Specialist';
    const avatar = targetUser?.avatar ? (targetUser.avatar.startsWith('http') ? targetUser.avatar : `http://localhost:5001${targetUser.avatar}`) : '';
    const role = targetUser?.title || targetUser?.role || 'Marketplace Member';

    return {
      id: rev._id || rev.id,
      userName: name,
      userAvatar: avatar,
      role: role,
      rating: rev.rating,
      date: rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
      timestamp: rev.createdAt ? new Date(rev.createdAt).getTime() : Date.now(),
      projectTitle: rev.projectTitle || 'Project Delivery',
      text: rev.comment || rev.text || '',
      response: rev.response,
      status: 'Published'
    };
  };

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const fetchAllReviews = async () => {
    setIsLoading(true);
    try {
      const [givenData, receivedData] = await Promise.all([
        apiFetch('/reviews?type=given').catch(() => []),
        apiFetch('/reviews?type=received').catch(() => [])
      ]);
      setGivenReviews(Array.isArray(givenData) ? givenData : []);
      setReceivedReviews(Array.isArray(receivedData) ? receivedData : []);
    } catch (error) {
      console.error('Error fetching client reviews:', error);
      setGivenReviews([]);
      setReceivedReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openSubmitModal = async () => {
    setShowModal(true);
    setRating(5);
    setComment('');
    setSelectedContractId('');
    setLoadingContracts(true);
    try {
      const data = await apiFetch('/contracts/hired').catch(() => []);
      setHiredContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching hired contracts for review:', err);
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !selectedContractId) return;

    setSubmitting(true);
    try {
      const selectedObj = hiredContracts.find(c => c._id === selectedContractId || c.id === selectedContractId);
      const res = await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          contractId: selectedContractId,
          freelancerId: selectedObj?.freelancer?._id || selectedObj?.freelancer?.id,
          projectTitle: selectedObj?.project?.title || selectedObj?.title,
          rating,
          comment: comment.trim()
        })
      });

      setMsg(res.message || 'Review submitted successfully for freelancer!');
      setTimeout(() => setMsg(null), 4000);
      setShowModal(false);
      fetchAllReviews();
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const currentList = (directionTab === 'given' ? givenReviews : receivedReviews).map(parseReview);
  const totalReviews = currentList.length;
  const overallRating = totalReviews > 0 ? (currentList.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1) : '0.0';
  
  const distribution = {
    5: currentList.filter(r => r.rating === 5).length,
    4: currentList.filter(r => r.rating === 4).length,
    3: currentList.filter(r => r.rating === 3).length,
    2: currentList.filter(r => r.rating === 2).length,
    1: currentList.filter(r => r.rating === 1).length,
  };

  const filteredReviews = currentList.filter(r => {
    if (activeTab === 'All Reviews') return true;
    return r.rating === parseInt(activeTab.charAt(0));
  }).sort((a, b) => {
    if (sortOption === 'Highest Rated') return b.rating - a.rating;
    if (sortOption === 'Lowest Rated') return a.rating - b.rating;
    if (sortOption === 'Oldest') return (a.timestamp || 0) - (b.timestamp || 0);
    return (b.timestamp || 0) - (a.timestamp || 0); // Newest
  });

  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage) || 1;
  const displayedReviews = filteredReviews.slice((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage);

  const StarVisualizer = ({ rating }) => (
    <div className="stars-small">
      {[1, 2, 3, 4, 5].map(star => (
        <Star key={star} size={14} fill={star <= rating ? "#f59e0b" : "none"} stroke={star <= rating ? "none" : "#cbd5e1"} />
      ))}
    </div>
  );

  return (
    <div className="gigsphere-freelancer-reviews">
      <div className="reviews-container">
        
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="breadcrumb">Dashboard / Reviews</div>
            <h1 className="page-title">Client Reviews &amp; Feedback</h1>
            <p className="page-desc">Manage reviews you've given to hired freelancers and feedback received from talent.</p>
          </div>

          <button onClick={openSubmitModal} style={{ padding: '0.65rem 1.4rem', borderRadius: '40px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={18} fill="#f59e0b" color="#f59e0b" /> Review Hired Freelancer
          </button>
        </div>

        {/* Direction Switcher Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => { setDirectionTab('given'); setCurrentPage(1); }}
            style={{
              padding: '10px 22px', borderRadius: '30px', fontWeight: 800, fontSize: '0.88rem', border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
              background: directionTab === 'given' ? '#1a73e8' : '#fff',
              color: directionTab === 'given' ? '#fff' : '#64748b',
              borderColor: directionTab === 'given' ? '#1a73e8' : '#e2e8f0'
            }}
          >
            Reviews Given to Freelancers ({givenReviews.length})
          </button>
          <button
            onClick={() => { setDirectionTab('received'); setCurrentPage(1); }}
            style={{
              padding: '10px 22px', borderRadius: '30px', fontWeight: 800, fontSize: '0.88rem', border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
              background: directionTab === 'received' ? '#1a73e8' : '#fff',
              color: directionTab === 'received' ? '#fff' : '#64748b',
              borderColor: directionTab === 'received' ? '#1a73e8' : '#e2e8f0'
            }}
          >
            Reviews Received from Freelancers ({receivedReviews.length})
          </button>
        </div>

        {msg && (
          <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
            {msg}
          </div>
        )}

        <div className="dashboard-content">
          
          {/* Sidebar Section */}
          <div className="sidebar-section">
            
            {/* Rating Summary Card */}
            <div className="card">
              <div className="summary-header">
                <div className="overall-rating">
                  {overallRating} <span className="overall-max">/ 5</span>
                </div>
                <div className="stars-large">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={24} fill={star <= Math.round(overallRating) ? "#f59e0b" : "none"} stroke={star <= Math.round(overallRating) ? "#f59e0b" : "#cbd5e1"} />
                  ))}
                </div>
                <div className="total-reviews">{totalReviews} Reviews {directionTab === 'given' ? 'Submitted' : 'Received'}</div>
              </div>

              <div className="distribution-list">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = distribution[stars];
                  const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={stars} className="dist-row">
                      <div className="dist-label">{stars} Stars</div>
                      <div className="dist-bar-container">
                        <div className="dist-bar-fill" style={{width: `${percent}%`}}></div>
                      </div>
                      <div className="dist-count">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>

          {/* Main Section */}
          <div className="main-section">
            
            {/* Filters */}
            <div className="filters-container">
              <div className="tabs-container">
                {tabs.map(tab => (
                  <button 
                    key={tab}
                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <select 
                className="custom-select"
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
              >
                <option>Newest</option>
                <option>Oldest</option>
                <option>Highest Rated</option>
                <option>Lowest Rated</option>
              </select>
            </div>

            {/* Reviews List */}
            <div className="reviews-list">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card">
                    <div className="skeleton" style={{width: '200px', height: '48px', marginBottom: '16px'}}></div>
                    <div className="skeleton" style={{width: '100%', height: '80px', marginBottom: '12px'}}></div>
                    <div className="skeleton" style={{width: '60%', height: '24px'}}></div>
                  </div>
                ))
              ) : displayedReviews.length > 0 ? (
                displayedReviews.map(review => (
                  <div key={review.id} className="card review-card">
                    
                    <div className="review-header">
                      <div className="client-info">
                        <img src={review.userAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.userName) + '&background=1a73e8&color=fff'} alt={review.userName} className="client-avatar" />
                        <div className="client-name-group">
                          <h3 className="client-name">
                            {review.userName}
                          </h3>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{review.role}</span>
                          <div className="review-meta">
                            <StarVisualizer rating={review.rating} />
                            <span className="review-date">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="skill-chip" style={{ backgroundColor: '#10b981', color: 'white' }}>{review.status}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="project-title">{review.projectTitle}</h4>
                      <p className="review-text">{review.text}</p>
                    </div>

                    {review.response?.text && (
                      <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.825rem' }}>
                        <span style={{ fontWeight: 800, color: '#1a73e8', display: 'block', marginBottom: '2px' }}>Response:</span>
                        <p style={{ margin: 0, color: '#334155' }}>{review.response.text}</p>
                      </div>
                    )}

                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <MessageCircle className="empty-icon" size={48} />
                  <h3 className="empty-title">No Reviews Found</h3>
                  <p className="empty-desc">
                    {activeTab === 'All Reviews' 
                      ? (directionTab === 'given' ? 'You have not submitted reviews for any freelancers yet.' : 'No freelancers have submitted reviews for you yet.')
                      : `No reviews match '${activeTab}'.`}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredReviews.length > reviewsPerPage && (
              <div className="pagination">
                <button 
                  className="page-btn" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i} 
                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  className="page-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Submit Review Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '500px', width: '100%', padding: '1.75rem', color: '#0f172a', margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justify: 'center' }}>
                  <Star size={20} color="#d97706" fill="#f59e0b" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Review Hired Freelancer</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Rate &amp; review freelancer performance</span>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justify: 'center', color: '#64748b', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Select Hired Freelancer / Contract *</label>
                {loadingContracts ? (
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#64748b' }}>Loading contracts...</div>
                ) : hiredContracts.length === 0 ? (
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#ef4444' }}>No active or completed contracts found to review.</div>
                ) : (
                  <select 
                    value={selectedContractId} 
                    onChange={(e) => setSelectedContractId(e.target.value)} 
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', background: '#fff' }}
                    required
                  >
                    <option value="">— Select contract —</option>
                    {hiredContracts.map(c => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.freelancer?.name || 'Freelancer'} — {c.project?.title || c.title}
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
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Review Feedback &amp; Comments *</label>
                <textarea 
                  rows={4} 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)} 
                  placeholder="Share details about freelancer performance, code quality, communication, and overall delivery..."
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '40px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting || !selectedContractId} style={{ padding: '0.65rem 1.5rem', borderRadius: '40px', background: '#0f172a', border: '1px solid #0f172a', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', opacity: (!selectedContractId || submitting) ? 0.6 : 1 }}>
                  {submitting ? 'Publishing...' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
