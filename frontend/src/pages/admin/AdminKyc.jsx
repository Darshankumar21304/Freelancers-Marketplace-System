import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import { FileCheck, CheckCircle2, RefreshCw, AlertCircle, XCircle, Search, Eye, Check, X, ShieldAlert } from 'lucide-react';

export default function AdminKyc() {
  const [kycUsers, setKycUsers] = useState([]);
  const [pipelineStats, setPipelineStats] = useState({ pending: 0, verified: 0, rejected: 0, actionRequired: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submittingId, setSubmittingId] = useState(null);

  // Modal State for Reject / Request More Docs reason
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalAction, setModalAction] = useState(''); // 'Rejected' or 'Action Required'
  const [reasonText, setReasonText] = useState('');

  useEffect(() => {
    fetchKycUsers(statusFilter);
  }, []);

  const fetchKycUsers = async (filter = statusFilter) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/admin/kyc?status=${filter}`);
      setKycUsers(data.users || []);
      if (data.stats) {
        setPipelineStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch KYC users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    fetchKycUsers(status);
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to APPROVE this user identity verification (KYC)?')) return;
    setSubmittingId(id);
    try {
      const res = await apiFetch(`/admin/users/${id}/kyc-review`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'Verified' })
      });
      setMsg(res.message);
      setTimeout(() => setMsg(null), 3500);
      fetchKycUsers(statusFilter);
    } catch (err) {
      alert(err.message || 'Failed to approve KYC');
    } finally {
      setSubmittingId(null);
    }
  };

  const openReviewModal = (user, action) => {
    setSelectedUser(user);
    setModalAction(action);
    setReasonText('');
    setModalOpen(true);
  };

  const handleModalSubmit = async () => {
    if (!reasonText.trim()) {
      alert('Please enter an official reason or instructions for the user.');
      return;
    }
    const id = selectedUser._id;
    setSubmittingId(id);
    setModalOpen(false);
    try {
      const res = await apiFetch(`/admin/users/${id}/kyc-review`, {
        method: 'PUT',
        body: JSON.stringify({ action: modalAction, reason: reasonText })
      });
      setMsg(res.message);
      setTimeout(() => setMsg(null), 3500);
      fetchKycUsers(statusFilter);
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingId(null);
      setSelectedUser(null);
    }
  };

  // Filter local users by search query
  const filteredUsers = kycUsers.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = pipelineStats.pending || kycUsers.filter(u => u.kycStatus === 'Pending Approval').length;
  const verifiedCount = pipelineStats.verified || kycUsers.filter(u => u.kycStatus === 'Verified').length;
  const rejectedCount = pipelineStats.rejected || kycUsers.filter(u => u.kycStatus === 'Rejected').length;
  const actionRequiredCount = pipelineStats.actionRequired || kycUsers.filter(u => u.kycStatus === 'Action Required').length;

  return (
    <div>
      {/* Page Header */}
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Identity Verification (KYC) Moderation Pipeline</h1>
          <p>Inspect uploaded freelancer/client ID documents, examine profile AI Risk Scores, and approve or reject KYC claims</p>
        </div>

        <button onClick={fetchKycUsers} className="min-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh KYC List
        </button>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="min-grid-4" style={{ marginBottom: '1.25rem' }}>
        <div className="min-card" style={{ cursor: 'pointer' }} onClick={() => handleStatusFilterChange('Pending Approval')}>
          <div className="stat-label">Awaiting Approval</div>
          <div className="stat-value" style={{ color: '#ea580c' }}>
            {pendingCount} Pending
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>Requires manual review</div>
        </div>

        <div className="min-card" style={{ cursor: 'pointer' }} onClick={() => handleStatusFilterChange('Verified')}>
          <div className="stat-label">Verified Users</div>
          <div className="stat-value" style={{ color: '#16a34a' }}>
            {verifiedCount} Verified
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>Completed verification</div>
        </div>

        <div className="min-card" style={{ cursor: 'pointer' }} onClick={() => handleStatusFilterChange('Rejected')}>
          <div className="stat-label">Rejected Submissions</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>
            {rejectedCount} Rejected
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>Document denied / invalid</div>
        </div>

        <div className="min-card" style={{ cursor: 'pointer' }} onClick={() => handleStatusFilterChange('Action Required')}>
          <div className="stat-label">Action Required</div>
          <div className="stat-value" style={{ color: '#2563eb' }}>
            {actionRequiredCount} Action Needed
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>Awaiting more documents</div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="min-card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: '320px' }}>
          <Search size={16} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Filter KYC Status:</span>
          <select 
            value={statusFilter} 
            onChange={(e) => handleStatusFilterChange(e.target.value)} 
            className="min-btn" 
            style={{ background: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '0.4rem 1rem' }}
          >
            <option value="all">All Submissions</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
            <option value="Action Required">Action Required</option>
          </select>
        </div>
      </div>

      {/* KYC Submissions Table */}
      <div className="min-card">
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FileCheck size={18} color="#4f46e5" /> Identity Documents Under Pipeline Review ({filteredUsers.length})
        </h3>

        <div className="min-table-container">
          <table className="min-table">
            <thead>
              <tr>
                <th>User Account</th>
                <th>Document Type</th>
                <th>ID Document Attachment</th>
                <th>AI Security Audit</th>
                <th>Request Date</th>
                <th>KYC Status</th>
                <th>Moderation Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    <RefreshCw size={24} className="spin" style={{ display: 'block', margin: '0 auto 0.5rem' }} />
                    Loading KYC pipelines...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>No KYC verification pipelines fit this query.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isPending = u.kycStatus === 'Pending Approval';
                  const isAction = u.kycStatus === 'Action Required';
                  const isVerified = u.kycStatus === 'Verified';
                  const isRejected = u.kycStatus === 'Rejected';

                  // Risk score styles
                  let riskColor = '#16a34a';
                  if (u.aiRiskScore > 70) riskColor = '#dc2626';
                  else if (u.aiRiskScore > 35) riskColor = '#ea580c';

                  return (
                    <tr key={u._id}>
                      <td style={{ fontWeight: 600 }}>
                        {u.name} <br/>
                        <span style={{ fontSize: '0.725rem', color: '#64748b' }}>{u.email}</span>
                        <span style={{ display: 'inline-block', padding: '1px 6px', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.65rem', marginLeft: '0.4rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>{u.role}</span>
                      </td>
                      <td style={{ fontWeight: 500, fontSize: '0.8rem' }}>
                        {u.kycDocType || 'Aadhaar Card'}
                      </td>
                      <td>
                        {u.kycDocUrl ? (
                          <a 
                            href={u.kycDocUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="min-btn min-btn-secondary" 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.725rem', padding: '4px 10px', textDecoration: 'none' }}
                          >
                            <Eye size={12} /> View Attached ID
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Deleted / No attachment</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ fontWeight: 800, color: riskColor, fontSize: '0.8rem' }}>{u.aiRiskScore}%</span>
                          <span style={{ fontSize: '0.65rem', background: riskColor + '15', color: riskColor, padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                            {u.aiRiskScore > 70 ? 'High Risk' : u.aiRiskScore > 35 ? 'Medium' : 'Clean'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.2rem' }} title={u.aiReason}>
                          {u.aiReason || 'Automated AI audit details pending.'}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {u.kycSubmittedAt ? new Date(u.kycSubmittedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <span className={`pill-badge ${isVerified ? 'clean' : isPending ? 'review' : isRejected ? 'danger' : 'warn'}`}>
                          {u.kycStatus}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {(isPending || isAction || isRejected) && (
                            <button 
                              onClick={() => handleApprove(u._id)}
                              disabled={submittingId === u._id}
                              className="min-btn"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Approve verification"
                            >
                              <Check size={12} /> Accept
                            </button>
                          )}
                          {(isPending || isVerified || isRejected) && (
                            <button 
                              onClick={() => openReviewModal(u, 'Action Required')}
                              disabled={submittingId === u._id}
                              className="min-btn"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Ask for clearer/more documents"
                            >
                              <AlertCircle size={12} /> Ask More Docs
                            </button>
                          )}
                          {(isPending || isVerified || isAction) && (
                            <button 
                              onClick={() => openReviewModal(u, 'Rejected')}
                              disabled={submittingId === u._id}
                              className="min-btn"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Reject document submission"
                            >
                              <X size={12} /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal for rejection note / more docs request */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', maxWidth: '480px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={20} color={modalAction === 'Rejected' ? '#dc2626' : '#2563eb'} /> 
              {modalAction === 'Rejected' ? 'Reject Identity Document' : 'Request More KYC Documents'}
            </h3>
            
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
              For user <strong>{selectedUser?.name}</strong>. Entering a reason below will dispatch an instant dashboard alert notification and save it to the database audit logs.
            </p>

            {selectedUser && (
              <div style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <strong>AI Risk Analysis Check:</strong> Risk Score is <strong>{selectedUser.aiRiskScore}%</strong>.<br/>
                Audit detail: <em>{selectedUser.aiReason || 'Automated AI audit details pending.'}</em>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                Official Message / Reasons for User:
              </label>
              <textarea 
                rows={4}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder={modalAction === 'Rejected' ? 'e.g. Uploaded document is blurred, or name on document does not match account registration.' : 'e.g. Please upload a clear photo of the back side of your Aadhaar card to complete verification.'}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'none', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setModalOpen(false); setSelectedUser(null); }}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', cursor: 'pointer', fontWeight: 500, color: '#475569', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleModalSubmit}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  background: modalAction === 'Rejected' ? '#dc2626' : '#2563eb', 
                  color: '#fff', 
                  cursor: 'pointer', 
                  fontWeight: 500,
                  fontSize: '0.85rem'
                }}
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
