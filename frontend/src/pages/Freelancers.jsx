import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Filter,
  Search,
  MapPin,
  Star,
  CheckCircle,
  LayoutGrid,
  List,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  ShieldCheck,
  Send,
  DollarSign
} from 'lucide-react';
import './BrowseProjects.css'; // Reusing the same CSS for consistent layout

const MOCK_SKILLS = [
  'All Skills',
  'React',
  'Node.js',
  'UI/UX Design',
  'Figma',
  'Python',
  'Flutter',
  'SEO'
];

const DEFAULT_FREELANCERS = [
  {
    _id: 'fl-101',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    location: 'Mumbai, India',
    country: 'India',
    verified: true,
    saved: false,
    profile: {
      title: 'Senior Full Stack & React Native Developer',
      bio: 'Full stack developer with 6+ years of experience crafting scalable web and mobile solutions. Specialized in React, Node.js, Next.js, and Stripe integrations.',
      hourlyRate: 1200,
      skills: 'React, Node.js, TypeScript, React Native, Redux, AWS',
      rating: 4.9,
      reviewsCount: 48,
      jobSuccess: '99%',
      totalEarned: '₹8.5L+'
    }
  },
  {
    _id: 'fl-102',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    location: 'Bangalore, India',
    country: 'India',
    verified: true,
    saved: false,
    profile: {
      title: 'Lead UI/UX & Product Designer',
      bio: 'Award-winning product designer creating high-converting mobile apps, design systems, and web applications. Expert in Figma, wireframing, and user research.',
      hourlyRate: 950,
      skills: 'UI/UX Design, Figma, Wireframing, User Research, Prototyping',
      rating: 5.0,
      reviewsCount: 62,
      jobSuccess: '100%',
      totalEarned: '₹6.2L+'
    }
  },
  {
    _id: 'fl-103',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    location: 'New Delhi, India',
    country: 'India',
    verified: true,
    saved: false,
    profile: {
      title: 'Backend Specialist & Microservices Architect',
      bio: 'Backend engineer focused on high-concurrency Node.js, Express, MongoDB, and Redis architectures. 5 years building API gateways and payment systems.',
      hourlyRate: 1100,
      skills: 'Node.js, Express, MongoDB, Redis, Microservices, Docker',
      rating: 4.9,
      reviewsCount: 35,
      jobSuccess: '98%',
      totalEarned: '₹7.0L+'
    }
  },
  {
    _id: 'fl-104',
    name: 'Rohan Mehta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    location: 'Pune, India',
    country: 'India',
    verified: false,
    saved: false,
    profile: {
      title: 'Flutter & iOS Mobile Engineer',
      bio: 'Building cross-platform iOS and Android mobile apps. Expert in Flutter, Dart, Firebase, push notifications, and app store deployment.',
      hourlyRate: 800,
      skills: 'Flutter, Dart, Firebase, REST APIs, iOS, Android',
      rating: 4.8,
      reviewsCount: 29,
      jobSuccess: '96%',
      totalEarned: '₹4.5L+'
    }
  },
  {
    _id: 'fl-105',
    name: 'Vikram Verma',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    location: 'Hyderabad, India',
    country: 'India',
    verified: true,
    saved: false,
    profile: {
      title: 'SEO Content Specialist & Technical Writer',
      bio: 'SEO strategist and tech writer with 5 years creating high-converting blog posts, whitepapers, and technical documentation.',
      hourlyRate: 600,
      skills: 'SEO, Content Writing, Tech Writing, Blogging, Copywriting',
      rating: 4.9,
      reviewsCount: 51,
      jobSuccess: '97%',
      totalEarned: '₹3.8L+'
    }
  },
  {
    _id: 'fl-106',
    name: 'Aanya Patel',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    location: 'Ahmedabad, India',
    country: 'India',
    verified: true,
    saved: false,
    profile: {
      title: 'Data Scientist & Machine Learning Engineer',
      bio: 'Python and ML engineer building predictive models, NLP tools, and data analytics dashboards using Pandas, Scikit-Learn, and PyTorch.',
      hourlyRate: 1400,
      skills: 'Python, Data Science, Machine Learning, Pandas, PyTorch, SQL',
      rating: 5.0,
      reviewsCount: 22,
      jobSuccess: '100%',
      totalEarned: '₹5.5L+'
    }
  }
];

export default function Freelancers() {
  const navigate = useNavigate();
  const [freelancers, setFreelancers] = useState([]);
  const [activeSkill, setActiveSkill] = useState('All Skills');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [rateFilter, setRateFilter] = useState('Any Rate');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [sortOption, setSortOption] = useState('Best Match');
  const [isLoading, setIsLoading] = useState(true);

  const [hireModalFreelancer, setHireModalFreelancer] = useState(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [offerBudget, setOfferBudget] = useState('');

  // Fetch freelancers from backend
  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/users/freelancers');
        setFreelancers(response.data);
      } catch (error) {
        console.warn('Backend API fetch for freelancers fell back to default feed:', error);
        setFreelancers(DEFAULT_FREELANCERS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFreelancers();
  }, []);



  const toggleSave = (e, id) => {
    e.preventDefault();
    setFreelancers(prev => prev.map(f => f._id === id ? { ...f, saved: !f.saved } : f));
  };

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (!hireModalFreelancer) return;
    alert(`Invitation and Job Offer sent successfully to ${hireModalFreelancer.name}!`);
    setHireModalFreelancer(null);
    setInviteMessage('');
    setOfferBudget('');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveSkill('All Skills');
    setRateFilter('Any Rate');
    setCategoryFilter('All Categories');
  };

  // Filter & Sort Logic
  const filteredFreelancers = freelancers.filter(f => {
    const name = f.name || '';
    const title = (f.profile && f.profile.title) || '';
    const bio = (f.profile && f.profile.bio) || '';
    const location = f.location || '';
    const skills = (f.profile && f.profile.skills) || '';
    const rateNum = Number(f.profile?.hourlyRate) || 800;

    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = name.toLowerCase().includes(q);
      const matchTitle = title.toLowerCase().includes(q);
      const matchSkills = skills.toLowerCase().includes(q);
      const matchLocation = location.toLowerCase().includes(q);
      if (!matchName && !matchTitle && !matchSkills && !matchLocation) return false;
    }

    // Skill Filter
    if (activeSkill !== 'All Skills') {
      if (!skills.toLowerCase().includes(activeSkill.toLowerCase())) return false;
    }

    // Rate Filter
    if (rateFilter === 'Under ₹500/hr' && rateNum >= 500) return false;
    if (rateFilter === '₹500 - ₹1000/hr' && (rateNum < 500 || rateNum > 1000)) return false;
    if (rateFilter === '₹1000+/hr' && rateNum < 1000) return false;

    return true;
  }).sort((a, b) => {
    const rateA = Number(a.profile?.hourlyRate) || 0;
    const rateB = Number(b.profile?.hourlyRate) || 0;
    const ratingA = Number(a.profile?.rating) || 5.0;
    const ratingB = Number(b.profile?.rating) || 5.0;

    if (sortOption === 'Highest Rated') return ratingB - ratingA;
    if (sortOption === 'Hourly Rate: Low to High') return rateA - rateB;
    if (sortOption === 'Hourly Rate: High to Low') return rateB - rateA;
    return 0;
  });

  const SidebarContent = () => (
    <>
      <div className="drawer-header lg:hidden">
        <h2 className="filter-title" style={{ marginBottom: 0 }}>Filters</h2>
        <button className="close-drawer-btn" onClick={() => setIsFilterOpen(false)}>
          <X size={24} />
        </button>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Category</h3>
        <div className="custom-select-wrapper">
          <select
            className="custom-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All Categories">All Categories</option>
            <option value="Development & IT">Development & IT</option>
            <option value="Design & Creative">Design & Creative</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Writing & Translation">Writing & Translation</option>
          </select>
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Hourly Rate</h3>
        {['Any Rate', 'Under ₹500/hr', '₹500 - ₹1000/hr', '₹1000+/hr'].map(rate => (
          <label key={rate} className="custom-radio">
            <input
              type="radio"
              name="hourlyRate"
              checked={rateFilter === rate}
              onChange={() => setRateFilter(rate)}
            />
            {rate}
          </label>
        ))}
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Job Success Rate</h3>
        {['Any Job Success', '90% & Up', '80% & Up'].map(success => (
          <label key={success} className="custom-radio">
            <input type="radio" name="jobSuccess" defaultChecked={success === 'Any Job Success'} />
            {success}
          </label>
        ))}
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Location</h3>
        {['Any Location', 'India', 'Remote Only'].map(loc => (
          <label key={loc} className="custom-radio">
            <input type="radio" name="location" defaultChecked={loc === 'Any Location'} />
            {loc}
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
    <div className="gigsphere-freelancer-browse-projects">
      <div className="browse-container">

        {/* Page Header */}
        <div className="page-header">
          <div>
            <div className="breadcrumb">Dashboard / Browse Freelancers</div>
            <h1 className="page-title">Browse Top Freelancers & Talent</h1>
            <p className="page-description">Discover verified developers, designers, and domain experts for your next project.</p>
          </div>
          <button className="saved-projects-btn">
            <Bookmark size={18} />
            Saved Freelancers
          </button>
        </div>

        {/* Search Bar & Skill Chips */}
        <div className="search-section">
          <div className="search-input-group">
            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, skill, title, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="search-btn">Search Talent</button>
            <button className="mobile-filter-btn" onClick={() => setIsFilterOpen(true)}>
              <Filter size={20} />
              Filters
            </button>
          </div>

          <div className="category-chips">
            {MOCK_SKILLS.map(skill => (
              <button
                key={skill}
                className={`chip ${activeSkill === skill ? 'active' : ''}`}
                onClick={() => setActiveSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        <div className="content-layout">

          {/* Desktop Filter Sidebar */}
          <aside className="filter-sidebar">
            <SidebarContent />
          </aside>

          {/* Mobile Filter Drawer Overlay */}
          <div className={`filter-drawer-overlay ${isFilterOpen ? 'open' : ''}`} onClick={() => setIsFilterOpen(false)}>
            <div className="filter-drawer" onClick={e => e.stopPropagation()}>
              <SidebarContent />
            </div>
          </div>

          {/* Main Results Grid */}
          <main className="results-area">

            <div className="results-toolbar">
              <div className="results-count">
                Showing <strong>{filteredFreelancers.length}</strong> freelancers found
              </div>

              <div className="toolbar-actions">
                <div className="sort-dropdown">
                  Sort By:
                  <div className="custom-select-wrapper" style={{ display: 'inline-block', width: '190px' }}>
                    <select
                      className="custom-select"
                      style={{ padding: '8px 12px' }}
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                    >
                      <option value="Best Match">Best Match</option>
                      <option value="Highest Rated">Highest Rated</option>
                      <option value="Hourly Rate: Low to High">Hourly Rate: Low to High</option>
                      <option value="Hourly Rate: High to Low">Hourly Rate: High to Low</option>
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
            ) : filteredFreelancers.length > 0 ? (
              <>
                <div className={`projects-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                  {filteredFreelancers.map(freelancer => {
                    const profile = freelancer.profile || {};
                    const rateDisplay = `₹${profile.hourlyRate || freelancer.hourlyRate || 1500}/hr`;
                    return (
                      <div key={freelancer._id || freelancer.id} className="project-card">

                        <div className="card-header" style={{ alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <img src={freelancer.avatar || 'https://i.pravatar.cc/150'} alt={freelancer.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                            <div>
                              <div style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <h3 className="project-title" style={{ marginBottom: 0 }}>{freelancer.name}</h3>
                                {freelancer.kycStatus === 'Verified' && (
                                  <CheckCircle size={14} color="#10b981" fill="#dcfce7" title="Verified Freelancer" />
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', fontWeight: 500, marginTop: '4px' }}>{(freelancer.profile && freelancer.profile.title) || 'Freelancer'}</p>
                              <div className="client-info" style={{ marginTop: '4px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <MapPin size={14} /> Remote
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            className={`bookmark-icon-btn ${freelancer.saved ? 'saved' : ''}`}
                            onClick={(e) => toggleSave(e, freelancer._id || freelancer.id)}
                          >
                            <Bookmark size={22} fill={freelancer.saved ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        <div className="project-meta-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '10px 12px', marginTop: '12px' }}>
                          <div className="meta-item">
                            <span className="meta-label">Hourly Rate</span>
                            <span className="meta-value" style={{ fontWeight: 700, color: 'var(--text-main)' }}>{rateDisplay}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Success Rate</span>
                            <span className="meta-value" style={{ color: '#16a34a', fontWeight: 600 }}>{profile.jobSuccess || '99%'}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Total Earned</span>
                            <span className="meta-value">{profile.totalEarned || '₹5L+'}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Rating</span>
                            <span className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#eab308', fontWeight: 700 }}>
                              <Star size={13} fill="#eab308" color="#eab308" /> {profile.rating || '5.0'}
                            </span>
                          </div>
                        </div>

                        <p className="project-desc">{(freelancer.profile && freelancer.profile.bio) || 'Ready to work on amazing projects.'}</p>

                        <div className="skills-container">
                          {(freelancer.profile && freelancer.profile.skills && typeof freelancer.profile.skills === 'string' ? freelancer.profile.skills.split(',') : (Array.isArray(freelancer.skills) ? freelancer.skills : []))?.map(skill => (
                            <span key={skill} className="skill-chip">{typeof skill === 'string' ? skill.trim() : skill}</span>
                          )) || <span className="skill-chip">General</span>}
                        </div>

                        <div className="card-footer">
                          <div className="card-actions" style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Link to={`/freelancer/${freelancer._id || freelancer.id}`} style={{ textDecoration: 'none' }}>
                              <button className="btn-secondary">View Profile</button>
                            </Link>
                            <button className="btn-primary" onClick={() => navigate('/client/dashboard/create-project')}>Hire Talent</button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="pagination">
                  <button className="page-btn" disabled><ChevronLeft size={18} /></button>
                  <button className="page-btn active">1</button>
                  <button className="page-btn">2</button>
                  <button className="page-btn"><ChevronRight size={18} /></button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <Users className="empty-icon" size={48} />
                <h3 className="empty-title">No freelancers found</h3>
                <p className="empty-desc">We couldn't find any talent matching your current search or filter criteria. Try adjusting your keywords.</p>
                <button className="btn-secondary" onClick={clearFilters}>Clear All Filters</button>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

