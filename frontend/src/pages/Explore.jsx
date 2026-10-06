import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AntigravityCanvas from '../components/AntigravityCanvas';
import AuthModal from '../components/AuthModal';
import { getUserRole, isAuthenticated } from '../utils/authUtils';
import {
  Filter,
  Search,
  MapPin,
  Star,
  CheckCircle,
  LayoutGrid,
  List,
  Clock,
  Users,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Briefcase
} from 'lucide-react';
import { formatINR } from '../utils/currency';
import { apiFetch } from '../utils/api';
import { getStoredProposals, saveStoredProposals } from '../utils/proposalUtils';
import { getUserProfile } from '../utils/authUtils';
import './BrowseProjects.css';

const MOCK_CATEGORIES = [
  'All Projects',
  'Saved & Favorites',
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Graphic Design',
  'Digital Marketing',
  'Content Writing',
  'Data Science'
];

const DEFAULT_PROJECTS = [
  {
    _id: 'prj-101',
    id: 'prj-101',
    title: 'Modern E-commerce Website Design & React Frontend',
    category: 'Web Development',
    budgetType: 'Fixed Price',
    budget: '₹85,000',
    experienceLevel: 'Intermediate',
    duration: '1 to 3 months',
    createdAt: new Date().toISOString(),
    description: 'We are seeking an experienced React developer to build a modern, high-converting e-commerce web application with glassmorphism aesthetic, cart functionality, and payment gateway integration.',
    skills: ['React', 'Node.js', 'Redux', 'Tailwind CSS', 'Stripe'],
    client_id: { name: 'TechNova Solutions', rating: 4.9 },
    saved: false
  },
  {
    _id: 'prj-102',
    id: 'prj-102',
    title: 'Cross-Platform Mobile App for Healthcare Startup',
    category: 'Mobile Development',
    budgetType: 'Fixed Price',
    budget: '₹1,20,000',
    experienceLevel: 'Expert',
    duration: '3 to 6 months',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    description: 'Looking for a React Native specialist to craft a seamless doctor appointment booking application featuring live video consultation, prescription uploads, and push notifications.',
    skills: ['React Native', 'TypeScript', 'WebRTC', 'Firebase'],
    client_id: { name: 'HealthCare Plus', rating: 5.0 },
    saved: false
  },
  {
    _id: 'prj-103',
    id: 'prj-103',
    title: 'Fintech Dashboard UI/UX Design System',
    category: 'UI/UX Design',
    budgetType: 'Fixed Price',
    budget: '₹60,000',
    experienceLevel: 'Intermediate',
    duration: 'Less than 1 month',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    description: 'We need a Figma UI/UX designer to create a complete design system, dark mode components, and interactive prototypes for our personal finance management dashboard.',
    skills: ['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping'],
    client_id: { name: 'FinTrust Global', rating: 4.8 },
    saved: false
  },
  {
    _id: 'prj-104',
    id: 'prj-104',
    title: 'Node.js Microservices Backend & Redis Caching',
    category: 'Web Development',
    budgetType: 'Fixed Price',
    budget: '₹95,000',
    experienceLevel: 'Expert',
    duration: '1 to 3 months',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    description: 'Architect and scale our backend microservices using Express, MongoDB, and Redis caching. Must have strong experience with REST APIs and JWT security.',
    skills: ['Node.js', 'MongoDB', 'Redis', 'Express.js', 'Docker'],
    client_id: { name: 'CloudScale Technologies', rating: 4.9 },
    saved: false
  }
];

export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getUserRole();
  const isAuth = isAuthenticated();

  useEffect(() => {
    if (isAuth && role && location.pathname === '/explore') {
      navigate(`/${role}/dashboard/browse-projects`, { replace: true });
    }
  }, [isAuth, role, location.pathname, navigate]);

  const [projects, setProjects] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All Projects');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sortBy, setSortBy] = useState('Best Match');
  const [filters, setFilters] = useState({
    skill: '',
    budgetRange: 'Any Budget',
    projectType: 'Any Type',
    experienceLevels: [],
    durations: [],
    clientRating: 'Any Rating',
    postedDate: 'Any Time'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, filters, sortBy]);

  // URL query check for ?saved=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('saved') === 'true') {
      setActiveCategory('Saved & Favorites');
    }
  }, [location.search]);

  const [proposalProject, setProposalProject] = useState(null);
  const [proposalForm, setProposalForm] = useState({ bidAmount: '', coverLetter: '', deliveryTime: '1 to 2 weeks' });
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  const [recommendations, setRecommendations] = useState([]);
  const [isRecsLoading, setIsRecsLoading] = useState(false);
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [aiDraftTone, setAiDraftTone] = useState('professional');

  // Fetch projects and recommendations from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await apiFetch('/projects');
        const savedList = JSON.parse(localStorage.getItem('saved_projects') || '[]');
        const updated = (Array.isArray(data) ? data : []).map(p => ({
          ...p,
          saved: savedList.includes(p._id)
        }));
        setProjects(updated);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRecommendations = async () => {
      if (role === 'freelancer' && isAuth) {
        setIsRecsLoading(true);
        try {
          const res = await apiFetch('/freelancer/ai/recommendations?limit=6');
          if (res && Array.isArray(res.recommendations)) {
            setRecommendations(res.recommendations);
          }
        } catch (err) {
          console.error('Error loading AI recommendations in Explore:', err);
        } finally {
          setIsRecsLoading(false);
        }
      }
    };

    fetchProjects();
    fetchRecommendations();
  }, [role, isAuth]);

  // Track AI interaction events
  const trackAiEvent = async (eventType, project, score = 0) => {
    if (!isAuth || role !== 'freelancer' || !project) return;
    try {
      await apiFetch('/freelancer/ai/events', {
        method: 'POST',
        body: JSON.stringify({
          projectId: project._id || project.id,
          eventType,
          score: score || project.matchScore || project.matchPercentage || 0
        })
      });
    } catch (e) {
      // non-blocking
    }
  };

  // AI Proposal Assistant handler
  const handleAiProposalAssist = async (action = 'generate') => {
    if (!proposalProject) return;
    setIsAiDrafting(true);
    try {
      const res = await apiFetch('/freelancer/ai/proposal', {
        method: 'POST',
        body: JSON.stringify({
          projectId: proposalProject._id || proposalProject.id,
          projectTitle: proposalProject.title,
          projectDescription: proposalProject.description,
          requiredSkills: proposalProject.skills || proposalProject.requiredSkills || [],
          action,
          tone: aiDraftTone,
          currentDraft: proposalForm.coverLetter
        })
      });

      if (res && res.proposalText) {
        setProposalForm(prev => ({
          ...prev,
          coverLetter: res.proposalText,
          bidAmount: prev.bidAmount || proposalProject.budget || ''
        }));
      }
    } catch (err) {
      console.error('AI proposal generation failed:', err);
      alert('AI Proposal Assistant: ' + err.message);
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    if (!proposalProject) return;
    setIsSubmittingProposal(true);
    try {
      await axios.post(`http://localhost:5001/api/projects/${proposalProject._id}/proposals`, proposalForm);
      alert('Proposal submitted successfully!');
      setProposalProject(null);
      setProposalForm({ bidAmount: '', coverLetter: '', deliveryTime: '1 to 2 weeks' });
    } catch (err) {
      console.error('Failed to submit proposal:', err);
      alert('Failed to submit proposal: ' + err.message);
    } finally {
      setIsSubmittingProposal(false);
    }
  };



  const toggleSave = (e, id) => {
    e.preventDefault();
    if (!isAuth) {
      setShowAuthModal(true);
      return;
    }
    const savedList = JSON.parse(localStorage.getItem('saved_projects') || '[]');
    let updated;
    const targetProject = projects.find(p => p._id === id);
    if (savedList.includes(id)) {
      updated = savedList.filter(item => item !== id);
    } else {
      updated = [...savedList, id];
      // Track bookmark event for adaptive learning
      if (targetProject) {
        trackAiEvent('project_bookmark', targetProject, targetProject.matchScore || 80);
      }
    }
    localStorage.setItem('saved_projects', JSON.stringify(updated));
    setProjects(projects.map(p => p._id === id ? { ...p, saved: updated.includes(p._id) } : p));
  };

  const handleProposeClick = (project) => {
    if (!isAuth) {
      setShowAuthModal(true);
      return;
    }
    if (role === 'client') {
      alert('Clients cannot submit proposals. Please log in as a freelancer.');
      return;
    }
    setProposalProject(project);
    trackAiEvent('project_view', project, project.matchScore || 75);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key, value) => {
    setFilters(prev => {
      const current = prev[key];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveCategory('All Projects');
    setFilters({
      skill: '',
      budgetRange: 'Any Budget',
      projectType: 'Any Type',
      experienceLevels: [],
      durations: [],
      clientRating: 'Any Rating',
      postedDate: 'Any Time'
    });
  };

  const filteredProjects = projects.filter(p => {
    if (activeCategory === 'Saved & Favorites') {
      const savedList = JSON.parse(localStorage.getItem('saved_projects') || '[]');
      if (!p.saved && !savedList.includes(p._id)) return false;
    } else if (activeCategory !== 'All Projects' && p.category !== activeCategory) {
      return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = p.title && p.title.toLowerCase().includes(q);
      const descMatch = p.description && p.description.toLowerCase().includes(q);
      const skillsMatch = p.skills && p.skills.some(s => s.toLowerCase().includes(q));
      if (!titleMatch && !descMatch && !skillsMatch) {
        return false;
      }
    }

    if (filters.skill && p.skills && !p.skills.includes(filters.skill)) return false;
    if (filters.projectType !== 'Any Type' && p.budgetType !== filters.projectType) return false;
    if (filters.experienceLevels.length > 0 && p.experienceLevel && !filters.experienceLevels.includes(p.experienceLevel)) return false;
    if (filters.durations.length > 0 && p.duration && !filters.durations.includes(p.duration)) return false;

    // Default client rating to handle missing data gracefully
    const rating = (p.client_id && p.client_id.rating) || 5.0;
    if (filters.clientRating === '4.5 & up' && rating < 4.5) return false;
    if (filters.clientRating === '4.0 & up' && rating < 4.0) return false;

    if (filters.budgetRange !== 'Any Budget') {
      const budgetNum = parseInt(p.budget, 10) || 0;
      if (filters.budgetRange === '₹10k - ₹50k' && (budgetNum < 10000 || budgetNum > 50000)) return false;
      if (filters.budgetRange === '₹50k - ₹1L' && (budgetNum < 50000 || budgetNum > 100000)) return false;
      if (filters.budgetRange === '₹1L+' && budgetNum <= 100000) return false;
    }

    if (filters.postedDate !== 'Any Time') {
      const now = new Date();
      const projectDate = new Date(p.createdAt);
      const diffTime = Math.abs(now - projectDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (filters.postedDate === 'Last 24 Hours' && diffDays > 1) return false;
      if (filters.postedDate === 'Last 7 Days' && diffDays > 7) return false;
      if (filters.postedDate === 'Last 14 Days' && diffDays > 14) return false;
    }

    return true;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'Newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'Highest Budget') return (parseInt(b.budget) || 0) - (parseInt(a.budget) || 0);
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedProjects = sortedProjects.slice(startIndex, startIndex + itemsPerPage);

  const SidebarContent = () => (
    <>
      <div className="drawer-header lg:hidden">
        <h2 className="filter-title" style={{ marginBottom: 0 }}>Filters</h2>
        <button className="close-drawer-btn" onClick={() => setIsFilterOpen(false)}>
          <X size={24} />
        </button>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Project Category</h3>
        <div className="custom-select-wrapper">
          <select className="custom-select" value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
            {MOCK_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Skills</h3>
        <div className="custom-select-wrapper">
          <select className="custom-select" value={filters.skill} onChange={(e) => handleFilterChange('skill', e.target.value)}>
            <option value="">Select a skill...</option>
            <option value="React">React</option>
            <option value="Node.js">Node.js</option>
            <option value="UI/UX">UI/UX</option>
            <option value="Python">Python</option>
            <option value="TypeScript">TypeScript</option>
          </select>
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Budget Range</h3>
        {['Any Budget', '₹10k - ₹50k', '₹50k - ₹1L', '₹1L+'].map(budget => (
          <label key={budget} className="custom-radio">
            <input type="radio" name="budgetRange" checked={filters.budgetRange === budget} onChange={() => handleFilterChange('budgetRange', budget)} />
            {budget}
          </label>
        ))}
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Project Type</h3>
        {['Any Type', 'Fixed Price', 'Hourly'].map(type => (
          <label key={type} className="custom-radio">
            <input type="radio" name="projectType" checked={filters.projectType === type} onChange={() => handleFilterChange('projectType', type)} />
            {type}
          </label>
        ))}
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Experience Level</h3>
        {['Entry Level', 'Intermediate', 'Expert'].map(level => (
          <label key={level} className="custom-checkbox">
            <input type="checkbox" checked={filters.experienceLevels.includes(level)} onChange={() => handleCheckboxChange('experienceLevels', level)} />
            {level}
          </label>
        ))}
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Project Duration</h3>
        {['Less than 1 month', '1 to 3 months', '3 to 6 months', 'More than 6 months'].map(dur => (
          <label key={dur} className="custom-checkbox">
            <input type="checkbox" checked={filters.durations.includes(dur)} onChange={() => handleCheckboxChange('durations', dur)} />
            {dur}
          </label>
        ))}
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Client Rating</h3>
        {['4.5 & up', '4.0 & up', 'Any Rating'].map((rating, i) => (
          <label key={rating} className="custom-radio">
            <input type="radio" name="clientRating" checked={filters.clientRating === rating} onChange={() => handleFilterChange('clientRating', rating)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {i < 2 ? <Star size={14} fill="#eab308" color="#eab308" /> : null}
              {rating}
            </div>
          </label>
        ))}
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Posted Date</h3>
        {['Any Time', 'Last 24 Hours', 'Last 7 Days', 'Last 14 Days'].map(time => (
          <label key={time} className="custom-radio">
            <input type="radio" name="postedDate" checked={filters.postedDate === time} onChange={() => handleFilterChange('postedDate', time)} />
            {time}
          </label>
        ))}
      </div>

      <div className="filter-actions">
        <button className="btn-clear" onClick={clearFilters}>Clear All</button>
        <button className="btn-apply" onClick={() => setIsFilterOpen(false)}>Apply Filters</button>
      </div>
    </>
  );

  return (
    <div className="gigsphere-freelancer-browse-projects" style={{ position: 'relative', overflow: 'hidden' }}>
      <AntigravityCanvas />

      <div className="browse-container" style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Browse Projects</h1>
            <p className="page-description">Discover projects that match your skills and experience.</p>
          </div>
          <button
            className={`saved-projects-btn ${activeCategory === 'Saved & Favorites' ? 'active' : ''}`}
            onClick={() => {
              if (!isAuth) {
                setShowAuthModal(true);
              } else {
                setActiveCategory(prev => prev === 'Saved & Favorites' ? 'All Projects' : 'Saved & Favorites');
              }
            }}
            style={activeCategory === 'Saved & Favorites' ? { background: 'linear-gradient(135deg, #1a73e8, #1557b0)', color: '#ffffff' } : {}}
          >
            <Bookmark size={18} fill={activeCategory === 'Saved & Favorites' ? '#fff' : 'none'} />
            {activeCategory === 'Saved & Favorites' ? 'Viewing Saved Favorites' : 'Saved Projects'}
          </button>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <div className="search-input-group">
            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                className="search-input"
                placeholder="Search by project title, skill, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="search-btn">Search Projects</button>
            <button className="mobile-filter-btn" onClick={() => setIsFilterOpen(true)}>
              <Filter size={20} />
              Filters
            </button>
          </div>

          {/* Category Chips */}
          <div className="category-chips">
            {MOCK_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="content-layout">

          {/* Desktop Sidebar Filter */}
          <aside className="filter-sidebar">
            <SidebarContent />
          </aside>

          {/* Mobile Drawer Filter */}
          <div className={`filter-drawer-overlay ${isFilterOpen ? 'open' : ''}`} onClick={() => setIsFilterOpen(false)}>
            <div className="filter-drawer" onClick={e => e.stopPropagation()}>
              <SidebarContent />
            </div>
          </div>

          {/* Main Results */}
          <main className="results-area">

            {/* AI RECOMMENDED FOR YOU SECTION (PRIMARY RECOMMENDATION SURFACE) */}
            {role === 'freelancer' && isAuth && (
              <div className="ai-recomms-section" style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #a7f3d0' }}>
                      ✨ AI Smart Match
                    </span>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }}>
                      Recommended For You
                    </h2>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Personalized to your profile skills & experience
                  </span>
                </div>

                {isRecsLoading ? (
                  <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
                    Scanning marketplace briefs for best matches...
                  </div>
                ) : recommendations.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    {recommendations.slice(0, 4).map(rec => (
                      <div key={rec._id || rec.id} className="project-card" style={{ border: '1.5px solid #10b981', background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 9px', borderRadius: '14px' }}>
                            {rec.matchPercentage || rec.matchScore}% Match
                          </span>
                          <button
                            className="bookmark-icon-btn"
                            onClick={(e) => toggleSave(e, rec._id)}
                            style={{ padding: '4px' }}
                          >
                            <Bookmark size={18} fill={rec.saved ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        <Link to={`/gig/${rec._id}`} style={{ textDecoration: 'none' }}>
                          <h3 className="project-title" style={{ fontSize: '1.05rem', margin: '0 0 6px', color: '#0f172a' }}>{rec.title}</h3>
                        </Link>

                        <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, margin: '4px 0 10px' }}>
                          Budget: {formatINR(rec.budget || rec.budgetMax || 0)}
                        </div>

                        {/* Matching Skills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                          {(rec.matchingSkills || []).map((sk, sIdx) => (
                            <span key={sIdx} style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                              ✓ {sk}
                            </span>
                          ))}
                          {(rec.missingSkills || []).slice(0, 2).map((sk, sIdx) => (
                            <span key={sIdx} style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px' }}>
                              + {sk}
                            </span>
                          ))}
                        </div>

                        {/* Why this project explainability */}
                        <div style={{ background: 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '8px', fontSize: '0.76rem', color: '#334155', marginBottom: '14px', border: '1px solid #bbf7d0' }}>
                          <strong style={{ display: 'block', marginBottom: '4px', color: '#065f46' }}>Why this project?</strong>
                          <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.4 }}>
                            {(rec.reasons || rec.whyRecommended || []).map((r, rIdx) => (
                              <li key={rIdx}>{r}</li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                          <button
                            className="btn-secondary"
                            style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                            onClick={() => {
                              trackAiEvent('project_view', rec, rec.matchPercentage);
                              navigate(`/gig/${rec._id}`);
                            }}
                          >
                            View Details
                          </button>
                          <button
                            className="btn-primary"
                            style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: '#059669' }}
                            onClick={() => handleProposeClick(rec)}
                          >
                            Submit Proposal
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.82rem', color: '#64748b', border: '1px dashed #cbd5e1' }}>
                    💡 <strong>Smart Matching Active:</strong> As new client briefs matching your technical stack are posted, personalized high-confidence recommendations will automatically appear here.
                  </div>
                )}
              </div>
            )}

            <div className="results-toolbar">
              <div className="results-count">
                Showing <strong>{sortedProjects.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, sortedProjects.length)}</strong> of <strong>{sortedProjects.length}</strong> projects found
              </div>

              <div className="toolbar-actions">
                <div className="sort-dropdown">
                  Sort By:
                  <div className="custom-select-wrapper" style={{ display: 'inline-block', width: '160px' }}>
                    <select className="custom-select" style={{ padding: '8px 12px' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option>Best Match</option>
                      <option>Newest</option>
                      <option>Highest Budget</option>
                    </select>
                  </div>
                </div>

                <div className="view-toggle">
                  <button
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className={`projects-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="project-card" style={{ height: '350px' }}>
                    <div className="skeleton" style={{ width: '60%', height: '24px', marginBottom: '16px' }}></div>
                    <div className="skeleton" style={{ width: '40%', height: '16px', marginBottom: '24px' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '80px', marginBottom: '24px' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '100%', flex: 1 }}></div>
                  </div>
                ))}
              </div>
            ) : sortedProjects.length > 0 ? (
              <>
                <div className={`projects-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                  {paginatedProjects.map(project => (
                    <div key={project.id || project._id} className="project-card">

                      <div className="card-header">
                        <div style={{ flex: 1 }}>
                          <Link to={`/gig/${project._id}`} style={{ textDecoration: 'none' }}>
                            <h3 className="project-title">{project.title}</h3>
                          </Link>

                          <div className="client-info" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                            {(() => {
                              const client = typeof project.client_id === 'object' ? (project.client_id || {}) : {};
                              const rawName = client.name || client.companyName || '';
                              const clientName = (rawName && !['Client User', 'Client Pro', 'Demo Client', 'Client', 'Unknown Client'].includes(rawName)) ? rawName : 'Heartware';
                              const rawPic = client.avatar || client.profilePhoto;
                              let clientAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=1a73e8&color=fff`;
                              if (rawPic && typeof rawPic === 'string' && rawPic.trim() !== '') {
                                if (rawPic.startsWith('http://') || rawPic.startsWith('https://')) clientAvatar = rawPic;
                                else if (rawPic.startsWith('/uploads')) clientAvatar = `http://localhost:5001${rawPic}`;
                                else clientAvatar = rawPic;
                              }
                              return (
                                <>
                                  <img
                                    src={clientAvatar}
                                    alt={clientName}
                                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary, #1a73e8)', flexShrink: 0 }}
                                  />
                                  <div>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', display: 'block', lineHeight: 1.2 }}>
                                      {clientName}
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 600, fontSize: '0.75rem', marginTop: '2px' }}>
                                      <CheckCircle size={12} /> Verified Client
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <button
                          className={`bookmark-icon-btn ${project.saved ? 'saved' : ''}`}
                          onClick={(e) => toggleSave(e, project._id)}
                        >
                          <Bookmark size={22} fill={project.saved ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <div className="project-meta-grid" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', margin: '16px 0' }}>
                        <div className="meta-item">
                          <span className="meta-label">{project.budgetType || 'Fixed Price'}</span>
                          <span className="meta-value" style={{ color: '#10b981', fontSize: '16px' }}>
                            {project.budget ? formatINR(project.budget) : 'Open Budget'}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Experience</span>
                          <span className="meta-value">{project.experienceLevel || 'Intermediate'}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Duration</span>
                          <span className="meta-value">{project.duration || 'Not specified'}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Posted</span>
                          <span className="meta-value">{new Date(project.createdAt).toLocaleDateString() || 'Recently'}</span>
                        </div>
                      </div>

                      <p className="project-desc" style={{ color: '#475569', fontSize: '15px' }}>{project.description}</p>

                      <div className="skills-container">
                        {project.skills && project.skills.map(skill => (
                          <span key={skill} className="skill-chip">{skill}</span>
                        ))}
                      </div>

                      <div className="card-footer" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                        <div className="footer-stats">
                          <div className="stat-item" style={{ fontSize: '14px', color: '#64748b' }}>
                            <Users size={16} /> {project.proposals ? project.proposals.length : 0} Proposals
                          </div>
                        </div>
                        <div className="card-actions">
                          <button
                            className="btn-secondary"
                            onClick={(e) => {
                              if (!isAuth) {
                                e.preventDefault();
                                setShowAuthModal(true);
                              } else {
                                navigate(`/gig/${project._id}`);
                              }
                            }}
                          >
                            View Project
                          </button>
                          {role !== 'client' && (
                            <button className="btn-primary" onClick={() => handleProposeClick(project)}>Submit Proposal</button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      disabled={validCurrentPage === 1}
                      onClick={() => {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      title="Previous Page"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (totalPages <= 7) return true;
                        if (page === 1 || page === totalPages) return true;
                        return Math.abs(page - validCurrentPage) <= 1;
                      })
                      .reduce((acc, page, idx, arr) => {
                        if (idx > 0 && page - arr[idx - 1] > 1) {
                          acc.push('...');
                        }
                        acc.push(page);
                        return acc;
                      }, [])
                      .map((p, idx) => (
                        p === '...' ? (
                          <span key={`dots-${idx}`} style={{ color: 'var(--text-muted)', padding: '0 4px', display: 'grid', placeContent: 'center' }}>...</span>
                        ) : (
                          <button
                            key={p}
                            className={`page-btn ${validCurrentPage === p ? 'active' : ''}`}
                            onClick={() => {
                              setCurrentPage(p);
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                          >
                            {p}
                          </button>
                        )
                      ))}

                    <button
                      className="page-btn"
                      disabled={validCurrentPage === totalPages}
                      onClick={() => {
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      title="Next Page"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                {activeCategory === 'Saved & Favorites' ? (
                  <>
                    <Bookmark className="empty-icon" style={{ color: '#ef4444' }} />
                    <h3 className="empty-title">No Saved Projects Yet</h3>
                    <p className="empty-desc">Click the heart or bookmark icon on any project listing to save it to your favorites for quick access.</p>
                    <button className="btn-primary" onClick={() => setActiveCategory('All Projects')}>Browse All Projects</button>
                  </>
                ) : (
                  <>
                    <Briefcase className="empty-icon" />
                    <h3 className="empty-title">No projects found</h3>
                    <p className="empty-desc">We couldn't find any projects matching your current filters and search query. Try adjusting your criteria.</p>
                    <button className="btn-secondary" onClick={clearFilters}>Clear All Filters</button>
                  </>
                )}
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Submit Proposal Modal */}
      {proposalProject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '550px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Submit Proposal</h2>
              <button onClick={() => setProposalProject(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>
              Submitting for: <strong>{proposalProject.title}</strong>
            </p>

            <form onSubmit={handleProposalSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Bid Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 25000"
                  value={proposalForm.bidAmount}
                  onChange={(e) => setProposalForm({ ...proposalForm, bidAmount: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Estimated Delivery Time</label>
                <select
                  value={proposalForm.deliveryTime}
                  onChange={(e) => setProposalForm({ ...proposalForm, deliveryTime: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  <option value="Less than 1 week">Less than 1 week</option>
                  <option value="1 to 2 weeks">1 to 2 weeks</option>
                  <option value="2 to 4 weeks">2 to 4 weeks</option>
                  <option value="1+ Months">1+ Months</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>Cover Letter / Pitch</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={isAiDrafting}
                      onClick={() => handleAiProposalAssist('generate')}
                      style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {isAiDrafting ? '✨ Generating...' : '✨ AI Generate'}
                    </button>
                    <button
                      type="button"
                      disabled={isAiDrafting || !proposalForm.coverLetter}
                      onClick={() => handleAiProposalAssist('shorten')}
                      style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Shorten
                    </button>
                    <button
                      type="button"
                      disabled={isAiDrafting || !proposalForm.coverLetter}
                      onClick={() => handleAiProposalAssist('professional')}
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Professional Tone
                    </button>
                  </div>
                </div>
                <textarea
                  required
                  rows="5"
                  placeholder="Describe your relevant experience and why you are the best fit for this project..."
                  value={proposalForm.coverLetter}
                  onChange={(e) => setProposalForm({ ...proposalForm, coverLetter: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical', fontSize: '0.88rem', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setProposalProject(null)}
                  style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProposal}
                  style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: 'var(--primary, #2563eb)', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                >
                  {isSubmittingProposal ? 'Submitting...' : 'Send Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Login Popup Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
