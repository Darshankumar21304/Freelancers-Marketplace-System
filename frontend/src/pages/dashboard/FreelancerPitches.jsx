import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Briefcase, User, Clock, CheckCircle,
  XCircle, Send, FileText, AlertCircle, MapPin,
  Star, ExternalLink, MessageSquare, ChevronRight, X, DollarSign
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { formatINR } from '../../utils/currency';
import { getCleanAvatar } from '../../utils/avatarUtils';
import './FreelancerPitches.css';

export default function FreelancerPitches() {
  const navigate = useNavigate();
  const [pitches, setPitches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals State
  const [selectedProjectModal, setSelectedProjectModal] = useState(null);
  const [bidPitchTarget, setBidPitchTarget] = useState(null);
  
  // Bid Submission Form State
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('7 Days');
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');

  useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/pitches/freelancer').catch(() => []);
      setPitches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading freelancer pitches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenBidModal = (pitch) => {
    setBidPitchTarget(pitch);
    setBidAmount(pitch.offeredBudget || pitch.project_id?.budget || '');
    setDeliveryTime('7 Days');
    setCoverLetter(`Hi ${pitch.client_id?.name || 'there'},\n\nThank you for inviting me to your project "${pitch.project_id?.title}". I have reviewed the requirements and would love to collaborate with you to deliver high-quality results.`);
    setBidError('');
    setBidSuccess('');
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    if (!bidAmount || isNaN(bidAmount) || Number(bidAmount) <= 0) {
      setBidError('Please enter a valid bid amount.');
      return;
    }
    if (!coverLetter.trim()) {
      setBidError('Please provide a brief proposal cover letter.');
      return;
    }

    setIsSubmittingBid(true);
    setBidError('');
    setBidSuccess('');

    try {
      const res = await apiFetch(`/pitches/${bidPitchTarget._id || bidPitchTarget.id}/submit-bid`, {
        method: 'POST',
        body: JSON.stringify({
          bidAmount: Number(bidAmount),
          deliveryTime,
          coverLetter
        })
      });

      if (res && res.success) {
        setBidSuccess('Proposal bid submitted successfully to client!');
        // Update local status
        setPitches(prev => prev.map(p => {
          if (p._id === bidPitchTarget._id || p.id === bidPitchTarget.id) {
            return {
              ...p,
              status: 'Bid Submitted',
              bidDetails: {
                bidAmount: Number(bidAmount),
                deliveryTime,
                coverLetter,
                submittedAt: new Date()
              }
            };
          }
          return p;
        }));

        setTimeout(() => {
          setBidPitchTarget(null);
          setBidSuccess('');
        }, 1500);
      } else {
        setBidError(res.message || 'Failed to submit bid.');
      }
    } catch (err) {
      setBidError(err.message || 'Error submitting bid.');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleDeclinePitch = async (pitchId) => {
    if (!window.confirm('Are you sure you want to decline this project pitch?')) return;

    try {
      const res = await apiFetch(`/pitches/${pitchId}/decline`, {
        method: 'PUT'
      });
      if (res && res.success) {
        setPitches(prev => prev.map(p => (p._id === pitchId || p.id === pitchId) ? { ...p, status: 'Declined' } : p));
      }
    } catch (err) {
      alert(err.message || 'Error declining pitch.');
    }
  };

  const pendingPitchesCount = pitches.filter(p => p.status === 'Pending').length;
  const bidsSubmittedCount = pitches.filter(p => p.status === 'Bid Submitted').length;

  return (
    <div className="fp-page-container">
      {/* Header Banner */}
      <div className="fp-header-banner">
        <div className="fp-banner-content">
          <div className="fp-badge">
            <Sparkles size={16} /> Direct Client Opportunities
          </div>
          <h1 className="fp-title">Direct Project Pitches</h1>
          <p className="fp-subtitle">
            Clients who specifically discovered your profile and invited you to collaborate on their active projects. Review requirements and submit bids.
          </p>
        </div>

        {/* Stats Row */}
        <div className="fp-stats-grid">
          <div className="fp-stat-card">
            <span className="fp-stat-label">Total Invitations</span>
            <span className="fp-stat-value">{pitches.length}</span>
          </div>
          <div className="fp-stat-card fp-highlight-stat">
            <span className="fp-stat-label">Awaiting Response</span>
            <span className="fp-stat-value">{pendingPitchesCount}</span>
          </div>
          <div className="fp-stat-card">
            <span className="fp-stat-label">Bids Submitted</span>
            <span className="fp-stat-value">{bidsSubmittedCount}</span>
          </div>
        </div>
      </div>

      {/* Pitches List */}
      {isLoading ? (
        <div className="fp-loading-box">
          <div className="fp-spinner" />
          <p>Loading your project invitations...</p>
        </div>
      ) : pitches.length === 0 ? (
        <div className="fp-empty-box">
          <div className="fp-empty-icon">
            <Sparkles size={48} />
          </div>
          <h3>No Direct Pitches Yet</h3>
          <p>When clients discover your profile in "Browse Freelancers" and invite you to their projects, they will show up here.</p>
          <button 
            className="fp-explore-btn"
            onClick={() => navigate('/freelancer/dashboard/browse-projects')}
          >
            Browse Open Public Projects
          </button>
        </div>
      ) : (
        <div className="fp-pitches-list">
          {pitches.map(pitch => {
            const client = pitch.client_id || {};
            const project = pitch.project_id || {};
            const clientName = client.name || 'Client';
            const clientAvatar = getCleanAvatar(client.avatar || client.profilePhoto, clientName);
            const clientRating = client.rating || 5.0;
            const clientLocation = client.location || 'India';
            const status = pitch.status || 'Pending';

            return (
              <div key={pitch._id || pitch.id} className={`fp-pitch-card ${status === 'Pending' ? 'status-pending' : ''}`}>
                {/* Left Side: Client & Pitch Quote */}
                <div className="fp-client-side">
                  <div className="fp-client-header">
                    <img src={clientAvatar} alt={clientName} className="fp-client-avatar" />
                    <div>
                      <h4 className="fp-client-name">{clientName}</h4>
                      <p className="fp-client-meta">
                        <MapPin size={12} /> {clientLocation}
                        {client.companyName && <span> • {client.companyName}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Pitch Message Bubble */}
                  <div className="fp-message-bubble">
                    <p className="fp-message-label">Client Pitch Note:</p>
                    <p className="fp-message-text">"{pitch.message}"</p>
                    <span className="fp-pitch-time">
                      Received {pitch.createdAt ? new Date(pitch.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently'}
                    </span>
                  </div>

                  <button
                    className="fp-chat-btn"
                    onClick={() => navigate(`/freelancer/dashboard/chat?partnerId=${client._id || client.id}`)}
                  >
                    <MessageSquare size={14} /> Chat with Client
                  </button>
                </div>

                {/* Right Side: Project Scope & Actions */}
                <div className="fp-project-side">
                  <div className="fp-project-top">
                    <div className="fp-project-info">
                      <div className="fp-badge-row">
                        <span className="fp-category-tag">{project.category || 'Development'}</span>
                        <span className={`fp-status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {status === 'Pending' ? '🌟 New Pitch' : status}
                        </span>
                      </div>
                      <h3 className="fp-project-title">{project.title || 'Custom Project Invitation'}</h3>
                    </div>

                    <div className="fp-budget-box">
                      <span className="fp-budget-label">Offered Budget</span>
                      <span className="fp-budget-val">
                        {pitch.offeredBudget ? formatINR(pitch.offeredBudget) : (project.budget ? formatINR(project.budget) : 'Fixed Price')}
                      </span>
                    </div>
                  </div>

                  {/* Project Summary Description */}
                  <p className="fp-project-desc">
                    {project.description || 'Full scope specifications provided in project brief.'}
                  </p>

                  {/* Skills tags */}
                  {Array.isArray(project.skills) && project.skills.length > 0 && (
                    <div className="fp-skills-wrap">
                      {project.skills.slice(0, 4).map((sk, idx) => (
                        <span key={idx} className="fp-skill-chip">{sk}</span>
                      ))}
                    </div>
                  )}

                  {/* Footer Details & Action Buttons */}
                  <div className="fp-card-footer">
                    <button
                      className="fp-btn-scope"
                      onClick={() => setSelectedProjectModal(project)}
                    >
                      <FileText size={15} /> View Full Scope
                    </button>

                    <div className="fp-actions-group">
                      {status === 'Pending' ? (
                        <>
                          <button
                            className="fp-btn-decline"
                            onClick={() => handleDeclinePitch(pitch._id || pitch.id)}
                          >
                            <XCircle size={15} /> Decline
                          </button>
                          <button
                            className="fp-btn-bid"
                            onClick={() => handleOpenBidModal(pitch)}
                          >
                            <Send size={15} /> Submit Bid / Proposal
                          </button>
                        </>
                      ) : status === 'Bid Submitted' ? (
                        <div className="fp-bid-info-chip">
                          <CheckCircle size={16} color="#10b981" />
                          <span>Bid Submitted: <strong>{formatINR(pitch.bidDetails?.bidAmount || pitch.offeredBudget)}</strong></span>
                        </div>
                      ) : (
                        <span className="fp-declined-tag">Invitation Declined</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. View Full Scope Modal */}
      {selectedProjectModal && (
        <div className="fp-modal-overlay" onClick={() => setSelectedProjectModal(null)}>
          <div className="fp-scope-modal" onClick={e => e.stopPropagation()}>
            <div className="fp-modal-head">
              <div>
                <span className="fp-category-tag">{selectedProjectModal.category || 'Project'}</span>
                <h3 className="fp-scope-modal-title">{selectedProjectModal.title}</h3>
              </div>
              <button className="fp-close-icon" onClick={() => setSelectedProjectModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="fp-scope-modal-body">
              <div className="fp-scope-meta-grid">
                <div className="fp-scope-meta-item">
                  <span className="fp-meta-lbl">Budget</span>
                  <span className="fp-meta-val">{selectedProjectModal.budget ? formatINR(selectedProjectModal.budget) : 'Fixed Price'}</span>
                </div>
                <div className="fp-scope-meta-item">
                  <span className="fp-meta-lbl">Duration</span>
                  <span className="fp-meta-val">{selectedProjectModal.duration || 'Flexible'}</span>
                </div>
                <div className="fp-scope-meta-item">
                  <span className="fp-meta-lbl">Experience</span>
                  <span className="fp-meta-val">{selectedProjectModal.experienceLevel || 'Intermediate'}</span>
                </div>
              </div>

              <h4 className="fp-sec-title">Project Description</h4>
              <p className="fp-scope-full-text">{selectedProjectModal.description}</p>

              {Array.isArray(selectedProjectModal.skills) && selectedProjectModal.skills.length > 0 && (
                <>
                  <h4 className="fp-sec-title">Required Skills</h4>
                  <div className="fp-skills-wrap">
                    {selectedProjectModal.skills.map((s, idx) => (
                      <span key={idx} className="fp-skill-chip">{s}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="fp-modal-footer">
              <button className="fp-btn-close-modal" onClick={() => setSelectedProjectModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Submit Bid / Proposal Modal */}
      {bidPitchTarget && (
        <div className="fp-modal-overlay" onClick={() => setBidPitchTarget(null)}>
          <div className="fp-bid-modal" onClick={e => e.stopPropagation()}>
            <div className="fp-modal-head">
              <div>
                <span className="fp-category-tag">Submit Proposal Bid</span>
                <h3 className="fp-scope-modal-title">{bidPitchTarget.project_id?.title}</h3>
              </div>
              <button className="fp-close-icon" onClick={() => setBidPitchTarget(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="fp-bid-form">
              {bidError && (
                <div className="fp-alert-error">
                  <AlertCircle size={16} />
                  <span>{bidError}</span>
                </div>
              )}
              {bidSuccess && (
                <div className="fp-alert-success">
                  <CheckCircle size={16} />
                  <span>{bidSuccess}</span>
                </div>
              )}

              <div className="fp-bid-inputs-row">
                <div className="fp-form-field">
                  <label className="fp-field-label">Your Bid Amount (₹) <span className="fp-req">*</span></label>
                  <input
                    type="number"
                    className="fp-field-input"
                    placeholder="e.g. 15000"
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="fp-form-field">
                  <label className="fp-field-label">Estimated Delivery</label>
                  <select
                    className="fp-field-select"
                    value={deliveryTime}
                    onChange={e => setDeliveryTime(e.target.value)}
                  >
                    <option value="3 Days">3 Days</option>
                    <option value="7 Days">7 Days</option>
                    <option value="14 Days">14 Days</option>
                    <option value="1 Month">1 Month</option>
                    <option value="Custom">Custom Timeline</option>
                  </select>
                </div>
              </div>

              <div className="fp-form-field">
                <label className="fp-field-label">Cover Letter / Pitch Response <span className="fp-req">*</span></label>
                <textarea
                  className="fp-field-textarea"
                  rows={5}
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Outline your approach, key deliverables, and questions..."
                  required
                />
              </div>

              <div className="fp-modal-footer">
                <button
                  type="button"
                  className="fp-btn-cancel-bid"
                  onClick={() => setBidPitchTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fp-btn-submit-bid"
                  disabled={isSubmittingBid}
                >
                  {isSubmittingBid ? 'Submitting Bid...' : (
                    <>
                      <Send size={15} /> Send Bid Proposal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
