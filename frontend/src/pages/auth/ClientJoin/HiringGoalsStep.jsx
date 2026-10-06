import React, { useState } from 'react';
import { Target, Search, X } from 'lucide-react';

export default function HiringGoalsStep({ formData, updateFormData, nextStep, prevStep }) {
  const [skillInput, setSkillInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skillsNeeded?.includes(skillInput.trim())) {
        updateFormData({
          skillsNeeded: [...(formData.skillsNeeded || []), skillInput.trim()]
        });
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    updateFormData({
      skillsNeeded: formData.skillsNeeded.filter(skill => skill !== skillToRemove)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <div className="step-container">
      <h2 className="step-title text-center">What are your hiring goals?</h2>
      <p className="step-subtitle text-center">Help us tailor your experience by telling us what you need.</p>

      <form onSubmit={handleSubmit} className="step-form mt-4">
        <div className="form-group">
          <label className="standard-label">What types of projects do you need help with?</label>
          <div className="input-with-icon join-input no-float">
            <Target className="input-icon" size={20} />
            <select 
              name="projectTypes" 
              value={formData.projectTypes || ''} 
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select project type</option>
              <option value="one-time">One-time projects</option>
              <option value="long-term">Long-term ongoing work</option>
              <option value="complex">Complex projects (multiple freelancers)</option>
              <option value="not-sure">I'm just exploring</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="standard-label">What skills are you looking for?</label>
          <div className="input-with-icon join-input no-float">
            <Search className="input-icon" size={20} />
            <input 
              type="text" 
              placeholder="Type a skill and press Enter"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
            />
          </div>
          <div className="skills-chips">
            {(formData.skillsNeeded || []).map((skill, index) => (
              <span key={index} className="skill-chip">
                {skill}
                <button type="button" onClick={() => removeSkill(skill)}><X size={14}/></button>
              </span>
            ))}
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
