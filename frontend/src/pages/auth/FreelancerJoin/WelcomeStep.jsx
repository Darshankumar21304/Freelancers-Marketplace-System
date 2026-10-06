import React from 'react';
import { Briefcase, TrendingUp, Globe, ShieldCheck, ArrowRight } from 'lucide-react';

export default function WelcomeStep({ nextStep }) {
  return (
    <div className="step-content welcome-step animate-fade-in text-center">
      <div className="welcome-hero-banner">
        <div className="welcome-illustration glass">
          <div className="illustration-icon">
            <Briefcase size={36} color="#1a73e8" />
          </div>
          <div className="floating-badge badge-1">
            <TrendingUp size={14} color="#10b981" /> Pro Talent
          </div>
          <div className="floating-badge badge-2">
            <Globe size={14} color="#1a73e8" /> Global Reach
          </div>
        </div>

        <h2 className="step-title">Ready to start your journey?</h2>
        <p className="step-description">
          Join our marketplace as a freelancer and connect with clients worldwide. Build your reputation, showcase your skills, and grow your independent business.
        </p>
      </div>

      <div className="benefits-grid">
        <div className="benefit-card">
          <div className="benefit-icon-wrapper blue">
            <Globe size={22} color="#1a73e8" />
          </div>
          <div className="benefit-text">
            <h4>Global Opportunities</h4>
            <p>Work with clients from all over the world.</p>
          </div>
        </div>

        <div className="benefit-card green">
          <div className="benefit-icon-wrapper green">
            <TrendingUp size={22} color="#10b981" />
          </div>
          <div className="benefit-text">
            <h4>Grow Your Income</h4>
            <p>Set your own rates and keep more of what you earn.</p>
          </div>
        </div>

        <div className="benefit-card purple">
          <div className="benefit-icon-wrapper purple">
            <ShieldCheck size={22} color="#a142f4" />
          </div>
          <div className="benefit-text">
            <h4>Secure Payments</h4>
            <p>Get paid on time, every time with our protected escrow system.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
        <button className="btn-welcome-cta" onClick={nextStep}>
          <span>Join as Freelancer</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
