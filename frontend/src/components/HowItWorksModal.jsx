import React, { useState } from 'react';
import { X, Search, Briefcase, FileCheck, CreditCard, Rocket, CheckCircle, UserPlus, FileText } from 'lucide-react';
import './HowItWorksModal.css';

const HowItWorksModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('client');

  if (!isOpen) return null;

  const clientSteps = [
    { icon: <UserPlus size={24} />, title: 'Post a Gig', desc: 'Create a detailed project brief specifying your requirements, budget, and timeline.' },
    { icon: <Search size={24} />, title: 'Review Proposals', desc: 'Receive bids from top-tier freelancers and review their portfolios and ratings.' },
    { icon: <Briefcase size={24} />, title: 'Hire & Collaborate', desc: 'Select the best fit, fund the secure escrow, and collaborate directly via chat.' },
    { icon: <FileCheck size={24} />, title: 'Approve & Pay', desc: 'Review the delivered work, approve it, and release funds securely.' }
  ];

  const freelancerSteps = [
    { icon: <Search size={24} />, title: 'Find Projects', desc: 'Browse the marketplace for projects that match your skills and expertise.' },
    { icon: <FileText size={24} />, title: 'Submit Proposals', desc: 'Send compelling proposals highlighting why you are the best fit for the job.' },
    { icon: <Rocket size={24} />, title: 'Do Great Work', desc: 'Collaborate with the client, deliver high-quality results, and meet deadlines.' },
    { icon: <CreditCard size={24} />, title: 'Get Paid securely', desc: 'Receive payment on time through our secure escrow system.' }
  ];

  return (
    <div className="how-it-works-overlay animate-fade-in" onClick={onClose}>
      <div className="how-it-works-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2>How GigSphere Works</h2>
          <p>The smartest way to work together, whether you're hiring or freelancing.</p>
        </div>

        <div className="tab-switcher">
          <button 
            className={`tab-btn ${activeTab === 'client' ? 'active' : ''}`}
            onClick={() => setActiveTab('client')}
          >
            For Clients
          </button>
          <button 
            className={`tab-btn ${activeTab === 'freelancer' ? 'active' : ''}`}
            onClick={() => setActiveTab('freelancer')}
          >
            For Freelancers
          </button>
        </div>

        <div className="steps-container">
          {(activeTab === 'client' ? clientSteps : freelancerSteps).map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-icon-wrapper">
                {step.icon}
                <div className="step-number">{index + 1}</div>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="get-started-btn" onClick={onClose}>
            Got it, Let's Go <CheckCircle size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;
