import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Layers, 
  AlertTriangle, 
  Building2,
  ShieldCheck, 
  LogOut,
  FileCheck,
  Menu,
  X
} from 'lucide-react';
import { logoutUser } from '../utils/authUtils';
import './AdminLayout.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const confirmLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <div className="admin-wrapper">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Minimalist Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <Link to="/" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.03em', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="url(#admin_gigsphere_grad)" />
              <ellipse cx="12" cy="12" rx="10" ry="4" stroke="url(#admin_gigsphere_grad_ring)" strokeWidth="2.2" strokeLinecap="round" transform="rotate(-30 12 12)" />
              <defs>
                <linearGradient id="admin_gigsphere_grad" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1A73E8" />
                  <stop offset="0.5" stopColor="#A142F4" />
                  <stop offset="1" stopColor="#00E5FF" />
                </linearGradient>
                <linearGradient id="admin_gigsphere_grad_ring" x1="2" y1="8" x2="22" y2="16" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00E5FF" />
                  <stop offset="0.5" stopColor="#1A73E8" />
                  <stop offset="1" stopColor="#A142F4" />
                </linearGradient>
              </defs>
            </svg>
            GigSphere
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="admin-brand-tag">ADMIN</span>
            <button className="admin-mobile-close" onClick={closeSidebar}>
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin/dashboard" end onClick={closeSidebar} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <BarChart3 size={18} />
            <span>Overview</span>
          </NavLink>

          <NavLink to="/admin/dashboard/users" onClick={closeSidebar} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Users</span>
          </NavLink>

          <NavLink to="/admin/dashboard/listings" onClick={closeSidebar} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Layers size={18} />
            <span>Listings</span>
          </NavLink>

          <NavLink to="/admin/dashboard/disputes" onClick={closeSidebar} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <AlertTriangle size={18} />
            <span>Disputes</span>
          </NavLink>

          <NavLink to="/admin/dashboard/payouts" onClick={closeSidebar} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Building2 size={18} />
            <span>Payouts</span>
          </NavLink>

          <NavLink to="/admin/dashboard/kyc" onClick={closeSidebar} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <FileCheck size={18} />
            <span>KYC Approvals</span>
          </NavLink>

          <NavLink to="/admin/dashboard/trust-fraud" onClick={closeSidebar} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <ShieldCheck size={18} color="#1a73e8" />
            <span>Trust & Fraud AI</span>
          </NavLink>
        </nav>

        <div className="admin-user-footer">
          <button onClick={() => setShowLogoutConfirm(true)} className="min-btn min-btn-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%' }}>
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Admin Page Content */}
      <main className="admin-content">
        {/* Mobile Header Toggle */}
        <div className="admin-mobile-header">
          <button className="admin-toggle-btn" onClick={toggleSidebar}>
            <Menu size={20} />
          </button>
          <span className="admin-mobile-title">Admin Console</span>
        </div>
        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '20px', fontWeight: 600 }}>Confirm Admin Logout</h3>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '15px' }}>Are you sure you want to log out of the Admin portal?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', cursor: 'pointer', fontWeight: 500, color: '#0f172a' }}
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
