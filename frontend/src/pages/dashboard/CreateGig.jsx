import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle, ChevronRight, ChevronLeft, Info, Upload,
  X, Briefcase, Calendar, Shield, Eye, Clock, IndianRupee
} from 'lucide-react';
import axios from 'axios';
import { uploadFileToCloudinary, apiFetch } from '../../utils/api';
import './CreateProject.css';

const steps = [
  { id: 1, title: 'Project Basics', desc: 'Title, category & description' },
  { id: 2, title: 'Skills & Requirements', desc: 'Choose expertise needed' },
  { id: 3, title: 'Budget', desc: 'Set project pricing' },
  { id: 4, title: 'Timeline & Milestones', desc: 'Define schedule & deliverables' },
  { id: 5, title: 'Attachments & Visibility', desc: 'Files and project access' },
  { id: 6, title: 'Review & Publish', desc: 'Final review before publishing' }
];

export default function CreateGig() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [files, setFiles] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    skills: [],
    experienceLevel: 'Intermediate',
    complexity: 'Medium',
    budgetType: 'Fixed Price',
    minBudget: '',
    maxBudget: '',
    minRate: '',
    maxRate: '',
    duration: '1 to 3 months',
    deadline: '',
    visibility: 'Public',
    includeMilestones: false,
    milestones: [{ id: 1, title: '', amount: '', date: '' }]
  });

  const [skillInput, setSkillInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
  };

  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const selectedFiles = Array.from(e.target.files);
    setIsUploadingFiles(true);

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const mime = file.type;
        const isImg = mime.startsWith('image/');
        const isVid = mime.startsWith('video/') || mime.startsWith('audio/');
        const isDoc = mime.includes('pdf') || mime.includes('word') || mime.includes('text');

        if (isImg && file.size > 10 * 1024 * 1024) throw new Error(`Image '${file.name}' exceeds 10MB Cloudinary limit.`);
        if (isDoc && file.size > 15 * 1024 * 1024) throw new Error(`Document '${file.name}' exceeds 15MB Cloudinary limit.`);
        if (isVid && file.size > 50 * 1024 * 1024) throw new Error(`Video '${file.name}' exceeds 50MB Cloudinary limit.`);

        const res = await uploadFileToCloudinary(file);
        return {
          name: file.name,
          url: res.url,
          publicId: res.publicId,
          size: file.size
        };
      });

      const uploadedResults = await Promise.all(uploadPromises);
      setFiles(prev => [...prev, ...uploadedResults]);
    } catch (err) {
      alert(err.message || 'Error uploading file to Cloudinary');
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        const isCategoryValid = formData.category !== 'Other'
          ? Boolean(formData.category)
          : Boolean(formData.customCategory && formData.customCategory.trim());
        return formData.title.trim().length > 0 && isCategoryValid && formData.description.trim().length > 0;
      case 2:
        return formData.skills.length > 0 || skillInput.trim().length > 0;
      case 3:
        if (formData.budgetType === 'Fixed Price') return Number(formData.maxBudget) > 0;
        return Number(formData.maxRate) > 0;
      case 4:
        if (formData.includeMilestones) {
          return formData.milestones.every(m => m.title.trim() !== '' && m.amount !== '' && m.date !== '');
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && skillInput.trim()) {
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      }
      setSkillInput('');
    }

    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } else {
      alert('Please fill all required fields correctly before proceeding.');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handlePublish = async () => {
    let currentSkills = [...formData.skills];
    if (skillInput.trim() && !currentSkills.includes(skillInput.trim())) {
      currentSkills.push(skillInput.trim());
      setFormData(prev => ({ ...prev, skills: currentSkills }));
      setSkillInput('');
    }

    if (!validateStep(1)) {
      alert('Please complete Step 1: Provide a project title, category, and description.');
      setCurrentStep(1);
      return;
    }

    if (currentSkills.length === 0) {
      alert('Please complete Step 2: Add at least one required skill for your project.');
      setCurrentStep(2);
      return;
    }

    if (!validateStep(3)) {
      alert('Please complete Step 3: Specify a valid maximum budget or hourly rate.');
      setCurrentStep(3);
      return;
    }

    if (!validateStep(4)) {
      alert('Please complete Step 4: Fill in all milestone details or turn off milestones.');
      setCurrentStep(4);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category === 'Other' ? (formData.customCategory || 'Other') : formData.category,
        skills: currentSkills,
        experienceLevel: formData.experienceLevel,
        budgetType: formData.budgetType,
        budget: formData.budgetType === 'Fixed Price' ? formData.maxBudget : formData.maxRate,
        duration: formData.duration,
        deadline: formData.deadline || formData.duration,
        attachments: files.map(f => f.name)
      };

      await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setIsSubmitting(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error creating project:', error);
      alert(error.message || 'Failed to publish project. Please try again.');
      setIsSubmitting(false);
    }
  };

  const calculateProgress = () => {
    return ((currentStep - 1) / (steps.length - 1)) * 100;
  };

  const calculateCompletion = () => {
    let completedSteps = 0;
    if (validateStep(1)) completedSteps++;
    if (validateStep(2)) completedSteps++;
    if (validateStep(3)) completedSteps++;
    if (validateStep(4)) completedSteps++;
    if (formData.visibility) completedSteps++;
    return Math.round((completedSteps / 5) * 100);
  };

  if (showSuccess) {
    return (
      <div className="gigsphere-create-project">
        <div className="gcpj-success-view" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center' }}>
          <CheckCircle size={60} style={{ color: '#16a34a', marginBottom: '20px' }} />
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Project Published Successfully!</h1>
          <p style={{ color: '#6b7280', marginBottom: '30px' }}>Your project has been posted to the marketplace and is now visible to freelancers.</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/client/dashboard/my-projects" className="gcpj-back-button">View My Projects</Link>
            <button onClick={() => { setShowSuccess(false); setCurrentStep(1); setFormData({ ...formData, title: '', description: '' }) }} className="gcpj-next-button">
              Create Another Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gigsphere-create-project">
      <div className="gcpj-page">

        {/* Page Header */}
        <div className="gcpj-page-header">
          <div className="gcpj-page-header-content">
            <div className="gcpj-breadcrumb">
              Dashboard / Create Project
            </div>
            <h1 className="gcpj-page-title">Post a New Project</h1>
            <p className="gcpj-page-description">Tell us what you need and connect with skilled freelancers.</p>
          </div>
          <div className="gcpj-draft-status">
            <button className="gcpj-save-draft-button">Save Draft</button>
          </div>
        </div>

        {/* Wizard Layout */}
        <div className="gcpj-wizard-layout">

          {/* Left Stepper */}
          <div className="gcpj-stepper-column">
            <div className="gcpj-stepper-card">
              <h3 className="gcpj-stepper-heading">Creation Steps</h3>
              <div className="gcpj-step-list">
                {steps.map((step, idx) => {
                  const isCompleted = currentStep > step.id;
                  const isActive = currentStep === step.id;
                  let stepClass = 'gcpj-step-item gcpj-step-upcoming';
                  if (isActive) stepClass = 'gcpj-step-item gcpj-step-active';
                  if (isCompleted) stepClass = 'gcpj-step-item gcpj-step-completed';

                  return (
                    <div
                      key={step.id}
                      className={stepClass}
                      onClick={() => {
                        if (step.id < currentStep || (step.id === currentStep + 1 && validateStep(currentStep))) {
                          // Auto add skill if navigating via stepper
                          if (currentStep === 2 && skillInput.trim()) {
                            if (!formData.skills.includes(skillInput.trim())) {
                              setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
                            }
                            setSkillInput('');
                          }
                          setCurrentStep(step.id);
                        }
                      }}
                      style={{ cursor: (step.id < currentStep || (step.id === currentStep + 1 && validateStep(currentStep))) ? 'pointer' : 'default' }}
                    >
                      {idx !== steps.length - 1 && <div className="gcpj-step-connector" />}
                      <div className="gcpj-step-indicator">
                        {isCompleted ? <CheckCircle size={16} /> : <span className="gcpj-step-number">{step.id}</span>}
                      </div>
                      <div className="gcpj-step-content">
                        <h4 className="gcpj-step-title">{step.title}</h4>
                        <p className="gcpj-step-description">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Form */}
          <div className="gcpj-form-column">
            <div className="gcpj-form-card">
              <div className="gcpj-form-header">
                <div className="gcpj-step-counter">Step {currentStep} of {steps.length}</div>
                <h2 className="gcpj-form-title">{steps[currentStep - 1].title}</h2>
                <p className="gcpj-form-subtitle">Let's start with the essential information about your project.</p>
                <div className="gcpj-progress-track">
                  <div className="gcpj-progress-fill" style={{ width: `${calculateProgress()}%` }}></div>
                </div>
              </div>

              <div className="gcpj-form-body">
                {/* STEP 1 */}
                {currentStep === 1 && (
                  <div>
                    <div className="gcpj-field-group">
                      <label className="gcpj-label">Project Title <span className="gcpj-required">*</span></label>
                      <input
                        type="text" name="title" value={formData.title} onChange={handleChange}
                        placeholder="Example: Build a responsive e-commerce website"
                        className="gcpj-input"
                      />
                      <div className="gcpj-helper-row">
                        <span className="gcpj-helper-text">A clear title helps skilled freelancers understand your requirement.</span>
                      </div>
                    </div>

                    <div className="gcpj-field-group">
                      <label className="gcpj-label">Category <span className="gcpj-required">*</span></label>
                      <select name="category" value={formData.category} onChange={handleChange} className="gcpj-select">
                        <option value="">Select a project category</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Mobile Apps">Mobile Apps</option>
                        <option value="Design & Creative">Design & Creative</option>
                        <option value="Writing & Translation">Writing & Translation</option>
                        <option value="AI & Machine Learning">AI & Machine Learning</option>
                        <option value="Data & Analytics">Data & Analytics</option>
                        <option value="Video & Animation">Video & Animation</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                        <option value="Other">Other (Specify custom category)</option>
                      </select>
                    </div>

                    {formData.category === 'Other' && (
                      <div className="gcpj-field-group">
                        <label className="gcpj-label">Specify Custom Category <span className="gcpj-required">*</span></label>
                        <input
                          type="text"
                          name="customCategory"
                          value={formData.customCategory || ''}
                          onChange={handleChange}
                          placeholder="e.g. Blockchain Development, Game Design, Cloud DevOps..."
                          className="gcpj-input"
                        />
                        <div className="gcpj-helper-row">
                          <span className="gcpj-helper-text">Mention your exact project category so freelancers can find your post.</span>
                        </div>
                      </div>
                    )}

                    <div className="gcpj-field-group">
                      <label className="gcpj-label">Project Description <span className="gcpj-required">*</span></label>
                      <textarea
                        name="description" value={formData.description} onChange={handleChange}
                        placeholder="Describe your project goals, requirements, expected deliverables, and any important details freelancers should know."
                        className="gcpj-textarea"
                      />
                      <div className="gcpj-helper-row">
                        <span></span>
                        <span className="gcpj-character-count">{formData.description.length} / 2000</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {currentStep === 2 && (
                  <div>
                    <div className="gcpj-field-group">
                      <label className="gcpj-label">Required Skills <span className="gcpj-required">*</span></label>
                      <div className="gcpj-skills-input">
                        <div className="gcpj-skills-list">
                          {formData.skills.map(skill => (
                            <span key={skill} className="gcpj-skill-chip">
                              {skill}
                              <button type="button" onClick={() => removeSkill(skill)} className="gcpj-skill-remove"><X size={14} /></button>
                            </span>
                          ))}
                          <input
                            type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={handleAddSkill}
                            onBlur={() => {
                              if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
                                setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
                                setSkillInput('');
                              }
                            }}
                            placeholder="Type a skill and press Enter"
                            style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: '150px' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="gcpj-field-row">
                      <div className="gcpj-field-group">
                        <label className="gcpj-label">Experience Level</label>
                        <div className="gcpj-budget-type-grid">
                          {['Beginner', 'Intermediate', 'Expert'].map(level => (
                            <div
                              key={level}
                              onClick={() => setFormData({ ...formData, experienceLevel: level })}
                              className={`gcpj-budget-type-card ${formData.experienceLevel === level ? 'gcpj-budget-type-selected' : ''}`}
                            >
                              <Briefcase size={20} />
                              <div>{level}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="gcpj-field-group">
                      <label className="gcpj-label">Project Complexity</label>
                      <select name="complexity" value={formData.complexity} onChange={handleChange} className="gcpj-select">
                        <option value="Small">Small (Quick task)</option>
                        <option value="Medium">Medium (Well-defined project)</option>
                        <option value="Large">Large (Complex initiative)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {currentStep === 3 && (
                  <div>
                    <div className="gcpj-field-group">
                      <label className="gcpj-label">Project Budget Type <span className="gcpj-required">*</span></label>
                      <div className="gcpj-budget-type-grid">
                        <div
                          onClick={() => setFormData({ ...formData, budgetType: 'Fixed Price' })}
                          className={`gcpj-budget-type-card ${formData.budgetType === 'Fixed Price' ? 'gcpj-budget-type-selected' : ''}`}
                        >
                          <Briefcase size={24} />
                          <div>Fixed Price</div>
                          <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Pay a set amount for the completed project.</span>
                        </div>
                        <div
                          onClick={() => setFormData({ ...formData, budgetType: 'Hourly' })}
                          className={`gcpj-budget-type-card ${formData.budgetType === 'Hourly' ? 'gcpj-budget-type-selected' : ''}`}
                        >
                          <Clock size={24} />
                          <div>Hourly Rate</div>
                          <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Pay for the hours worked by the freelancer.</span>
                        </div>
                      </div>
                    </div>

                    {formData.budgetType === 'Fixed Price' ? (
                      <div className="gcpj-field-row">
                        <div className="gcpj-field-group">
                          <label className="gcpj-label">Minimum Budget ₹</label>
                          <div className="gcpj-currency-input-wrapper">
                            <IndianRupee size={16} className="gcpj-currency-symbol" />
                            <input type="number" name="minBudget" value={formData.minBudget} onChange={handleChange} className="gcpj-currency-input" placeholder="5000" />
                          </div>
                        </div>
                        <div className="gcpj-field-group">
                          <label className="gcpj-label">Maximum Budget ₹ <span className="gcpj-required">*</span></label>
                          <div className="gcpj-currency-input-wrapper">
                            <IndianRupee size={16} className="gcpj-currency-symbol" />
                            <input type="number" name="maxBudget" value={formData.maxBudget} onChange={handleChange} className="gcpj-currency-input" placeholder="25000" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="gcpj-field-row">
                        <div className="gcpj-field-group">
                          <label className="gcpj-label">Minimum Rate ₹/hour</label>
                          <div className="gcpj-currency-input-wrapper">
                            <IndianRupee size={16} className="gcpj-currency-symbol" />
                            <input type="number" name="minRate" value={formData.minRate} onChange={handleChange} className="gcpj-currency-input" placeholder="500" />
                          </div>
                        </div>
                        <div className="gcpj-field-group">
                          <label className="gcpj-label">Maximum Rate ₹/hour <span className="gcpj-required">*</span></label>
                          <div className="gcpj-currency-input-wrapper">
                            <IndianRupee size={16} className="gcpj-currency-symbol" />
                            <input type="number" name="maxRate" value={formData.maxRate} onChange={handleChange} className="gcpj-currency-input" placeholder="1500" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4 */}
                {currentStep === 4 && (
                  <div>
                    <div className="gcpj-field-group">
                      <label className="gcpj-label">Project Duration</label>
                      <select name="duration" value={formData.duration} onChange={handleChange} className="gcpj-select">
                        <option value="Less than 1 week">Less than 1 week</option>
                        <option value="1 to 4 weeks">1 to 4 weeks</option>
                        <option value="1 to 3 months">1 to 3 months</option>
                        <option value="More than 3 months">More than 3 months</option>
                      </select>
                    </div>

                    <div className="gcpj-field-group">
                      <label className="gcpj-label">Project Deadline <span className="gcpj-required">*</span></label>
                      <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="gcpj-input" />
                    </div>

                    <div className="gcpj-field-group" style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: formData.includeMilestones ? '16px' : '0' }}>
                        <div>
                          <label className="gcpj-label" style={{ marginBottom: '4px' }}>Define Milestones (Optional)</label>
                          <p className="gcpj-helper-text" style={{ margin: 0 }}>Break your project into manageable phases for easier tracking and payment.</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.includeMilestones}
                            onChange={(e) => setFormData({ ...formData, includeMilestones: e.target.checked })}
                            style={{ display: 'none' }}
                          />
                          <div className={`toggle-track ${formData.includeMilestones ? 'active' : ''}`} style={{ width: '40px', height: '24px', background: formData.includeMilestones ? 'var(--primary)' : '#cbd5e1', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                            <div className="toggle-thumb" style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.includeMilestones ? '19px' : '3px', transition: '0.3s' }}></div>
                          </div>
                        </label>
                      </div>

                      {formData.includeMilestones && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {formData.milestones.map((milestone, index) => (
                            <div key={milestone.id} className="gcpj-milestone-grid" style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Milestone Title</label>
                                <input type="text" value={milestone.title} onChange={(e) => {
                                  const newMilestones = [...formData.milestones];
                                  newMilestones[index].title = e.target.value;
                                  setFormData({ ...formData, milestones: newMilestones });
                                }} className="gcpj-input" placeholder="e.g. Design Homepage" />
                              </div>
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Amount ₹</label>
                                <input type="number" value={milestone.amount} onChange={(e) => {
                                  const newMilestones = [...formData.milestones];
                                  newMilestones[index].amount = e.target.value;
                                  setFormData({ ...formData, milestones: newMilestones });
                                }} className="gcpj-input" placeholder="5000" />
                              </div>
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Expected Date</label>
                                <input type="date" value={milestone.date} onChange={(e) => {
                                  const newMilestones = [...formData.milestones];
                                  newMilestones[index].date = e.target.value;
                                  setFormData({ ...formData, milestones: newMilestones });
                                }} className="gcpj-input" />
                              </div>
                              {formData.milestones.length > 1 && (
                                <button type="button" onClick={() => {
                                  setFormData({ ...formData, milestones: formData.milestones.filter((_, i) => i !== index) });
                                }} style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, milestones: [...formData.milestones, { id: Date.now(), title: '', amount: '', date: '' }] })}
                            style={{ padding: '8px 16px', background: 'transparent', border: '1px dashed var(--primary)', color: 'var(--primary)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-start' }}
                          >
                            + Add Another Milestone
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 5 */}
                {currentStep === 5 && (
                  <div>
                    <div className="gcpj-field-group">
                      <label className="gcpj-label">Attachments</label>
                      <div className="gcpj-upload-zone" onClick={() => document.getElementById('project-files').click()} style={{ cursor: 'pointer' }}>
                        <Upload className="gcpj-upload-icon" />
                        <div className="gcpj-upload-title">Click to upload or drag and drop</div>
                        <div className="gcpj-upload-description">SVG, PNG, JPG, PDF or ZIP (max. 10MB)</div>
                        <button type="button" className="gcpj-upload-button">Browse Files</button>
                        <input type="file" id="project-files" multiple style={{ display: 'none' }} onChange={handleFileChange} />
                      </div>
                      {files.length > 0 && (
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {files.map((f, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f3f4f6', borderRadius: '4px' }}>
                              <span style={{ fontSize: '14px' }}>{f.name}</span>
                              <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="gcpj-field-group">
                      <label className="gcpj-label">Project Visibility</label>
                      <div className="gcpj-budget-type-grid">
                        <div
                          onClick={() => setFormData({ ...formData, visibility: 'Public' })}
                          className={`gcpj-budget-type-card ${formData.visibility === 'Public' ? 'gcpj-budget-type-selected' : ''}`}
                        >
                          <Eye size={20} />
                          <div>Public Project</div>
                        </div>
                        <div
                          onClick={() => setFormData({ ...formData, visibility: 'Private' })}
                          className={`gcpj-budget-type-card ${formData.visibility === 'Private' ? 'gcpj-budget-type-selected' : ''}`}
                        >
                          <Shield size={20} />
                          <div>Invite Only</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6 */}
                {currentStep === 6 && (
                  <div>
                    <div className="gcpj-review-section">
                      <div className="gcpj-review-header">
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{formData.title || 'Untitled Project'}</h3>
                        <button onClick={() => setCurrentStep(1)} className="gcpj-review-edit-button">Edit</button>
                      </div>
                      <div className="gcpj-review-content">
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                          <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{formData.category || 'No category'}</span>
                          <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{formData.experienceLevel}</span>
                        </div>
                        <p style={{ fontSize: '14px', lineHeight: 1.6, marginBottom: '16px', color: '#4b5563' }}>{formData.description || 'No description provided.'}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px 0', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Budget</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                              {formData.budgetType === 'Fixed Price'
                                ? `${formData.minBudget ? `₹${formData.minBudget} - ` : ''}₹${formData.maxBudget || '0'}`
                                : `${formData.minRate ? `₹${formData.minRate}/hr - ` : ''}₹${formData.maxRate || '0'}/hr`}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Timeline</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{formData.deadline || 'Not set'}</div>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Skills</div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {formData.skills.length > 0 ? formData.skills.map(skill => (
                              <span key={skill} style={{ border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{skill}</span>
                            )) : <span style={{ fontSize: '12px', color: '#6b7280' }}>No skills selected</span>}
                          </div>
                        </div>

                        <div style={{ marginTop: '16px' }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Attachments</div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {files.length > 0 ? files.map((f, i) => (
                              <span key={i} style={{ border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{f.name}</span>
                            )) : <span style={{ fontSize: '12px', color: '#6b7280' }}>No attachments</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="gcpj-form-footer">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1 || isSubmitting}
                  className="gcpj-back-button"
                  style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
                >
                  <ChevronLeft size={16} /> Back
                </button>

                {currentStep < steps.length ? (
                  <button onClick={handleNext} className="gcpj-next-button">
                    Next Step <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handlePublish}
                    disabled={isSubmitting}
                    className="gcpj-publish-button"
                  >
                    {isSubmitting ? 'Publishing...' : <><CheckCircle size={18} /> Publish Project</>}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Summary */}
          <div className="gcpj-summary-column">
            <div className="gcpj-summary-stack">

              {/* Preview Card */}
              <div className="gcpj-preview-card">
                <h3 className="gcpj-preview-header">Project Preview</h3>

                <div className="gcpj-preview-section">
                  <div className="gcpj-preview-title">{formData.title || <span className="gcpj-preview-empty">Project title will appear here.</span>}</div>
                  <div className="gcpj-preview-value" style={{ fontSize: '12px' }}>{formData.category || <span className="gcpj-preview-empty">No category selected.</span>}</div>
                </div>

                <div className="gcpj-preview-section">
                  <div className="gcpj-preview-label">Description</div>
                  <div className="gcpj-preview-value" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{formData.description || <span className="gcpj-preview-empty">Description will appear here.</span>}</div>
                </div>

                <div className="gcpj-preview-section">
                  <div className="gcpj-preview-label">Skills</div>
                  <div className="gcpj-preview-skills">
                    {formData.skills.length > 0 ? formData.skills.map(skill => (
                      <span key={skill} className="gcpj-preview-skill">{skill}</span>
                    )) : <span className="gcpj-preview-empty">No skills selected.</span>}
                  </div>
                </div>

                <div className="gcpj-preview-section">
                  <div className="gcpj-preview-label">Budget</div>
                  <div className="gcpj-preview-value">
                    {formData.budgetType === 'Fixed Price' && !formData.maxBudget && <span className="gcpj-preview-empty">Budget not set.</span>}
                    {formData.budgetType === 'Fixed Price' && formData.maxBudget && `₹${formData.maxBudget} (Fixed)`}

                    {formData.budgetType === 'Hourly' && !formData.maxRate && <span className="gcpj-preview-empty">Rate not set.</span>}
                    {formData.budgetType === 'Hourly' && formData.maxRate && `₹${formData.maxRate}/hr`}
                  </div>
                </div>

                <div className="gcpj-preview-section" style={{ borderBottom: 'none' }}>
                  <div className="gcpj-preview-label">Timeline</div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="gcpj-tips-card">
                <h3 className="gcpj-tips-header"><Info size={16} style={{ marginRight: '6px' }} /> Helpful Tips</h3>
                <ul className="gcpj-tips-list">
                  <li className="gcpj-tip-item">
                    <div className="gcpj-tip-icon"><CheckCircle size={12} /></div>
                    <div className="gcpj-tip-content">Use a specific project title.</div>
                  </li>
                  <li className="gcpj-tip-item">
                    <div className="gcpj-tip-icon"><CheckCircle size={12} /></div>
                    <div className="gcpj-tip-content">Clearly describe expected deliverables.</div>
                  </li>
                  <li className="gcpj-tip-item">
                    <div className="gcpj-tip-icon"><CheckCircle size={12} /></div>
                    <div className="gcpj-tip-content">Mention the skills required for the project.</div>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
