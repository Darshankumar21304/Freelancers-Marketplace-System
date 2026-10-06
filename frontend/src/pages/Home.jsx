import React, { useState, useEffect } from 'react';
import { 
  Search, Code, Palette, PenTool, Video, Music, TrendingUp, Star, 
  CheckCircle2, ShieldCheck, Briefcase, Zap, Globe, MessageSquare, 
  ChevronRight, ArrowRight, Sparkles, Lock, CreditCard, Award, 
  ShieldAlert, RefreshCw, Cpu, Layers, DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatINR } from '../utils/currency';
import AntigravityCanvas from '../components/AntigravityCanvas';
import AuthModal from '../components/AuthModal';
import FreelancerProfileModal from '../components/FreelancerProfileModal';
import { getCleanAvatar } from '../utils/avatarUtils';
import { apiFetch } from '../utils/api';
import './Home.css';

const categories = [
  { name: 'Web & Full Stack', icon: Code, color: '#1a73e8', bg: '#e8f0fe' },
  { name: 'Mobile Apps (iOS & Android)', icon: Code, color: '#a142f4', bg: '#f3e8fd' },
  { name: 'UI/UX & Product Design', icon: Palette, color: '#e52592', bg: '#fce8e6' },
  { name: 'AI & Data Engineering', icon: Cpu, color: '#00e5ff', bg: '#e0f7fa' },
  { name: 'Growth & Performance Marketing', icon: TrendingUp, color: '#34a853', bg: '#e6f4ea' },
  { name: 'Content & Technical Writing', icon: PenTool, color: '#f9ab00', bg: '#fef7e0' },
  { name: 'Video Editing & 3D Animation', icon: Video, color: '#a142f4', bg: '#f3e8fd' },
  { name: 'Blockchain & Smart Contracts', icon: Layers, color: '#1a73e8', bg: '#e8f0fe' }
];

export default function Home() {
  // Live Database Records State
  const [freelancers, setFreelancers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Interactive Landing Page Demos State
  const [demoRiskVal, setDemoRiskVal] = useState(12);

  // Auth Popup Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [authRole, setAuthRole] = useState('client');

  // Freelancer Profile Modal State
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleOpenProfile = (fl) => {
    setSelectedFreelancer(fl);
    setIsProfileModalOpen(true);
  };

  const handleOpenAuth = (tab = 'login') => {
    setAuthTab(tab);
    setShowAuthModal(true);
  };

  useEffect(() => {
    fetchLandingPageData();
  }, []);

  const fetchLandingPageData = async () => {
    setLoadingData(true);
    try {
      const [flRes, prRes] = await Promise.all([
        apiFetch('/users/freelancers').catch(() => []),
        apiFetch('/projects').catch(() => [])
      ]);

      const flList = Array.isArray(flRes) ? flRes : (flRes.freelancers || []);
      const prList = Array.isArray(prRes) ? prRes : (prRes.projects || []);

      setFreelancers(flList.slice(0, 4));
      setProjects(prList.slice(0, 3));
    } catch (err) {
      console.error('Error fetching landing page data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const openAuthModal = (tab = 'register', role = 'client') => {
    setAuthTab(tab);
    setAuthRole(role);
    setShowAuthModal(true);
  };

  return (
    <div className="gigsphere-landing-page">
      
      {/* 1. GOOGLE ANTIGRAVITY HERO SECTION */}
      <section className="hero-section">
        <AntigravityCanvas />

        <div className="container hero-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-content text-center" style={{ maxWidth: '860px', margin: '0 auto' }}>
            
            {/* Top GigSphere Brand Badge Emblem */}
            <div className="hero-brand-badge">
              <div className="hero-logo-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="6" fill="url(#hero_gigsphere_grad)" />
                  <ellipse cx="12" cy="12" rx="10" ry="4" stroke="url(#hero_gigsphere_grad_ring)" strokeWidth="2.2" strokeLinecap="round" transform="rotate(-30 12 12)" />
                  <defs>
                    <linearGradient id="hero_gigsphere_grad" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#1A73E8" />
                      <stop offset="0.5" stopColor="#A142F4" />
                      <stop offset="1" stopColor="#00E5FF" />
                    </linearGradient>
                    <linearGradient id="hero_gigsphere_grad_ring" x1="2" y1="8" x2="22" y2="16" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00E5FF" />
                      <stop offset="0.5" stopColor="#1A73E8" />
                      <stop offset="1" stopColor="#A142F4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="hero-brand-name">GigSphere</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-title">
              The next-generation <br />
              <span className="gradient-text">freelance marketplace platform</span>
            </h1>
            
            <p className="hero-subtitle">
              GigSphere connects visionary clients with top Indian freelancers powered by automated AI risk auditing, instant Razorpay deposits, and 100% escrow vault protection.
            </p>
            
            {/* Dual Pill CTA Buttons */}
            <div className="hero-pill-ctas">
              <Link to="/auth/client-join" className="pill-btn pill-dark shadow-glow">
                <Briefcase size={18} /> Join as Client
              </Link>
              <Link to="/auth/freelancer-join" className="pill-btn pill-light">
                <Award size={18} /> Join as Freelancer
              </Link>
              <Link to="/explore" className="pill-btn pill-outline">
                Explore Marketplace <ArrowRight size={16} />
              </Link>
            </div>
            
            {/* Telemetry Metrics Bar */}
            <div className="hero-metrics-bar">
              <div className="metric-item">
                <div className="metric-val">₹1.2 Cr+</div>
                <div className="metric-lbl">Escrow Funds Protected</div>
              </div>
              <div className="metric-divider"></div>
              <div className="metric-item">
                <div className="metric-val">15,000+</div>
                <div className="metric-lbl">Verified Freelancers</div>
              </div>
              <div className="metric-divider"></div>
              <div className="metric-item">
                <div className="metric-val">99.8%</div>
                <div className="metric-lbl">Dispute Resolution Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURE MATRIX (COMPACT ANTIGRAVITY CAPSULES) */}
      <section className="feature-matrix-section">
        <div className="container">
          <div className="section-header text-center" style={{ marginBottom: '2rem' }}>
            <h2 className="section-title">Engineered for Transparency, Security & Speed</h2>
          </div>

          <div className="antigravity-capsules-row">
            
            {/* Capsule 1: AI Security */}
            <div className="antigravity-chip blue-glow">
              <div className="chip-icon blue"><Cpu size={20} /></div>
              <div className="chip-body">
                <span className="chip-title">Automated Risk Auditing</span>
                <span className="chip-subtitle">AI Security Engine</span>
              </div>
              <Sparkles size={16} className="chip-sparkle" color="#1a73e8" />
            </div>

            {/* Capsule 2: Secure Payment */}
            <div className="antigravity-chip green-glow">
              <div className="chip-icon green"><Lock size={20} /></div>
              <div className="chip-body">
                <span className="chip-title">Razorpay Payment & Escrow</span>
                <span className="chip-subtitle">Secure Payment Vault</span>
              </div>
              <CreditCard size={16} className="chip-sparkle" color="#10b981" />
            </div>

            {/* Capsule 3: Dispute Resolution */}
            <div className="antigravity-chip purple-glow">
              <div className="chip-icon purple"><MessageSquare size={20} /></div>
              <div className="chip-body">
                <span className="chip-title">Evidence Defense & Verdicts</span>
                <span className="chip-subtitle">Dispute Resolution</span>
              </div>
              <ShieldCheck size={16} className="chip-sparkle" color="#a142f4" />
            </div>

          </div>
        </div>
      </section>

      {/* 3. DUAL INVITING AUDIENCE PORTALS ("FOR CLIENTS" vs "FOR FREELANCERS") */}
      <section className="audience-portals-section">
        <div className="container">
          <div className="portals-grid">
            
            {/* For Clients Portal */}
            <div className="portal-card client-portal hover-lift">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.5rem' }}>
                <span className="portal-badge">FOR CLIENTS & BUSINESSES</span>
                <Sparkles size={16} color="#1a73e8" />
              </div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', lineHeight: '1.3' }}>Hire vetted top 1% Indian freelancers</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Post project requirements, receive AI-screened proposals in minutes, and collaborate securely with zero upfront risk.</p>
              
              <ul className="portal-features" style={{ marginBottom: '1.25rem', gap: '0.4rem' }}>
                <li style={{ fontSize: '0.8rem' }}><CheckCircle2 size={14} color="#1a73e8" /> 100% Escrow Protection on every milestone</li>
                <li style={{ fontSize: '0.8rem' }}><CheckCircle2 size={14} color="#1a73e8" /> Automated AI skill matching & quality scoring</li>
                <li style={{ fontSize: '0.8rem' }}><CheckCircle2 size={14} color="#1a73e8" /> Pay via Razorpay UPI, NetBanking, or Cards</li>
              </ul>

              <Link to="/auth/client-join" className="pill-btn pill-dark" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                Hire Talent Now <ArrowRight size={15} />
              </Link>
            </div>

            {/* For Freelancers Portal */}
            <div className="portal-card freelancer-portal hover-lift">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.5rem' }}>
                <span className="portal-badge alt">FOR FREELANCERS</span>
                <Sparkles size={16} color="#10b981" />
              </div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', lineHeight: '1.3' }}>Keep 90% of earnings with instant payouts</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Build your portfolio, pitch to verified clients, and withdraw earnings directly to your UPI ID or Bank account.</p>
              
              <ul className="portal-features" style={{ marginBottom: '1.25rem', gap: '0.4rem' }}>
                <li style={{ fontSize: '0.8rem' }}><CheckCircle2 size={14} color="#10b981" /> Instant Razorpay withdrawal payouts within 24h</li>
                <li style={{ fontSize: '0.8rem' }}><CheckCircle2 size={14} color="#10b981" /> Verified clients with funded escrow vaults</li>
                <li style={{ fontSize: '0.8rem' }}><CheckCircle2 size={14} color="#10b981" /> AI profile audit badge to win high-paying bids</li>
              </ul>

              <Link to="/auth/freelancer-join" className="pill-btn pill-green" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                Join as Freelancer <ArrowRight size={15} />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 4. EXPLORE CATEGORIES */}
      <section id="categories" className="categories-section">
        <div className="container">
          <div className="section-header flex justify-between items-center">
            <div>
              <h2 className="section-title">Explore High-Demand Categories</h2>
              <p className="section-subtitle">Find specialized talent across cutting-edge technology & creative domains.</p>
            </div>
            <Link to="/explore" className="pill-btn pill-outline hidden-mobile">
              Browse All Categories <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="category-grid">
            {categories.map((cat, idx) => (
              <Link to={`/explore?category=${encodeURIComponent(cat.name)}`} key={idx} className="category-card hover-lift">
                <div className="category-icon-wrapper" style={{ backgroundColor: cat.bg, color: cat.color }}>
                  <cat.icon size={24} />
                </div>
                <div className="category-info">
                  <h3 className="category-name">{cat.name}</h3>
                  <span className="category-arrow"><ChevronRight size={18} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TOP FEATURED FREELANCERS */}
      <section className="featured-freelancers-section">
        <div className="container">
          <div className="section-header flex justify-between items-center">
            <div>
              <h2 className="section-title">Top Rated Vetted Talent</h2>
              <p className="section-subtitle">Handpicked professionals with verified work history and AI safety badges.</p>
            </div>
            <Link to="/freelancers" className="pill-btn pill-outline hidden-mobile">
              View All Freelancers <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="freelancers-grid">
            {loadingData ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="freelancer-card" style={{ opacity: 0.6 }}>
                  <div style={{ height: 48, width: 48, borderRadius: '50%', background: '#e2e8f0', marginBottom: 12 }}></div>
                  <div style={{ height: 16, width: '60%', background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }}></div>
                  <div style={{ height: 12, width: '40%', background: '#f1f5f9', borderRadius: 4, marginBottom: 16 }}></div>
                  <div style={{ height: 32, width: '100%', background: '#f8fafc', borderRadius: 6 }}></div>
                </div>
              ))
            ) : freelancers.length > 0 ? (
              freelancers.map((freelancer) => {
                const flId = freelancer._id || freelancer.id;
                const flName = freelancer.name || 'Freelancer';
                const flTitle = freelancer.profile?.title || freelancer.title || 'Verified Specialist';
                const flAvatar = getCleanAvatar(freelancer.profilePhoto || freelancer.avatar, flName);
                const flRating = freelancer.rating || freelancer.profile?.rating || 4.9;
                const flReviews = freelancer.reviewCount || 1;
                const flPrice = freelancer.profile?.hourlyRate || freelancer.price || 1500;
                const flRisk = freelancer.aiRiskScore || 8;
                const rawSkills = freelancer.profile?.skills || freelancer.skills || ['Full Stack', 'Cloud'];
                const flSkills = Array.isArray(rawSkills) ? rawSkills : (typeof rawSkills === 'string' ? rawSkills.split(',').map(s => s.trim()) : []);

                return (
                  <div key={flId} className="freelancer-card hover-lift">
                    <div className="freelancer-header" style={{ cursor: 'pointer' }} onClick={() => handleOpenProfile(freelancer)}>
                      <img src={flAvatar} alt={flName} className="freelancer-avatar" />
                      <div>
                        <h3 className="freelancer-name">{flName}</h3>
                        <p className="freelancer-title">{flTitle}</p>
                      </div>
                    </div>
                    
                    <div className="freelancer-details">
                      <div className="detail-item">
                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        <span>{flRating} ({flReviews})</span>
                      </div>
                      <div className="detail-item">
                        <ShieldCheck size={14} color="#10b981" />
                        <span style={{ color: '#10b981', fontWeight: 700 }}>AI Risk {flRisk}%</span>
                      </div>
                    </div>
                    
                    <div className="freelancer-skills">
                      {flSkills.slice(0, 4).map((skill, i) => (
                        <span key={i} className="skill-badge">{skill}</span>
                      ))}
                    </div>
                    
                    <div className="freelancer-footer">
                      <div className="freelancer-price">
                        <span className="price-label">Rate</span>
                        <span className="price-amount">{formatINR(flPrice)}/hr</span>
                      </div>
                      <button 
                        type="button" 
                        className="min-btn min-btn-primary"
                        onClick={() => handleOpenProfile(freelancer)}
                        style={{ cursor: 'pointer' }}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                No active freelancers found in the database.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. FEATURED OPEN OPPORTUNITIES */}
      <section className="featured-projects-section">
        <div className="container">
          <div className="section-header flex justify-between items-center">
            <div>
              <h2 className="section-title">Latest Project Opportunities</h2>
              <p className="section-subtitle">Verified client projects open for proposals right now.</p>
            </div>
            <Link to="/explore" className="pill-btn pill-outline hidden-mobile">
              Browse All Projects <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="projects-grid">
            {loadingData ? (
              [1, 2, 3].map(i => (
                <div key={i} className="project-card" style={{ opacity: 0.6 }}>
                  <div style={{ height: 16, width: '40%', background: '#e2e8f0', borderRadius: 4, marginBottom: 12 }}></div>
                  <div style={{ height: 20, width: '80%', background: '#cbd5e1', borderRadius: 4, marginBottom: 8 }}></div>
                  <div style={{ height: 40, width: '100%', background: '#f1f5f9', borderRadius: 4, marginBottom: 16 }}></div>
                  <div style={{ height: 32, width: '100%', background: '#f8fafc', borderRadius: 6 }}></div>
                </div>
              ))
            ) : projects.length > 0 ? (
              projects.map((project) => {
                const prId = project._id || project.id;
                const prTitle = project.title || 'Project Opportunity';
                const prDesc = project.description || 'Project description';
                const prCat = project.category || 'Web & Full Stack';
                const prBudget = project.budget || 25000;
                const prType = project.type || 'Fixed Price';
                const prPosted = project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recent';
                const rawSkills = project.skills || ['Full Stack'];
                const prSkills = Array.isArray(rawSkills) ? rawSkills : (typeof rawSkills === 'string' ? rawSkills.split(',').map(s => s.trim()) : []);

                return (
                  <div key={prId} className="project-card hover-lift">
                    <div className="project-header">
                      <span className="project-category">{prCat}</span>
                      <span className="project-posted">{prPosted}</span>
                    </div>
                    <h3 className="project-title">{prTitle}</h3>
                    <p className="project-desc">{prDesc}</p>
                    
                    <div className="project-skills">
                      {prSkills.slice(0, 4).map((skill, i) => (
                        <span key={i} className="skill-badge">{skill}</span>
                      ))}
                    </div>
                    
                    <div className="project-footer">
                      <div className="project-budget">
                        <span className="budget-amount">{formatINR(prBudget)}</span>
                        <span className="budget-type">{prType}</span>
                      </div>
                      <button 
                        type="button" 
                        className="min-btn min-btn-primary"
                        onClick={() => {
                          if (localStorage.getItem('token')) {
                            window.location.href = `/gig/${prId}`;
                          } else {
                            handleOpenAuth('login');
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        Submit Bid
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                No open projects available in the database right now.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. FINAL GOOGLE ANTIGRAVITY PILL CTA */}
      <section className="final-cta-section">
        <div className="container text-center">
          <h2 className="cta-title">Ready to experience the future of freelancing?</h2>
          <p className="cta-subtitle">Join thousands of Indian businesses and top freelancers collaborating with AI security and instant Razorpay payouts.</p>
          <div className="cta-buttons">
            <Link to="/auth/client-join" className="pill-btn pill-white">
              <Briefcase size={18} /> Join as Client
            </Link>
            <Link to="/auth/freelancer-join" className="pill-btn pill-dark">
              <Award size={18} /> Join as Freelancer
            </Link>
          </div>
        </div>
      </section>

      {/* Freelancer Profile Modal Popup */}
      <FreelancerProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        freelancer={selectedFreelancer}
        onHire={() => {
          setIsProfileModalOpen(false);
          handleOpenAuth('login');
        }}
        onMessage={() => {
          setIsProfileModalOpen(false);
          handleOpenAuth('login');
        }}
        onShortlist={() => {
          setIsProfileModalOpen(false);
          handleOpenAuth('login');
        }}
      />

      {/* Interactive Log In Auth Modal Popup */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

    </div>
  );
}
