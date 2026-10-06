import React, { useState } from 'react';
import { User, Mail, Lock, Globe2, Eye, EyeOff } from 'lucide-react';
import GoogleAuthButton from '../../../components/GoogleAuthButton';

export default function AccountInfoStep({ formData, updateFormData, nextStep }) {
  const [showPassword, setShowPassword] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    // In a real app, you'd add deeper validation here
    nextStep();
  };

  const getPasswordStrength = () => {
    const pass = formData.password || '';
    if (pass.length === 0) return 0;
    if (pass.length < 6) return 1;
    if (pass.length < 10) return 2;
    return 3;
  };

  const strength = getPasswordStrength();

  return (
    <div className="step-content animate-fade-in">
      <h2 className="step-title">Create your account</h2>
      <p className="step-description">First things first, let's set up your login credentials.</p>

      <div style={{ marginTop: '16px', marginBottom: '20px' }}>
        <GoogleAuthButton role="freelancer" text="Quick Sign up with Google" />
        <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>or complete manually</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>
      </div>

      <form onSubmit={handleNext} className="join-form">
        <div className="form-row">
          <div className="form-group">
            <label className="standard-label">Full Name</label>
            <div className="input-with-icon join-input no-float">
              <User className="input-icon" size={20} />
              <input 
                type="text" 
                id="fullName" 
                name="fullName"
                placeholder="e.g. John Doe"
                value={formData.fullName || ''}
                onChange={handleChange}
                required 
              />
            </div>
          </div>
          <div className="form-group">
            <label className="standard-label">Username</label>
            <div className="input-with-icon join-input no-float">
              <User className="input-icon" size={20} />
              <input 
                type="text" 
                id="username" 
                name="username"
                placeholder="e.g. john_doe"
                value={formData.username || ''}
                onChange={handleChange}
                required 
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="standard-label">Email Address</label>
          <div className="input-with-icon join-input no-float">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              id="email" 
              name="email"
              placeholder="e.g. john@example.com"
              value={formData.email || ''}
              onChange={handleChange}
              required 
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="standard-label">Country</label>
            <div className="input-with-icon join-input no-float">
              <Globe2 className="input-icon" size={20} />
              <input 
                type="text" 
                id="country" 
                name="country"
                placeholder="e.g. India"
                value={formData.country || ''}
                onChange={handleChange}
                required 
              />
            </div>
          </div>
          <div className="form-group">
            <label className="standard-label">City / Location</label>
            <div className="input-with-icon join-input no-float">
              <Globe2 className="input-icon" size={20} />
              <input 
                type="text" 
                id="location" 
                name="location"
                placeholder="e.g. Mumbai"
                value={formData.location || ''}
                onChange={handleChange}
                required 
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="standard-label">Password</label>
          <div className="input-with-icon join-input no-float">
            <Lock className="input-icon" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              id="password" 
              name="password"
              placeholder="••••••••"
              value={formData.password || ''}
              onChange={handleChange}
              required 
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <div className="password-strength-container mt-2">
            <div className={`strength-bar ${strength >= 1 ? 'weak' : ''}`}></div>
            <div className={`strength-bar ${strength >= 2 ? 'medium' : ''}`}></div>
            <div className={`strength-bar ${strength >= 3 ? 'strong' : ''}`}></div>
          </div>
          <p className="strength-text">
            {strength === 0 && "Enter a password"}
            {strength === 1 && "Weak - add more characters"}
            {strength === 2 && "Good - add symbols or numbers"}
            {strength === 3 && "Strong password!"}
          </p>
        </div>

        <div className="step-actions">
          <button type="submit" className="btn btn-primary next-button">
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
