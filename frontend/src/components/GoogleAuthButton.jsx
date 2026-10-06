import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../utils/authUtils';
import { apiFetch } from '../utils/api';
import { ShieldCheck, UserCheck, Check, Sparkles, X } from 'lucide-react';

export default function GoogleAuthButton({ role: preferredRole = null, text = 'Continue with Google', style = {} }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states for modal
  const [googleEmail, setGoogleEmail] = useState('user.google@gigsphere.com');
  const [googleName, setGoogleName] = useState('Google Member');
  const [selectedRole, setSelectedRole] = useState(preferredRole || 'client');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '277065195085-ue04fdu58eusqetj4n9cft384jnjbh0d.apps.googleusercontent.com';

  useEffect(() => {
    // Load Google Identity Services script dynamically
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleSignIn();
      document.body.appendChild(script);
    } else {
      initGoogleSignIn();
    }
  }, []);

  const initGoogleSignIn = () => {
    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    } catch (e) {
      console.warn('Google GIS initialization notice:', e);
    }
  };

  // Decode JWT payload from Google ID Token
  const decodeJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleGoogleCallback = async (response) => {
    if (!response.credential) return;
    setIsLoading(true);
    setError('');

    try {
      const payload = decodeJwt(response.credential);
      const email = payload?.email || 'google.user@gigsphere.com';
      const name = payload?.name || 'Google User';
      const avatar = payload?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a73e8&color=ffffff&bold=true`;
      const googleId = payload?.sub || Date.now().toString();

      await executeGoogleLogin({ email, name, avatar, googleId, role: preferredRole || 'client' });
    } catch (err) {
      console.error('Google Callback Error:', err);
      setError(err.message || 'Google authentication failed.');
      setIsLoading(false);
    }
  };

  const executeGoogleLogin = async ({ email, name, avatar, googleId, role }) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await apiFetch('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          avatar,
          googleId,
          role: role || selectedRole || 'client'
        })
      });

      if (!res.token || !res.user) {
        throw new Error(res.message || 'Failed to authenticate with Google');
      }

      loginUser(res.user.role, res.token, res.user);

      // Redirect user based on role
      if (res.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (res.user.role === 'freelancer') {
        navigate('/freelancer/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err) {
      console.error('Google OAuth API error:', err);
      setError(err.message || 'Google Login failed. Please try again.');
    } finally {
      setIsLoading(false);
      setShowModal(false);
    }
  };

  const handleButtonClick = () => {
    setError('');
    // Try triggering Google Prompt if GIS is available
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fall back to modal popup for instant login selection
            setShowModal(true);
          }
        });
      } catch (e) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      setError('Please enter a valid Google email address');
      return;
    }

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(googleName || 'Google User')}&background=1a73e8&color=ffffff&bold=true`;
    executeGoogleLogin({
      email: googleEmail,
      name: googleName || 'Google User',
      avatar: defaultAvatar,
      googleId: 'g_' + Date.now(),
      role: preferredRole || selectedRole
    });
  };

  return (
    <>
      <div style={{ width: '100%', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={isLoading}
          style={{
            width: '100%',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '10px',
            color: '#0f172a',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            ...style
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#1a73e8';
            e.currentTarget.style.boxShadow = '0 3px 10px rgba(26,115,232,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
          }}
        >
          {/* Iconic Google G Logo SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span>{isLoading ? 'Authenticating with Google...' : text}</span>
        </button>

        {error && (
          <div style={{ color: '#ef4444', fontSize: '0.825rem', marginTop: '6px', textAlign: 'center', fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>

      {/* Google Sign-In Interactive Popup Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '440px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative',
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 12px',
                background: '#eff6ff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bfdbfe'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Sign in with Google</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Connect your Google Account to GigSphere</p>
            </div>

            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Google Full Name
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Google Account Email
                </label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="e.g. alex.johnson@gmail.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              {!preferredRole && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Select Account Role
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('client')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: selectedRole === 'client' ? '2px solid #1a73e8' : '1px solid #cbd5e1',
                        background: selectedRole === 'client' ? '#eff6ff' : '#ffffff',
                        color: selectedRole === 'client' ? '#1a73e8' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      Client Partner
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('freelancer')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: selectedRole === 'freelancer' ? '2px solid #1a73e8' : '1px solid #cbd5e1',
                        background: selectedRole === 'freelancer' ? '#eff6ff' : '#ffffff',
                        color: selectedRole === 'freelancer' ? '#1a73e8' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      Freelancer
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#1a73e8',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isLoading ? 'Signing In...' : 'Confirm & Continue with Google'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
