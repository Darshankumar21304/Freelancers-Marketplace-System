import React, { useState } from 'react';
import { Check } from 'lucide-react';
import './FreelancerJoin.css';

import WelcomeStep from './WelcomeStep';
import AccountInfoStep from './AccountInfoStep';
import ProfessionalDetailsStep from './ProfessionalDetailsStep';
import ProfileSetupStep from './ProfileSetupStep';
import PortfolioStep from './PortfolioStep';
import IdentityVerificationStep from './IdentityVerificationStep';
import ReviewSubmitStep from './ReviewSubmitStep';

const STEPS = [
  "Welcome",
  "Account",
  "Professional",
  "Profile",
  "Portfolio",
  "Verify",
  "Review"
];

export default function FreelancerJoin() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Account Info
    fullName: '',
    username: '',
    email: '',
    password: '',
    country: '',
    // Professional Details
    title: '',
    category: '',
    experience: '',
    skills: [],
    // Profile Setup
    bio: '',
    availability: '',
    hourlyRate: '',
    profileImage: null,
    // Portfolio
    portfolio: [],
    // Verification
    termsAccepted: false
  });

  const updateFormData = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Calculate progress percentage
  const progressPercentage = ((currentStep) / (STEPS.length - 1)) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep nextStep={nextStep} />;
      case 1:
        return <AccountInfoStep formData={formData} updateFormData={updateFormData} nextStep={nextStep} />;
      case 2:
        return <ProfessionalDetailsStep formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <ProfileSetupStep formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return <PortfolioStep formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 5:
        return <IdentityVerificationStep formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 6:
        return <ReviewSubmitStep formData={formData} prevStep={prevStep} goToStep={setCurrentStep} />;
      default:
        return <WelcomeStep nextStep={nextStep} />;
    }
  };

  return (
    <div className="freelancer-join-container">
      <div className="join-wizard-card">
        {currentStep > 0 && (
          <div className="wizard-header">
            <h3>Join as a Freelancer</h3>
            <div className="progress-container">
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="step-indicators">
                {STEPS.map((step, index) => {
                  if (index === 0) return null; // Skip welcome step in top progress
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  
                  return (
                    <div 
                      key={step} 
                      className={`step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    >
                      <div className="step-icon-wrapper">
                        {isCompleted ? <Check size={12} /> : <span>{index}</span>}
                      </div>
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        <div className="wizard-body">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
