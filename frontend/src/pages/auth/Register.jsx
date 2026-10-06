import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Briefcase, Monitor, ArrowLeft } from 'lucide-react';
import { loginUser } from '../../utils/authUtils';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import './Auth.css';

export default function Register() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRoleContinue = () => {
    if (!selectedRole) return;
    
    if (selectedRole === 'freelancer') {
      navigate('/auth/freelancer-join');
    } else if (selectedRole === 'client') {
      navigate('/auth/client-join');
    }
  };

  const handleClientRegister = (e) => {
    e.preventDefault();
    // Simulate successful registration and login for client
    loginUser('client');
    navigate('/client/dashboard');
  };

  return (
    <div className="auth-container">
      <div className="role-selection-wrapper">
        <div className="role-selection-header">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', padding: '0.35rem 1.1rem 0.35rem 0.55rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '40px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="6" fill="url(#reg_gigsphere_grad)" />
                <ellipse cx="12" cy="12" rx="10" ry="4" stroke="url(#reg_gigsphere_grad_ring)" strokeWidth="2.2" strokeLinecap="round" transform="rotate(-30 12 12)" />
                <defs>
                  <linearGradient id="reg_gigsphere_grad" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1A73E8" />
                    <stop offset="0.5" stopColor="#A142F4" />
                    <stop offset="1" stopColor="#00E5FF" />
                  </linearGradient>
                  <linearGradient id="reg_gigsphere_grad_ring" x1="2" y1="8" x2="22" y2="16" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00E5FF" />
                    <stop offset="0.5" stopColor="#1A73E8" />
                    <stop offset="1" stopColor="#A142F4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>GigSphere</span>
          </div>

          <h1>Join as a client or freelancer</h1>
          <p>Select your role to get started with GigSphere</p>
        </div>

          <div className="role-cards-container">
            {/* Client Card */}
            <div 
              className={`role-card-large ${selectedRole === 'client' ? 'selected' : ''}`}
              onClick={() => setSelectedRole('client')}
            >
              <div className="role-icon-wrapper client">
                <Monitor size={40} />
              </div>
              <h2>Join as a Client</h2>
              <p>Post projects, hire skilled freelancers, and manage work.</p>
              <div className="role-radio">
                <div className="radio-inner" />
              </div>
            </div>

            {/* Freelancer Card */}
            <div 
              className={`role-card-large ${selectedRole === 'freelancer' ? 'selected' : ''}`}
              onClick={() => setSelectedRole('freelancer')}
            >
              <div className="role-icon-wrapper freelancer">
                <Briefcase size={40} />
              </div>
              <h2>Join as a Freelancer</h2>
              <p>Offer your skills, find projects, and earn money.</p>
              <div className="role-radio">
                <div className="radio-inner" />
              </div>
            </div>
          </div>

          <div className="role-selection-footer">
            <button 
              className="btn btn-primary role-continue-btn"
              onClick={handleRoleContinue}
              disabled={!selectedRole}
            >
              {selectedRole === 'client' ? 'Continue as Client' : selectedRole === 'freelancer' ? 'Continue as Freelancer' : 'Create Account'}
            </button>

            <div style={{ width: '100%', maxWidth: '380px', margin: '20px auto 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>or sign up instantly with</span>
                <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
              </div>
              <GoogleAuthButton role={selectedRole || 'client'} text="Sign up with Google" />
            </div>

            <p style={{ marginTop: '12px' }}>
              Already have an account? <Link to="/auth/login">Log In</Link>
            </p>
          </div>
        </div>
      </div>
    );
}
