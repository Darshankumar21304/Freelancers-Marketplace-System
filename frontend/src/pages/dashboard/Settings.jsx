import React, { useState, useEffect } from 'react';
import {
  User, Briefcase, Lock, Bell, CreditCard,
  Shield, Palette, CheckCircle, XCircle, UploadCloud
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { getUserProfile, saveUserProfile } from '../../utils/authUtils';
import { uploadFileToCloudinary } from '../../utils/fileUpload';
import './Settings.css';

// Custom Toggle Component
const Toggle = ({ active, onChange }) => (
  <div className={`custom-toggle ${active ? 'active' : ''}`} onClick={onChange}>
    <div className="toggle-thumb"></div>
  </div>
);

const generateAvatarUrl = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=1a73e8&color=fff&size=150`;

export default function Settings() {
  const storedUser = getUserProfile() || {};
  const userRole = storedUser.role || 'freelancer';
  const [activeTab, setActiveTab] = useState('account');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const savedProfile = getUserProfile();

  // Form States
  const [formData, setFormData] = useState({
    // Account
    fullName: 'Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    phone: '+91 98765 43210',
    location: 'Mumbai, India',
    language: 'English',
    // Professional
    title: 'Senior Full Stack Developer',
    bio: 'I build scalable web applications using React, Node.js, and AWS.',
    skills: 'React, Node.js, Express, MongoDB, AWS',
    experience: '5+ years',
    availability: 'Full-time (40 hrs/week)',
    hourlyRate: '1500',
    // Security
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    // Notifications
    notifEmail: true,
    notifMessage: true,
    notifProject: true,
    notifProposal: true,
    notifPayment: true,
    notifReview: true,
    // Payments
    bankAccount: storedUser.bankDetails?.accountNumber || '',
    upiId: storedUser.bankDetails?.upiId || '',
    withdrawalPref: 'Weekly',
    // Privacy
    profileVisibility: 'Public',
    onlineStatus: true,
    searchVisibility: true,
    // Appearance
    theme: localStorage.getItem('gigsphere_theme') || 'system'
  });

  const [initialData, setInitialData] = useState({ ...formData });
  const [avatarUrl, setAvatarUrl] = useState(storedUser.avatar || storedUser.profilePhoto || generateAvatarUrl(storedUser.name));
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = React.useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiFetch('/users/settings');
        if (data.user) {
          const loadedTheme = data.user.preferences?.appearance?.theme || localStorage.getItem('gigsphere_theme') || 'system';
          applyTheme(loadedTheme);

          const newFormData = {
            ...formData,
            avatar: data.user.avatar || savedProfile?.avatar || savedProfile?.profileImage || '',
            fullName: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            location: data.user.location || '',
            language: data.user.language || 'English',
            notifEmail: data.user.preferences?.notifications?.email ?? true,
            notifMessage: data.user.preferences?.notifications?.message ?? true,
            notifProject: data.user.preferences?.notifications?.project ?? true,
            notifProposal: data.user.preferences?.notifications?.proposal ?? true,
            notifPayment: data.user.preferences?.notifications?.payment ?? true,
            notifReview: data.user.preferences?.notifications?.review ?? true,
            bankAccount: data.user.preferences?.payment?.bankAccount || data.user.bankDetails?.accountNumber || '',
            upiId: data.user.preferences?.payment?.upiId || data.user.bankDetails?.upiId || '',
            withdrawalPref: data.user.preferences?.payment?.withdrawalPref || 'Weekly',
            profileVisibility: data.user.preferences?.privacy?.profileVisibility || 'Public',
            onlineStatus: data.user.preferences?.privacy?.onlineStatus ?? true,
            searchVisibility: data.user.preferences?.privacy?.searchVisibility ?? true,
            theme: loadedTheme
          };
          if (data.profile) {
            newFormData.title = data.profile.title || '';
            newFormData.bio = data.profile.bio || '';
            newFormData.skills = Array.isArray(data.profile.skills) ? data.profile.skills.join(', ') : (data.profile.skills || '');
            newFormData.experience = data.profile.experience || 'Entry Level';
            newFormData.availability = data.profile.availability || 'Full-time (40 hrs/week)';
            newFormData.hourlyRate = data.profile.hourlyRate || '';
          }
          setFormData(newFormData);
          setInitialData(newFormData);

          if (data.user.avatar || data.user.profilePhoto) {
            setAvatarUrl(data.user.avatar || data.user.profilePhoto);
          } else {
            setAvatarUrl(generateAvatarUrl(data.user.name));
          }
        }
      } catch (error) {
        showToast('error', error.message || 'Failed to load settings');
      }
    };
    fetchSettings();
  }, []);

  // Check if form is dirty
  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'theme') {
      applyTheme(value);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result;
        handleInputChange('avatar', base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        showToast('error', 'Current password is required to set a new password');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        showToast('error', 'New passwords do not match');
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        name: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        language: formData.language,
        avatar: avatarUrl,
        profilePhoto: avatarUrl,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        preferences: {
          notifications: {
            email: formData.notifEmail,
            message: formData.notifMessage,
            project: formData.notifProject,
            proposal: formData.notifProposal,
            payment: formData.notifPayment,
            review: formData.notifReview
          },
          payment: {
            bankAccount: formData.bankAccount,
            upiId: formData.upiId,
            withdrawalPref: formData.withdrawalPref
          },
          privacy: {
            profileVisibility: formData.profileVisibility,
            onlineStatus: formData.onlineStatus,
            searchVisibility: formData.searchVisibility
          },
          appearance: {
            theme: formData.theme
          }
        },
        title: formData.title,
        bio: formData.bio,
        skills: formData.skills,
        experience: formData.experience,
        availability: formData.availability,
        hourlyRate: formData.hourlyRate
      };

      const response = await apiFetch('/users/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setInitialData({ ...formData });
      showToast('success', 'Settings saved successfully');

      // Update theme if changed
      if (formData.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (formData.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System preference logic
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      showToast('error', error.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...initialData });
    applyTheme(initialData.theme);
  };

  const navItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'professional', label: 'Professional Profile', icon: Briefcase },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const res = await uploadFileToCloudinary(file, '/api/upload/avatar');
      const newAvatar = res.avatarUrl || res.url;
      setAvatarUrl(newAvatar);

      // Update local stored profile
      const stored = getUserProfile() || {};
      stored.avatar = newAvatar;
      stored.profilePhoto = newAvatar;
      saveUserProfile(stored);

      showToast('success', 'Profile photo updated & saved successfully!');
    } catch (err) {
      showToast('error', err.message || 'Failed to upload photo to Cloudinary');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

const renderContent = () => {
  switch (activeTab) {
    case 'account':
      return (
        <>
          <div className="section-header">
            <h2 className="section-title">Account Settings</h2>
            <p className="section-desc">Manage your personal information and contact details.</p>
          </div>
          <div className="section-body">
            <input
              type="file"
              ref={avatarInputRef}
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
              accept="image/jpeg,image/png,image/webp,image/gif"
            />
            <div className="avatar-upload">
              <img
                src={avatarUrl && avatarUrl.startsWith('/uploads') ? `http://localhost:5001${avatarUrl}` : (avatarUrl || generateAvatarUrl(formData.fullName))}
                alt="Avatar"
                className="avatar-preview"
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div className="avatar-actions">
                <button type="button" className="btn-upload" onClick={() => avatarInputRef.current?.click()} disabled={isUploadingAvatar}>
                  <UploadCloud size={16} /> {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
                </button>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>JPG, WEBP or PNG. Max size of 10MB.</span>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group col-span-2">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={formData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" className="form-input" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" className="form-input" value={formData.location} onChange={e => handleInputChange('location', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select className="form-select" value={formData.language} onChange={e => handleInputChange('language', e.target.value)}>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Spanish</option>
                </select>
              </div>
            </div>
          </div>
        </>
      );

    case 'professional':
      return (
        <>
          <div className="section-header">
            <h2 className="section-title">Professional Profile</h2>
            <p className="section-desc">Highlight your skills and set your rates.</p>
          </div>
          <div className="section-body form-grid">
            <div className="form-group col-span-2">
              <label className="form-label">Professional Title</label>
              <input type="text" className="form-input" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} />
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Bio</label>
              <textarea className="form-textarea" value={formData.bio} onChange={e => handleInputChange('bio', e.target.value)}></textarea>
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Skills (comma separated)</label>
              <input type="text" className="form-input" value={formData.skills} onChange={e => handleInputChange('skills', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Experience</label>
              <select className="form-select" value={formData.experience} onChange={e => handleInputChange('experience', e.target.value)}>
                <option>Entry Level</option>
                <option>1-3 years</option>
                <option>3-5 years</option>
                <option>5+ years</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Availability</label>
              <select className="form-select" value={formData.availability} onChange={e => handleInputChange('availability', e.target.value)}>
                <option>Full-time (40 hrs/week)</option>
                <option>Part-time (20 hrs/week)</option>
                <option>As needed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hourly Rate (₹)</label>
              <input type="number" className="form-input" value={formData.hourlyRate} onChange={e => handleInputChange('hourlyRate', e.target.value)} />
            </div>
          </div>
        </>
      );

    case 'security':
      return (
        <>
          <div className="section-header">
            <h2 className="section-title">Security</h2>
            <p className="section-desc">Manage your password and security settings.</p>
          </div>
          <div className="section-body form-grid">
            <div className="form-group col-span-2">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" placeholder="Enter current password" value={formData.currentPassword} onChange={e => handleInputChange('currentPassword', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" placeholder="Enter new password" value={formData.newPassword} onChange={e => handleInputChange('newPassword', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" placeholder="Confirm new password" value={formData.confirmPassword} onChange={e => handleInputChange('confirmPassword', e.target.value)} />
            </div>
          </div>
        </>
      );

    case 'notifications':
      return (
        <>
          <div className="section-header">
            <h2 className="section-title">Notifications</h2>
            <p className="section-desc">Choose what you want to be notified about.</p>
          </div>
          <div className="section-body">
            <div className="toggle-group">
              <div className="toggle-info">
                <span className="toggle-title">Email Notifications</span>
                <span className="toggle-desc">Receive notifications via email.</span>
              </div>
              <Toggle active={formData.notifEmail} onChange={() => handleInputChange('notifEmail', !formData.notifEmail)} />
            </div>
            <div className="toggle-group">
              <div className="toggle-info">
                <span className="toggle-title">Message Notifications</span>
                <span className="toggle-desc">When a client sends you a message.</span>
              </div>
              <Toggle active={formData.notifMessage} onChange={() => handleInputChange('notifMessage', !formData.notifMessage)} />
            </div>
            <div className="toggle-group">
              <div className="toggle-info">
                <span className="toggle-title">Project Recommendations</span>
                <span className="toggle-desc">Get notified about projects matching your skills.</span>
              </div>
              <Toggle active={formData.notifProject} onChange={() => handleInputChange('notifProject', !formData.notifProject)} />
            </div>
            <div className="toggle-group">
              <div className="toggle-info">
                <span className="toggle-title">Proposal Updates</span>
                <span className="toggle-desc">When a proposal is accepted or declined.</span>
              </div>
              <Toggle active={formData.notifProposal} onChange={() => handleInputChange('notifProposal', !formData.notifProposal)} />
            </div>
            <div className="toggle-group">
              <div className="toggle-info">
                <span className="toggle-title">Payment Updates</span>
                <span className="toggle-desc">When a payment is processed or withdrawn.</span>
              </div>
              <Toggle active={formData.notifPayment} onChange={() => handleInputChange('notifPayment', !formData.notifPayment)} />
            </div>
            <div className="toggle-group">
              <div className="toggle-info">
                <span className="toggle-title">Review Notifications</span>
                <span className="toggle-desc">When a client leaves a review on your profile.</span>
              </div>
              <Toggle active={formData.notifReview} onChange={() => handleInputChange('notifReview', !formData.notifReview)} />
            </div>
          </div>
        </>
      );

    case 'payments':
      return (
        <>
          <div className="section-header">
            <h2 className="section-title">Payments</h2>
            <p className="section-desc">Manage your withdrawal methods and preferences.</p>
          </div>
          <div className="section-body form-grid">
            <div className="form-group col-span-2">
              <label className="form-label">Bank Account</label>
              <input type="text" className="form-input" value={formData.bankAccount} onChange={e => handleInputChange('bankAccount', e.target.value)} />
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">UPI ID</label>
              <input type="text" className="form-input" value={formData.upiId} onChange={e => handleInputChange('upiId', e.target.value)} />
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Withdrawal Preference</label>
              <select className="form-select" value={formData.withdrawalPref} onChange={e => handleInputChange('withdrawalPref', e.target.value)}>
                <option>Manual Withdrawal</option>
                <option>Weekly (Every Monday)</option>
                <option>Bi-weekly</option>
                <option>Monthly (1st of Month)</option>
              </select>
            </div>
          </div>
        </>
      );

    case 'privacy':
      return (
        <>
          <div className="section-header">
            <h2 className="section-title">Privacy</h2>
            <p className="section-desc">Control who can see your profile and activity.</p>
          </div>
          <div className="section-body">
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Profile Visibility</label>
              <select className="form-select" value={formData.profileVisibility} onChange={e => handleInputChange('profileVisibility', e.target.value)}>
                <option>Public (Visible to everyone)</option>
                <option>GigSphere Members Only</option>
                <option>Private (Only clients you apply to)</option>
              </select>
            </div>
            <div className="toggle-group">
              <div className="toggle-info">
                <span className="toggle-title">Online Status</span>
                <span className="toggle-desc">Show clients when you are actively using GigSphere.</span>
              </div>
              <Toggle active={formData.onlineStatus} onChange={() => handleInputChange('onlineStatus', !formData.onlineStatus)} />
            </div>
            <div className="toggle-group">
              <div className="toggle-info">
                <span className="toggle-title">Search Visibility</span>
                <span className="toggle-desc">Allow clients to find you in Freelancer search.</span>
              </div>
              <Toggle active={formData.searchVisibility} onChange={() => handleInputChange('searchVisibility', !formData.searchVisibility)} />
            </div>
          </div>
        </>
      );

    case 'appearance':
      return (
        <>
          <div className="section-header">
            <h2 className="section-title">Appearance</h2>
            <p className="section-desc">Customize how GigSphere looks on your device.</p>
          </div>
          <div className="section-body">
            <div className="appearance-grid">
              <div className={`theme-card theme-card-light ${formData.theme === 'light' ? 'active' : ''}`} onClick={() => handleInputChange('theme', 'light')}>
                <div className="theme-preview">
                  <div className="theme-preview-line"></div>
                  <div className="theme-preview-line"></div>
                  <div className="theme-preview-line"></div>
                </div>
                <span className="form-label">Light Mode</span>
              </div>
              <div className={`theme-card theme-card-dark ${formData.theme === 'dark' ? 'active' : ''}`} onClick={() => handleInputChange('theme', 'dark')}>
                <div className="theme-preview">
                  <div className="theme-preview-line"></div>
                  <div className="theme-preview-line"></div>
                  <div className="theme-preview-line"></div>
                </div>
                <span className="form-label">Dark Mode</span>
              </div>
              <div className={`theme-card ${formData.theme === 'system' ? 'active' : ''}`} onClick={() => handleInputChange('theme', 'system')}>
                <div className="theme-preview" style={{ background: 'linear-gradient(90deg, #f3f4f6 50%, #1f2937 50%)' }}></div>
                <span className="form-label">System Preference</span>
              </div>
            </div>
          </div>
        </>
      );

    default:
      return null;
  }
};

return (
  <div className="gigsphere-freelancer-settings animate-fade-in-up">
    <div className="settings-container">

      {/* Header */}
      <div className="page-header">
        <div className="breadcrumb">Dashboard / Settings</div>
        <h1 className="page-title">Settings</h1>
        <p className="page-desc">Manage your account, security, notifications, payments, and preferences.</p>
      </div>

      <div className="settings-layout">

        {/* Navigation */}
        <nav className="settings-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="settings-content">
          {renderContent()}

          <div className="section-footer">
            {hasUnsavedChanges && (
              <span style={{ marginRight: 'auto', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                You have unsaved changes.
              </span>
            )}
            <button className="btn btn-outline" onClick={handleCancel} disabled={!hasUnsavedChanges}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!hasUnsavedChanges || isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

      </div>

    </div>

    {/* Toasts */}
    {toast && (
      <div className="toast-container">
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          {toast.message}
        </div>
      </div>
    )}

  </div>
);
}
