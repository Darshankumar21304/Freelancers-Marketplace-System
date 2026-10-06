import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Briefcase, CheckCircle, TrendingUp, FolderPlus, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { formatINR } from '../../utils/currency';
import { apiFetch } from '../../utils/api';
import './Dashboard.css';
import './ClientDashboard.css';

export default function ClientAnalytics() {
  const [analyticsData, setAnalyticsData] = useState({
    walletBalance: 0,
    escrowBalance: 0,
    totalSpent: 0,
    payments: [],
    chartData: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const [wallet, contractsRes] = await Promise.all([
          apiFetch('/wallet').catch(() => ({ walletBalance: 0, escrowBalance: 0, transactions: [] })),
          apiFetch('/contracts/active').catch(() => [])
        ]);
        
        let calculatedTotalSpent = 0;
        let dynamicEscrow = wallet.escrowBalance || 0;

        if (dynamicEscrow === 0 && Array.isArray(contractsRes)) {
          contractsRes.forEach(c => {
            if (c.milestones && Array.isArray(c.milestones)) {
              c.milestones.forEach(m => {
                if (m.status === 'In Progress' || m.status === 'Pending' || m.status === 'Under Review') {
                  dynamicEscrow += Number(m.amount || 0);
                }
              });
            } else if (c.totalValue) {
              dynamicEscrow += Number(c.totalValue || 0);
            }
          });
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = {};
        
        const currentMonthIdx = new Date().getMonth();
        for (let i = 5; i >= 0; i--) {
          const mIdx = (currentMonthIdx - i + 12) % 12;
          monthlyData[months[mIdx]] = { name: months[mIdx], projectSpending: 0, milestonePayments: 0 };
        }

        if (wallet.transactions && Array.isArray(wallet.transactions)) {
          wallet.transactions.forEach(t => {
            const date = new Date(t.createdAt);
            const mName = months[date.getMonth()];
            const amount = Math.abs(t.amount || 0);
            if (t.type === 'escrow_release' || t.type === 'deposit') {
              calculatedTotalSpent += amount;
            }
            if (monthlyData[mName]) {
              if (t.type === 'deposit') {
                monthlyData[mName].projectSpending += amount;
              } else if (t.type === 'escrow_fund' || t.type === 'escrow_release') {
                monthlyData[mName].milestonePayments += amount;
              }
            }
          });
        }

        setAnalyticsData({
          walletBalance: wallet.walletBalance || 0,
          escrowBalance: dynamicEscrow,
          totalSpent: calculatedTotalSpent,
          payments: wallet.transactions || [],
          chartData: Object.values(monthlyData)
        });
      } catch (err) {
        console.error('Error fetching analytics data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="client-dashboard-container">
      {/* Header */}
      <div className="overview-header" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.85rem', background: '#e8f0fe', color: '#1a73e8', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            <TrendingUp size={13} /> Financial Analytics & Spending Hub
          </div>
          <h1 className="overview-title">Client Analytics & Financial Report</h1>
          <p className="overview-subtitle">Track project spending, secured escrow deposits, and transaction history over time.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/client/dashboard/wallet" className="pill-btn pill-light" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem', borderRadius: '40px', background: '#1a73e8', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
            <CreditCard size={16} /> Manage Wallet Vault
          </Link>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid-responsive-3" style={{ marginBottom: '28px' }}>
        <div className="client-kpi-card">
          <div className="client-kpi-header">
            <span className="client-kpi-title">Total Project Investments</span>
            <div className="client-kpi-icon-wrapper" style={{ backgroundColor: '#e8f0fe' }}>
              <TrendingUp size={20} color="#1a73e8" />
            </div>
          </div>
          <p className="client-kpi-value">{formatINR(analyticsData.totalSpent)}</p>
          <p className="client-kpi-desc">Cumulative funds allocated across project milestones.</p>
        </div>

        <div className="client-kpi-card">
          <div className="client-kpi-header">
            <span className="client-kpi-title">Escrow Vault Protection</span>
            <div className="client-kpi-icon-wrapper" style={{ backgroundColor: '#dcfce7' }}>
              <ShieldCheck size={20} color="#10b981" />
            </div>
          </div>
          <p className="client-kpi-value">{formatINR(analyticsData.escrowBalance)}</p>
          <p className="client-kpi-desc">Secured funds locked in Escrow for active project milestones.</p>
        </div>

        <div className="client-kpi-card">
          <div className="client-kpi-header">
            <span className="client-kpi-title">Available Wallet Balance</span>
            <div className="client-kpi-icon-wrapper" style={{ backgroundColor: '#f3e8fd' }}>
              <CreditCard size={20} color="#a142f4" />
            </div>
          </div>
          <p className="client-kpi-value">{formatINR(analyticsData.walletBalance)}</p>
          <p className="client-kpi-desc">Liquid balance ready for immediate milestone funding.</p>
        </div>
      </div>

      {/* Spending Analytics Chart */}
      <div className="dashboard-panel" style={{ marginBottom: '28px', background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="panel-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Monthly Escrow & Spending Analytics</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
              Visual breakdown of monthly project spending vs milestone payouts.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1a73e8', fontWeight: '700' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#1a73e8', display: 'inline-block' }}></span>
              Project Spending
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: '700' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
              Milestone Payments
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: '320px', minWidth: 0 }}>
          {analyticsData.chartData.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px dashed #cbd5e1', borderRadius: '16px', background: '#f8fafc', color: '#64748b' }}>
              <TrendingUp size={36} color="#1a73e8" style={{ marginBottom: '8px' }} />
              <h4 style={{ margin: '0 0 4px', color: '#0f172a', fontWeight: 800 }}>No Analytics Data Recorded</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Analytics will generate automatically once you post a project and fund milestone escrow.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#1a73e8" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorMilestones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => formatINR(val)} />
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                <Tooltip 
                  formatter={(value, name) => [
                    formatINR(value), 
                    name === 'projectSpending' ? 'Monthly Project Spending' : 'Milestone Payments'
                  ]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }} 
                />
                <Area type="monotone" dataKey="projectSpending" stroke="#1a73e8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpending)" />
                <Area type="monotone" dataKey="milestonePayments" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMilestones)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Transaction Audit Log */}
      <div className="recent-payments-section" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '24px' }}>
        <div className="recent-payments-header" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="recent-payments-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Transaction & Escrow Audit Logs</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
              Complete statement of deposit transactions, escrow funding, and released freelancer milestone payouts.
            </p>
          </div>
        </div>

        <div className="payments-table-container responsive-table-wrapper">
          {analyticsData.payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '16px', background: '#f8fafc' }}>
              <FolderPlus size={38} color="#1a73e8" style={{ marginBottom: '10px' }} />
              <h4 style={{ margin: '0 0 6px', color: '#0f172a', fontWeight: 800, fontSize: '1.05rem' }}>No Transactions Recorded</h4>
              <p style={{ margin: '0 0 16px', fontSize: '0.875rem' }}>Deposit funds into your Escrow Vault to view transaction history.</p>
            </div>
          ) : (
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Transaction Details</th>
                  <th>Type</th>
                  <th>Reference / Method</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.payments.map((pay) => (
                  <tr key={pay._id || pay.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: pay.type === 'deposit' ? '#e2fbe8' : pay.type === 'withdrawal' ? '#ffebe8' : '#e8f0fe',
                          color: pay.type === 'deposit' ? '#15803d' : pay.type === 'withdrawal' ? '#d92727' : '#1a73e8',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          {pay.type === 'deposit' ? <ArrowDownLeft size={16} /> : pay.type === 'withdrawal' ? <ArrowUpRight size={16} /> : <Briefcase size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{pay.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ref: {pay.razorpayPaymentId || pay.razorpayOrderId || pay._id || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: '700', color: '#475569', fontSize: '0.825rem', textTransform: 'capitalize' }}>{pay.type || 'payment'}</td>
                    <td style={{ color: '#64748b', fontSize: '0.825rem' }}>{pay.paymentMethod || 'Wallet Transfer'}</td>
                    <td style={{ 
                      fontWeight: '800', 
                      fontSize: '0.85rem',
                      color: pay.amount > 0 ? '#10b981' : '#f87171' 
                    }}>
                      {pay.amount > 0 ? '+' : ''}{formatINR(pay.amount)}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.825rem' }}>
                      {new Date(pay.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 800, 
                        padding: '3px 8px', 
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        background: pay.status === 'completed' ? '#dcfce7' : pay.status === 'pending' ? '#fef3c7' : '#f1f5f9',
                        color: pay.status === 'completed' ? '#15803d' : pay.status === 'pending' ? '#b45309' : '#64748b'
                      }}>
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
