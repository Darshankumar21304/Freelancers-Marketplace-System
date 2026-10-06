import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, User, Briefcase, Clock, Tag } from 'lucide-react';
import { loginUser } from '../../../utils/authUtils';

export default function ReviewSubmitStep({ formData, prevStep, goToStep }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: 'freelancer',
          bio: formData.bio,
          skills: formData.skills ? formData.skills.join(', ') : '',
          country: formData.country,
          location: formData.location || formData.country,
          title: formData.title,
          hourlyRate: formData.hourlyRate
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const mergedProfile = {
        ...data.user,
        ...formData,
        avatar: data.user?.avatar || formData.profileImage || formData.avatar || '',
        profileImage: data.user?.avatar || formData.profileImage || formData.avatar || '',
        name: formData.fullName,
        location: formData.location || formData.country || data.user.location || 'India',
        country: formData.country || data.user.country || 'India',
        bio: formData.bio,
        title: formData.title
      };

      loginUser('freelancer', data.token, mergedProfile);
      navigate('/freelancer/dashboard');
    } catch (error) {
      console.error(error);
      alert(error.message); // Simple error display for now
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="step-content animate-fade-in">
      <h2 className="step-title">Review & Submit</h2>
      <p className="step-description">You're almost there! Review your information before joining.</p>

      <div className="review-summary">
        <div className="review-card glass">
          <div className="review-header">
            <h3>Personal Information</h3>
            <button type="button" className="btn-text" onClick={() => goToStep && goToStep(1)}>Edit</button>
          </div>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label">Full Name</span>
              <span className="review-value">{formData.fullName || '-'}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Email</span>
              <span className="review-value">{formData.email || '-'}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Country</span>
              <span className="review-value">{formData.country || '-'}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Location / City</span>
              <span className="review-value">{formData.location || '-'}</span>
            </div>
          </div>
        </div>

        <div className="review-card glass mt-4">
          <div className="review-header">
            <h3>Professional Profile</h3>
            <button type="button" className="btn-text" onClick={() => goToStep && goToStep(2)}>Edit</button>
          </div>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label"><Briefcase size={14} /> Title</span>
              <span className="review-value">{formData.title || '-'}</span>
            </div>
            <div className="review-item">
              <span className="review-label"><Tag size={14} /> Category</span>
              <span className="review-value">{formData.category || '-'}</span>
            </div>
            <div className="review-item">
              <span className="review-label"><Clock size={14} /> Availability</span>
              <span className="review-value">{formData.availability ? formData.availability.replace('-', ' ') : '-'}</span>
            </div>
          </div>
          <div className="review-skills mt-2">
            <span className="review-label">Skills: </span>
            <div className="skills-chips small">
              {(formData.skills || []).map((skill, index) => (
                <span key={index} className="skill-chip read-only">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="step-actions split mt-6">
        <button type="button" className="btn btn-outline back-button" onClick={prevStep} disabled={isSubmitting}>
          Back
        </button>
        <button
          type="button"
          className={`btn btn-primary next-button submit-btn ${isSubmitting ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
        </button>
      </div>
    </div>
  );
}
