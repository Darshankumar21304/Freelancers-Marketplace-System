import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import { formatINR } from '../../utils/currency';
import {
  AlertTriangle, MessageSquare, Send, RefreshCw, X,
  PlusCircle, Scale, CheckCircle2, Clock, ChevronRight
} from 'lucide-react';
import { getUserRole } from '../../utils/authUtils';

export default function Disputes() {
  const role = getUserRole();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [postingMessage, setPostingMessage] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileForm, setFileForm] = useState({ projectId: '', projectTitle: '', freelancerEmail: '', clientEmail: '', amount: '', issue: '' });
  const [filingDispute, setFilingDispute] = useState(false);

  // Projects & counterparties for dispute form
  const [myProjects, setMyProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => { fetchDisputes(); }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/users/disputes');
      setDisputes(data.disputes || []);
    } catch (err) {
      console.error(err);
      flash('Failed to load disputes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const flash = (text, type = 'success') => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(null), 5000);
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedDispute) return;
    setPostingMessage(true);
    try {
      const res = await apiFetch(`/users/disputes/${selectedDispute.id}/message`, {
        method: 'POST', body: JSON.stringify({ text: newMessageText })
      });
      setSelectedDispute(res.dispute);
      setDisputes(disputes.map(d => d.id === res.dispute.id ? res.dispute : d));
      setNewMessageText('');
    } catch (err) {
      flash(err.message || 'Failed to post message.', 'error');
    } finally { setPostingMessage(false); }
  };

  const openFileModal = async () => {
    setShowFileModal(true);
    setSelectedProject(null);
    setFileForm({ projectId: '', projectTitle: '', freelancerEmail: '', clientEmail: '', amount: '', issue: '' });
    setLoadingProjects(true);
    try {
      if (role === 'freelancer') {
        const data = await apiFetch('/projects/my-contracts');
        const contractProjects = (data.contracts || []).map(c => ({
          _id: c.project_id?._id || c._id,
          contractId: c._id,
          title: c.project_id?.title || c.title || 'Marketplace Project',
          budget: c.totalValue || c.amountEarned || 1000,
          client: c.client_id,
          clientName: c.client_id?.name || 'Client',
          clientEmail: c.client_id?.email || '',
          proposals: []
        }));
        setMyProjects(contractProjects);
      } else {
        const data = await apiFetch('/projects/my');
        setMyProjects(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      flash('Failed to load active projects.', 'error');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleProjectSelect = (projectId) => {
    const proj = myProjects.find(p => p._id === projectId || p.contractId === projectId);
    if (!proj) {
      setSelectedProject(null);
      setFileForm(f => ({ ...f, projectId: '', projectTitle: '', freelancerEmail: '', clientEmail: '', amount: '' }));
      return;
    }
    setSelectedProject(proj);

    if (role === 'freelancer') {
      const cEmail = proj.clientEmail || proj.client?.email || '';
      setFileForm(f => ({
        ...f,
        projectId: proj._id,
        projectTitle: proj.title,
        clientEmail: cEmail,
        freelancerEmail: '',
        amount: proj.budget ? String(proj.budget) : (f.amount || '1000')
      }));
    } else {
      // For client: find hired or accepted proposal, or fallback to first proposal
      const candidates = (proj.proposals || []).filter(p => p.status === 'Hired' || p.status === 'Accepted');
      const activeProp = candidates.length > 0 ? candidates[0] : (proj.proposals?.[0] || null);

      const flEmail = activeProp?.freelancer_id?.email 
                   || activeProp?.freelancer_email 
                   || activeProp?.freelancer_name 
                   || '';

      setFileForm(f => ({
        ...f,
        projectId: proj._id,
        projectTitle: proj.title,
        freelancerEmail: flEmail,
        clientEmail: '',
        amount: proj.budget ? String(proj.budget) : (f.amount || '1000')
      }));
    }
  };

  const handleFileDispute = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      flash('Please select a project first.', 'error');
      return;
    }
    if (!fileForm.issue || !fileForm.issue.trim()) {
      flash('Please provide an issue description.', 'error');
      return;
    }
    setFilingDispute(true);
    try {
      const res = await apiFetch('/users/disputes', { method: 'POST', body: JSON.stringify(fileForm) });
      flash(res.message || 'Dispute filed successfully!');
      setShowFileModal(false);
      setFileForm({ projectId: '', projectTitle: '', freelancerEmail: '', clientEmail: '', amount: '', issue: '' });
      setSelectedProject(null);
      await fetchDisputes();
    } catch (err) {
      flash(err.message || 'Failed to file dispute.', 'error');
    } finally { setFilingDispute(false); }
  };

  const statusStyle = (status) => {
    if (status === 'Open') return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
    if (status === 'Under Review') return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
    if (['Resolved', 'Refunded', 'Released', 'Settled'].some(s => status?.startsWith(s)))
      return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
    return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
  };

  const isOpenDispute = (d) => d.status === 'Open' || d.status === 'Under Review';

  const inputStyle = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };
  const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' };

  return (
    <div className="client-dashboard-container">
      <div className="overview-header">
        <div>
          <h1 className="overview-title">My Disputes</h1>
          <p className="overview-subtitle">View open disputes, participate in the evidence thread, and track admin resolutions.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchDisputes} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.2rem', borderRadius: '40px', background: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={openFileModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.65rem 1.4rem', borderRadius: '40px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            <PlusCircle size={18} /> File New Dispute
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: msgType === 'error' ? '#fef2f2' : '#eff6ff', border: `1px solid ${msgType === 'error' ? '#fecaca' : '#bfdbfe'}`, color: msgType === 'error' ? '#dc2626' : '#1e40af', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
          {msg}
        </div>
      )}

      <div style={{ padding: '0.85rem 1rem', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', border: '1px solid #bfdbfe', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <Scale size={18} color="#4f46e5" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.825rem', color: '#334155' }}>
          <strong style={{ color: '#0f172a' }}>Dispute Protection:</strong> All escrowed funds are held safely until officially resolved by the GigSphere admin team. Submit evidence in the discussion thread.
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={32} className="spin" style={{ color: '#4f46e5', marginBottom: '12px' }} /><p>Loading your disputes...</p>
        </div>
      ) : disputes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #cbd5e1', borderRadius: '16px', background: '#f8fafc', color: '#64748b' }}>
          <AlertTriangle size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h4 style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: 800 }}>No Disputes Found</h4>
          <p style={{ margin: '0 0 20px', fontSize: '0.875rem' }}>
            {role === 'client' ? 'No active disputes. File one if you have an issue with a freelancer.' : 'No disputes filed on your contracts. You can file a dispute if there is an issue with a client or milestone.'}
          </p>
          <button onClick={openFileModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.4rem', borderRadius: '40px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            <PlusCircle size={16} /> File a Dispute
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {disputes.map((d) => {
            const st = statusStyle(d.status);
            return (
              <div key={d.id} onClick={() => { setSelectedDispute(d); setNewMessageText(''); }}
                style={{ padding: '1.1rem 1.25rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: st.bg, border: `1px solid ${st.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={20} color={st.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.925rem' }}>{d.projectTitle}</span>
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{d.status}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{d.id}</span>
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.issue}</p>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.775rem', color: '#94a3b8' }}>
                    <span><MessageSquare size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{d.messages?.length || 0} messages</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatINR(d.amount)} escrowed</span>
                    <span><Clock size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            );
          })}
        </div>
      )}

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <div style={overlayStyle}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <AlertTriangle size={18} color="#f59e0b" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{selectedDispute.id}: {selectedDispute.projectTitle}</h3>
                  {(() => { const st = statusStyle(selectedDispute.status); return <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{selectedDispute.status}</span>; })()}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Escrowed: <strong style={{ color: '#0f172a' }}>{formatINR(selectedDispute.amount)}</strong> • Filed {new Date(selectedDispute.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button onClick={() => setSelectedDispute(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '6px', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.85rem', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', marginBottom: '6px' }}>Client Complaint</div>
                  <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0f172a', marginBottom: '4px' }}>{selectedDispute.clientName}</div>
                  <p style={{ margin: 0, fontSize: '0.775rem', color: '#475569', lineHeight: 1.5 }}>"{selectedDispute.issue}"</p>
                </div>
                <div style={{ padding: '0.85rem', background: '#eef2ff', borderRadius: '12px', border: '1px solid #c7d2fe' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', marginBottom: '6px' }}>Freelancer Defense</div>
                  <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0f172a', marginBottom: '4px' }}>{selectedDispute.freelancerName}</div>
                  <p style={{ margin: 0, fontSize: '0.775rem', color: '#475569', lineHeight: 1.5 }}>"{selectedDispute.freelancerDefense || 'Response pending.'}"</p>
                </div>
              </div>

              {!isOpenDispute(selectedDispute) && selectedDispute.resolution && (
                <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <CheckCircle2 size={16} color="#15803d" />
                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#15803d' }}>Admin Resolution: {selectedDispute.status}</span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '0.8rem', color: '#166534' }}><strong>Verdict:</strong> {selectedDispute.resolution}</p>
                  {selectedDispute.adminReasoning && <p style={{ margin: 0, fontSize: '0.775rem', color: '#166534' }}><strong>Admin Reasoning:</strong> {selectedDispute.adminReasoning}</p>}
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase' }}>
                  <MessageSquare size={16} color="#4f46e5" /> Evidence & Discussion Thread ({selectedDispute.messages?.length || 0})
                </h4>
                <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', paddingRight: '4px' }}>
                  {!selectedDispute.messages?.length ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.825rem' }}>No messages yet. Be the first to submit evidence.</div>
                  ) : selectedDispute.messages.map((m) => {
                    const isMine = (role === 'client' && m.senderRole === 'Client') || (role === 'freelancer' && m.senderRole === 'Freelancer');
                    const isAdmin = m.senderRole === 'System Admin' || m.senderRole === 'Admin';
                    let bg = '#f8fafc', border = '#e2e8f0', nameColor = '#64748b';
                    if (isAdmin) { bg = '#f0fdf4'; border = '#bbf7d0'; nameColor = '#15803d'; }
                    else if (m.senderRole === 'Client') { bg = '#fef2f2'; border = '#fecaca'; nameColor = '#dc2626'; }
                    else if (m.senderRole === 'Freelancer') { bg = '#eef2ff'; border = '#c7d2fe'; nameColor = '#4f46e5'; }
                    return (
                      <div key={m.id} style={{ padding: '10px 12px', background: bg, border: `1px solid ${border}`, borderRadius: '10px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 800, color: nameColor, fontSize: '0.775rem' }}>
                            [{m.senderRole}] {m.senderName}{isMine && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#94a3b8' }}>(You)</span>}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(m.timestamp).toLocaleString()}</span>
                        </div>
                        <div style={{ color: '#334155', lineHeight: 1.5 }}>{m.text}</div>
                      </div>
                    );
                  })}
                </div>

                {isOpenDispute(selectedDispute) ? (
                  <form onSubmit={handlePostMessage} style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Type your evidence or response..." value={newMessageText} onChange={e => setNewMessageText(e.target.value)}
                      style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.825rem', outline: 'none' }} required />
                    <button type="submit" disabled={postingMessage || !newMessageText.trim()} style={{ padding: '0.65rem 1.1rem', borderRadius: '10px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {postingMessage ? <RefreshCw size={15} className="spin" /> : <Send size={15} />} Post
                    </button>
                  </form>
                ) : (
                  <div style={{ fontSize: '0.775rem', color: '#94a3b8', fontStyle: 'italic', padding: '10px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                    Thread closed — this dispute has been resolved by admin.
                  </div>
                )}
              </div>

              {selectedDispute.aiRecommendation && (
                <div style={{ padding: '0.85rem 1rem', background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', border: '1px solid #c7d2fe', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Scale size={15} color="#4f46e5" />
                    <span style={{ fontWeight: 800, fontSize: '0.825rem', color: '#4f46e5', textTransform: 'uppercase' }}>AI Mediation Analysis</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>
                    {selectedDispute.aiRecommendation.reasoning || selectedDispute.aiRecommendation.verdictSummary || 'AI mediation report is available for admin review.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File New Dispute Modal */}
      {showFileModal && (
        <div style={overlayStyle}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', maxWidth: '520px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>File a New Dispute</h3>
              </div>
              <button onClick={() => setShowFileModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '6px', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleFileDispute} style={{ padding: '1.25rem 1.5rem' }}>

              {/* Step 1: Select Project */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Select Your Project *
                </label>
                {loadingProjects ? (
                  <div style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.825rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={13} className="spin" /> Loading your projects...
                  </div>
                ) : myProjects.length === 0 ? (
                  <div style={{ padding: '0.7rem 1rem', borderRadius: '10px', border: '1px dashed #e2e8f0', fontSize: '0.825rem', color: '#94a3b8', background: '#f8fafc' }}>
                    No projects found. Create a project first to file a dispute.
                  </div>
                ) : (
                  <select
                    value={fileForm.projectId}
                    onChange={e => handleProjectSelect(e.target.value)}
                    required
                    style={{ ...inputStyle, appearance: 'auto', cursor: 'pointer', background: '#fff' }}
                  >
                    <option value="">— Choose a project —</option>
                    {myProjects.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.title} {p.budget ? `(₹${Number(p.budget).toLocaleString()})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Step 2: Select Counterparty */}
              {selectedProject && (
                <div style={{ marginBottom: '14px' }}>
                  {role === 'freelancer' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                        Project Client *
                      </label>
                      <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.85rem', color: '#0f172a' }}>
                        <strong>{selectedProject.clientName || selectedProject.client?.name || 'Client'}</strong>
                        {selectedProject.clientEmail || selectedProject.client?.email ? (
                          <span style={{ color: '#64748b', marginLeft: '6px' }}>({selectedProject.clientEmail || selectedProject.client?.email})</span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                        Freelancer to Dispute *
                      </label>
                      {(() => {
                        const proposalList = selectedProject.proposals || [];
                        const candidateList = proposalList.filter(p => p.status === 'Hired' || p.status === 'Accepted');
                        const displayList = candidateList.length > 0 ? candidateList : proposalList;

                        if (displayList.length > 0) {
                          return (
                            <select
                              value={fileForm.freelancerEmail}
                              onChange={e => setFileForm(f => ({ ...f, freelancerEmail: e.target.value }))}
                              required
                              style={{ ...inputStyle, appearance: 'auto', cursor: 'pointer', background: '#fff' }}
                            >
                              <option value="">— Select freelancer —</option>
                              {displayList.map((p, i) => {
                                const val = p.freelancer_id?.email || p.freelancer_email || p.freelancer_name || `freelancer_${i}`;
                                const name = p.freelancer_name || p.freelancer_id?.name || `Freelancer ${i + 1}`;
                                const email = p.freelancer_id?.email || p.freelancer_email;
                                const statusTag = p.status ? ` (${p.status})` : '';
                                return (
                                  <option key={i} value={val}>
                                    {name}{statusTag}{email ? ` — ${email}` : ''}
                                  </option>
                                );
                              })}
                            </select>
                          );
                        } else {
                          return (
                            <div>
                              <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px dashed #fde68a', background: '#fffbeb', fontSize: '0.8rem', color: '#92400e', marginBottom: '8px' }}>
                                ⚠ No proposals recorded on this project yet. Please enter the freelancer's email or username below.
                              </div>
                              <input
                                type="text"
                                placeholder="Enter freelancer email or name"
                                value={fileForm.freelancerEmail}
                                onChange={e => setFileForm(f => ({ ...f, freelancerEmail: e.target.value }))}
                                required
                                style={inputStyle}
                              />
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Disputed Amount (auto-filled from budget, editable) */}
              {selectedProject && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    Disputed Amount (₹) *
                    <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '6px' }}>auto-filled from project budget, edit if needed</span>
                  </label>
                  <input type="number" placeholder="e.g. 25000" value={fileForm.amount}
                    onChange={e => setFileForm(p => ({ ...p, amount: e.target.value }))}
                    required min="1" style={inputStyle} />
                </div>
              )}

              {/* Step 4: Issue Description */}
              {selectedProject && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Issue Description *</label>
                  <textarea rows={4}
                    placeholder="Describe the issue clearly. Include relevant dates, milestones missed, and what was not delivered..."
                    value={fileForm.issue}
                    onChange={e => setFileForm(p => ({ ...p, issue: e.target.value }))}
                    required
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setShowFileModal(false)} style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontWeight: 700, cursor: 'pointer', color: '#374151' }}>Cancel</button>
                <button type="submit" disabled={filingDispute || !selectedProject} style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: (filingDispute || !selectedProject) ? 0.5 : 1 }}>
                  {filingDispute ? <RefreshCw size={15} className="spin" /> : <AlertTriangle size={15} />}
                  {filingDispute ? 'Filing...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
