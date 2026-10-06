import React from 'react';
import { Building, Users, Briefcase } from 'lucide-react';

export default function CompanyInfoStep({ formData, updateFormData, nextStep, prevStep }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <div className="step-container">
      <h2 className="step-title text-center">Tell us about your company</h2>
      <p className="step-subtitle text-center">This helps freelancers understand who they'll be working with.</p>

      <form onSubmit={handleSubmit} className="step-form mt-4">
        <div className="form-group">
          <label className="standard-label">Company / Organization Name</label>
          <div className="input-with-icon join-input no-float">
            <Building className="input-icon" size={20} />
            <input 
              type="text" 
              name="companyName"
              placeholder="e.g. Acme Corp (Optional if individual)"
              value={formData.companyName || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="standard-label">Industry</label>
          <div className="input-with-icon join-input no-float">
            <Briefcase className="input-icon" size={20} />
            <select 
              name="industry" 
              value={formData.industry || ''} 
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select your industry</option>
              <option value="technology">Technology & Software</option>
              <option value="marketing">Marketing & Advertising</option>
              <option value="design">Design & Creative</option>
              <option value="finance">Finance & Accounting</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="standard-label">Company Size</label>
          <div className="input-with-icon join-input no-float">
            <Users className="input-icon" size={20} />
            <select 
              name="companySize" 
              value={formData.companySize || ''} 
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select company size</option>
              <option value="1">Just me (Individual)</option>
              <option value="2-9">2 - 9 employees</option>
              <option value="10-99">10 - 99 employees</option>
              <option value="100-499">100 - 499 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          </div>
        </div>

        <div className="step-actions">
          <button type="button" onClick={prevStep} className="btn btn-outline back-button">
            Back
          </button>
          <button type="submit" className="btn btn-primary next-button">
            Next Step
          </button>
        </div>
      </form>
    </div>
  );
}
