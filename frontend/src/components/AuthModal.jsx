import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, RefreshCw } from 'lucide-react';
import { loginUser } from '../utils/authUtils';
import { apiFetch } from '../utils/api';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    setErrorMsg(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      loginUser(res.user.role, res.token, res.user);
      onClose();
      navigate(`/${res.user.role}/dashboard`);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Parse JWT token from Google Identity Services
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  // Google SSO Handler
  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setLoading(true);

    const googleClientId = '277065195085-ue04fdu58eusqetj4n9cft384jnjbh0d.apps.googleusercontent.com';

    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          try {
            const decoded = parseJwt(response.credential);
            const userEmail = decoded?.email;
            const userName = decoded?.name || 'Google User';

            if (!userEmail) {
              throw new Error('Unable to retrieve email from Google Account.');
            }

            const res = await apiFetch('/auth/google', {
              method: 'POST',
              body: JSON.stringify({
                email: userEmail,
                name: userName,
                role: 'client'
              })
            });

            loginUser(res.user.role, res.token, { ...res.user, googleToken: response.credential });
            onClose();
            navigate(`/${res.user.role}/dashboard`);
          } catch (err) {
            setErrorMsg(err.message || 'Google authentication failed. Please sign in with email & password.');
          } finally {
            setLoading(false);
          }
        }
      });

      window.google.accounts.id.prompt();
    } else {
      setErrorMsg('Google Sign-In is not initialized or blocked by browser settings. Please sign in using your email & password.');
      setLoading(false);
    }
  };

  const handleGoToJoin = () => {
    onClose();
    navigate('/auth/register');
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card animate-zoom-in" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="auth-modal-header">
          <div className="auth-brand-logo">
            <div className="auth-logo-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="6" fill="url(#modal_gigsphere_grad)" />
                <ellipse cx="12" cy="12" rx="10" ry="4" stroke="url(#modal_gigsphere_grad_ring)" strokeWidth="2.2" strokeLinecap="round" transform="rotate(-30 12 12)" />
                <defs>
                  <linearGradient id="modal_gigsphere_grad" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1A73E8" />
                    <stop offset="0.5" stopColor="#A142F4" />
                    <stop offset="1" stopColor="#00E5FF" />
                  </linearGradient>
                  <linearGradient id="modal_gigsphere_grad_ring" x1="2" y1="8" x2="22" y2="16" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00E5FF" />
                    <stop offset="0.5" stopColor="#1A73E8" />
                    <stop offset="1" stopColor="#A142F4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="auth-brand-name">GigSphere</span>
          </div>

          <button onClick={onClose} className="auth-close-btn" title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="auth-modal-subhead">
          <h3>Log In to your account</h3>
          <p>Welcome back! Select your preferred sign in method.</p>
        </div>

        {errorMsg && (
          <div className="auth-error-banner">
            {errorMsg}
          </div>
        )}

        {/* Google SSO Button */}
        <div className="auth-google-section">
          <button type="button" onClick={handleGoogleAuth} disabled={loading} className="google-sso-btn">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>
          <div className="auth-divider">
            <span>or email authentication</span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleFormSubmit} className="auth-modal-form">
          <div className="auth-field-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="name@company.com" 
                required 
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={16} />
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="••••••••" 
                required 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? <RefreshCw size={16} className="spin" /> : null}
            {loading ? 'Authenticating...' : 'Log In to GigSphere'}
          </button>
        </form>

        {/* Switch to Register Page */}
        <div className="auth-modal-footer">
          <p>Don't have an account? <button type="button" onClick={handleGoToJoin} className="link-btn">Join GigSphere</button></p>
        </div>

      </div>
    </div>
  );
}
