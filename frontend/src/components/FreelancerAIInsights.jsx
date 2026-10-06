import React, { useState, useEffect } from 'react';
import {
  Brain, TrendingUp, CheckCircle, AlertCircle, Zap, Star,
  ChevronRight, Loader2, RefreshCw
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { Link } from 'react-router-dom';

export default function FreelancerAIInsights() {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/users/profile/ai-analyze', { method: 'POST' });
      setAnalysis(data);
      setHasRun(true);
    } catch (err) {
      console.error('AI analyze error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getGradeBg = (grade) => {
    if (grade === 'A+' || grade === 'A') return 'linear-gradient(135deg, #dcfce7, #bbf7d0)';
    if (grade === 'B') return 'linear-gradient(135deg, #e8f0fe, #c7d7fd)';
    if (grade === 'C') return 'linear-gradient(135deg, #fef3c7, #fde68a)';
    return 'linear-gradient(135deg, #fee2e2, #fecaca)';
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #1a73e8, #a142f4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>AI Profile Strength Analyzer</h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>Powered by GigSphere AI — improves your visibility and hire rate</p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={isLoading}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            borderRadius: '30px', border: '1px solid #e2e8f0', background: '#f8fafc',
            color: '#475569', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s', opacity: isLoading ? 0.6 : 1
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          Re-analyze
        </button>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #1a73e8, #a142f4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={24} color="#fff" className="spin" />
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Analyzing your profile against GigSphere best practices...</p>
        </div>
      )}

      {!isLoading && analysis && (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Score Circle */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              position: 'relative', width: '160px', height: '160px', margin: '0 auto 12px',
              borderRadius: '50%', background: getGradeBg(analysis.grade),
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: `4px solid ${getScoreColor(analysis.score)}`,
              boxShadow: `0 0 0 6px ${getScoreColor(analysis.score)}20`
            }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: getScoreColor(analysis.score), lineHeight: 1 }}>
                {analysis.score}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>/ 100</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: getScoreColor(analysis.score), marginTop: '4px' }}>
                Grade {analysis.grade}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Profile Strength</p>
            <Link
              to="/dashboard/profile"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '10px',
                padding: '6px 14px', borderRadius: '30px', background: '#1a73e8',
                color: '#fff', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none'
              }}
            >
              Improve <ChevronRight size={12} />
            </Link>
          </div>

          {/* Insights Panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Strengths */}
            {analysis.strengths?.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '12px', padding: '16px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <CheckCircle size={16} color="#10b981" />
                  <span style={{ fontWeight: 700, color: '#065f46', fontSize: '0.85rem' }}>What's Working</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {analysis.strengths.map((s, i) => (
                    <span key={i} style={{
                      padding: '4px 12px', borderRadius: '20px', background: '#dcfce7',
                      border: '1px solid #10b981', color: '#065f46', fontSize: '0.78rem', fontWeight: 600
                    }}>
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Tips */}
            {analysis.tips?.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', borderRadius: '12px', padding: '16px', border: '1px solid #fed7aa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Zap size={16} color="#f97316" />
                  <span style={{ fontWeight: 700, color: '#7c2d12', fontSize: '0.85rem' }}>AI Improvement Tips</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysis.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <AlertCircle size={14} color="#f97316" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', color: '#7c2d12' }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing fields */}
            {analysis.missingFields?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Missing:</span>
                {analysis.missingFields.map((f, i) => (
                  <span key={i} style={{
                    padding: '3px 10px', borderRadius: '20px', background: '#f1f5f9',
                    border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem'
                  }}>
                    {f.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && !hasRun && (
        <div style={{ textAlign: 'center', padding: '32px', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
          <Brain size={32} color="#1a73e8" style={{ marginBottom: '8px' }} />
          <p style={{ color: '#64748b', margin: 0 }}>Click Re-analyze to get your AI profile strength score.</p>
        </div>
      )}
    </div>
  );
}
