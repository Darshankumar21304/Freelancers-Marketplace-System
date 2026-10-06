import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, PlusCircle, ClipboardList, MessageSquare, 
  LogOut, Wallet, Briefcase, FileText, Users, 
  CreditCard, Star, Bell, Search, Folder, Menu, X, AlertTriangle, Heart, Clock, Sparkles, Send, TrendingUp
} from 'lucide-react';
import { getUserRole, logoutUser } from '../utils/authUtils';
import '../pages/dashboard/Dashboard.css';

export default function DashboardLayout() {
  const role = getUserRole() || 'client'; // Fallback to client if not set
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logoutUser();
    navigate('/');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const clientNavItems = [
    { name: 'Dashboard', path: '/client/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Profile', path: '/client/dashboard/profile', icon: Users },
    { name: 'Browse Freelancers', path: '/client/dashboard/browse-freelancers', icon: Search },
    { name: 'Create Project', path: '/client/dashboard/create-project', icon: PlusCircle },
    { name: 'My Projects', path: '/client/dashboard/my-projects', icon: Briefcase },
    { name: 'Received Proposals', path: '/client/dashboard/proposals', icon: FileText },
    { name: 'Hired Freelancers', path: '/client/dashboard/hired', icon: Users },
    { name: 'Analytics', path: '/client/dashboard/analytics', icon: TrendingUp },
    { name: 'Payments', path: '/client/dashboard/wallet', icon: CreditCard },
    { name: 'Disputes', path: '/client/dashboard/disputes', icon: AlertTriangle },
    { name: 'Reviews', path: '/client/dashboard/reviews', icon: Star },
  ];

  const freelancerNavItems = [
    { name: 'Dashboard', path: '/freelancer/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Profile', path: '/freelancer/dashboard/profile', icon: Users },
    { name: 'Browse Projects', path: '/freelancer/dashboard/browse-projects', icon: Search },
    { name: 'Saved Favorites', path: '/freelancer/dashboard/browse-projects?saved=true', icon: Heart },
    { name: 'Direct Pitches', path: '/freelancer/dashboard/pitches', icon: Sparkles },
    { name: 'My Proposals', path: '/freelancer/dashboard/my-proposals', icon: FileText },
    { name: 'Active Projects', path: '/freelancer/dashboard/active-projects', icon: Briefcase },
    { name: 'Gig History', path: '/freelancer/dashboard/gig-history', icon: Clock },
    { name: 'Portfolio', path: '/freelancer/dashboard/portfolio', icon: Folder },
    { name: 'Analytics', path: '/freelancer/dashboard/analytics', icon: TrendingUp },
    { name: 'Earnings', path: '/freelancer/dashboard/wallet', icon: Wallet },
    { name: 'Disputes', path: '/freelancer/dashboard/disputes', icon: AlertTriangle },
    { name: 'Reviews', path: '/freelancer/dashboard/reviews', icon: Star },
  ];

  const activeNavItems = role === 'client' ? clientNavItems : freelancerNavItems;

  return (
    <div className="dashboard-layout">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="6" fill="url(#dash_gigsphere_grad)" />
                <ellipse cx="12" cy="12" rx="10" ry="4" stroke="url(#dash_gigsphere_grad_ring)" strokeWidth="2.2" strokeLinecap="round" transform="rotate(-30 12 12)" />
                <defs>
                  <linearGradient id="dash_gigsphere_grad" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1A73E8" />
                    <stop offset="0.5" stopColor="#A142F4" />
                    <stop offset="1" stopColor="#00E5FF" />
                  </linearGradient>
                  <linearGradient id="dash_gigsphere_grad_ring" x1="2" y1="8" x2="22" y2="16" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00E5FF" />
                    <stop offset="0.5" stopColor="#1A73E8" />
                    <stop offset="1" stopColor="#A142F4" />
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <h2 className="sidebar-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>GigSphere</h2>
                <p className="sidebar-subtitle" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {role === 'client' ? 'Client Workspace' : 'Freelancer Workspace'}
                </p>
              </div>
            </div>
            <button className="mobile-close-sidebar" onClick={closeSidebar}>
              <X size={24} />
            </button>
          </div>
        </div>
        <nav className="sidebar-nav">
          {activeNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              onClick={closeSidebar}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="nav-item-icon" size={20} />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-footer-btn logout" onClick={handleLogout}>
            <LogOut className="nav-item-icon" size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Mobile Header Toggle */}
        <div className="dashboard-mobile-header">
          <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <span className="mobile-dashboard-title">Dashboard</span>
        </div>
        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'var(--bg-surface, #fff)', padding: '24px', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-main, #111)', fontSize: '20px', fontWeight: 600 }}>Confirm Logout</h3>
            <p style={{ color: 'var(--text-muted, #666)', marginBottom: '24px', fontSize: '15px' }}>Are you sure you want to log out of your account?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color, #ccc)', background: 'transparent', cursor: 'pointer', fontWeight: 500, color: 'var(--text-main, #111)' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
