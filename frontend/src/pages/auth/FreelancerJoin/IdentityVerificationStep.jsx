import React, { useState, useRef } from 'react';
import { Shield, CheckCircle2, UploadCloud, Loader2, FileCheck } from 'lucide-react';
import { uploadFileToCloudinary } from '../../../utils/fileUpload';
import LegalModal from '../../../components/LegalModal';

export default function IdentityVerificationStep({ formData, updateFormData, nextStep, prevStep }) {
  const [isUploading, setIsUploading] = useState(false);
  const [docName, setDocName] = useState('');
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');
  const fileInputRef = useRef(null);

  const openLegalModal = (tab = 'terms') => {
    setLegalTab(tab);
    setShowLegalModal(true);
  };

  const handleNext = (e) => {
    e.preventDefault();
    nextStep();
  };

  const handleCheckbox = (e) => {
    updateFormData({ termsAccepted: e.target.checked });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocName(file.name);
    setIsUploading(true);

    try {
      const res = await uploadFileToCloudinary(file);
      if (res?.url) {
        updateFormData({ idDocumentUrl: res.url });
      }
    } catch (err) {
      console.error('ID Upload error:', err);
      alert(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="step-content animate-fade-in text-center">
      <div className="security-badge">
        <Shield size={32} color="#10b981" />
      </div>
      <h2 className="step-title text-center">Verify your identity</h2>
      <p className="step-description text-center">We need to verify your identity to keep our platform secure and trusted.</p>

      <form onSubmit={handleNext} className="join-form" style={{ maxWidth: '580px', margin: '0 auto' }}>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*,.pdf" 
          onChange={handleFileSelect} 
          style={{ display: 'none' }} 
        />

        <div className="upload-box" onClick={() => fileInputRef.current?.click()}>
          {isUploading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#1a73e8', fontWeight: 600 }}>
              <Loader2 size={24} className="spin" /> Uploading Government ID to Cloudinary CDN...
            </div>
          ) : formData.idDocumentUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <FileCheck size={36} color="#10b981" />
              <h4 style={{ color: '#10b981' }}>Government ID Uploaded!</h4>
              <p>{docName || 'Document verified & stored on Cloudinary'}</p>
            </div>
          ) : (
            <>
              <UploadCloud size={36} className="upload-icon" />
              <h4>Upload Government ID (Optional)</h4>
              <p>Passport, Driver's License, or National ID (PDF, PNG, JPG up to 10MB)</p>
              <button type="button" className="btn btn-outline upload-btn mt-2">
                Browse Files
              </button>
            </>
          )}
        </div>

        <div className="trust-indicators">
          <div className="trust-item">
            <CheckCircle2 size={18} />
            <span>Information is encrypted</span>
          </div>
          <div className="trust-item">
            <CheckCircle2 size={18} />
            <span>Never shared publicly</span>
          </div>
        </div>

        <div className="terms-checkbox">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              required
              checked={formData.termsAccepted || false}
              onChange={handleCheckbox}
            />
            <span className="checkbox-text">
              I understand and agree to the <button type="button" onClick={(e) => { e.preventDefault(); openLegalModal('terms'); }} style={{ background: 'none', border: 'none', color: '#1a73e8', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Terms of Service</button> and <button type="button" onClick={(e) => { e.preventDefault(); openLegalModal('privacy'); }} style={{ background: 'none', border: 'none', color: '#1a73e8', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Privacy Policy</button>.
            </span>
          </label>
        </div>

        <div className="step-actions split">
          <button type="button" className="btn btn-outline back-button" onClick={prevStep}>
            Back
          </button>
          <button type="submit" className="btn btn-primary next-button" disabled={!formData.termsAccepted || isUploading}>
            {isUploading ? 'Uploading...' : 'Continue'}
          </button>
        </div>
      </form>

      <LegalModal 
        isOpen={showLegalModal} 
        onClose={() => setShowLegalModal(false)} 
        defaultTab={legalTab} 
      />
    </div>
  );
}
