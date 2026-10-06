import React, { useState } from 'react';
import { Check } from 'lucide-react';
import '../FreelancerJoin/FreelancerJoin.css'; // Reusing freelancer styles

import WelcomeStep from './WelcomeStep';
import CompanyInfoStep from './CompanyInfoStep';
import HiringGoalsStep from './HiringGoalsStep';
import AccountInfoStep from './AccountInfoStep';

const STEPS = [
  "Welcome",
  "Company Info",
  "Hiring Goals",
  "Account Info"
];

export default function ClientJoin() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Company Info
    companyName: '',
    industry: '',
    companySize: '',
    // Hiring Goals
    projectTypes: '',
    skillsNeeded: [],
    // Account Info
    fullName: '',
    email: '',
    password: '',
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep nextStep={nextStep} />;
      case 1:
        return <CompanyInfoStep formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 2:
        return <HiringGoalsStep formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <AccountInfoStep formData={formData} updateFormData={updateFormData} prevStep={prevStep} />;
      default:
        return <WelcomeStep nextStep={nextStep} />;
    }
  };

  const progressPercentage = ((currentStep) / (STEPS.length - 1)) * 100;

  return (
    <div className="freelancer-join-container">
      <div className="join-wizard-card">
        {/* Progress Header */}
        <div className="wizard-header">
          <h3>Join as a Client</h3>
          <div className="progress-container">
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            <div className="step-indicators">
              {STEPS.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div 
                    key={step} 
                    className={`step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  >
                    <div className="step-icon-wrapper">
                      {isCompleted ? <Check size={12} /> : <span>{index + 1}</span>}
                    </div>
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="wizard-body">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
