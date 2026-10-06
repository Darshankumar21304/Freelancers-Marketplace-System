import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Star, Eye, CheckCircle,
  Image as ImageIcon, UploadCloud, Link as LinkIcon, Edit2, Trash2,
  X, Award, Briefcase, GraduationCap, Code2, ChevronDown, ChevronUp,
  Globe, Loader2, Save, ExternalLink
} from 'lucide-react';
import { getUserProfile } from '../../utils/authUtils';
import { apiFetch } from '../../utils/api';
import { uploadFileToCloudinary } from '../../utils/fileUpload';
import './Portfolio.css';

const GithubIcon = ({ size = 15, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ size = 15, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const CATEGORIES = ['All', 'Web Development', 'Mobile Apps', 'UI/UX Design', 'AI & Data', 'Blockchain', 'Other'];
const TABS = ['Portfolio', 'Work Experience', 'Certifications', 'Social Links'];

const formatExternalUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export default function Portfolio() {
  const userProfile = getUserProfile();
  const [activeTab, setActiveTab] = useState('Portfolio');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [profile, setProfile] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [workExperience, setWorkExperience] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [socialLinks, setSocialLinks] = useState({ linkedinUrl: '', githubUrl: '', websiteUrl: '' });

  const [isAddPortfolioOpen, setIsAddPortfolioOpen] = useState(false);
  const [isAddExpOpen, setIsAddExpOpen] = useState(false);
  const [isAddCertOpen, setIsAddCertOpen] = useState(false);

  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: '', description: '', category: 'Web Development',
    skills: '', link: '', completionDate: '', clientName: '', imageUrl: ''
  });
  const [portfolioImageFile, setPortfolioImageFile] = useState(null);
  const [portfolioImagePreview, setPortfolioImagePreview] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const portfolioImageRef = useRef(null);

  const [newExp, setNewExp] = useState({
    company: '', role: '', startDate: '', endDate: '', isCurrent: false, description: ''
  });

  const [newCert, setNewCert] = useState({
    name: '', issuer: '', issueDate: '', credentialUrl: '', docUrl: ''
  });
  const [certDocFile, setCertDocFile] = useState(null);
  const [isUploadingCertDoc, setIsUploadingCertDoc] = useState(false);
  const certDocRef = useRef(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/users/profile/me');
      if (data?.profile) {
        setProfile(data.profile);
        setPortfolioItems(data.profile.portfolioItems || []);
        setWorkExperience(data.profile.workExperience || []);
        setCertifications(data.profile.certifications || []);
        setSocialLinks({
          linkedinUrl: data.profile.linkedinUrl || '',
          githubUrl: data.profile.githubUrl || '',
          websiteUrl: data.profile.websiteUrl || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      showToast('Error loading profile data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const saveToAPI = async (updates) => {
    setIsSaving(true);
    try {
      await apiFetch('/users/profile/me', { method: 'PUT', body: JSON.stringify(updates) });
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast('Failed to save changes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Portfolio image upload
  const handlePortfolioImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPortfolioImageFile(file);
    setPortfolioImagePreview(URL.createObjectURL(file));
  };

  const uploadPortfolioImage = async () => {
    if (!portfolioImageFile) return newPortfolioItem.imageUrl;
    setIsUploadingImage(true);
    try {
      const result = await uploadFileToCloudinary(portfolioImageFile, '/api/upload/single');
      return result.url;
    } catch (err) {
      showToast('Image upload failed: ' + err.message, 'error');
      return '';
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Add portfolio item
  const handleAddPortfolioItem = async () => {
    if (!newPortfolioItem.title.trim()) return showToast('Title is required', 'error');
    const imageUrl = await uploadPortfolioImage();
    const item = {
      ...newPortfolioItem,
      imageUrl,
      skills: newPortfolioItem.skills.split(',').map(s => s.trim()).filter(Boolean)
    };
    const updated = [...portfolioItems, item];
    setPortfolioItems(updated);
    await saveToAPI({ portfolioItems: updated });
    setNewPortfolioItem({ title: '', description: '', category: 'Web Development', skills: '', link: '', completionDate: '', clientName: '', imageUrl: '' });
    setPortfolioImageFile(null);
    setPortfolioImagePreview('');
    setIsAddPortfolioOpen(false);
  };

  const handleDeletePortfolioItem = async (idx) => {
    const updated = portfolioItems.filter((_, i) => i !== idx);
    setPortfolioItems(updated);
    await saveToAPI({ portfolioItems: updated });
  };

  // Work Experience
  const handleAddExp = async () => {
    if (!newExp.company.trim()) return showToast('Company name is required', 'error');
    const updated = [...workExperience, newExp];
    setWorkExperience(updated);
    await saveToAPI({ workExperience: updated });
    setNewExp({ company: '', role: '', startDate: '', endDate: '', isCurrent: false, description: '' });
    setIsAddExpOpen(false);
  };

  const handleDeleteExp = async (idx) => {
    const updated = workExperience.filter((_, i) => i !== idx);
    setWorkExperience(updated);
    await saveToAPI({ workExperience: updated });
  };

  // Certifications
  const handleCertDocSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCertDocFile(file);
    setIsUploadingCertDoc(true);
    try {
      const result = await uploadFileToCloudinary(file, '/api/upload/single');
      setNewCert(prev => ({ ...prev, docUrl: result.url }));
      showToast('Document uploaded to Cloudinary!');
    } catch (err) {
      showToast('Document upload failed: ' + err.message, 'error');
    } finally {
      setIsUploadingCertDoc(false);
    }
  };

  const handleAddCert = async () => {
    if (!newCert.name.trim()) return showToast('Certification name is required', 'error');
    const updated = [...certifications, newCert];
    setCertifications(updated);
    await saveToAPI({ certifications: updated });
    setNewCert({ name: '', issuer: '', issueDate: '', credentialUrl: '', docUrl: '' });
    setCertDocFile(null);
    setIsAddCertOpen(false);
  };

  const handleDeleteCert = async (idx) => {
    const updated = certifications.filter((_, i) => i !== idx);
    setCertifications(updated);
    await saveToAPI({ certifications: updated });
  };

  // Social Links
  const handleSaveSocialLinks = async () => {
    await saveToAPI(socialLinks);
  };

  const filteredPortfolio = activeCategoryFilter === 'All'
    ? portfolioItems
    : portfolioItems.filter(p => p.category === activeCategoryFilter);

  const fieldStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#0f172a',
    background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '12px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.875rem',
          background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', animation: 'slideIn 0.3s ease'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Portfolio & Professional History</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>Showcase your work, experience, and certifications. All media stored on Cloudinary CDN.</p>
        </div>
        {isSaving && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1a73e8', fontWeight: 600, fontSize: '0.875rem' }}>
            <Loader2 size={16} className="spin" /> Saving...
          </div>
        )}
      </div>

      {/* Profile Completion Banner */}
      {profile && (
        <div style={{ background: 'linear-gradient(135deg, #1a73e8 0%, #a142f4 100%)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.85, marginBottom: '4px' }}>PROFILE COMPLETION</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{profile.profileCompletion || 0}%</div>
            <div style={{ marginTop: '8px', width: '280px', height: '6px', background: 'rgba(255,255,255,0.3)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${profile.profileCompletion || 0}%`, background: '#fff', borderRadius: '999px', transition: 'width 0.8s ease' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>{portfolioItems.length}</div>
              <div style={{ opacity: 0.8 }}>Projects</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>{certifications.length}</div>
              <div style={{ opacity: 0.8 }}>Certs</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>{workExperience.length}</div>
              <div style={{ opacity: 0.8 }}>Experience</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #f1f5f9', marginBottom: '24px', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap',
            color: activeTab === tab ? '#1a73e8' : '#64748b',
            borderBottom: activeTab === tab ? '2px solid #1a73e8' : '2px solid transparent',
            marginBottom: '-2px', transition: 'all 0.2s'
          }}>
            {tab === 'Portfolio' && <Code2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
            {tab === 'Work Experience' && <Briefcase size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
            {tab === 'Certifications' && <Award size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
            {tab === 'Social Links' && <Globe size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#64748b' }}>
          <Loader2 size={32} className="spin" />
        </div>
      ) : (
        <>
          {/* ===== PORTFOLIO TAB ===== */}
          {activeTab === 'Portfolio' && (
            <div>
              {/* Category Filter + Add Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActiveCategoryFilter(cat)} style={{
                      padding: '6px 16px', borderRadius: '999px', border: '1px solid',
                      borderColor: activeCategoryFilter === cat ? '#1a73e8' : '#e2e8f0',
                      background: activeCategoryFilter === cat ? '#1a73e8' : '#f8fafc',
                      color: activeCategoryFilter === cat ? '#fff' : '#64748b',
                      fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      {cat}
                    </button>
                  ))}
                </div>
                <button onClick={() => setIsAddPortfolioOpen(true)} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
                  borderRadius: '999px', background: 'linear-gradient(135deg, #1a73e8, #a142f4)',
                  color: '#fff', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(26,115,232,0.3)'
                }}>
                  <Plus size={16} /> Add Project
                </button>
              </div>

              {filteredPortfolio.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '20px', background: '#f8fafc' }}>
                  <ImageIcon size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                  <h3 style={{ color: '#0f172a', fontWeight: 800, margin: '0 0 6px' }}>No portfolio projects yet</h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 16px' }}>
                    Add your best work to showcase your skills to potential clients. Portfolio images are stored on Cloudinary CDN.
                  </p>
                  <button onClick={() => setIsAddPortfolioOpen(true)} style={{ padding: '10px 24px', borderRadius: '999px', background: '#1a73e8', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    Add First Project
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {filteredPortfolio.map((item, idx) => (
                    <div key={idx} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(26,115,232,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      {/* Cover Image */}
                      <div style={{ height: '180px', background: 'linear-gradient(135deg, #1a73e8 0%, #a142f4 100%)', position: 'relative', overflow: 'hidden' }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Code2 size={40} color="rgba(255,255,255,0.6)" />
                          </div>
                        )}
                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                          {(item.link || item.url) && (
                            <a href={formatExternalUrl(item.link || item.url)} target="_blank" rel="noopener noreferrer" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} title="Open External Project Link" onClick={(e) => e.stopPropagation()}>
                              <ExternalLink size={14} color="#1a73e8" />
                            </a>
                          )}
                          <button onClick={() => handleDeletePortfolioItem(idx)} style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Trash2 size={14} color="#ef4444" />
                          </button>
                        </div>
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.9)', color: '#1a73e8', fontSize: '0.72rem', fontWeight: 700 }}>
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <div style={{ padding: '16px' }}>
                        <h3 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{item.title}</h3>
                        {item.clientName && <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#1a73e8', fontWeight: 600 }}>Client: {item.clientName}</p>}
                        <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.description}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {(item.skills || []).slice(0, 4).map((skill, si) => (
                            <span key={si} style={{ padding: '3px 10px', borderRadius: '20px', background: '#e8f0fe', color: '#1a73e8', fontSize: '0.72rem', fontWeight: 600 }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                        {item.completionDate && (
                          <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Completed: {item.completionDate}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== WORK EXPERIENCE TAB ===== */}
          {activeTab === 'Work Experience' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>Work Experience</h3>
                <button onClick={() => setIsAddExpOpen(true)} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
                  borderRadius: '999px', background: 'linear-gradient(135deg, #1a73e8, #a142f4)',
                  color: '#fff', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(26,115,232,0.3)'
                }}>
                  <Plus size={16} /> Add Experience
                </button>
              </div>

              {workExperience.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '20px', background: '#f8fafc' }}>
                  <Briefcase size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                  <h3 style={{ color: '#0f172a', fontWeight: 800, margin: '0 0 6px' }}>No work experience added yet</h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 16px' }}>
                    Add your past roles, full-time positions, or freelance experience to build trust with clients.
                  </p>
                  <button onClick={() => setIsAddExpOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 24px', borderRadius: '999px', background: '#1a73e8', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    <Plus size={16} /> Add First Experience
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {workExperience.map((exp, idx) => (
                    <div key={idx} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', position: 'relative' }}>
                      <button onClick={() => handleDeleteExp(idx)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Briefcase size={22} color="#1a73e8" />
                        </div>
                        <div>
                          <h3 style={{ margin: '0 0 2px', fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{exp.role || 'Software Engineer'}</h3>
                          <p style={{ margin: '0 0 6px', fontSize: '0.875rem', color: '#1a73e8', fontWeight: 600 }}>{exp.company}</p>
                          <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#64748b' }}>
                            {exp.startDate} - {exp.isCurrent ? 'Present' : (exp.endDate || 'N/A')}
                          </p>
                          {exp.description && <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>{exp.description}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== CERTIFICATIONS TAB ===== */}
          {activeTab === 'Certifications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>Certifications & Credentials</h3>
                <button onClick={() => setIsAddCertOpen(true)} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
                  borderRadius: '999px', background: 'linear-gradient(135deg, #1a73e8, #a142f4)',
                  color: '#fff', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(26,115,232,0.3)'
                }}>
                  <Plus size={16} /> Add Certification
                </button>
              </div>

              {certifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '20px', background: '#f8fafc' }}>
                  <Award size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                  <h3 style={{ color: '#0f172a', fontWeight: 800, margin: '0 0 6px' }}>No certifications yet</h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 16px' }}>
                    Upload certificates from Google, Coursera, AWS, or any institution to boost your profile strength.
                  </p>
                  <button onClick={() => setIsAddCertOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 24px', borderRadius: '999px', background: '#1a73e8', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    <Plus size={16} /> Add First Certification
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {certifications.map((cert, idx) => (
                    <div key={idx} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', position: 'relative' }}>
                      <button onClick={() => handleDeleteCert(idx)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={15} color="#ef4444" />
                      </button>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                        <Award size={22} color="#d97706" />
                      </div>
                      <h3 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', paddingRight: '24px' }}>{cert.name}</h3>
                      {cert.issuer && <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#1a73e8', fontWeight: 600 }}>{cert.issuer}</p>}
                      {cert.issueDate && <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#94a3b8' }}>Issued: {cert.issueDate}</p>}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {cert.credentialUrl && (
                          <a href={formatExternalUrl(cert.credentialUrl)} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid #1a73e8', color: '#1a73e8', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <LinkIcon size={11} /> View Credential
                          </a>
                        )}
                        {cert.docUrl && (
                          <a href={formatExternalUrl(cert.docUrl)} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ExternalLink size={11} /> Document
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== SOCIAL LINKS TAB ===== */}
          {activeTab === 'Social Links' && (
            <div style={{ maxWidth: '560px' }}>
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px', fontWeight: 800, color: '#0f172a' }}>Professional Links</h3>
                {[
                  { key: 'linkedinUrl', label: 'LinkedIn Profile', icon: LinkedinIcon, placeholder: 'https://linkedin.com/in/your-profile' },
                  { key: 'githubUrl', label: 'GitHub Profile', icon: GithubIcon, placeholder: 'https://github.com/your-username' },
                  { key: 'websiteUrl', label: 'Personal Website', icon: Globe, placeholder: 'https://yoursite.com' }
                ].map(({ key, label, icon: Icon, placeholder }) => (
                  <div key={key} style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 700, fontSize: '0.875rem', color: '#374151' }}>
                      <Icon size={15} /> {label}
                    </label>
                    <input
                      type="url"
                      placeholder={placeholder}
                      value={socialLinks[key]}
                      onChange={e => setSocialLinks(prev => ({ ...prev, [key]: e.target.value }))}
                      style={fieldStyle}
                    />
                  </div>
                ))}
                <button onClick={handleSaveSocialLinks} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '999px', background: '#1a73e8', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                  <Save size={15} /> Save Links
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== ADD PORTFOLIO MODAL ===== */}
      {isAddPortfolioOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', maxWidth: '560px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>Add Portfolio Project</h2>
              <button onClick={() => setIsAddPortfolioOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', display: 'block', marginBottom: '8px' }}>Project Cover Image (Cloudinary CDN)</label>
              {portfolioImagePreview ? (
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '160px', marginBottom: '8px' }}>
                  <img src={portfolioImagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => { setPortfolioImagePreview(''); setPortfolioImageFile(null); }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div onClick={() => portfolioImageRef.current?.click()} style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', transition: 'border-color 0.2s' }}>
                  <UploadCloud size={28} color="#94a3b8" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Click to upload project image (JPG, PNG, max 10MB)</p>
                </div>
              )}
              <input ref={portfolioImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePortfolioImageSelect} />
            </div>

            {[
              { key: 'title', label: 'Project Title *', placeholder: 'e.g. Fintech Dashboard' },
              { key: 'clientName', label: 'Client / Company', placeholder: 'e.g. Heartware Inc.' },
              { key: 'completionDate', label: 'Completion Date', placeholder: 'e.g. Aug 2024' },
              { key: 'link', label: 'Live URL / GitHub', placeholder: 'https://...' },
              { key: 'skills', label: 'Skills Used (comma-separated)', placeholder: 'React, Node.js, MongoDB' }
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: '14px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', display: 'block', marginBottom: '6px' }}>{label}</label>
                <input value={newPortfolioItem[key]} onChange={e => setNewPortfolioItem(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={fieldStyle} />
              </div>
            ))}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', display: 'block', marginBottom: '6px' }}>Category</label>
              <select value={newPortfolioItem.category} onChange={e => setNewPortfolioItem(p => ({ ...p, category: e.target.value }))} style={fieldStyle}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', display: 'block', marginBottom: '6px' }}>Description</label>
              <textarea value={newPortfolioItem.description} onChange={e => setNewPortfolioItem(p => ({ ...p, description: e.target.value }))} placeholder="Describe what you built, the challenges, and impact..." rows={3} style={{ ...fieldStyle, resize: 'vertical' }} />
            </div>

            <button onClick={handleAddPortfolioItem} disabled={isUploadingImage || isSaving} style={{
              width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #1a73e8, #a142f4)', color: '#fff',
              fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: (isUploadingImage || isSaving) ? 0.7 : 1
            }}>
              {(isUploadingImage || isSaving) ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}
              {isUploadingImage ? 'Uploading to Cloudinary...' : isSaving ? 'Saving...' : 'Add Project'}
            </button>
          </div>
        </div>
      )}

      {/* ===== ADD EXPERIENCE MODAL ===== */}
      {isAddExpOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>Add Work Experience</h2>
              <button onClick={() => setIsAddExpOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {[
              { key: 'company', label: 'Company *', placeholder: 'e.g. Google, Infosys, Startup' },
              { key: 'role', label: 'Role / Title', placeholder: 'e.g. Senior Frontend Developer' },
              { key: 'startDate', label: 'Start Date', placeholder: 'e.g. Jan 2022' },
              { key: 'endDate', label: 'End Date', placeholder: 'e.g. Dec 2023 (leave empty if current)' }
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: '14px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', display: 'block', marginBottom: '6px' }}>{label}</label>
                <input value={newExp[key]} onChange={e => setNewExp(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={fieldStyle} />
              </div>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
              <input type="checkbox" checked={newExp.isCurrent} onChange={e => setNewExp(p => ({ ...p, isCurrent: e.target.checked }))} />
              Currently working here
            </label>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', display: 'block', marginBottom: '6px' }}>Description</label>
              <textarea value={newExp.description} onChange={e => setNewExp(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Key responsibilities and achievements..." style={{ ...fieldStyle, resize: 'vertical' }} />
            </div>
            <button onClick={handleAddExp} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1a73e8, #a142f4)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
              Save Experience
            </button>
          </div>
        </div>
      )}

      {/* ===== ADD CERTIFICATION MODAL ===== */}
      {isAddCertOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>Add Certification</h2>
              <button onClick={() => setIsAddCertOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {[
              { key: 'name', label: 'Certification Name *', placeholder: 'e.g. Google Cloud Professional' },
              { key: 'issuer', label: 'Issued By', placeholder: 'e.g. Google, Coursera, AWS' },
              { key: 'issueDate', label: 'Issue Date', placeholder: 'e.g. March 2024' },
              { key: 'credentialUrl', label: 'Credential URL', placeholder: 'https://verify.credential.com/...' }
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: '14px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', display: 'block', marginBottom: '6px' }}>{label}</label>
                <input value={newCert[key]} onChange={e => setNewCert(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={fieldStyle} />
              </div>
            ))}
            {/* Certificate Document Upload to Cloudinary */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', display: 'block', marginBottom: '8px' }}>Upload Certificate Document (Cloudinary CDN)</label>
              <div onClick={() => certDocRef.current?.click()} style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}>
                {isUploadingCertDoc ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#1a73e8' }}>
                    <Loader2 size={18} className="spin" /> Uploading to Cloudinary...
                  </div>
                ) : newCert.docUrl ? (
                  <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.875rem' }}>
                    <CheckCircle size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Document uploaded successfully!
                  </div>
                ) : (
                  <div>
                    <UploadCloud size={24} color="#94a3b8" style={{ marginBottom: '6px' }} />
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Upload PDF certificate (max 15MB)</p>
                  </div>
                )}
              </div>
              <input ref={certDocRef} type="file" accept=".pdf,.jpg,.png" style={{ display: 'none' }} onChange={handleCertDocSelect} />
            </div>
            <button onClick={handleAddCert} disabled={isUploadingCertDoc} style={{
              width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #1a73e8, #a142f4)', color: '#fff',
              fontWeight: 700, cursor: 'pointer', fontSize: '1rem', opacity: isUploadingCertDoc ? 0.7 : 1
            }}>
              Save Certification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
