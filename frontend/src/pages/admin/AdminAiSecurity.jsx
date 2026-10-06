import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Cpu, 
  RefreshCw, 
  Sliders, 
  Bot, 
  Zap, 
  Check, 
  Filter,
  Play,
  Layers,
  Activity,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  History,
  Send,
  MessageSquare
} from 'lucide-react';

export default function AdminAiSecurity() {
  const [activeTab, setActiveTab] = useState('governance'); // governance | simulation | performance | learning | alerts | assistant | logs
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  // 1. Model Governance State
  const [versionsData, setVersionsData] = useState(null);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [weights, setWeights] = useState({
    skillMatch: 30,
    requirementMatch: 15,
    experience: 10,
    pastSuccess: 10,
    rating: 8,
    budgetCompatibility: 7,
    availability: 5,
    relatedSkills: 5,
    learningAdjustment: 10
  });
  const [newVersionTag, setNewVersionTag] = useState('1.1.0');
  const [versionNotes, setVersionNotes] = useState('');
  const [savingVersion, setSavingVersion] = useState(false);

  // 2. Simulation State
  const [simulating, setSimulating] = useState(false);
  const [simResults, setSimResults] = useState(null);

  // 3. Performance Funnel State
  const [perfData, setPerfData] = useState(null);
  const [loadingPerf, setLoadingPerf] = useState(false);

  // 4. Learning Monitor State
  const [learningData, setLearningData] = useState(null);
  const [loadingLearning, setLoadingLearning] = useState(false);

  // 5. Alert Center State
  const [alertsData, setAlertsData] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // 6. AI Admin Assistant State
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState(null);
  const [askingAssistant, setAskingAssistant] = useState(false);

  // 7. Security Logs State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [rescanning, setRescanning] = useState(false);

  useEffect(() => {
    fetchModelVersions();
    fetchAlerts();
    fetchPerformance();
    fetchLearning();
  }, []);

  const fetchModelVersions = async () => {
    setLoadingVersions(true);
    try {
      const data = await apiFetch('/admin/ai/model-versions');
      setVersionsData(data);
      if (data?.currentProductionConfig?.weights) {
        const rawW = data.currentProductionConfig.weights;
        setWeights({
          skillMatch: Math.round((rawW.skillMatch || 0.3) * 100),
          requirementMatch: Math.round((rawW.requirementMatch || 0.15) * 100),
          experience: Math.round((rawW.experience || 0.10) * 100),
          pastSuccess: Math.round((rawW.pastSuccess || 0.10) * 100),
          rating: Math.round((rawW.rating || 0.08) * 100),
          budgetCompatibility: Math.round((rawW.budgetCompatibility || 0.07) * 100),
          availability: Math.round((rawW.availability || 0.05) * 100),
          relatedSkills: Math.round((rawW.relatedSkills || 0.05) * 100),
          learningAdjustment: Math.round((rawW.learningAdjustment || 0.10) * 100)
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const fetchPerformance = async () => {
    setLoadingPerf(true);
    try {
      const data = await apiFetch('/admin/ai/performance');
      setPerfData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPerf(false);
    }
  };

  const fetchLearning = async () => {
    setLoadingLearning(true);
    try {
      const data = await apiFetch('/admin/ai/learning-summary');
      setLearningData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLearning(false);
    }
  };

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const data = await apiFetch('/admin/ai/alerts');
      setAlertsData(data.alerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await apiFetch('/admin/ai-security');
      setLogs(data.aiLogs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Weight total check
  const totalWeightPercent = Object.values(weights).reduce((a, b) => Number(a) + Number(b), 0);

  const handleStageVersion = async (e) => {
    e.preventDefault();
    if (totalWeightPercent !== 100) {
      setError(`Weights must sum exactly to 100% (currently ${totalWeightPercent}%). Please balance weights.`);
      setTimeout(() => setError(null), 4000);
      return;
    }

    setSavingVersion(true);
    setError(null);
    try {
      const normalizedWeights = {};
      Object.entries(weights).forEach(([k, v]) => {
        normalizedWeights[k] = Number((v / 100).toFixed(2));
      });

      const res = await apiFetch('/admin/ai/model-versions', {
        method: 'POST',
        body: JSON.stringify({
          version: newVersionTag,
          title: `Candidate Ensemble v${newVersionTag}`,
          weights: normalizedWeights,
          notes: versionNotes || 'Staged through Admin AI Governance Console'
        })
      });

      setMsg(res.message);
      setTimeout(() => setMsg(null), 4000);
      fetchModelVersions();
    } catch (err) {
      setError(err.message || 'Failed to stage model version');
    } finally {
      setSavingVersion(false);
    }
  };

  const handleActivateVersion = async (versionId) => {
    if (!window.confirm(`Activate model version ${versionId} for live production recommendations?`)) return;
    try {
      const res = await apiFetch(`/admin/ai/model-versions/${versionId}/activate`, { method: 'POST' });
      setMsg(res.message);
      setTimeout(() => setMsg(null), 4000);
      fetchModelVersions();
    } catch (err) {
      alert(err.message || 'Failed to activate version');
    }
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimResults(null);
    try {
      const normalizedWeights = {};
      Object.entries(weights).forEach(([k, v]) => {
        normalizedWeights[k] = Number((v / 100).toFixed(2));
      });

      const res = await apiFetch('/admin/ai/model-simulate', {
        method: 'POST',
        body: JSON.stringify({
          weights: normalizedWeights,
          testSampleCount: 5
        })
      });
      setSimResults(res);
    } catch (err) {
      alert(err.message || 'Simulation run failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleAskAssistant = async (e, directText) => {
    if (e) e.preventDefault();
    const queryText = directText || assistantQuery;
    if (!queryText.trim()) return;

    setAskingAssistant(true);
    setAssistantResponse(null);
    try {
      const res = await apiFetch('/admin/ai/assistant/query', {
        method: 'POST',
        body: JSON.stringify({ question: queryText })
      });
      setAssistantResponse(res);
    } catch (err) {
      alert(err.message || 'Admin assistant query failed');
    } finally {
      setAskingAssistant(false);
    }
  };

  const handleTriggerFullScan = async () => {
    setRescanning(true);
    try {
      const res = await apiFetch('/admin/users/auto-audit-all', { method: 'POST' });
      setMsg(res.message);
      setTimeout(() => setMsg(null), 4000);
      fetchLogs();
      fetchAlerts();
    } catch (err) {
      alert(err.message || 'Full database rescan failed');
    } finally {
      setRescanning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header & Live Telemetry Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              AI Governance, Model Controls & Security
            </h1>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              padding: '0.2rem 0.6rem', 
              borderRadius: '20px', 
              background: '#eff6ff', 
              color: '#1a73e8',
              border: '1px solid #bfdbfe'
            }}>
              <Sparkles size={12} /> Active Version: {versionsData?.activeVersion || 'v1.0.0'}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.825rem', margin: '0.25rem 0 0 0' }}>
            Server-side model versioning, simulation sandbox, performance telemetry, adaptive learning & grounded AI assistant
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={handleTriggerFullScan} 
            disabled={rescanning}
            className="min-btn min-btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
          >
            {rescanning ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>{rescanning ? 'Auditing Platform...' : 'Trigger AI Audit Scan'}</span>
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* 2. Primary Admin AI Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {[
          { id: 'governance', label: 'Model Governance', icon: Sliders },
          { id: 'simulation', label: 'AI Simulation Sandbox', icon: Play },
          { id: 'performance', label: 'Performance & Conversion', icon: TrendingUp },
          { id: 'learning', label: 'Adaptive Learning Monitor', icon: Activity },
          { id: 'alerts', label: `Alert Center (${alertsData.length})`, icon: AlertTriangle },
          { id: 'assistant', label: 'Admin AI Assistant', icon: Bot },
          { id: 'logs', label: 'Threat Radar Logs', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'logs' && logs.length === 0) fetchLogs();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isActive ? '#bfdbfe' : 'transparent',
                background: isActive ? '#eff6ff' : 'transparent',
                color: isActive ? '#1a73e8' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.825rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: MODEL GOVERNANCE & VERSIONING */}
      {activeTab === 'governance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
            
            {/* Model Weights Configuration */}
            <div className="min-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sliders size={18} color="#1a73e8" />
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Recommendation Scoring Weights</h3>
                </div>
                <span className={`pill-badge ${totalWeightPercent === 100 ? 'active' : 'review'}`}>
                  Sum: {totalWeightPercent}% {totalWeightPercent === 100 ? 'Balanced' : '(Must = 100%)'}
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '1rem' }}>
                Multi-objective optimization scoring ensemble across skill taxonomy, client requirements, verified experience, and adaptive feedback.
              </p>

              <form onSubmit={handleStageVersion} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {Object.entries(weights).map(([factor, val]) => (
                  <div key={factor}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span style={{ fontWeight: 700, color: '#1a73e8' }}>{val}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="60"
                      value={val}
                      onChange={(e) => setWeights({ ...weights, [factor]: Number(e.target.value) })}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                ))}

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="v1.1.0" 
                      value={newVersionTag} 
                      onChange={(e) => setNewVersionTag(e.target.value)}
                      className="min-input"
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Notes on change rationale..." 
                      value={versionNotes} 
                      onChange={(e) => setVersionNotes(e.target.value)}
                      className="min-input"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="submit" 
                      disabled={savingVersion || totalWeightPercent !== 100}
                      className="min-btn min-btn-primary"
                      style={{ flex: 1, padding: '0.5rem' }}
                    >
                      {savingVersion ? 'Staging Version...' : 'Stage Candidate Model Version'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('simulation')}
                      className="min-btn"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Play size={14} /> Simulate First
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Version History Matrix */}
            <div className="min-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <History size={18} color="#1a73e8" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Model Version History & Rollouts</h3>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '1rem' }}>
                Audited version control tracking creator, activation date, and rollback states.
              </p>

              <div className="min-table-container">
                <table className="min-table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Creator & Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versionsData?.versions && versionsData.versions.length > 0 ? (
                      versionsData.versions.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{v.version}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{v.title}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{v.creator}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(v.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td>
                            <span className={`pill-badge ${v.status === 'active' ? 'active' : 'clean'}`}>
                              {v.status === 'active' ? '● Live Production' : 'Staged'}
                            </span>
                          </td>
                          <td>
                            {v.status !== 'active' ? (
                              <button 
                                onClick={() => handleActivateVersion(v.id)}
                                className="min-btn min-btn-primary"
                                style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
                              >
                                Activate
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 700 }}>Active</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                          No version records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: AI SIMULATION WORKBENCH */}
      {activeTab === 'simulation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="min-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  Candidate Model Simulation Sandbox
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.2rem 0 0 0' }}>
                  Test proposed weights against real database project and freelancer pairings WITHOUT impacting live production.
                </p>
              </div>
              <button 
                onClick={handleRunSimulation} 
                disabled={simulating}
                className="min-btn min-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
              >
                <Play size={14} className={simulating ? 'animate-spin' : ''} />
                <span>{simulating ? 'Simulating On Real DB...' : 'Run Simulation'}</span>
              </button>
            </div>

            {/* Simulation Aggregate Comparison */}
            {simResults && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Sample Pairings</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{simResults.simulationMetrics?.totalPairingsEvaluated || 0}</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Baseline Average Score</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#64748b' }}>{simResults.simulationMetrics?.averageBaselineScore}%</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#1a73e8', fontWeight: 700, textTransform: 'uppercase' }}>Simulated Average Score</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a73e8' }}>{simResults.simulationMetrics?.averageSimulatedScore}%</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>Overall Score Shift (Δ)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#15803d' }}>
                    {simResults.simulationMetrics?.averageShift > 0 ? `+${simResults.simulationMetrics?.averageShift}%` : `${simResults.simulationMetrics?.averageShift}%`}
                  </div>
                </div>
              </div>
            )}

            {/* Granular Simulation Pairings */}
            {simResults?.results && simResults.results.length > 0 ? (
              <div className="min-table-container">
                <table className="min-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Candidate Freelancer</th>
                      <th>Baseline Score</th>
                      <th>Simulated Score</th>
                      <th>Delta</th>
                      <th>Simulated Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simResults.results.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{r.projectTitle}</td>
                        <td style={{ color: '#1a73e8', fontWeight: 600 }}>{r.freelancerName}</td>
                        <td style={{ color: '#64748b', fontWeight: 700 }}>{r.baselineScore}%</td>
                        <td style={{ color: '#0f172a', fontWeight: 800 }}>{r.simulatedScore}%</td>
                        <td>
                          <span className={`pill-badge ${r.scoreDelta >= 0 ? 'active' : 'review'}`}>
                            {r.scoreDelta >= 0 ? `+${r.scoreDelta}%` : `${r.scoreDelta}%`}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.725rem', color: '#64748b' }}>
                          Skill: {r.factorBreakdown?.skillMatch}% • Req: {r.factorBreakdown?.requirementMatch}% • Exp: {r.factorBreakdown?.experience}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                <Play size={28} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <div>Click "Run Simulation" to evaluate current slider weights against actual MongoDB projects.</div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 3: PERFORMANCE & CONVERSION FUNNEL */}
      {activeTab === 'performance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="min-card">
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              Recommendation Conversion Funnel Telemetry
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
              Authoritative tracking of real candidate interactions to verify recommendation efficacy and business value.
            </p>

            {/* Funnel Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Impressions</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>{perfData?.funnel?.impressions || 0}</div>
                <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>Card Displays</div>
              </div>

              <div style={{ padding: '0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Views</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>{perfData?.funnel?.views || 0}</div>
                <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>Details Opened</div>
              </div>

              <div style={{ padding: '0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bookmarks</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>{perfData?.funnel?.bookmarks || 0}</div>
                <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>Saved Candidates</div>
              </div>

              <div style={{ padding: '0.85rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1a73e8', textTransform: 'uppercase' }}>Proposals</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a73e8', margin: '0.2rem 0' }}>{perfData?.funnel?.proposals || 0}</div>
                <div style={{ fontSize: '0.675rem', color: '#1a73e8' }}>Bids Submitted</div>
              </div>

              <div style={{ padding: '0.85rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Hires</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', margin: '0.2rem 0' }}>{perfData?.funnel?.hires || 0}</div>
                <div style={{ fontSize: '0.675rem', color: '#15803d' }}>Contracts Awarded</div>
              </div>

              <div style={{ padding: '0.85rem', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>Completions</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed', margin: '0.2rem 0' }}>{perfData?.funnel?.completions || 0}</div>
                <div style={{ fontSize: '0.675rem', color: '#7c3aed' }}>Successfully Delivered</div>
              </div>
            </div>

            {/* Derived Rates */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Recommendation to Proposal Rate</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                  {perfData?.conversionMetrics?.viewToProposalRate || '0%'}
                </div>
                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Proposals initiated from recommended project views</div>
              </div>

              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Proposal to Hire Rate</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', margin: '0.25rem 0' }}>
                  {perfData?.conversionMetrics?.proposalToHireRate || '0%'}
                </div>
                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Recommended candidate hire acceptance rate</div>
              </div>

              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Total Tracked AI Events</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5', margin: '0.25rem 0' }}>
                  {perfData?.conversionMetrics?.totalTrackedEvents || 0}
                </div>
                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Immutable events stored in RecommendationEvents</div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 4: ADAPTIVE LEARNING MONITOR */}
      {activeTab === 'learning' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="min-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  Adaptive Learning & Skill Weight Adjustments
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.2rem 0 0 0' }}>
                  Server-controlled bounded learning weights updated strictly upon verified hires, reviews, and completed milestones.
                </p>
              </div>
              <span className="pill-badge active">Status: {learningData?.learningStatus || 'Active'}</span>
            </div>

            <div className="min-table-container">
              <table className="min-table">
                <thead>
                  <tr>
                    <th>Skill Domain</th>
                    <th>Views</th>
                    <th>Proposals</th>
                    <th>Hires</th>
                    <th>Completions</th>
                    <th>Learned Success Rate</th>
                    <th>Score Adjustment</th>
                  </tr>
                </thead>
                <tbody>
                  {learningData?.skills && learningData.skills.length > 0 ? (
                    learningData.skills.map((s, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, textTransform: 'capitalize' }}>{s.skill}</td>
                        <td>{s.views}</td>
                        <td>{s.proposals}</td>
                        <td style={{ color: '#1a73e8', fontWeight: 600 }}>{s.hires}</td>
                        <td style={{ color: '#15803d', fontWeight: 600 }}>{s.completions}</td>
                        <td>
                          <span style={{ fontWeight: 700 }}>{Math.round(s.successRate * 100)}%</span>
                        </td>
                        <td>
                          <span className={`pill-badge ${s.scoreAdjustment >= 0 ? 'active' : 'review'}`}>
                            {s.scoreAdjustment >= 0 ? `+${(s.scoreAdjustment * 100).toFixed(0)}%` : `${(s.scoreAdjustment * 100).toFixed(0)}%`}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                        No learning event records available yet. Learning adjustments trigger automatically as contracts complete.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* TAB 5: AI ALERT CENTER & MARKETPLACE ANOMALIES */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="min-card">
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              Actionable AI & Security Incident Queue
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
              Automated anomaly detection across high-risk accounts, bidding velocity spikes, and escrow disputes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {alertsData && alertsData.length > 0 ? (
                alertsData.map((alert) => (
                  <div 
                    key={alert.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: alert.severity === 'high' ? '#fecaca' : alert.severity === 'medium' ? '#fde68a' : '#e2e8f0',
                      background: alert.severity === 'high' ? '#fff5f5' : alert.severity === 'medium' ? '#fffbeb' : '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ 
                        padding: '0.45rem', 
                        borderRadius: '6px', 
                        background: alert.severity === 'high' ? '#fee2e2' : alert.severity === 'medium' ? '#fef3c7' : '#eff6ff',
                        color: alert.severity === 'high' ? '#b91c1c' : alert.severity === 'medium' ? '#b45309' : '#1a73e8'
                      }}>
                        {alert.severity === 'high' ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{alert.title}</div>
                        <div style={{ fontSize: '0.775rem', color: '#475569', marginTop: '0.2rem' }}>{alert.evidence}</div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.35rem' }}>
                          <strong>Recommended Action:</strong> {alert.recommendedAction}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`pill-badge ${alert.severity === 'high' ? 'blocked' : alert.severity === 'medium' ? 'review' : 'clean'}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      {alert.link && (
                        <a href={alert.link} className="min-btn min-btn-primary" style={{ textDecoration: 'none', fontSize: '0.725rem' }}>
                          Resolve →
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                  <CheckCircle size={28} color="#15803d" style={{ marginBottom: '0.5rem' }} />
                  <div>No pending AI risk alerts. All marketplace telemetry within safe parameters.</div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB 6: CONTROLLED ADMIN AI ASSISTANT */}
      {activeTab === 'assistant' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="min-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Bot size={20} color="#1a73e8" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Grounded Executive AI Assistant
              </h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '1rem' }}>
              Answers administrative questions grounded strictly in authorized live MongoDB counts, project categories, dispute records, and risk signals.
            </p>

            {/* Quick Prompt Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
              {[
                "Summarize this month's platform activity and user growth",
                "Who are the highest risk accounts flagged by AI?",
                "Which project categories have the highest volume?",
                "What is our recommendation engine performance and conversion rate?"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    setAssistantQuery(chip);
                    handleAskAssistant(e, chip);
                  }}
                  className="min-btn"
                  style={{ fontSize: '0.725rem', background: '#f8fafc' }}
                >
                  {chip}
                </button>
              ))}
            </div>

            <form onSubmit={handleAskAssistant} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input 
                type="text" 
                placeholder="Ask anything about live platform stats, risk anomalies, or revenue..." 
                value={assistantQuery}
                onChange={(e) => setAssistantQuery(e.target.value)}
                className="min-input"
                style={{ flex: 1 }}
              />
              <button 
                type="submit" 
                disabled={askingAssistant || !assistantQuery.trim()}
                className="min-btn min-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 1rem' }}
              >
                <Send size={14} />
                <span>{askingAssistant ? 'Querying Live DB...' : 'Ask Assistant'}</span>
              </button>
            </form>

            {/* Assistant Output & Grounded DB Telemetry */}
            {assistantResponse && (
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: '#1a73e8', fontWeight: 700, fontSize: '0.8rem' }}>
                  <Sparkles size={14} /> AI Executive Response
                </div>
                <div style={{ fontSize: '0.85rem', color: '#0f172a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {assistantResponse.answer}
                </div>

                {/* Grounding Context Preview */}
                {assistantResponse.groundContext && (
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', fontSize: '0.725rem', color: '#64748b' }}>
                    <strong>Verified MongoDB Grounding Context:</strong> Users: {assistantResponse.groundContext.platformStats?.totalUsers} • Active Projects: {assistantResponse.groundContext.platformStats?.activeProjectsCount} • Flagged Risk Accounts: {assistantResponse.groundContext.highRiskAccountsCount}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 7: THREAT RADAR & AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="min-card">
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              Real-Time Security Audit Logs & Fake Account Radar
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '1rem' }}>
              Autonomous detection logs capturing stock avatars, off-platform contact leaks, and duplicate portfolio text.
            </p>

            {loadingLogs ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading audit logs...</div>
            ) : (
              <div className="min-table-container">
                <table className="min-table">
                  <thead>
                    <tr>
                      <th>Target User</th>
                      <th>Role</th>
                      <th>Risk Score</th>
                      <th>Status</th>
                      <th>Audited Time</th>
                      <th>AI Diagnostic Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs && logs.length > 0 ? (
                      logs.map((log, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{log.name || log.email || 'User'}</td>
                          <td>
                            <span className="pill-badge clean">{log.role}</span>
                          </td>
                          <td style={{ fontWeight: 700, color: log.riskScore >= 70 ? '#dc2626' : log.riskScore >= 40 ? '#b45309' : '#15803d' }}>
                            {log.riskScore}/100
                          </td>
                          <td>
                            <span className={`pill-badge ${log.status === 'Flagged' || log.status === 'Suspended' ? 'blocked' : 'active'}`}>
                              {log.status || 'Clean'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.725rem', color: '#64748b' }}>
                            {log.auditedAt ? new Date(log.auditedAt).toLocaleString() : 'Recent'}
                          </td>
                          <td style={{ fontSize: '0.725rem', color: '#475569', maxWidth: 300 }}>
                            {log.aiReason || 'Standard profile vetting passed.'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                          No audit logs found. Click "Trigger AI Audit Scan" to scan registered accounts.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
