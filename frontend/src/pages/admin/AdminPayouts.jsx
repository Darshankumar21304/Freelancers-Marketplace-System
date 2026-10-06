import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import { formatINR } from '../../utils/currency';
import { Building2, CheckCircle2, RefreshCw, DollarSign, ArrowUpRight, ShieldCheck, Check } from 'lucide-react';

export default function AdminPayouts() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/withdrawals');
      setWithdrawals(data.withdrawals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayout = async (id) => {
    if (!window.confirm('Are you sure you want to APPROVE and process this freelancer payout withdrawal?')) return;

    setApprovingId(id);
    try {
      const res = await apiFetch(`/admin/withdrawals/${id}/approve`, { method: 'PUT' });
      setMsg(res.message);
      setTimeout(() => setMsg(null), 3500);

      setWithdrawals(withdrawals.map(w => w._id === id ? { ...w, status: 'completed' } : w));
    } catch (err) {
      alert(err.message || 'Error approving withdrawal payout');
    } finally {
      setApprovingId(null);
    }
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const completedWithdrawals = withdrawals.filter(w => w.status === 'completed');

  return (
    <div>
      {/* Page Header */}
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Freelancer Payouts & Commission Revenues</h1>
          <p>Approve freelancer withdrawal requests, monitor 10% platform commission, and inspect payout accounts</p>
        </div>

        <button onClick={fetchWithdrawals} className="min-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Payout Requests
        </button>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="min-grid-4" style={{ marginBottom: '1.25rem' }}>
        <div className="min-card">
          <div className="stat-label">Pending Payout Claims</div>
          <div className="stat-value" style={{ color: '#b45309' }}>
            {pendingWithdrawals.length} Claims
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>Awaiting admin approval</div>
        </div>

        <div className="min-card">
          <div className="stat-label">Pending Payout Amount</div>
          <div className="stat-value" style={{ color: '#0f172a' }}>
            {formatINR(pendingWithdrawals.reduce((acc, curr) => acc + Math.abs(curr.amount || 0), 0))}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>Freelancer earnings</div>
        </div>

        <div className="min-card">
          <div className="stat-label">Completed Payouts</div>
          <div className="stat-value" style={{ color: '#15803d' }}>
            {formatINR(completedWithdrawals.reduce((acc, curr) => acc + Math.abs(curr.amount || 0), 0))}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>Disbursed to bank/UPI</div>
        </div>

        <div className="min-card">
          <div className="stat-label">10% Platform Revenue</div>
          <div className="stat-value" style={{ color: '#4f46e5', fontSize: '1.2rem' }}>
            {formatINR(491000)}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>Platform service fee</div>
        </div>
      </div>

      {/* Interactive Payout Approvals Table */}
      <div className="min-card">
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Building2 size={18} color="#4f46e5" /> Freelancer Withdrawal Payout Requests ({withdrawals.length})
        </h3>

        <div className="min-table-container">
          <table className="min-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Freelancer Account</th>
                <th>Requested Payout</th>
                <th>Payout Destination (Bank / UPI)</th>
                <th>Request Date</th>
                <th>Payout Status</th>
                <th>Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading withdrawal requests...</td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No withdrawal payout requests submitted yet.</td>
                </tr>
              ) : (
                withdrawals.map((w) => {
                  const isPending = w.status === 'pending';
                  const userObj = w.user_id || {};

                  return (
                    <tr key={w._id}>
                      <td style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>{w._id.toString().slice(-6).toUpperCase()}</td>
                      <td style={{ fontWeight: 600 }}>
                        {userObj.name || 'Freelancer'} <br/>
                        <span style={{ fontSize: '0.725rem', color: '#64748b' }}>{userObj.email || ''}</span>
                      </td>
                      <td style={{ fontWeight: 800, color: '#dc2626' }}>
                        {formatINR(Math.abs(w.amount))}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#334155', maxWidth: '320px' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{w.paymentMethod}</span> <br/>
                        <code style={{ fontSize: '0.725rem', color: '#475569', display: 'block', marginTop: '0.25rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', wordBreak: 'break-all' }}>
                          {w.reference || 'Manual Payout Destination Pending'}
                        </code>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(w.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span className={`pill-badge ${isPending ? 'review' : 'clean'}`}>
                          {isPending ? 'Pending Approval' : 'Completed Payout'}
                        </span>
                      </td>
                      <td>
                        {isPending ? (
                          <button 
                            onClick={() => handleApprovePayout(w._id)}
                            disabled={approvingId === w._id}
                            className="min-btn min-btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                          >
                            {approvingId === w._id ? <RefreshCw size={12} className="spin" /> : <Check size={12} />}
                            Approve Payout
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <ShieldCheck size={12} /> Approved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
