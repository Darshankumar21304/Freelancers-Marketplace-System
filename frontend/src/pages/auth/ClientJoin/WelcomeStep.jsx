import React from 'react';
import { Monitor, ArrowRight, Sparkles, Briefcase, ShieldCheck, Zap } from 'lucide-react';

export default function WelcomeStep({ nextStep }) {
  return (
    <div className="step-content welcome-step animate-fade-in text-center">
      <div className="welcome-hero-banner">
        <div className="welcome-illustration glass">
          <div className="illustration-icon">
            <Monitor size={36} color="#1a73e8" />
          </div>
          <div className="floating-badge badge-1">
            <Sparkles size={14} color="#f59e0b" /> Verified Talent
          </div>
          <div className="floating-badge badge-2">
            <Zap size={14} color="#10b981" /> Fast Hiring
          </div>
        </div>

        <h2 className="step-title">Welcome to GigSphere!</h2>
        <p className="step-description">
          Set up your client account in under 2 minutes to start connecting with top vetted freelancers worldwide.
        </p>
      </div>

      <div className="benefits-grid">
        <div className="benefit-card">
          <div className="benefit-icon-wrapper blue">
            <Sparkles size={22} color="#1a73e8" />
          </div>
          <div className="benefit-text">
            <h4>Post Projects Quickly</h4>
            <p>Publish project briefs and receive qualified bids fast.</p>
          </div>
        </div>

        <div className="benefit-card green">
          <div className="benefit-icon-wrapper green">
            <Briefcase size={22} color="#10b981" />
          </div>
          <div className="benefit-text">
            <h4>Hire Top Vetted Talent</h4>
            <p>Review proposals, ratings, and active portfolios.</p>
          </div>
        </div>

        <div className="benefit-card purple">
          <div className="benefit-icon-wrapper purple">
            <ShieldCheck size={22} color="#a142f4" />
          </div>
          <div className="benefit-text">
            <h4>Secure Escrow Payments</h4>
            <p>Release funds only when milestone deliverables are approved.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
        <button className="btn-welcome-cta" onClick={nextStep}>
          <span>Get Started as Client</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
