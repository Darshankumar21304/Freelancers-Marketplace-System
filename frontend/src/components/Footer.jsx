import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Footer.css';

const GigSphereEmblem = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="6" fill="url(#footer_gigsphere_grad)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke="url(#footer_gigsphere_grad_ring)" strokeWidth="2.2" strokeLinecap="round" transform="rotate(-30 12 12)" />
    <defs>
      <linearGradient id="footer_gigsphere_grad" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1A73E8" />
        <stop offset="0.5" stopColor="#A142F4" />
        <stop offset="1" stopColor="#00E5FF" />
      </linearGradient>
      <linearGradient id="footer_gigsphere_grad_ring" x1="2" y1="8" x2="22" y2="16" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00E5FF" />
        <stop offset="0.5" stopColor="#1A73E8" />
        <stop offset="1" stopColor="#A142F4" />
      </linearGradient>
    </defs>
  </svg>
);

const Footer = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;

  const isLandingPage = location.pathname === '/';

  if (!isLandingPage) {
    return (
      <footer className="footer-simple">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div className="footer-logo-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <GigSphereEmblem size={22} />
          </div>
          <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>GigSphere</span>
          <span style={{ color: '#64748b' }}>•</span>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} GigSphere. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-brand-logo" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div className="footer-logo-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <GigSphereEmblem size={32} />
              </div>
              <span className="brand-title" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
                GigSphere
              </span>
            </Link>
            <p>An Indian freelance marketplace connecting clients with skilled professionals through AI security and instant Razorpay payments.</p>
          </div>
          
          <div className="footer-links">
            <h4>For Clients</h4>
            <ul>
              <li><Link to="/explore">Explore Projects</Link></li>
              <li><Link to="/auth/client-join">Post a Project</Link></li>
              <li><Link to="/freelancers">Find Freelancers</Link></li>
            </ul>
          </div>
          
          <div className="footer-links">
            <h4>For Freelancers</h4>
            <ul>
              <li><Link to="/explore">Browse Projects</Link></li>
              <li><Link to="/auth/freelancer-join">Create Profile</Link></li>
              <li><Link to="/freelancers">Find Opportunities</Link></li>
            </ul>
          </div>
          
          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><Link to="/">About GigSphere</Link></li>
              <li><Link to="/explore">Marketplace Categories</Link></li>
              <li><Link to="/freelancers">Top Talent</Link></li>
              <li><a href="#how-it-works">AI Trust Verification</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <GigSphereEmblem size={20} />
          </div>
          <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.85rem' }}>GigSphere</span>
          <span style={{ color: '#475569' }}>•</span>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} GigSphere. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
