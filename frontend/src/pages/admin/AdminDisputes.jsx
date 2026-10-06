import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import { formatINR } from '../../utils/currency';
import { 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Scale, 
  Zap, 
  Eye, 
  X, 
  Search, 
  Filter, 
  MessageSquare, 
  Send, 
  FileText, 
  UserCheck, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected Dispute Modal State
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [aiMediationResult, setAiMediationResult] = useState(null);
  const [mediatingAi, setMediatingAi] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  // Admin Reasoning State
  const [adminReasoningText, setAdminReasoningText] = useState('');

  // Discussion Thread Message Post State
  const [newMessageText, setNewMessageText] = useState('');
  const [newMessageSender, setNewMessageSender] = useState('Admin');
  const [postingMessage, setPostingMessage] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/disputes');
      setDisputes(data.disputes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectDispute = (dispute) => {
    setSelectedDispute(dispute);
    setAiMediationResult(dispute.aiRecommendation || null);
    setAdminReasoningText(dispute.adminReasoning || '');
  };

  const handleRunAiMediation = async (disputeId) => {
    setMediatingAi(true);
    setAiMediationResult(null);

    try {
      const res = await apiFetch(`/admin/disputes/${disputeId}/ai-mediate`, { method: 'POST' });
      setAiMediationResult(res.recommendation);
      setDisputes(disputes.map(d => d.id === disputeId ? { ...d, aiRecommendation: res.recommendation } : d));
      
      // Auto-suggest AI reasoning into admin reasoning text area if currently blank
      if (!adminReasoningText && res.recommendation?.reasoning) {
        setAdminReasoningText(res.recommendation.reasoning);
      }
    } catch (err) {
      alert(err.message || 'AI Mediation analysis failed');
    } finally {
      setMediatingAi(false);
    }
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedDispute) return;

    setPostingMessage(true);
    try {
      let senderRole = newMessageSender;
      let senderName = newMessageSender === 'Client' ? selectedDispute.clientName : newMessageSender === 'Freelancer' ? selectedDispute.freelancerName : 'System Administrator';

      const res = await apiFetch(`/admin/disputes/${selectedDispute.id}/message`, {
        method: 'POST',
        body: JSON.stringify({
          senderRole,
          senderName,
          text: newMessageText
        })
      });

      setSelectedDispute(res.dispute);
      setDisputes(disputes.map(d => d.id === selectedDispute.id ? res.dispute : d));
      setNewMessageText('');
    } catch (err) {
      alert(err.message || 'Error posting message to dispute thread');
    } finally {
      setPostingMessage(false);
    }
  };

  const handleResolve = async (id, resolutionType) => {
    if (!adminReasoningText.trim()) {
      alert('Please type administrative official reasoning before resolving this dispute.');
      return;
    }

    setResolvingId(id);
    try {
      const res = await apiFetch(`/admin/disputes/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ 
          resolution: resolutionType,
          adminReasoning: adminReasoningText
        })
      });
      setMsg(res.message);
      setTimeout(() => setMsg(null), 4000);
      
      setDisputes(disputes.map(d => d.id === id ? res.dispute : d));
      if (selectedDispute && selectedDispute.id === id) {
        setSelectedDispute(res.dispute);
      }
    } catch (err) {
      alert(err.message || 'Error resolving dispute');
    } finally {
      setResolvingId(null);
    }
  };

  // Filtered Disputes
  const filteredDisputes = disputes.filter(d => {
    const matchesSearch = search === '' || 
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
      d.clientName.toLowerCase().includes(search.toLowerCase()) ||
      d.freelancerName.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'open') return matchesSearch && (d.status === 'Open' || d.status === 'Under Review');
    if (statusFilter === 'resolved') return matchesSearch && (d.status.startsWith('Resolved') || d.status.startsWith('Refunded') || d.status.startsWith('Released') || d.status.startsWith('Settled'));
    return matchesSearch;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Complaints & Dispute Resolution</h1>
          <p>Resolve billing disputes, milestone escrow claims, evidence questioning, and admin verdict reasoning</p>
        </div>

        <button 
          onClick={fetchDisputes} 
          className="min-btn" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Dispute Tickets
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
          <div className="stat-label">Total Dispute Claims</div>
          <div className="stat-value">{disputes.length} Tickets</div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>Active platform cases</div>
        </div>

        <div className="min-card">
          <div className="stat-label">Pending Resolution</div>
          <div className="stat-value" style={{ color: '#b45309' }}>
            {disputes.filter(d => d.status === 'Open' || d.status === 'Under Review').length} Open
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>Escrow held safely</div>
        </div>

        <div className="min-card">
          <div className="stat-label">Total Escrow Value</div>
          <div className="stat-value" style={{ color: '#4f46e5' }}>
            {formatINR(disputes.reduce((acc, curr) => acc + (curr.amount || 0), 0))}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>Escrow protection system</div>
        </div>

        <div className="min-card">
          <div className="stat-label">AI Mediation Engine</div>
          <div className="stat-value" style={{ color: '#15803d', fontSize: '1.2rem' }}>Online 95%</div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>Autonomous AI mediator</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexGrow: 1 }}>
          <input 
            type="text" 
            placeholder="Search by Ticket ID, project title, or user..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="min-input" 
            style={{ flexGrow: 1 }}
          />
        </div>

        <select 
          className="min-input" 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Dispute Statuses</option>
          <option value="open">Open / Under Review</option>
          <option value="resolved">Resolved Cases</option>
        </select>
      </div>

      {/* Interactive Disputes Table */}
      <div className="min-table-container">
        <table className="min-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Project Title</th>
              <th>Client Account</th>
              <th>Freelancer Account</th>
              <th>Escrow Amount</th>
              <th>Issue Summary</th>
              <th>Status</th>
              <th>Admin Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading dispute tickets...</td>
              </tr>
            ) : filteredDisputes.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No disputes found matching criteria.</td>
              </tr>
            ) : (
              filteredDisputes.map((d) => {
                const isOpen = d.status === 'Open' || d.status === 'Under Review';

                return (
                  <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => handleInspectDispute(d)}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{d.id}</td>
                    <td style={{ fontWeight: 600 }}>{d.projectTitle}</td>
                    <td style={{ fontSize: '0.8rem' }}>{d.clientName} <br/><span style={{ fontSize: '0.725rem', color: '#64748b' }}>{d.clientEmail}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{d.freelancerName} <br/><span style={{ fontSize: '0.725rem', color: '#64748b' }}>{d.freelancerEmail}</span></td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>{formatINR(d.amount)}</td>
                    <td style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '220px' }}>{d.issue}</td>
                    <td>
                      <span className={`pill-badge ${isOpen ? 'review' : 'clean'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => handleInspectDispute(d)}
                          className="min-btn"
                          title="Inspect Case, Discussion & Verdict"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}
                        >
                          <Eye size={12} /> Inspect Case
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Interactive Dispute Case, Discussion & Reasoning Inspector Modal */}
      {selectedDispute && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '14px', maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{selectedDispute.id}: {selectedDispute.projectTitle}</h3>
                  <span className={`pill-badge ${selectedDispute.status === 'Open' || selectedDispute.status === 'Under Review' ? 'review' : 'clean'}`}>
                    {selectedDispute.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Protected Escrow: <strong style={{ color: '#0f172a' }}>{formatINR(selectedDispute.amount)}</strong>
                </div>
              </div>
              <button onClick={() => setSelectedDispute(null)} className="min-btn" style={{ padding: '0.25rem 0.5rem' }}>
                <X size={16} />
              </button>
            </div>

            {/* Section 1: Initial Claims Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Client Complaint</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{selectedDispute.clientName} ({selectedDispute.clientEmail})</div>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.775rem', color: '#475569' }}>"{selectedDispute.issue}"</p>
              </div>

              <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.725rem', fontWeight: 800, color: '#1a73e8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Freelancer Defense Statement</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{selectedDispute.freelancerName} ({selectedDispute.freelancerEmail})</div>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.775rem', color: '#475569' }}>"{selectedDispute.freelancerDefense || 'Milestones completed as per scope statement.'}"</p>
              </div>
            </div>

            {/* Section 2: Interactive Evidence & Discussion Thread */}
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase' }}>
                <MessageSquare size={16} color="#4f46e5" /> Evidence Questioning & Defense Thread ({selectedDispute.messages?.length || 0})
              </h4>

              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem', paddingRight: '0.25rem' }}>
                {selectedDispute.messages?.map((m) => {
                  const isClient = m.senderRole === 'Client';
                  const isAdmin = m.senderRole === 'System Admin' || m.senderRole === 'Admin';
                  const bg = isAdmin ? '#f0fdf4' : isClient ? '#fef2f2' : '#eef2ff';
                  const border = isAdmin ? '#bbf7d0' : isClient ? '#fecaca' : '#c7d2fe';
                  const tagColor = isAdmin ? '#15803d' : isClient ? '#dc2626' : '#4f46e5';

                  return (
                    <div key={m.id} style={{ padding: '0.5rem 0.75rem', background: bg, border: `1px solid ${border}`, borderRadius: '8px', fontSize: '0.775rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 800, color: tagColor }}>[{m.senderRole}] {m.senderName}</span>
                        <span style={{ fontSize: '0.675rem', color: '#64748b' }}>{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ color: '#334155', lineHeight: 1.4 }}>{m.text}</div>
                    </div>
                  );
                })}
              </div>

              {/* Post Question / Defense Form */}
              {selectedDispute.status === 'Open' || selectedDispute.status === 'Under Review' ? (
                <form onSubmit={handlePostMessage} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <select 
                    value={newMessageSender}
                    onChange={(e) => setNewMessageSender(e.target.value)}
                    className="min-input"
                    style={{ fontSize: '0.725rem', padding: '0.3rem 0.5rem', width: '110px' }}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Client">Client</option>
                    <option value="Freelancer">Freelancer</option>
                  </select>

                  <input 
                    type="text" 
                    placeholder="Type a message or question to the dispute thread..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    className="min-input"
                    style={{ flexGrow: 1, fontSize: '0.775rem' }}
                    required
                  />

                  <button type="submit" disabled={postingMessage} className="min-btn min-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                    {postingMessage ? <RefreshCw size={12} className="spin" /> : <Send size={12} />}
                    Post
                  </button>
                </form>
              ) : (
                <div style={{ fontSize: '0.725rem', color: '#64748b', fontStyle: 'italic' }}>Thread closed following dispute resolution.</div>
              )}
            </div>

            {/* Section 3: AI Mediation Assistant */}
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#e6ecf5', borderRadius: '12px', boxShadow: '2px 2px 6px #c5d0e2, -2px -2px 6px #ffffff', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Scale size={16} color="#4f46e5" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>GigSphere AI Mediation Analysis</span>
                </div>

                <button 
                  onClick={() => handleRunAiMediation(selectedDispute.id)} 
                  disabled={mediatingAi}
                  className="min-btn min-btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                >
                  {mediatingAi ? <RefreshCw size={12} className="spin" /> : <Zap size={12} />}
                  {mediatingAi ? 'Analyzing Evidence with AI...' : 'Analyze Dispute with AI'}
                </button>
              </div>

              {aiMediationResult ? (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#e6ecf5', borderRadius: '8px', boxShadow: 'inset 2px 2px 4px #c5d0e2, inset -2px -2px 4px #ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#15803d' }}>
                      Recommended Verdict: {aiMediationResult.recommendedAction === 'refund_client' ? 'Refund Client' : aiMediationResult.recommendedAction === 'release_freelancer' ? 'Release to Freelancer' : '50/50 Split Settlement'}
                    </span>
                    <button 
                      onClick={() => setAdminReasoningText(aiMediationResult.reasoning || aiMediationResult.verdictSummary)}
                      className="min-btn"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <Sparkles size={10} /> Use AI Reasoning
                    </button>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#334155', lineHeight: 1.45 }}>
                    <strong>Legal Reasoning:</strong> {aiMediationResult.reasoning || aiMediationResult.verdictSummary}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                  Click "Analyze Dispute with AI" to generate an impartial AI mediation verdict based on contract evidence.
                </div>
              )}
            </div>

            {/* Section 4: Admin Official Reasoning & Resolution Execution */}
            {selectedDispute.status === 'Open' || selectedDispute.status === 'Under Review' ? (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.85rem' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Admin Official Verdict & Reasoning (Required)
                  </label>
                  <textarea 
                    rows="2"
                    placeholder="Type official administrative reasoning for this resolution (or click 'Use AI Reasoning')..."
                    value={adminReasoningText}
                    onChange={(e) => setAdminReasoningText(e.target.value)}
                    className="min-input"
                    style={{ width: '100%', fontFamily: 'inherit', fontSize: '0.8rem' }}
                    required
                  />
                </div>

                <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Execute Admin Resolution Action:
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleResolve(selectedDispute.id, 'refund_client')}
                    disabled={resolvingId === selectedDispute.id} 
                    className="min-btn min-btn-danger"
                    style={{ flexGrow: 1, fontSize: '0.775rem' }}
                  >
                    Refund Full Amount to Client ({formatINR(selectedDispute.amount)})
                  </button>

                  <button 
                    onClick={() => handleResolve(selectedDispute.id, 'release_freelancer')}
                    disabled={resolvingId === selectedDispute.id} 
                    className="min-btn min-btn-primary"
                    style={{ flexGrow: 1, fontSize: '0.775rem' }}
                  >
                    Release Full Amount to Freelancer ({formatINR(selectedDispute.amount)})
                  </button>

                  <button 
                    onClick={() => handleResolve(selectedDispute.id, 'split_50_50')}
                    disabled={resolvingId === selectedDispute.id} 
                    className="min-btn"
                    style={{ flexGrow: 1, fontSize: '0.775rem' }}
                  >
                    Settle 50/50 Split ({formatINR(selectedDispute.amount / 2)} each)
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.85rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '10px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                  ✓ Official Resolution Action: {selectedDispute.status}
                </div>
                <div style={{ fontSize: '0.775rem', color: '#166534' }}>
                  <strong>Admin Official Reasoning:</strong> {selectedDispute.adminReasoning || selectedDispute.resolution}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
