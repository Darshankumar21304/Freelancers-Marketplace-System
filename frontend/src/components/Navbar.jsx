import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Search, User, Bell, LogOut, Menu, X, ChevronDown, Rocket, Sparkles } from 'lucide-react';
import { getUserRole, isAuthenticated, logoutUser, getUserProfile } from '../utils/authUtils';
import { apiFetch } from '../utils/api';
import AuthModal from './AuthModal';
import HowItWorksModal from './HowItWorksModal';
import './Navbar.css';

const Navbar = () => {
  const isAuth = isAuthenticated();
  const role = getUserRole();
  const dashboardPath = isAuth && role ? `/${role}/dashboard` : '/auth/login';
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!isAuth) return;

    const fetchCounts = async () => {
      try {
        const notifs = await apiFetch('/notifications').catch(() => []);
        if (Array.isArray(notifs)) {
          setUnreadNotifications(notifs.filter(n => !n.read).length);
        }

        const msgUnread = await apiFetch('/messages/unread-count').catch(() => ({ count: 0 }));
        if (msgUnread && typeof msgUnread.count === 'number') {
          setUnreadMessages(msgUnread.count);
        }
      } catch (err) {
        console.error('Error fetching unread counts:', err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 8000); // Check every 8 seconds
    return () => clearInterval(interval);
  }, [isAuth, location.pathname]);

  // Auth Popup Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [authRole, setAuthRole] = useState('client');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const openLoginModal = () => {
    setAuthTab('login');
    setShowAuthModal(true);
    closeMobileMenu();
  };

  const openRegisterModal = (role = 'client') => {
    setAuthTab('register');
    setAuthRole(role);
    setShowAuthModal(true);
    closeMobileMenu();
  };

  const isAdminPage = location.pathname.startsWith('/admin');
  if (isAdminPage) return null;

  const isLandingPage = location.pathname === '/';

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logoutUser();
    setIsMobileMenuOpen(false);
    setShowLogoutConfirm(false);
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar antigravity-navbar">
      <div className="navbar-container">
        
        {/* Left: Custom GigSphere Orbital Sphere Emblem Logo */}
        <div className="navbar-left">
          <Link to="/" className="antigravity-brand" onClick={closeMobileMenu}>
            <div className="antigravity-logo-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="6" fill="url(#gigsphere_grad)" />
                <ellipse cx="12" cy="12" rx="10" ry="4" stroke="url(#gigsphere_grad_ring)" strokeWidth="2.2" strokeLinecap="round" transform="rotate(-30 12 12)" />
                <defs>
                  <linearGradient id="gigsphere_grad" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1A73E8" />
                    <stop offset="0.5" stopColor="#A142F4" />
                    <stop offset="1" stopColor="#00E5FF" />
                  </linearGradient>
                  <linearGradient id="gigsphere_grad_ring" x1="2" y1="8" x2="22" y2="16" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00E5FF" />
                    <stop offset="0.5" stopColor="#1A73E8" />
                    <stop offset="1" stopColor="#A142F4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="brand-title">GigSphere</span>
          </Link>
        </div>

        {/* Center: Google Antigravity Style Navigation Links (Only shown when logged out) */}
        {!isAuth && (
          <div className="navbar-center landing-nav-center">
            <Link to="/explore" className="antigravity-nav-link">
              Explore Marketplace <ChevronDown size={14} className="chevron-icon" />
            </Link>
            <Link to="/freelancers" className="antigravity-nav-link">
              Find Freelancers <ChevronDown size={14} className="chevron-icon" />
            </Link>
            <a href="#how-it-works" className="antigravity-nav-link" onClick={(e) => { e.preventDefault(); setShowHowItWorks(true); }}>
              How It Works
            </a>
          </div>
        )}

        {/* Right: Pill Buttons & Authenticated Actions */}
        <div className="navbar-right">
          {isAuth && (
            <div className="hidden-mobile" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <Link to={`${dashboardPath}/notifications`} className="nav-icon-link">
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="badge badge-warning">{unreadNotifications}</span>
                )}
              </Link>
              <Link to={`${dashboardPath}/chat`} className="nav-icon-link">
                <MessageSquare size={20} />
                {unreadMessages > 0 && (
                  <span className="badge badge-danger">{unreadMessages}</span>
                )}
              </Link>
            </div>
          )}

          <div className="navbar-auth hidden-mobile">
            {!isAuth ? (
              <>
                <button type="button" onClick={openLoginModal} className="antigravity-btn btn-ghost">
                  Log In
                </button>
                <Link to="/auth/register" className="antigravity-btn btn-black">
                  <Rocket size={15} className="rocket-animated" /> Join GigSphere
                </Link>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Link to={dashboardPath} className="antigravity-btn btn-black" style={{ fontSize: '0.825rem', gap: '0.45rem', padding: '0.45rem 1.1rem' }}>
                  {getUserProfile()?.avatar || getUserProfile()?.profilePhoto ? (
                    <img src={getUserProfile().avatar || getUserProfile().profilePhoto} alt="User Avatar" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <User size={15} />
                  )}
                  Dashboard
                </Link>
                <button type="button" onClick={handleLogout} className="antigravity-btn btn-ghost" title="Log Out" style={{ padding: '0.45rem 0.7rem', color: '#64748b' }}>
                  <LogOut size={15} />
                </button>
              </div>
            )}
          </div>

          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

      </div>

      {/* Mobile Animated Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu animate-fade-in-up">
          <div className="mobile-nav-links">
            {!isAuth && (
              <>
                <Link to="/explore" className="nav-link" onClick={closeMobileMenu}>Explore Marketplace</Link>
                <Link to="/freelancers" className="nav-link" onClick={closeMobileMenu}>Find Freelancers</Link>
                <a href="#how-it-works" className="nav-link" onClick={(e) => { e.preventDefault(); closeMobileMenu(); setShowHowItWorks(true); }}>How It Works</a>
              </>
            )}
            {isAuth && <Link to={dashboardPath} className="nav-link" onClick={closeMobileMenu}>Dashboard</Link>}
            
            <div className="mobile-auth-buttons">
              {!isAuth ? (
                <>
                  <button type="button" onClick={openLoginModal} className="antigravity-btn btn-ghost">Log In</button>
                  <button type="button" onClick={() => openRegisterModal('client')} className="antigravity-btn btn-black">Join GigSphere</button>
                </>
              ) : (
                <button onClick={handleLogout} className="antigravity-btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                  <LogOut size={16} /> Log Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Auth Modal Popup */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialTab={authTab}
        defaultRole={authRole}
      />

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '18px', fontWeight: 800 }}>Confirm Logout</h3>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>Are you sure you want to log out of your account?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="antigravity-btn btn-ghost"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="antigravity-btn"
                style={{ background: '#dc2626', color: '#fff' }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How It Works Modal */}
      <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
    </nav>
  );
};

export default Navbar;
