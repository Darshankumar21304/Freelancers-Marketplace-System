import React, { useState, useEffect } from 'react';
import { 
  Download, Plus, CheckCircle, Clock, Calendar, 
  CreditCard, ShieldCheck, Search, Filter, FileText, 
  CheckSquare, Sparkles, FolderPlus, ArrowUpRight, X,
  Building2, ArrowDownLeft
} from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { apiFetch } from '../../utils/api';
import { getUserProfile } from '../../utils/authUtils';
import PaymentSuccessModal from '../../components/PaymentSuccessModal';
import './Dashboard.css';
import './ClientDashboard.css';

export default function ClientSpending() {
  const [filter, setFilter] = useState('All Payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentsList, setPaymentsList] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(0);

  // Deposit modal state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(5000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [msg, setMsg] = useState(null);

  // Withdraw modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('UPI');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  // GPay Style Payment Success Modal State
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    amount: 0,
    txnId: ''
  });

  const userProfile = getUserProfile();

  useEffect(() => {
    fetchPaymentsAndWallet();
  }, []);

  const fetchPaymentsAndWallet = async () => {
    try {
      const data = await apiFetch('/wallet');
      setWalletBalance(data.walletBalance || 0);
      setEscrowBalance(data.escrowBalance || 0);
      setUpiId(data.bankDetails?.upiId || '');
      setAccountHolder(data.bankDetails?.accountHolder || '');
      setAccountNumber(data.bankDetails?.accountNumber || '');
      setIfscCode(data.bankDetails?.ifscCode || '');
      setBankName(data.bankDetails?.bankName || '');
      setPaymentsList(data.transactions || []);
    } catch (err) {
      console.error('Failed to load wallet/payments:', err);
      setPaymentsList([]);
    }
  };

  // Official Razorpay Checkout integration
  const handleRazorpayDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || depositAmount <= 0) return;

    setIsProcessing(true);
    setMsg(null);

    try {
      // Create Razorpay Order via Backend API
      const orderRes = await apiFetch('/wallet/deposit/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(depositAmount), paymentMethod: 'Razorpay UPI/Card' })
      });

      const options = {
        key: orderRes.keyId || 'rzp_test_TV9lK03aYfyyEi',
        amount: orderRes.amount * 100, // Amount in paise
        currency: 'INR',
        name: 'GigSphere Marketplace Escrow',
        description: `Wallet Deposit ₹${orderRes.amount}`,
        handler: async function (response) {
          try {
            const verifyRes = await apiFetch('/wallet/deposit/verify', {
              method: 'POST',
              body: JSON.stringify({
                transactionId: orderRes.transactionId,
                razorpay_order_id: response.razorpay_order_id || orderRes.orderId,
                razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                amount: Number(depositAmount)
              })
            });

            setWalletBalance(verifyRes.walletBalance || (walletBalance + Number(depositAmount)));
            setIsDepositModalOpen(false);
            
            // Trigger GPay Style Payment Success Modal!
            setSuccessModal({
              isOpen: true,
              amount: Number(depositAmount),
              txnId: response.razorpay_payment_id || `RZP-${Date.now()}`
            });

            fetchPaymentsAndWallet();
          } catch (err) {
            setMsg(err.message || 'Payment verification failed');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: userProfile?.name || 'Client',
          email: userProfile?.email || 'client@gigsphere.com'
        },
        theme: {
          color: '#1a73e8'
        }
      };

      if (window.Razorpay) {
        const rzp1 = new window.Razorpay(options);
        rzp1.open();
      } else {
        // Direct sandbox fallback with GPay success modal
        const verifyRes = await apiFetch('/wallet/deposit/verify', {
          method: 'POST',
          body: JSON.stringify({
            transactionId: orderRes.transactionId,
            razorpayPaymentId: `pay_${Date.now()}`,
            razorpayOrderId: orderRes.orderId
          })
        });

        setWalletBalance(verifyRes.walletBalance || (walletBalance + Number(depositAmount)));
        setIsDepositModalOpen(false);
        setSuccessModal({
          isOpen: true,
          amount: Number(depositAmount),
          txnId: `RZP-${Date.now()}`
        });
        fetchPaymentsAndWallet();
        setIsProcessing(false);
      }
    } catch (err) {
      setMsg(err.message || 'Failed to initiate Razorpay transaction.');
      setIsProcessing(false);
    }
  };

  // Withdraw Handler with Minimum ₹500 Balance Enforcement
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);

    if (walletBalance < 500) {
      alert('Minimum wallet balance of ₹500 is required for withdrawals.');
      return;
    }

    if (!amount || amount < 500 || amount > walletBalance) {
      alert(`Invalid withdrawal amount. Minimum: ₹500 | Available: ${formatINR(walletBalance)}`);
      return;
    }

    setIsWithdrawing(true);
    setMsg(null);

    try {
      const res = await apiFetch('/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ 
          amount, 
          payoutMethod: withdrawMethod,
          upiId,
          accountHolder,
          accountNumber,
          ifscCode,
          bankName
        })
      });

      setMsg(res.message || `Withdrawal request for ₹${amount.toLocaleString()} submitted successfully!`);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      fetchPaymentsAndWallet();
    } catch (err) {
      alert(err.message || 'Withdrawal request failed');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const filteredPayments = paymentsList.filter(p => {
    const matchesFilter = filter === 'All Payments' || 
      (filter === 'Released' && p.status === 'Released') ||
      (filter === 'Pending Approval' && p.status === 'Pending Approval') ||
      (filter === 'Escrow Funded' && p.status === 'Escrow Funded');
    
    const description = p.description || p.freelancer || p.project || p.title || '';
    const matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="client-dashboard-container">
      {/* Header */}
      <div className="overview-header">
        <div>
          <h1 className="overview-title">Spending & Escrow Analytics</h1>
          <p className="overview-subtitle">Manage project investments, release milestone payments, and withdraw funds.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setIsWithdrawModalOpen(true)} className="pill-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.65rem 1.4rem', borderRadius: '40px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: 700, cursor: 'pointer' }}>
            <ArrowDownLeft size={18} color="#10b981" /> Withdraw Funds
          </button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.65rem 1.4rem', borderRadius: '40px', background: '#0f172a', color: '#fff', border: '1px solid #0f172a', fontWeight: 700, cursor: 'pointer' }} onClick={() => { setIsDepositModalOpen(true); setMsg(null); }}>
            <Plus size={18} /> Deposit with Razorpay
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600, textAlign: 'left' }}>
          {msg}
        </div>
      )}

      {/* Payment Status Summary Cards */}
      <div className="payment-status-grid">
        <div className="payment-status-card released">
          <div className="payment-status-icon" style={{ backgroundColor: '#dcfce7', color: '#10b981' }}>
            <CreditCard size={24} />
          </div>
          <div className="payment-status-content">
            <span className="payment-status-label">Available Wallet Balance</span>
            <span className="payment-status-value">{formatINR(walletBalance)}</span>
            <span className="payment-status-sub">Ready for instant project milestone escrow</span>
          </div>
        </div>

        <div className="payment-status-card pending">
          <div className="payment-status-icon" style={{ backgroundColor: '#e8f0fe', color: '#1a73e8' }}>
            <ShieldCheck size={24} />
          </div>
          <div className="payment-status-content">
            <span className="payment-status-label">Escrow Vault Locked</span>
            <span className="payment-status-value">{formatINR(escrowBalance)}</span>
            <span className="payment-status-sub">Secured funds locked in active milestones</span>
          </div>
        </div>

        <div className="payment-status-card upcoming">
          <div className="payment-status-icon" style={{ backgroundColor: '#f3e8fd', color: '#a142f4' }}>
            <CheckCircle size={24} />
          </div>
          <div className="payment-status-content">
            <span className="payment-status-label">Total Transactions</span>
            <span className="payment-status-value">{paymentsList.length}</span>
            <span className="payment-status-sub">Razorpay deposits and milestone releases</span>
          </div>
        </div>
      </div>

      {/* Recent Payments Section */}
      <div className="recent-payments-section">
        <div className="recent-payments-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="recent-payments-title">Transaction History</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
              Real-time breakdown of Razorpay wallet deposits, escrow locks, and milestone releases.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px 8px 36px', border: '1px solid #cbd5e1', borderRadius: '30px', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>

            <select 
              className="date-filter" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All Payments">All Payments</option>
              <option value="Released">Released</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Escrow Funded">Escrow Funded</option>
            </select>
          </div>
        </div>

        <div className="payments-table-container">
          {filteredPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '16px', background: '#f8fafc' }}>
              <FolderPlus size={38} color="#1a73e8" style={{ marginBottom: '10px' }} />
              <h4 style={{ margin: '0 0 6px', color: '#0f172a', fontWeight: 800, fontSize: '1.05rem' }}>No Transactions Found</h4>
              <p style={{ margin: '0 0 16px', fontSize: '0.875rem' }}>Click "Deposit with Razorpay" to add funds to your wallet.</p>
              <button 
                onClick={() => setIsDepositModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem', borderRadius: '40px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <Plus size={15} /> Add Funds via Razorpay
              </button>
            </div>
          ) : (
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Description</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((pay, index) => {
                  const txnId = pay.razorpayPaymentId ? `RZP-${String(pay.razorpayPaymentId).slice(-8).toUpperCase()}` : `TXN-${String(pay._id || index + 101).slice(-6).toUpperCase()}`;
                  const isCompleted = pay.status === 'completed' || pay.status === 'Released';
                  const isPositive = pay.amount > 0;
                  return (
                    <tr key={pay._id || pay.id || index}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{txnId}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{pay.title || pay.description || pay.milestone || 'Wallet Deposit'}</td>
                      <td style={{ color: '#64748b' }}>{pay.paymentMethod || pay.payment_method || 'Razorpay Gateway'}</td>
                      <td className="payment-amount" style={{ color: isPositive ? '#10b981' : '#dc2626', fontWeight: 800 }}>
                        {isPositive ? '+' : ''}{formatINR(pay.amount)}
                      </td>
                      <td style={{ color: '#64748b' }}>{new Date(pay.createdAt || pay.created_at || Date.now()).toLocaleDateString()}</td>
                      <td>
                        <span className={`payment-status-badge ${isCompleted ? 'released' : pay.status === 'pending' ? 'pending' : 'revoked'}`}>
                          <CheckCircle size={14} /> {pay.status === 'completed' ? 'Completed' : pay.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Official Razorpay Deposit Modal Popup */}
      {isDepositModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justify: 'center', zIndex: 99999, padding: '1rem' }} onClick={() => setIsDepositModalOpen(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '460px', width: '100%', padding: '1.75rem', color: '#0f172a', margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justify: 'center' }}>
                  <CreditCard size={20} color="#1a73e8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Deposit Funds</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Razorpay Official Gateway</span>
                </div>
              </div>
              <button onClick={() => setIsDepositModalOpen(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justify: 'center', color: '#64748b', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRazorpayDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textAlign: 'left' }}>Deposit Amount (INR)</label>
                <input 
                  type="number" 
                  required 
                  min="100"
                  max="500000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[1000, 5000, 10000, 25000].map(amt => (
                  <button 
                    key={amt} 
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    style={{ fontSize: '0.775rem', padding: '0.4rem 0.8rem', flex: 1, fontWeight: 700, borderRadius: '30px', border: Number(depositAmount) === amt ? '1px solid #1a73e8' : '1px solid #cbd5e1', background: Number(depositAmount) === amt ? '#e8f0fe' : '#f8fafc', color: Number(depositAmount) === amt ? '#1a73e8' : '#334155', cursor: 'pointer', transition: 'all 0.15s ease' }}
                  >
                    +₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.8rem', color: '#475569', textAlign: 'left' }}>
                <ShieldCheck size={16} color="#10b981" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Instant Escrow Deposit via <strong>Razorpay Gateway</strong> (UPI, Credit/Debit Card, NetBanking).
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsDepositModalOpen(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '40px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isProcessing} style={{ padding: '0.65rem 1.5rem', borderRadius: '40px', background: '#1a73e8', border: '1px solid #1a73e8', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {isProcessing ? 'Connecting Razorpay...' : `Pay ₹${Number(depositAmount).toLocaleString()} via Razorpay`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal Popup (Min ₹500 Requirement) */}
      {isWithdrawModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justify: 'center', zIndex: 99999, padding: '1rem' }} onClick={() => setIsWithdrawModalOpen(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '460px', width: '100%', padding: '1.75rem', color: '#0f172a', margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justify: 'center' }}>
                  <Building2 size={20} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Withdraw Funds</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Instant UPI & Bank Payout</span>
                </div>
              </div>
              <button onClick={() => setIsWithdrawModalOpen(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justify: 'center', color: '#64748b', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', color: '#475569', textAlign: 'left' }}>
                Available Balance: <strong style={{ color: '#0f172a', fontWeight: 800 }}>{formatINR(walletBalance)}</strong>
              </div>

              {walletBalance < 500 ? (
                <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '10px', fontSize: '0.825rem', fontWeight: 700, textAlign: 'left' }}>
                  ⚠️ Minimum wallet balance of ₹500 is required to request payout withdrawals. Please deposit additional funds or wait for milestone payout release.
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textAlign: 'left' }}>Withdrawal Amount (Min ₹500)</label>
                    <input 
                      type="number" 
                      min="500"
                      max={walletBalance}
                      value={withdrawAmount} 
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder={`Min ₹500 - Max ${formatINR(walletBalance)}`}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                      required 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textAlign: 'left' }}>Payout Method</label>
                    <select 
                      value={withdrawMethod}
                      onChange={(e) => setWithdrawMethod(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff', cursor: 'pointer' }}
                    >
                      <option value="UPI">UPI Instant Payout</option>
                      <option value="Bank Transfer">Direct Bank Transfer</option>
                    </select>
                  </div>

                  {withdrawMethod === 'UPI' ? (
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textAlign: 'left' }}>UPI ID for Payout <span style={{ color: '#dc2626' }}>*</span></label>
                      <input 
                        type="text" 
                        value={upiId} 
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. name@upi"
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                        required 
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textAlign: 'left' }}>Account Holder Name <span style={{ color: '#dc2626' }}>*</span></label>
                        <input 
                          type="text" 
                          value={accountHolder} 
                          onChange={(e) => setAccountHolder(e.target.value)}
                          placeholder="e.g. John Doe"
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                          required 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textAlign: 'left' }}>Bank Name <span style={{ color: '#dc2626' }}>*</span></label>
                        <input 
                          type="text" 
                          value={bankName} 
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. HDFC Bank"
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                          required 
                        />
                      </div>
                      <div className="grid-responsive-2" style={{ gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textAlign: 'left' }}>Account Number <span style={{ color: '#dc2626' }}>*</span></label>
                          <input 
                            type="text" 
                            value={accountNumber} 
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="e.g. 1234567890"
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                            required 
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textAlign: 'left' }}>IFSC Code <span style={{ color: '#dc2626' }}>*</span></label>
                          <input 
                            type="text" 
                            value={ifscCode} 
                            onChange={(e) => setIfscCode(e.target.value)}
                            placeholder="e.g. HDFC0000123"
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                            required 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsWithdrawModalOpen(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '40px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                {walletBalance >= 500 && (
                  <button type="submit" disabled={isWithdrawing} style={{ padding: '0.65rem 1.5rem', borderRadius: '40px', background: '#0f172a', border: '1px solid #0f172a', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                    {isWithdrawing ? 'Submitting...' : 'Submit Withdrawal Request'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Pay Style Payment Success Modal Popup */}
      <PaymentSuccessModal 
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        amount={successModal.amount}
        txnId={successModal.txnId}
        paymentMethod="Razorpay Gateway (UPI / NetBanking)"
      />
    </div>
  );
}
