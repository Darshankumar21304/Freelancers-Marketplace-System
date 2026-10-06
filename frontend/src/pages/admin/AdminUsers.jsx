import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import { 
  Search, 
  Ban, 
  CheckCircle, 
  Trash2, 
  ShieldAlert, 
  UserX, 
  AlertCircle, 
  Eye, 
  Cpu, 
  RefreshCw, 
  X,
  FileText,
  Zap,
  Flag
} from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [msg, setMsg] = useState(null);

  // Auto Audit All State
  const [auditingAll, setAuditingAll] = useState(false);

  // Selected User Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [reAuditingUser, setReAuditingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = `/admin/users?role=${roleFilter}&status=${statusFilter}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      const data = await apiFetch(query);
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleAutoAuditAll = async () => {
    setAuditingAll(true);
    try {
      const res = await apiFetch('/admin/users/auto-audit-all', { method: 'POST' });
      setMsg(res.message);
      setTimeout(() => setMsg(null), 4000);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Auto audit failed');
    } finally {
      setAuditingAll(false);
    }
  };

  const handleInspectUser = async (user) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    setUserPosts([]);
    setFreelancerProfile(null);

    try {
      const data = await apiFetch(`/admin/users/${user._id}/details`);
      setUserPosts(data.posts || []);
      setFreelancerProfile(data.freelancerProfile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleBlock = async (id) => {
    try {
      const res = await apiFetch(`/admin/users/${id}/block`, { method: 'PUT' });
      setMsg(res.message);
      setTimeout(() => setMsg(null), 3000);
      fetchUsers();
      if (selectedUser && selectedUser._id === id) {
        setSelectedUser({ ...selectedUser, isBlocked: !selectedUser.isBlocked });
      }
    } catch (err) {
      alert(err.message || 'Error updating user');
    }
  };

  const handleFlagPermanently = async (id) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY FLAG and block this user account?')) return;
    try {
      const res = await apiFetch(`/admin/users/${id}/flag-permanently`, { method: 'PUT' });
      setMsg(res.message);
      setTimeout(() => setMsg(null), 3500);
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      alert(err.message || 'Error flagging user');
    }
  };

  const handleRunReAudit = async (user) => {
    setReAuditingUser(true);
    try {
      const res = await apiFetch('/admin/ai/scan-profile', {
        method: 'POST',
        body: JSON.stringify({
          userId: user._id,
          name: user.name,
          email: user.email,
          title: freelancerProfile?.title || user.role,
          bio: freelancerProfile?.bio || user.name,
          skills: freelancerProfile?.skills || ''
        })
      });

      setMsg(`AI Audit completed: Risk Score ${res.audit.riskScore}%`);
      setTimeout(() => setMsg(null), 3500);
      
      setSelectedUser({
        ...selectedUser,
        aiRiskScore: res.audit.riskScore,
        aiReason: res.audit.reason,
        verificationStatus: res.audit.status === 'Suspended' ? 'suspended' : res.audit.status === 'Flagged' ? 'flagged' : 'verified'
      });
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Re-audit failed');
    } finally {
      setReAuditingUser(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete account: ${name}?`)) return;
    try {
      const res = await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
      setMsg(res.message);
      setTimeout(() => setMsg(null), 3000);
      fetchUsers();
      if (selectedUser && selectedUser._id === id) setSelectedUser(null);
    } catch (err) {
      alert(err.message || 'Error deleting user');
    }
  };

  return (
    <div>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>User Management & Interactive Inspector</h1>
          <p>Interactive database accounts, automated AI risk scoring, and post content evaluation</p>
        </div>

        <button 
          onClick={handleAutoAuditAll} 
          disabled={auditingAll}
          className="min-btn min-btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {auditingAll ? <RefreshCw size={14} className="spin" /> : <Cpu size={14} />}
          {auditingAll ? 'Scanning All DB Users with AI...' : 'Auto-Audit All DB Users with AI'}
        </button>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flexGrow: 1 }}>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="min-input" 
            style={{ flexGrow: 1 }}
          />
          <button type="submit" className="min-btn min-btn-primary">Search</button>
        </form>

        <select 
          className="min-input" 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="client">Client</option>
          <option value="freelancer">Freelancer</option>
          <option value="admin">Admin</option>
        </select>

        <select 
          className="min-input" 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Interactive Users Table */}
      <div className="min-table-container">
        <table className="min-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email Address</th>
              <th>Role</th>
              <th>Account Status</th>
              <th>AI Risk Score</th>
              <th>AI Verification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading database accounts...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No users found matching query.</td>
              </tr>
            ) : (
              users.map((u) => {
                const score = u.aiRiskScore || 10;
                const scoreColor = score > 60 ? '#dc2626' : score > 25 ? '#b45309' : '#15803d';

                return (
                  <tr key={u._id} style={{ cursor: 'pointer' }} onClick={() => handleInspectUser(u)}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{u.name}</td>
                    <td style={{ fontSize: '0.8rem' }}>{u.email}</td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{u.role}</span>
                    </td>
                    <td>
                      {u.isBlocked ? (
                        <span className="pill-badge blocked">Blocked</span>
                      ) : (
                        <span className="pill-badge active">Active</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 800, color: scoreColor, fontSize: '0.85rem' }}>
                          {score}%
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {score > 60 ? 'High Risk' : score > 25 ? 'Moderate' : 'Safe'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`pill-badge ${u.verificationStatus === 'flagged' || u.verificationStatus === 'suspended' ? 'blocked' : 'clean'}`}>
                        {u.verificationStatus || 'Verified'}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {u.role !== 'admin' && (
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button 
                            onClick={() => handleInspectUser(u)} 
                            className="min-btn"
                            title="Inspect Profile & Posts"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <Eye size={12} /> Inspect
                          </button>
                          <button 
                            onClick={() => handleToggleBlock(u._id)} 
                            className={`min-btn ${u.isBlocked ? 'min-btn-primary' : ''}`}
                          >
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Interactive User Profile & Posts Inspector Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '14px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{selectedUser.name}</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedUser.email} • <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{selectedUser.role}</span></span>
              </div>
              <button onClick={() => setSelectedUser(null)} className="min-btn" style={{ padding: '0.25rem 0.5rem' }}>
                <X size={16} />
              </button>
            </div>

            {/* AI Risk Score & Security Status */}
            <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>AI Security Risk Analysis</span>
                <span style={{ fontWeight: 800, color: selectedUser.aiRiskScore > 50 ? '#dc2626' : '#15803d' }}>
                  Risk Score: {selectedUser.aiRiskScore || 10}%
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155' }}>
                <strong>AI Audit Findings:</strong> {selectedUser.aiReason || 'Profile matches verified user criteria.'}
              </p>
            </div>

            {/* Profile Info Breakdown */}
            {freelancerProfile && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>{freelancerProfile.title}</div>
                <div style={{ fontSize: '0.775rem', color: '#475569', marginBottom: '0.5rem' }}>{freelancerProfile.bio}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a73e8' }}>Skills: {freelancerProfile.skills}</div>
              </div>
            )}

            {/* User Posts & Automatically Calculated Content Scores */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} /> User Posted Requirements & Listings ({userPosts.length})
              </h4>

              {loadingDetails ? (
                <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>Loading user posts & AI content scores...</div>
              ) : userPosts.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', padding: '0.5rem' }}>No active project posts or gigs created by this user yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {userPosts.map((p) => (
                    <div key={p.id} style={{ padding: '0.65rem 0.85rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0f172a' }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.description}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.725rem', fontWeight: 800, color: p.aiScore > 60 ? '#15803d' : '#dc2626' }}>
                          AI Content Score: {p.aiScore}%
                        </span>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a73e8' }}>₹{p.budget}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.85rem' }}>
              <button 
                onClick={() => handleRunReAudit(selectedUser)} 
                disabled={reAuditingUser}
                className="min-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {reAuditingUser ? <RefreshCw size={12} className="spin" /> : <Zap size={12} />}
                {reAuditingUser ? 'Auditing Profile...' : 'Run AI Re-Audit'}
              </button>

              <button 
                onClick={() => handleToggleBlock(selectedUser._id)} 
                className={`min-btn ${selectedUser.isBlocked ? 'min-btn-primary' : ''}`}
              >
                {selectedUser.isBlocked ? 'Unblock User' : 'Block Account'}
              </button>

              <button 
                onClick={() => handleFlagPermanently(selectedUser._id)} 
                className="min-btn min-btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Flag size={12} /> Flag Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
