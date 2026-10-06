import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Link, Plus, Trash2, UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import { uploadFileToCloudinary } from '../../../utils/api';
const formatExternalUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export default function PortfolioStep({ formData, updateFormData, nextStep, prevStep }) {
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', url: '', imageUrl: '' });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const imageInputRef = useRef(null);

  const portfolio = formData.portfolio || [];

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setIsUploadingImage(true);

    try {
      const res = await uploadFileToCloudinary(file);
      if (res?.url) {
        setNewItem(prev => ({ ...prev, imageUrl: res.url }));
      }
    } catch (err) {
      console.error('Portfolio image upload error:', err);
      alert(err.message || 'Image upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.title && newItem.description) {
      updateFormData({ portfolio: [...portfolio, newItem] });
      setNewItem({ title: '', description: '', url: '', imageUrl: '' });
      setImagePreview('');
      setShowForm(false);
    }
  };

  const handleRemoveItem = (index) => {
    const newPortfolio = portfolio.filter((_, i) => i !== index);
    updateFormData({ portfolio: newPortfolio });
  };

  return (
    <div className="step-content animate-fade-in">
      <h2 className="step-title">Showcase your work</h2>
      <p className="step-description">Adding portfolio items increases your chances of getting hired by 3x.</p>

      {portfolio.length > 0 && (
        <div className="portfolio-grid">
          {portfolio.map((item, index) => (
            <div key={index} className="portfolio-card glass">
              <div className="portfolio-card-img">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon size={44} className="placeholder-icon" />
                )}
              </div>
              <div className="portfolio-card-content">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                {(item.url || item.link) && (
                  <a href={formatExternalUrl(item.url || item.link)} target="_blank" rel="noopener noreferrer" className="portfolio-link">
                    <Link size={14} /> {item.url || item.link}
                  </a>
                )}
                <button type="button" className="remove-btn" onClick={() => handleRemoveItem(index)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showForm && portfolio.length < 5 && (
        <button type="button" className="add-portfolio-card-btn" onClick={() => setShowForm(true)}>
          <div className="add-icon-circle">
            <Plus size={24} color="#1a73e8" />
          </div>
          <div className="add-text">
            <h4>Add New Project</h4>
            <p>Showcase a past project, live website, or case study</p>
          </div>
        </button>
      )}

      {showForm && (
        <form onSubmit={handleAddItem} className="portfolio-form">
          <h4>New Project</h4>

          <div className="form-group">
            <label className="standard-label">Project Title *</label>
            <div className="input-with-icon join-input no-float">
              <ImageIcon className="input-icon" size={20} />
              <input 
                type="text" 
                placeholder="e.g. E-Commerce Mobile App" 
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="standard-label">Project Description *</label>
            <div className="textarea-wrapper">
              <textarea 
                placeholder="Briefly describe what you built, key features, and tools used..." 
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                required
                rows={3}
                style={{ paddingLeft: '1rem' }}
              ></textarea>
            </div>
          </div>

          {/* Project Screenshot / Cover Upload to Cloudinary */}
          <div className="form-group">
            <label className="standard-label">Project Cover / Screenshot (Cloudinary CDN)</label>
            <input 
              type="file" 
              ref={imageInputRef} 
              accept="image/*" 
              onChange={handleImageSelect} 
              style={{ display: 'none' }} 
            />
            <div 
              onClick={() => imageInputRef.current?.click()} 
              style={{
                border: '2px dashed #cbd5e1', borderRadius: '14px', padding: '16px',
                textAlign: 'center', cursor: 'pointer', background: '#f8fafc',
                transition: 'all 0.2s ease'
              }}
            >
              {isUploadingImage ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#1a73e8', fontWeight: 600, fontSize: '0.85rem' }}>
                  <Loader2 size={18} className="spin" /> Uploading image to Cloudinary...
                </div>
              ) : newItem.imageUrl || imagePreview ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <img src={newItem.imageUrl || imagePreview} alt="Preview" style={{ width: '56px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
                    <CheckCircle2 size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Image Uploaded Successfully!
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                  <UploadCloud size={24} color="#1a73e8" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>Click to upload project banner or screenshot</span>
                  <span style={{ fontSize: '0.78rem' }}>PNG, JPG up to 10MB (Stored on Cloudinary CDN)</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="standard-label">Project URL (Optional)</label>
            <div className="input-with-icon join-input no-float">
              <Link className="input-icon" size={20} />
              <input 
                type="url" 
                placeholder="https://github.com/... or https://myproject.com" 
                value={newItem.url}
                onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
              />
            </div>
          </div>

          <div className="portfolio-form-actions">
            <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setImagePreview(''); }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isUploadingImage}>
              {isUploadingImage ? 'Uploading Image...' : 'Save Project'}
            </button>
          </div>
        </form>
      )}

      <div className="step-actions split mt-4">
        <button type="button" className="btn btn-outline back-button" onClick={prevStep}>
          Back
        </button>
        <button type="button" className="btn btn-primary next-button" onClick={nextStep}>
          {portfolio.length > 0 ? 'Continue' : 'Skip for now'}
        </button>
      </div>
    </div>
  );
}
