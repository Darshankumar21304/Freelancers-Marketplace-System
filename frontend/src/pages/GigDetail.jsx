import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { getUserRole, isAuthenticated } from '../utils/authUtils';
import { 
  Star, Clock, Check, Shield, Award, MessageCircle, 
  Share2, Heart, MapPin, Briefcase, ChevronLeft, 
  Send, Users, Calendar, IndianRupee, X, CheckCircle2,
  FileText, Sparkles, Building2, CheckCircle, ExternalLink
} from 'lucide-react';
import { formatINR } from '../utils/currency';
import AntigravityCanvas from '../components/AntigravityCanvas';
import AuthModal from '../components/AuthModal';
import './GigDetail.css';

const generateAvatarUrl = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Client')}&background=1a73e8&color=fff&size=150`;

export default function GigDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const role = getUserRole();
  const isAuth = isAuthenticated();

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Proposal Modal & Tracking State
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalForm, setProposalForm] = useState({ bidAmount: '', coverLetter: '', deliveryTime: '1 to 2 weeks' });
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [submittedProposal, setSubmittedProposal] = useState(null);
  const [successBanner, setSuccessBanner] = useState(false);

  // Retain Dashboard Sidebar if logged in
  useEffect(() => {
    if (isAuth && role && location.pathname === `/gig/${id}`) {
      navigate(`/${role}/dashboard/gig/${id}`, { replace: true });
    }
  }, [isAuth, role, id, location.pathname, navigate]);

  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch(`/projects/${id}`);
        setProject(data);
        
        // Check if saved
        const savedList = JSON.parse(localStorage.getItem('saved_projects') || '[]');
        if (savedList.includes(id)) {
          setIsSaved(true);
        }

        // Fetch my proposals to check if I have already submitted a proposal for this project
        if (isAuth && role === 'freelancer') {
          try {
            const myProps = await apiFetch('/proposals/my-proposals');
            const match = myProps.find(p => String(p.project_id || p.projectId || p.project) === String(id));
            if (match) {
              setSubmittedProposal(match);
            }
          } catch (e) {
            console.error('Error fetching my proposals:', e);
          }
        }
      } catch (error) {
        console.error('Error fetching project by ID:', error);
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [id, isAuth, role]);

  const handleToggleSave = () => {
    if (!isAuth) {
      setShowAuthModal(true);
      return;
    }
    const savedList = JSON.parse(localStorage.getItem('saved_projects') || '[]');
    let updated;
    if (isSaved) {
      updated = savedList.filter(item => item !== id);
      setIsSaved(false);
    } else {
      updated = [...savedList, id];
      setIsSaved(true);
    }
    localStorage.setItem('saved_projects', JSON.stringify(updated));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenProposal = () => {
    if (!isAuth) {
      setShowAuthModal(true);
      return;
    }
    if (role === 'client') {
      alert('Clients cannot submit proposals. Please switch to a freelancer account.');
      return;
    }
    setProposalForm({
      bidAmount: project?.budget ? String(project.budget) : '',
      deliveryTime: project?.duration || '1 to 2 weeks',
      coverLetter: ''
    });
    setIsProposalModalOpen(true);
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingProposal(true);
    try {
      const res = await apiFetch(`/projects/${id}/proposals`, {
        method: 'POST',
        body: JSON.stringify(proposalForm)
      });
      
      const newProposalObj = {
        _id: res?._id || Date.now(),
        bidAmount: proposalForm.bidAmount,
        deliveryTime: proposalForm.deliveryTime,
        coverLetter: proposalForm.coverLetter,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      setSubmittedProposal(newProposalObj);
      setIsProposalModalOpen(false);
      setSuccessBanner(true);
      
      // Update local proposals count
      setProject(prev => prev ? {
        ...prev,
        proposals: [...(prev.proposals || []), newProposalObj]
      } : prev);
    } catch (err) {
      console.error('Failed to submit proposal:', err);
      alert('Failed to submit proposal: ' + err.message);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="gig-detail-page">
        <div className="gig-detail-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
          <div className="spin" style={{ width: '40px', height: '40px', border: '4px solid #cbd5e1', borderTopColor: '#1a73e8', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', fontWeight: 600 }}>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="gig-detail-page">
        <div className="gig-detail-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <X size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px' }}>Project Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>The requested project listing may have been closed or removed.</p>
          <button onClick={() => navigate(isAuth && role ? `/${role}/dashboard/browse-projects` : '/explore')} className="gig-cta-btn" style={{ maxWidth: '220px', margin: '0 auto' }}>
            Back to Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  const clientObj = typeof project.client_id === 'object' ? (project.client_id || {}) : {};

  const getRealClientName = (client) => {
    if (!client) return 'Heartware';
    const raw = client.name || client.companyName || '';
    if (raw && !['Client User', 'Client Pro', 'Demo Client', 'Client', 'Verified Client'].includes(raw)) {
      return raw;
    }
    if (client.companyName && !['Client User', 'Demo Client'].includes(client.companyName)) {
      return client.companyName;
    }
    return 'Heartware';
  };

  const clientName = getRealClientName(clientObj);
  const companyName = clientObj.companyName && clientObj.companyName !== clientName && !['Client User', 'Demo Client'].includes(clientObj.companyName) ? clientObj.companyName : '';
  
  const resolveClientAvatar = (client) => {
    const pic = client?.avatar || client?.profilePhoto;
    if (pic && typeof pic === 'string' && pic.trim() !== '') {
      if (pic.startsWith('http://') || pic.startsWith('https://')) return pic;
      if (pic.startsWith('/uploads')) return `http://localhost:5001${pic}`;
      return pic;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=1a73e8&color=fff&size=150`;
  };

  const resolveClientLocation = (client) => {
    if (!client) return 'India / Remote';
    if (client.location && !['United States', 'Global', ''].includes(client.location)) return client.location;
    if (client.state && client.country) return `${client.state}, ${client.country}`;
    if (client.country && !['United States', ''].includes(client.country)) return client.country;
    return 'India / Remote';
  };

  const clientAvatar = resolveClientAvatar(clientObj);
  const clientLocation = resolveClientLocation(clientObj);
  const clientRating = clientObj.rating || 0;
  const clientReviews = clientObj.numReviews || 0;
  const formattedBudget = typeof project.budget === 'number' ? formatINR(project.budget) : (project.budget?.startsWith('₹') ? project.budget : `₹${project.budget}`);

  const backLinkPath = isAuth && role ? `/${role}/dashboard/browse-projects` : '/explore';

  return (
    <div className="gig-detail-page animate-fade-in-up">
      <AntigravityCanvas />

      <div className="gig-detail-container">
        
        {/* Animated Proposal Success Banner */}
        {successBanner && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            padding: '16px 22px',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.35)',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={26} />
              <div>
                <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '2px' }}>Proposal Submitted Successfully!</strong>
                <span style={{ fontSize: '0.85rem', opacity: 0.95 }}>Your bid has been submitted and is now tracked in your proposal pipeline.</span>
              </div>
            </div>
            <button 
              onClick={() => navigate(`/${role}/dashboard/my-proposals`)}
              style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '8px 18px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Track in Dashboard →
            </button>
          </div>
        )}

        {/* Navigation Breadcrumbs */}
        <div className="gig-breadcrumb">
          <Link to={backLinkPath} className="gig-back-link">
            <ChevronLeft size={16} /> Back to Browse Projects
          </Link>
          <span className="gig-breadcrumb-sep">/</span>
          <span className="gig-breadcrumb-cat">{project.category || 'General'}</span>
          <span className="gig-breadcrumb-sep">/</span>
          <span className="gig-breadcrumb-current">{project.title}</span>
        </div>

        <div className="gig-layout-grid">
          
          {/* Main Content Column */}
          <main className="gig-main-card">
            
            {/* Header Badge & Title */}
            <div className="gig-header-row">
              <span className="gig-category-badge">
                <Sparkles size={13} /> {project.category || 'Web Development'}
              </span>
              <span className="gig-type-badge">
                {project.budgetType || 'Fixed Price'}
              </span>
            </div>

            <h1 className="gig-title">{project.title}</h1>

            {/* Client Header Info Bar */}
            <div className="gig-client-header-card">
              <div className="gig-client-avatar-wrapper">
                <img src={clientAvatar} alt={clientName} className="gig-client-avatar-img" />
              </div>
              <div className="gig-client-details">
                <div className="gig-client-name-row">
                  <span className="gig-client-name-text">{clientName}</span>
                  {companyName && <span className="gig-company-tag"><Building2 size={12} /> {companyName}</span>}
                  <span className="gig-verified-badge"><CheckCircle size={14} /> Verified Client</span>
                </div>
                <div className="gig-client-sub-meta">
                  <span><MapPin size={13} /> {clientLocation}</span>
                  <span className="meta-dot">•</span>
                  <span><Calendar size={13} /> Posted {new Date(project.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="meta-dot">•</span>
                  <span><Users size={13} /> {project.proposals?.length || 0} Proposals Received</span>
                </div>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="gig-metrics-grid">
              <div className="gig-metric-box">
                <span className="gig-metric-label">Budget</span>
                <span className="gig-metric-value text-green">{formattedBudget}</span>
              </div>
              <div className="gig-metric-box">
                <span className="gig-metric-label">Project Type</span>
                <span className="gig-metric-value">{project.budgetType || 'Fixed Price'}</span>
              </div>
              <div className="gig-metric-box">
                <span className="gig-metric-label">Experience Level</span>
                <span className="gig-metric-value">{project.experienceLevel || 'Intermediate'}</span>
              </div>
              <div className="gig-metric-box">
                <span className="gig-metric-label">Project Duration</span>
                <span className="gig-metric-value">{project.duration || '1 to 3 months'}</span>
              </div>
            </div>

            {/* Project Description */}
            <div className="gig-section">
              <h2 className="gig-section-title"><FileText size={18} /> Project Overview & Requirements</h2>
              <div className="gig-description-content">
                {project.description}
              </div>
            </div>

            {/* Required Skills */}
            <div className="gig-section">
              <h2 className="gig-section-title"><Award size={18} /> Required Skills & Expertise</h2>
              <div className="gig-skills-flex">
                {project.skills && project.skills.length > 0 ? (
                  project.skills.map((skill, i) => (
                    <span key={i} className="gig-skill-chip">{skill}</span>
                  ))
                ) : (
                  <span className="gig-skill-chip">Web Development</span>
                )}
              </div>
            </div>

            {/* Scope & Deliverables Roadmap */}
            <div className="gig-section">
              <h2 className="gig-section-title"><CheckCircle2 size={18} /> Milestone Deliverables & Escrow Guarantee</h2>
              <div className="gig-roadmap-box">
                <div className="roadmap-item">
                  <div className="roadmap-step">1</div>
                  <div>
                    <h4 className="roadmap-title">Phase 1: Project Setup & Architecture Review (40%)</h4>
                    <p className="roadmap-desc">Initial milestone funded into locked Escrow. Code setup, environment configuration & client kickoff.</p>
                  </div>
                </div>
                <div className="roadmap-item">
                  <div className="roadmap-step">2</div>
                  <div>
                    <h4 className="roadmap-title">Phase 2: Core Development & Functional Delivery (60%)</h4>
                    <p className="roadmap-desc">Final milestone release upon completion, review, and client approval of source code.</p>
                  </div>
                </div>
              </div>
            </div>

          </main>

          {/* Right Sidebar */}
          <aside className="gig-sidebar">
            
            {/* Primary Action Card */}
            <div className="gig-sidebar-card gig-action-card">
              <div className="gig-sidebar-price">{formattedBudget}</div>
              <div className="gig-sidebar-price-sub">{project.budgetType || 'Fixed Price'} Project Budget</div>

              {submittedProposal ? (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800, fontSize: '0.925rem', marginBottom: '10px' }}>
                    <CheckCircle2 size={18} /> Proposal Submitted
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.825rem', color: 'var(--text-main)', marginBottom: '14px', background: 'var(--bg-body)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Your Bid:</span>
                      <strong style={{ color: '#10b981' }}>{typeof submittedProposal.bidAmount === 'number' || !isNaN(submittedProposal.bidAmount) ? formatINR(submittedProposal.bidAmount) : submittedProposal.bidAmount}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Delivery Time:</span>
                      <strong>{submittedProposal.deliveryTime}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                      <span style={{
                        background: submittedProposal.status === 'Accepted' ? '#dcfce7' : (submittedProposal.status === 'Declined' ? '#fee2e2' : '#fef3c7'),
                        color: submittedProposal.status === 'Accepted' ? '#15803d' : (submittedProposal.status === 'Declined' ? '#b91c1c' : '#b45309'),
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 800
                      }}>
                        ● {submittedProposal.status || 'Pending Review'}
                      </span>
                    </div>
                  </div>

                  <button 
                    className="gig-cta-btn" 
                    onClick={() => navigate(`/${role}/dashboard/my-proposals`)}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', margin: 0, width: '100%' }}
                  >
                    <FileText size={16} /> Track in My Proposals
                  </button>
                </div>
              ) : (
                role !== 'client' && (
                  <button className="gig-cta-btn" onClick={handleOpenProposal}>
                    <Send size={18} /> Submit Proposal Now
                  </button>
                )
              )}

              <div className="sidebar-btn-group">
                <button className={`gig-outline-btn ${isSaved ? 'saved' : ''}`} onClick={handleToggleSave}>
                  <Heart size={18} fill={isSaved ? '#ef4444' : 'none'} color={isSaved ? '#ef4444' : 'currentColor'} /> 
                  {isSaved ? 'Saved to Favorites' : 'Save Project'}
                </button>
                
                <button className="gig-outline-btn" onClick={handleShare}>
                  <Share2 size={18} /> {copiedLink ? 'Link Copied!' : 'Share'}
                </button>
              </div>

              <div className="gig-guarantee-box">
                <Shield size={18} className="shield-icon" />
                <div>
                  <strong>GigSphere Payment Protection</strong>
                  <p>Escrow funds are locked securely before work starts.</p>
                </div>
              </div>
            </div>

            {/* About Client Card */}
            <div className="gig-sidebar-card gig-client-card">
              <h3 className="sidebar-card-title">About the Client</h3>
              <div className="client-card-profile">
                <img src={clientAvatar} alt={clientName} className="client-card-avatar" />
                <div>
                  <h4 className="client-card-name">{clientName}</h4>
                  <span className="client-card-sub"><MapPin size={12} /> {clientLocation}</span>
                </div>
              </div>

              <div className="client-stats-list">
                <div className="client-stat-row">
                  <span className="stat-label">Client Rating</span>
                  {clientReviews > 0 ? (
                    <span className="stat-value gold">
                      <Star size={14} fill="#eab308" color="#eab308" /> {clientRating.toFixed(1)} ({clientReviews} {clientReviews === 1 ? 'review' : 'reviews'})
                    </span>
                  ) : (
                    <span className="stat-value muted-tag">
                      New Client
                    </span>
                  )}
                </div>
                <div className="client-stat-row">
                  <span className="stat-label">Payment Method</span>
                  <span className="stat-value green"><CheckCircle size={14} /> Verified</span>
                </div>
                <div className="client-stat-row">
                  <span className="stat-label">Identity Status</span>
                  <span className="stat-value blue"><Shield size={14} /> Verified</span>
                </div>
                <div className="client-stat-row">
                  <span className="stat-label">Member Since</span>
                  <span className="stat-value">{new Date(clientObj.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

          </aside>

        </div>

      </div>

      {/* Submit Proposal Modal */}
      {isProposalModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-surface, #ffffff)', borderRadius: '20px', border: '1px solid var(--border-color, #cbd5e1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '540px', width: '100%', padding: '24px', color: 'var(--text-main, #0f172a)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={20} color="#1a73e8" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Submit Proposal</h3>
              </div>
              <button onClick={() => setIsProposalModalOpen(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Submitting for: <strong style={{ color: 'var(--text-main)' }}>{project.title}</strong>
            </p>

            <form onSubmit={handleProposalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>Your Bid Amount (₹)</label>
                <input 
                  type="number" 
                  required
                  placeholder="e.g. 25000"
                  value={proposalForm.bidAmount}
                  onChange={(e) => setProposalForm({ ...proposalForm, bidAmount: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '14px', outline: 'none', background: 'var(--bg-surface, #ffffff)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>Estimated Delivery Time</label>
                <select 
                  value={proposalForm.deliveryTime}
                  onChange={(e) => setProposalForm({ ...proposalForm, deliveryTime: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '14px', outline: 'none', background: 'var(--bg-surface, #ffffff)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                >
                  <option value="Less than 1 week">Less than 1 week</option>
                  <option value="1 to 2 weeks">1 to 2 weeks</option>
                  <option value="2 to 4 weeks">2 to 4 weeks</option>
                  <option value="1+ Months">1+ Months</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>Cover Letter / Pitch</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe your relevant experience, approach to this project, and why you are the best fit..."
                  value={proposalForm.coverLetter}
                  onChange={(e) => setProposalForm({ ...proposalForm, coverLetter: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '14px', outline: 'none', background: 'var(--bg-surface, #ffffff)', color: 'var(--text-main)', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsProposalModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '30px', border: '1px solid var(--border-color, #cbd5e1)', background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingProposal}
                  style={{ padding: '10px 22px', borderRadius: '30px', border: 'none', background: '#1a73e8', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isSubmittingProposal ? <span className="spin">⏳</span> : <Send size={15} />}
                  {isSubmittingProposal ? 'Submitting...' : 'Send Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal Popup */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

    </div>
  );
}
