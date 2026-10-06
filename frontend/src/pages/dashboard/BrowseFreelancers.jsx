import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Users, Star, MapPin, Briefcase, Award,
  CheckCircle, MessageSquare, Send, X, PlusCircle,
  ExternalLink, Sparkles, Filter, AlertCircle, ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { formatINR } from '../../utils/currency';
import { getCleanAvatar } from '../../utils/avatarUtils';
import FreelancerProfileModal from '../../components/FreelancerProfileModal';
import './BrowseFreelancers.css';

const SKILL_CATEGORIES = [
  'All Talent',
  'Web Development',
  'Mobile Apps',
  'UI/UX Design',
  'AI & Data Science',
  'Graphic Design',
  'Writing & Translation',
  'Digital Marketing'
];

export default function BrowseFreelancers() {
  const navigate = useNavigate();
  const [freelancers, setFreelancers] = useState([]);
  const [clientProjects, setClientProjects] = useState([]);
  const [existingContracts, setExistingContracts] = useState([]);
  const [clientPitches, setClientPitches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Talent');
  const [sortBy, setSortBy] = useState('rating'); // 'rating' | 'rate-asc' | 'rate-desc' | 'reviews'

  // Modal States
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pitchTargetFreelancer, setPitchTargetFreelancer] = useState(null);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);

  // Pitch Form State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [pitchMessage, setPitchMessage] = useState('');
  const [offeredBudget, setOfferedBudget] = useState('');
  const [isSubmittingPitch, setIsSubmittingPitch] = useState(false);
  const [pitchError, setPitchError] = useState('');
  const [pitchSuccess, setPitchSuccess] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Freelancers
      const flData = await apiFetch('/users/freelancers').catch(() => []);
      setFreelancers(Array.isArray(flData) ? flData : []);

      // 2. Fetch Client's Projects
      const projData = await apiFetch('/projects/my').catch(() => []);
      setClientProjects(Array.isArray(projData) ? projData : []);

      // 3. Fetch Contracts to know who is already hired
      const contractsData = await apiFetch('/contracts/my-contracts').catch(() => []);
      setExistingContracts(Array.isArray(contractsData) ? contractsData : []);

      // 4. Fetch Client's existing Pitches
      const pitchData = await apiFetch('/pitches/client').catch(() => []);
      setClientPitches(Array.isArray(pitchData) ? pitchData : []);
    } catch (err) {
      console.error('Error fetching talent data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenProfile = (fl) => {
    const profile = fl.profile || {};
    setSelectedFreelancer({
      ...fl,
      ...profile,
      freelancerName: fl.name,
      avatar: fl.avatar || fl.profilePhoto,
      skills: profile.skills || fl.skills || [],
      rating: profile.rating || fl.rating || 5.0,
      numReviews: profile.numReviews || fl.numReviews || 0,
      hourlyRate: profile.hourlyRate || fl.hourlyRate || 0,
      bio: profile.bio || fl.bio || 'Experienced professional ready to collaborate.'
    });
    setIsProfileModalOpen(true);
  };

  const handleOpenPitchModal = (fl) => {
    setPitchTargetFreelancer(fl);
    setPitchError('');
    setPitchSuccess('');
    setPitchMessage(`Hi ${fl.name.split(' ')[0]}, I checked your profile and portfolio on GigSphere and believe you are a great fit for our project! We would love to have you onboard.`);
    
    // Find first available project
    const available = getAvailableProjectsForFreelancer(fl._id || fl.id);
    if (available.length > 0) {
      setSelectedProjectId(available[0]._id || available[0].id);
      setOfferedBudget(available[0].budget || '');
    } else {
      setSelectedProjectId('');
      setOfferedBudget('');
    }

    setIsPitchModalOpen(true);
  };

  // Helper: check if freelancer is already hired for a specific project
  const isFreelancerHiredForProject = (freelancerId, projectId) => {
    const hiredInContract = existingContracts.some(c => {
      const cProjId = c.project_id?._id || c.project_id || c.projectId;
      const cFlId = c.freelancer_id?._id || c.freelancer_id;
      return String(cProjId) === String(projectId) && String(cFlId) === String(freelancerId);
    });

    const project = clientProjects.find(p => String(p._id || p.id) === String(projectId));
    const hiredInProposals = project?.proposals?.some(prop => {
      const propFlId = prop.freelancer_id?._id || prop.freelancer_id;
      return String(propFlId) === String(freelancerId) && (prop.status === 'Hired' || prop.status === 'Accepted');
    });

    return hiredInContract || Boolean(hiredInProposals);
  };

  // Helper: check if pitch is already pending for this freelancer + project
  const isPitchPendingForProject = (freelancerId, projectId) => {
    return clientPitches.some(pitch => {
      const pProjId = pitch.project_id?._id || pitch.project_id;
      const pFlId = pitch.freelancer_id?._id || pitch.freelancer_id;
      return String(pProjId) === String(projectId) && 
             String(pFlId) === String(freelancerId) && 
             (pitch.status === 'Pending' || pitch.status === 'Bid Submitted');
    });
  };

  // Projects available to pitch for this freelancer
  const getAvailableProjectsForFreelancer = (freelancerId) => {
    return clientProjects.filter(project => {
      const projId = project._id || project.id;
      const isHired = isFreelancerHiredForProject(freelancerId, projId);
      const isPitched = isPitchPendingForProject(freelancerId, projId);
      return !isHired && !isPitched;
    });
  };

  const handleProjectSelectChange = (e) => {
    const pId = e.target.value;
    setSelectedProjectId(pId);
    const selected = clientProjects.find(p => String(p._id || p.id) === String(pId));
    if (selected) {
      setOfferedBudget(selected.budget || '');
    }
  };

  const handleSubmitPitch = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setPitchError('Please select an active project to pitch.');
      return;
    }
    if (!pitchMessage.trim()) {
      setPitchError('Please write a short pitch invitation message.');
      return;
    }

    setIsSubmittingPitch(true);
    setPitchError('');
    setPitchSuccess('');

    try {
      const flId = pitchTargetFreelancer._id || pitchTargetFreelancer.id;
      const res = await apiFetch('/pitches', {
        method: 'POST',
        body: JSON.stringify({
          freelancerId: flId,
          projectId: selectedProjectId,
          message: pitchMessage,
          offeredBudget: offeredBudget
        })
      });

      if (res && res.success) {
        setPitchSuccess('Project pitch successfully sent! The freelancer has been notified.');
        // Refresh pitches list
        const updatedPitches = await apiFetch('/pitches/client').catch(() => []);
        setClientPitches(Array.isArray(updatedPitches) ? updatedPitches : []);
        setTimeout(() => {
          setIsPitchModalOpen(false);
          setPitchSuccess('');
        }, 1600);
      } else {
        setPitchError(res.message || 'Failed to send project pitch.');
      }
    } catch (err) {
      setPitchError(err.message || 'An error occurred while sending pitch.');
    } finally {
      setIsSubmittingPitch(false);
    }
  };

  // Filter & Search Logic
  const filteredFreelancers = freelancers.filter(fl => {
    const profile = fl.profile || {};
    const name = (fl.name || '').toLowerCase();
    const title = (profile.title || fl.title || '').toLowerCase();
    const bio = (profile.bio || fl.bio || '').toLowerCase();
    const skills = [
      ...(Array.isArray(profile.skills) ? profile.skills : []),
      ...(Array.isArray(fl.skills) ? fl.skills : [])
    ].map(s => String(s).toLowerCase()).join(' ');

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || name.includes(query) || title.includes(query) || bio.includes(query) || skills.includes(query);

    let matchesCategory = true;
    if (selectedCategory !== 'All Talent') {
      const catLower = selectedCategory.toLowerCase();
      if (catLower.includes('web')) matchesCategory = skills.includes('react') || skills.includes('web') || skills.includes('node') || skills.includes('frontend') || skills.includes('backend') || title.includes('web') || title.includes('developer');
      else if (catLower.includes('mobile')) matchesCategory = skills.includes('flutter') || skills.includes('react native') || skills.includes('ios') || skills.includes('android') || title.includes('mobile') || title.includes('app');
      else if (catLower.includes('design') || catLower.includes('ui')) matchesCategory = skills.includes('figma') || skills.includes('ui') || skills.includes('ux') || skills.includes('design') || title.includes('design') || title.includes('ui');
      else if (catLower.includes('ai') || catLower.includes('data')) matchesCategory = skills.includes('python') || skills.includes('ai') || skills.includes('ml') || skills.includes('data') || title.includes('data') || title.includes('ai');
      else if (catLower.includes('writing')) matchesCategory = skills.includes('content') || skills.includes('copy') || skills.includes('writing') || title.includes('writer');
      else if (catLower.includes('marketing')) matchesCategory = skills.includes('marketing') || skills.includes('seo') || skills.includes('social') || title.includes('marketing');
    }

    return matchesSearch && matchesCategory;
  });

  // Sorting Logic
  const sortedFreelancers = [...filteredFreelancers].sort((a, b) => {
    const aProf = a.profile || {};
    const bProf = b.profile || {};
    const aRating = aProf.rating || a.rating || 5;
    const bRating = bProf.rating || b.rating || 5;
    const aRate = aProf.hourlyRate || a.hourlyRate || 0;
    const bRate = bProf.hourlyRate || b.hourlyRate || 0;
    const aRev = aProf.numReviews || a.numReviews || 0;
    const bRev = bProf.numReviews || b.numReviews || 0;

    if (sortBy === 'rating') return bRating - aRating;
    if (sortBy === 'reviews') return bRev - aRev;
    if (sortBy === 'rate-asc') return aRate - bRate;
    if (sortBy === 'rate-desc') return bRate - aRate;
    return 0;
  });

  return (
    <div className="bf-page-container">
      {/* Top Banner Header */}
      <div className="bf-header-banner">
        <div className="bf-header-content">
          <div className="bf-badge">
            <Sparkles size={16} /> Verified Top Talent Network
          </div>
          <h1 className="bf-title">Browse & Hire Top Freelancers</h1>
          <p className="bf-subtitle">
            Explore world-class engineers, designers, and specialists. Inspect detailed portfolios and pitch your projects directly.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bf-controls-card">
        <div className="bf-search-row">
          <div className="bf-search-wrapper">
            <Search className="bf-search-icon" size={18} />
            <input
              type="text"
              placeholder="Search talent by name, role (e.g. Full Stack Developer), or skill (e.g. React, Figma)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bf-search-input"
            />
            {searchQuery && (
              <button className="bf-search-clear" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="bf-sort-wrapper">
            <span className="bf-sort-label">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bf-sort-select"
            >
              <option value="rating">Highest Rated ★</option>
              <option value="reviews">Most Reviews</option>
              <option value="rate-asc">Hourly Rate: Low to High</option>
              <option value="rate-desc">Hourly Rate: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="bf-category-pills">
          {SKILL_CATEGORIES.map(category => (
            <button
              key={category}
              className={`bf-category-pill ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Talent Grid Results */}
      {isLoading ? (
        <div className="bf-loading-state">
          <div className="bf-spinner"></div>
          <p>Finding top verified talent...</p>
        </div>
      ) : sortedFreelancers.length === 0 ? (
        <div className="bf-empty-state">
          <div className="bf-empty-icon">
            <Users size={48} />
          </div>
          <h3>No Freelancers Found</h3>
          <p>Try refining your search keyword or switching category filters.</p>
          <button 
            className="bf-reset-btn"
            onClick={() => { setSearchQuery(''); setSelectedCategory('All Talent'); }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bf-grid">
          {sortedFreelancers.map(fl => {
            const flId = fl._id || fl.id;
            const profile = fl.profile || {};
            const name = fl.name || 'Freelancer';
            const title = profile.title || fl.title || 'Professional Specialist';
            const avatar = getCleanAvatar(fl.avatar || fl.profilePhoto, name);
            const rating = profile.rating || fl.rating || 5.0;
            const numReviews = profile.numReviews || fl.numReviews || 0;
            const hourlyRate = profile.hourlyRate || fl.hourlyRate || 0;
            const location = fl.location || profile.location || 'India';
            const bio = profile.bio || fl.bio || 'Specialized expert with extensive project delivery experience on GigSphere.';
            
            const rawSkills = profile.skills || fl.skills || [];
            const skills = (Array.isArray(rawSkills) ? rawSkills : [rawSkills])
              .flatMap(s => typeof s === 'string' ? s.split(',').map(x => x.trim()) : s)
              .filter(Boolean)
              .slice(0, 5);

            const availableProjects = getAvailableProjectsForFreelancer(flId);
            const hasAvailableProjects = availableProjects.length > 0;

            return (
              <div key={flId} className="bf-card">
                {/* Card Top / Header */}
                <div className="bf-card-header">
                  <div className="bf-avatar-box">
                    <img src={avatar} alt={name} className="bf-avatar-img" />
                    <span className="bf-online-indicator" title="Verified & Active" />
                  </div>

                  <div className="bf-card-meta">
                    <div className="bf-name-row">
                      <h3 className="bf-name">{name}</h3>
                      <ShieldCheck className="bf-verified-badge" size={18} title="Identity & Skills Verified" />
                    </div>
                    <p className="bf-card-title">{title}</p>
                    
                    <div className="bf-rating-location-row">
                      <div className="bf-star-rating">
                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        <span className="bf-rating-num">{Number(rating).toFixed(1)}</span>
                        {numReviews > 0 && <span className="bf-reviews-cnt">({numReviews})</span>}
                      </div>
                      <span className="bf-dot-sep">•</span>
                      <div className="bf-location">
                        <MapPin size={13} />
                        <span>{location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio Excerpt */}
                <p className="bf-bio-text">{bio}</p>

                {/* Skills Badges */}
                <div className="bf-skills-row">
                  {skills.map((skill, idx) => (
                    <span key={idx} className="bf-skill-tag">{skill}</span>
                  ))}
                </div>

                {/* Card Bottom / Price & Actions */}
                <div className="bf-card-footer">
                  <div className="bf-rate-display">
                    <span className="bf-rate-label">Hourly Rate</span>
                    <span className="bf-rate-value">
                      {hourlyRate > 0 ? `${formatINR(hourlyRate)}/hr` : 'Custom Quote'}
                    </span>
                  </div>

                  <div className="bf-actions-group">
                    <button
                      className="bf-btn-secondary"
                      onClick={() => handleOpenProfile(fl)}
                    >
                      View Profile
                    </button>
                    <button
                      className="bf-btn-primary"
                      onClick={() => handleOpenPitchModal(fl)}
                    >
                      <Send size={15} />
                      Pitch Project
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. View Freelancer Profile Modal (Reused) */}
      <FreelancerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        freelancer={selectedFreelancer}
        onHire={() => {
          setIsProfileModalOpen(false);
          if (selectedFreelancer) handleOpenPitchModal(selectedFreelancer);
        }}
        onMessage={() => {
          setIsProfileModalOpen(false);
          navigate(`/client/dashboard/chat?partnerId=${selectedFreelancer?._id || selectedFreelancer?.id}`);
        }}
      />

      {/* 2. Pitch Project Modal */}
      {isPitchModalOpen && pitchTargetFreelancer && (
        <div className="bf-modal-overlay" onClick={() => setIsPitchModalOpen(false)}>
          <div className="bf-pitch-modal" onClick={e => e.stopPropagation()}>
            <div className="bf-pitch-header">
              <div className="bf-pitch-fl-info">
                <img
                  src={getCleanAvatar(pitchTargetFreelancer.avatar || pitchTargetFreelancer.profilePhoto, pitchTargetFreelancer.name)}
                  alt={pitchTargetFreelancer.name}
                  className="bf-pitch-avatar"
                />
                <div>
                  <h3 className="bf-pitch-fl-name">Pitch Project to {pitchTargetFreelancer.name}</h3>
                  <p className="bf-pitch-fl-role">{pitchTargetFreelancer.profile?.title || pitchTargetFreelancer.title || 'Freelancer'}</p>
                </div>
              </div>
              <button className="bf-modal-close" onClick={() => setIsPitchModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitPitch} className="bf-pitch-body">
              {pitchError && (
                <div className="bf-alert-error">
                  <AlertCircle size={18} />
                  <span>{pitchError}</span>
                </div>
              )}
              {pitchSuccess && (
                <div className="bf-alert-success">
                  <CheckCircle size={18} />
                  <span>{pitchSuccess}</span>
                </div>
              )}

              {/* Project Selection */}
              <div className="bf-form-group">
                <label className="bf-form-label">
                  Select Project to Pitch <span className="bf-req">*</span>
                </label>
                
                {clientProjects.length === 0 ? (
                  <div className="bf-no-projects-notice">
                    <p>You have not posted any projects yet.</p>
                    <button
                      type="button"
                      className="bf-create-proj-inline-btn"
                      onClick={() => navigate('/client/dashboard/create-project')}
                    >
                      <PlusCircle size={15} /> Create a Project First
                    </button>
                  </div>
                ) : (
                  <select
                    className="bf-form-select"
                    value={selectedProjectId}
                    onChange={handleProjectSelectChange}
                    required
                  >
                    <option value="" disabled>-- Select one of your active projects --</option>
                    {clientProjects.map(proj => {
                      const projId = proj._id || proj.id;
                      const flId = pitchTargetFreelancer._id || pitchTargetFreelancer.id;
                      const isHired = isFreelancerHiredForProject(flId, projId);
                      const isPitched = isPitchPendingForProject(flId, projId);
                      const isDisabled = isHired || isPitched;

                      let statusNote = '';
                      if (isHired) statusNote = ' (Already Hired)';
                      else if (isPitched) statusNote = ' (Pitch Sent)';

                      return (
                        <option
                          key={projId}
                          value={projId}
                          disabled={isDisabled}
                        >
                          {proj.title} • {proj.budget ? formatINR(proj.budget) : 'Fixed Price'} {statusNote}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Proposed / Offered Budget */}
              <div className="bf-form-group">
                <label className="bf-form-label">Offered Budget / Milestone (₹)</label>
                <input
                  type="text"
                  className="bf-form-input"
                  placeholder="e.g. 15000"
                  value={offeredBudget}
                  onChange={e => setOfferedBudget(e.target.value)}
                />
              </div>

              {/* Pitch Note / Message */}
              <div className="bf-form-group">
                <label className="bf-form-label">
                  Personalized Pitch Message <span className="bf-req">*</span>
                </label>
                <textarea
                  className="bf-form-textarea"
                  rows={4}
                  placeholder="Explain why they are a great fit and what the deliverables are..."
                  value={pitchMessage}
                  onChange={e => setPitchMessage(e.target.value)}
                  required
                />
              </div>

              {/* Footer Actions */}
              <div className="bf-pitch-footer">
                <button
                  type="button"
                  className="bf-btn-cancel"
                  onClick={() => setIsPitchModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bf-btn-send-pitch"
                  disabled={isSubmittingPitch || clientProjects.length === 0 || !selectedProjectId}
                >
                  {isSubmittingPitch ? (
                    'Sending Pitch...'
                  ) : (
                    <>
                      <Send size={16} /> Send Direct Pitch
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
