import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, Lock } from 'lucide-react';
import './LegalModal.css';

export default function LegalModal({ isOpen, onClose, defaultTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'terms' | 'privacy'

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="legal-modal-overlay" onClick={onClose}>
      <div className="legal-modal-card animate-zoom-in" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="legal-modal-header">
          <div className="legal-brand">
            <div className="legal-icon-badge">
              <ShieldCheck size={20} color="#1a73e8" />
            </div>
            <span className="legal-brand-name">GigSphere Legal</span>
          </div>
          <button onClick={onClose} className="legal-close-btn" title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="legal-tab-bar">
          <button 
            className={`legal-tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            <FileText size={15} /> Terms of Service
          </button>
          <button 
            className={`legal-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <Lock size={15} /> Privacy Policy
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="legal-modal-content">
          {activeTab === 'terms' ? (
            <div className="legal-section">
              <h2>Terms of Service</h2>
              <p className="legal-effective">Effective Date: August 30, 2026</p>

              <h3>1. Platform Scope & Service Contract</h3>
              <p>
                GigSphere operates as an AI-audited freelance marketplace platform connecting clients with independent freelancers across India and globally. By creating an account, users agree to abide by transparent communication, escrow milestone protection, and fair dispute procedures.
              </p>

              <h3>2. 100% Escrow Vault & Deposit Regulations</h3>
              <p>
                All project funds must be deposited into the GigSphere Escrow Vault via Razorpay prior to project initiation. Funds remain locked in escrow until the client reviews and explicitly approves the completed work milestone.
              </p>

              <h3>3. Platform Commission & Payout Withdrawals</h3>
              <p>
                GigSphere charges a flat 10% platform commission on completed project milestones. Freelancers receive 90% net earnings credited to their wallet balance, available for instant payout withdrawal directly to their UPI ID or Bank Account.
              </p>

              <h3>4. Dispute Resolution & Verdict Policy</h3>
              <p>
                In the event of a dispute, both parties can present evidence in the Dispute Resolution Portal. Admin verdicts are binding and final. Approved refunds return 100% of escrow balance to the client's wallet.
              </p>
            </div>
          ) : (
            <div className="legal-section">
              <h2>Privacy Policy</h2>
              <p className="legal-effective">Effective Date: August 30, 2026</p>

              <h3>1. Information We Collect</h3>
              <p>
                GigSphere collects personal information necessary to provide marketplace services, including name, email address, bank account/UPI details for payouts, and portfolio content submitted for AI risk scoring.
              </p>

              <h3>2. Payment Security & Encryption</h3>
              <p>
                All financial transactions are processed securely using 256-bit SSL encryption via Razorpay. GigSphere does not store raw credit card numbers or banking passwords on internal servers.
              </p>

              <h3>3. Automated AI Risk Auditing</h3>
              <p>
                User profiles and content submissions undergo automated AI risk auditing to prevent fraud, spam, and identity impersonation. Risk scores are evaluated algorithmically to maintain marketplace integrity.
              </p>

              <h3>4. Data Protection Rights</h3>
              <p>
                Users maintain the right to access, update, or request deletion of their personal profile data at any time through their Account Settings dashboard.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="legal-modal-footer">
          <button onClick={onClose} className="legal-accept-btn">
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
}
