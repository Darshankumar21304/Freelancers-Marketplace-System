import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../../../utils/authUtils';
import GoogleAuthButton from '../../../components/GoogleAuthButton';
import LegalModal from '../../../components/LegalModal';

export default function AccountInfoStep({ formData, updateFormData, prevStep }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Legal Modal State
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  const openLegalModal = (tab = 'terms') => {
    setLegalTab(tab);
    setShowLegalModal(true);
  };
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateFormData({
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: 'client',
          companyName: formData.companyName,
          location: formData.country || formData.location,
          country: formData.country
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const mergedProfile = {
        ...data.user,
        ...formData,
        name: formData.fullName,
        location: formData.country || data.user.location || 'India',
        country: formData.country || data.user.country || 'India'
      };

      loginUser('client', data.token, mergedProfile);
      navigate('/client/dashboard');
    } catch (error) {
      console.error(error);
      alert(error.message); // Simple error display for now
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple password strength calculation
  const calculateStrength = (pass) => {
    let strength = 0;
    if (pass.length > 5) strength += 1;
    if (pass.length > 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    return Math.min(3, Math.floor(strength / 1.5));
  };

  const strength = calculateStrength(formData.password || '');

  return (
    <div className="step-container">
      <h2 className="step-title text-center">Create your account</h2>
      <p className="step-subtitle text-center">You're almost done! Set up your login details.</p>

      <div style={{ marginTop: '16px' }}>
        <GoogleAuthButton role="client" text="Quick Sign up with Google" />
        <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>or complete manually</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="step-form">
        <div className="form-group">
          <label className="standard-label">Full Name</label>
          <div className="input-with-icon join-input no-float">
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              name="fullName"
              placeholder="e.g. Jane Doe"
              value={formData.fullName || ''}
              onChange={handleChange}
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label className="standard-label">Email Address</label>
          <div className="input-with-icon join-input no-float">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              name="email"
              placeholder="e.g. jane@acme.com"
              value={formData.email || ''}
              onChange={handleChange}
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label className="standard-label">Password</label>
          <div className="input-with-icon join-input no-float">
            <Lock className="input-icon" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              placeholder="Create a strong password"
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
          {formData.password && (
            <div className="password-strength mt-2">
              <div className={`strength-bar ${strength >= 1 ? 'weak' : ''}`}></div>
              <div className={`strength-bar ${strength >= 2 ? 'medium' : ''}`}></div>
              <div className={`strength-bar ${strength >= 3 ? 'strong' : ''}`}></div>
            </div>
          )}
        </div>

        <div className="checkbox-group mt-4">
          <input 
            type="checkbox" 
            id="terms" 
            name="termsAccepted"
            checked={formData.termsAccepted || false}
            onChange={handleChange}
            required 
          />
          <label htmlFor="terms">
            I agree to the GigSphere <button type="button" onClick={() => openLegalModal('terms')} className="link-btn" style={{ fontSize: '0.85rem' }}>Terms of Service</button> and <button type="button" onClick={() => openLegalModal('privacy')} className="link-btn" style={{ fontSize: '0.85rem' }}>Privacy Policy</button>
          </label>
        </div>

        <div className="step-actions">
          <button type="button" onClick={prevStep} className="btn btn-outline back-button" disabled={isSubmitting}>
            Back
          </button>
          <button type="submit" className={`btn btn-primary next-button submit-btn ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting || !formData.termsAccepted}>
            {isSubmitting ? 'Creating Account...' : 'Complete Account Setup'}
          </button>
        </div>
      </form>

      {/* Interactive Legal Modal Popup */}
      <LegalModal 
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        defaultTab={legalTab}
      />
    </div>
  );
}
