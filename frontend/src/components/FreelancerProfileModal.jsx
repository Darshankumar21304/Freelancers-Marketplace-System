import React, { useState } from 'react';
import { 
  X, Star, MapPin, Briefcase, Award, ExternalLink, 
  CheckCircle, MessageSquare, UserCheck, ShieldCheck, 
  Folder, Clock, FileText, Sparkles, Code, Globe
} from 'lucide-react';
import { formatINR } from '../utils/currency';
import { getCleanAvatar } from '../utils/avatarUtils';
import { apiFetch } from '../utils/api';
import './FreelancerProfileModal.css';

const getAbsoluteUrl = (url) => {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (!trimmed) return '#';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export default function FreelancerProfileModal({
  isOpen,
  onClose,
  freelancer,
  onHire,
  onMessage,
  onShortlist,
  onReject
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [trustData, setTrustData] = useState(null);

  React.useEffect(() => {
    if (isOpen && freelancer) {
      const flId = freelancer._id || freelancer.id || freelancer.user_id;
      if (flId) {
        apiFetch(`/trust/freelancer/${flId}`)
          .then(data => setTrustData(data))
          .catch(() => null);
      }
    }
  }, [isOpen, freelancer]);

  if (!isOpen || !freelancer) return null;

  const profileData = freelancer.profile || {};
  const name = freelancer.name || freelancer.freelancerName || 'Freelancer';
  const title = profileData.title || freelancer.title || 'Freelance Specialist';
  const avatar = getCleanAvatar(freelancer.avatar || freelancer.profilePhoto, name);
  const rating = freelancer.rating || profileData.rating || 5.0;
  const numReviews = freelancer.numReviews || freelancer.reviewCount || profileData.reviewCount || 1;
  const hourlyRate = profileData.hourlyRate || freelancer.hourlyRate || freelancer.price || 1500;
  const location = profileData.location || freelancer.location || freelancer.city || 'India';
  const bio = profileData.bio || freelancer.bio || 'Ready to work on amazing projects.';
  const skillsRaw = profileData.skills || freelancer.skills || [];
  const skills = Array.isArray(skillsRaw) 
    ? skillsRaw.flatMap(s => typeof s === 'string' ? s.split(',').map(x => x.trim()) : s).filter(Boolean) 
    : (typeof skillsRaw === 'string' ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : []);
  const portfolioItems = Array.isArray(profileData.portfolioItems || freelancer.portfolioItems) ? (profileData.portfolioItems || freelancer.portfolioItems) : [];
  const gigs = Array.isArray(profileData.gigs || freelancer.gigs) ? (profileData.gigs || freelancer.gigs) : [];
  const gigHistory = Array.isArray(profileData.gigHistory || freelancer.gigHistory) ? (profileData.gigHistory || freelancer.gigHistory) : [];
  const workExperience = Array.isArray(profileData.workExperience || freelancer.workExperience) ? (profileData.workExperience || freelancer.workExperience) : [];
  const certifications = Array.isArray(profileData.certifications || freelancer.certifications) ? (profileData.certifications || freelancer.certifications) : [];

  return (
    <div className="fl-modal-overlay" onClick={onClose}>
      <div className="fl-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="fl-modal-header">
          <button className="fl-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>

          <div className="fl-header-profile">
            <div className="fl-avatar-container">
              <img src={avatar} alt={name} className="fl-avatar-img" />
              <div className="fl-verified-badge" title="GigSphere Verified Freelancer">
                <ShieldCheck size={14} color="#ffffff" />
              </div>
            </div>

            <div className="fl-header-info">
              <div className="fl-name-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 className="fl-name">{name}</h2>
                <span className="fl-pro-pill">
                  <Sparkles size={12} /> Verified Pro
                </span>
                <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} color="#059669" /> {trustData?.trustScore ? `${trustData.trustScore}% Trust Score` : 'High Trust'}
                </span>
              </div>
              <p className="fl-title">{title}</p>
              
              <div className="fl-meta-row">
                <span className="fl-meta-item fl-rating">
                  <Star size={14} fill="#f59e0b" color="#f59e0b" /> {rating} ({numReviews} reviews)
                </span>
                <span className="fl-meta-dot">•</span>
                <span className="fl-meta-item">
                  <MapPin size={14} color="#64748b" /> {location}
                </span>
                <span className="fl-meta-dot">•</span>
                <span className="fl-meta-item fl-rate">
                  <strong>{formatINR(hourlyRate)}</strong> / hr
                </span>
              </div>
            </div>
          </div>

          {/* Modal Tabs */}
          <div className="fl-tabs-bar">
            <button 
              className={`fl-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <UserCheck size={16} /> Overview & Skills
            </button>
            <button 
              className={`fl-tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              <Folder size={16} /> Portfolio ({portfolioItems.length})
            </button>
            <button 
              className={`fl-tab-btn ${activeTab === 'gigs' ? 'active' : ''}`}
              onClick={() => setActiveTab('gigs')}
            >
              <Briefcase size={16} /> Posted Gigs ({gigs.length})
            </button>
            <button 
              className={`fl-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <Clock size={16} /> Gig History ({gigHistory.length})
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="fl-modal-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="fl-tab-content">
              <section className="fl-section">
                <h3 className="fl-section-title">About & Biography</h3>
                <p className="fl-bio-text">{bio}</p>
              </section>

              <section className="fl-section">
                <h3 className="fl-section-title">Verified Technical Skills</h3>
                {skills.length === 0 ? (
                  <p className="fl-empty-text" style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>No skills listed on profile yet.</p>
                ) : (
                  <div className="fl-skills-cloud">
                    {skills.map((skill, index) => (
                      <span key={index} className="fl-skill-chip">
                        <Code size={13} className="fl-skill-icon" /> {skill}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              <div className="fl-grid-two">
                <section className="fl-section">
                  <h3 className="fl-section-title">Work Experience</h3>
                  {workExperience.length === 0 ? (
                    <p className="fl-empty-text" style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>No work experience listed yet.</p>
                  ) : (
                    <div className="fl-timeline">
                      {workExperience.map((item, idx) => (
                        <div key={idx} className="fl-timeline-item">
                          <h4 className="fl-timeline-role">{item.role}</h4>
                          <span className="fl-timeline-company">{item.company} • ({item.startDate} - {item.endDate || 'Present'})</span>
                          <p className="fl-timeline-desc">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="fl-section">
                  <h3 className="fl-section-title">Certifications & Credentials</h3>
                  {certifications.length === 0 ? (
                    <p className="fl-empty-text" style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>No certifications listed yet.</p>
                  ) : (
                    certifications.map((c, i) => (
                      <div key={i} className="fl-cert-card">
                        <Award size={20} color="#1a73e8" />
                        <div>
                          <strong>{c.name}</strong>
                          <span>{c.issuer} ({c.issueDate})</span>
                          {(c.credentialUrl || c.docUrl || c.link || c.url) && (
                            <a 
                              href={getAbsoluteUrl(c.credentialUrl || c.docUrl || c.link || c.url)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ fontSize: '0.75rem', color: '#1a73e8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}
                            >
                              View Credential <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="fl-tab-content">
              {portfolioItems.length === 0 ? (
                <div className="fl-empty-state">
                  <Folder size={40} color="#94a3b8" />
                  <p>No portfolio items uploaded yet.</p>
                </div>
              ) : (
                <div className="fl-portfolio-grid">
                  {portfolioItems.map((item, idx) => (
                    <div key={idx} className="fl-portfolio-card">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.title} className="fl-portfolio-img" />
                      )}
                      <div className="fl-portfolio-info">
                        <span className="fl-portfolio-cat">{item.category || 'Project'}</span>
                        <h4 className="fl-portfolio-title">{item.title}</h4>
                        <p className="fl-portfolio-desc">{item.description}</p>
                        {(item.link || item.url) && (
                          <a href={getAbsoluteUrl(item.link || item.url)} target="_blank" rel="noopener noreferrer" className="fl-portfolio-link">
                            View Project <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: POSTED GIGS */}
          {activeTab === 'gigs' && (
            <div className="fl-tab-content">
              {gigs.length === 0 ? (
                <div className="fl-empty-state">
                  <Briefcase size={40} color="#94a3b8" />
                  <p>No active marketplace service gigs posted by this freelancer currently.</p>
                </div>
              ) : (
                <div className="fl-gigs-grid">
                  {gigs.map((g, idx) => (
                    <div key={idx} className="fl-gig-card">
                      {g.images && g.images.length > 0 && (
                        <img src={g.images[0]} alt={g.title} className="fl-gig-img" />
                      )}
                      <div className="fl-gig-details">
                        <div className="fl-gig-badge">{g.category || 'Service'}</div>
                        <h4 className="fl-gig-title">{g.title}</h4>
                        <p className="fl-gig-desc">{g.description}</p>
                        <div className="fl-gig-footer">
                          <span className="fl-gig-time">
                            <Clock size={13} /> {g.deliveryDays || 5} Days Delivery
                          </span>
                          <span className="fl-gig-price">
                            Starting at <strong>{formatINR(g.price)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GIG HISTORY & COMPLETED WORKS */}
          {activeTab === 'history' && (
            <div className="fl-tab-content">
              {gigHistory.length === 0 ? (
                <div className="fl-empty-state">
                  <Clock size={40} color="#94a3b8" />
                  <p>No past gig history recorded yet.</p>
                </div>
              ) : (
                <div className="fl-history-list">
                  {gigHistory.map((hist, idx) => (
                    <div key={idx} className="fl-history-card">
                      <div className="fl-history-header">
                        <div>
                          <h4 className="fl-history-title">{hist.title}</h4>
                          <span className="fl-history-date">Completed on {hist.date}</span>
                        </div>
                        <div className="fl-history-amount">
                          {formatINR(hist.amount)}
                        </div>
                      </div>
                      <div className="fl-history-badge-row">
                        <span className="fl-status-badge completed">
                          <CheckCircle size={13} /> {hist.status}
                        </span>
                        <span className="fl-history-stars">
                          <Star size={13} fill="#f59e0b" color="#f59e0b" /> 5.0 Rating
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="fl-modal-footer">
          {onReject && (
            <button className="fl-btn-reject" onClick={() => onReject(freelancer)}>
              <X size={16} /> Reject Proposal
            </button>
          )}

          {onShortlist && (
            <button className="fl-btn-secondary" onClick={() => onShortlist(freelancer)}>
              Shortlist Candidate
            </button>
          )}

          {onMessage && (
            <button className="fl-btn-chat" onClick={() => onMessage(freelancer)}>
              <MessageSquare size={16} /> Send Message
            </button>
          )}

          {onHire && (
            <button className="fl-btn-primary" onClick={() => onHire(freelancer)}>
              Hire Freelancer
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
