import React, { useState, useEffect } from 'react';
import { 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  IndianRupee, 
  Briefcase, 
  Clock, 
  PlusCircle, 
  Building2, 
  CreditCard, 
  Zap, 
  Check, 
  X, 
  RefreshCw, 
  ShieldCheck 
} from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { apiFetch } from '../../utils/api';
import './Wallet.css';

export default function Wallet() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [bankDetails, setBankDetails] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  // Deposit State
  const [depositAmount, setDepositAmount] = useState(5000);
  const [depositing, setDepositing] = useState(false);

  // Withdraw State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('UPI');
  const [withdrawing, setWithdrawing] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  // Bank Details Form State
  const [bankForm, setBankForm] = useState({
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: ''
  });
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/wallet');
      setWalletBalance(data.walletBalance || 0);
      setEscrowBalance(data.escrowBalance || 0);
      setBankDetails(data.bankDetails || {});
      setUpiId(data.bankDetails?.upiId || '');
      setAccountHolder(data.bankDetails?.accountHolder || '');
      setAccountNumber(data.bankDetails?.accountNumber || '');
      setIfscCode(data.bankDetails?.ifscCode || '');
      setBankName(data.bankDetails?.bankName || '');
      setBankForm({
        accountHolder: data.bankDetails?.accountHolder || '',
        accountNumber: data.bankDetails?.accountNumber || '',
        ifscCode: data.bankDetails?.ifscCode || '',
        bankName: data.bankDetails?.bankName || '',
        upiId: data.bankDetails?.upiId || ''
      });
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositAmount || depositAmount <= 0) return;

    setDepositing(true);
    try {
      // 1. Create Deposit Order
      const orderRes = await apiFetch('/wallet/deposit/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(depositAmount), paymentMethod: 'Razorpay UPI/Card' })
      });

      const options = {
        key: orderRes.keyId || 'rzp_test_TV9lK03aYfyyEi',
        amount: orderRes.amount * 100, // in paise
        currency: 'INR',
        name: 'GigSphere Marketplace',
        description: `Wallet Balance Deposit ₹${orderRes.amount}`,
        order_id: orderRes.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await apiFetch('/wallet/deposit/verify', {
              method: 'POST',
              body: JSON.stringify({
                transactionId: orderRes.transactionId,
                razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                razorpayOrderId: response.razorpay_order_id || orderRes.orderId,
                razorpaySignature: response.razorpay_signature,
                amount: orderRes.amount
              })
            });
            setMsg(verifyRes.message);
            setTimeout(() => setMsg(null), 4000);
            setShowDepositModal(false);
            fetchWalletData();
          } catch (err) {
            alert(err.message || 'Payment verification failed');
          } finally {
            setDepositing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setDepositing(false);
          }
        },
        prefill: {
          name: bankForm.accountHolder || 'Client Account',
          email: 'user@gigsphere.com',
          contact: '9876543210'
        },
        theme: {
          color: '#1a73e8'
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          alert('Payment Failed: ' + (response.error?.description || 'Transaction cancelled'));
          setDepositing(false);
        });
        rzp.open();
      } else {
        // Direct sandbox fallback
        const verifyRes = await apiFetch('/wallet/deposit/verify', {
          method: 'POST',
          body: JSON.stringify({
            transactionId: orderRes.transactionId,
            razorpayPaymentId: `pay_${Date.now()}`,
            razorpayOrderId: orderRes.orderId,
            amount: orderRes.amount
          })
        });
        setMsg(verifyRes.message);
        setTimeout(() => setMsg(null), 4000);
        setShowDepositModal(false);
        fetchWalletData();
        setDepositing(false);
      }
    } catch (err) {
      alert(err.message || 'Deposit failed');
      setDepositing(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0 || amount > walletBalance) {
      alert(`Invalid amount. Max available: ${formatINR(walletBalance)}`);
      return;
    }

    setWithdrawing(true);
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

      setMsg(res.message);
      setTimeout(() => setMsg(null), 4000);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchWalletData();
    } catch (err) {
      alert(err.message || 'Withdrawal request failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setSavingBank(true);

    try {
      const res = await apiFetch('/wallet/bank-details', {
        method: 'POST',
        body: JSON.stringify(bankForm)
      });

      setMsg(res.message);
      setTimeout(() => setMsg(null), 4000);
      setBankDetails(res.bankDetails);
      setShowBankModal(false);
    } catch (err) {
      alert(err.message || 'Saving bank details failed');
    } finally {
      setSavingBank(false);
    }
  };

  return (
    <div className="wallet-page animate-fade-in-up">
      <div className="wallet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="wallet-title">Wallet & Financial Management</h1>
          <p className="wallet-subtitle">Razorpay payment gateway deposits, protected escrow vaults, and payout withdrawals.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowBankModal(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={16} /> Bank & UPI Setup
          </button>
          <button onClick={() => setShowDepositModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PlusCircle size={16} /> Add Funds (Razorpay)
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* Balances Grid */}
      <div className="wallet-balances">
        <div className="balance-card hover-lift" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff' }}>
          <div className="balance-label" style={{ color: '#94a3b8' }}><IndianRupee size={16} /> Available Wallet Balance</div>
          <div className="balance-amount" style={{ color: '#ffffff' }}>{isLoading ? '...' : formatINR(walletBalance)}</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button 
              className="btn" 
              onClick={() => {
                setUpiId(bankDetails?.upiId || '');
                setAccountHolder(bankDetails?.accountHolder || '');
                setAccountNumber(bankDetails?.accountNumber || '');
                setIfscCode(bankDetails?.ifscCode || '');
                setBankName(bankDetails?.bankName || '');
                setShowWithdrawModal(true);
              }}
              disabled={walletBalance <= 0}
              style={{ backgroundColor: '#4f46e5', color: 'white', flexGrow: 1, border: 'none' }}
            >
              Withdraw Earnings
            </button>
            <button 
              className="btn" 
              onClick={() => setShowDepositModal(true)}
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', flexGrow: 1, border: 'none' }}
            >
              + Deposit
            </button>
          </div>
        </div>
        
        <div className="balance-card light hover-lift">
          <div className="balance-label"><Briefcase size={16} /> Protected Escrow Balance</div>
          <div className="balance-amount">{isLoading ? '...' : formatINR(escrowBalance)}</div>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Secured in milestone contract vault</p>
        </div>

        <div className="balance-card light hover-lift">
          <div className="balance-label"><Building2 size={16} /> Saved Payout Destination</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0.5rem 0' }}>
            {bankDetails.upiId ? `UPI: ${bankDetails.upiId}` : bankDetails.accountNumber ? `${bankDetails.bankName || 'Bank'} A/C ...${bankDetails.accountNumber.slice(-4)}` : 'Not Configured'}
          </div>
          <button onClick={() => setShowBankModal(true)} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
            Configure Bank & UPI &rarr;
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transaction-history" style={{ marginTop: '2rem' }}>
        <div className="history-header">
          <h2 className="history-title">Financial Transaction History</h2>
          <button onClick={fetchWalletData} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={12} className={isLoading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        <div className="history-list">
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No recent financial transactions logged.</div>
          ) : (
            transactions.map(tx => {
              const isPositive = tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'refund' || tx.type === 'escrow_release';

              return (
                <div key={tx._id} className="history-item">
                  <div className="history-info">
                    <div className={`history-icon ${isPositive ? 'earning' : 'withdrawal'}`}>
                      {isPositive ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div className="history-details">
                      <h4>{tx.title}</h4>
                      <p>{new Date(tx.createdAt).toLocaleDateString()} • {tx.paymentMethod} • <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{tx.status}</span></p>
                    </div>
                  </div>
                  <div className={`history-amount ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '+' : ''}{formatINR(tx.amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Razorpay Deposit Modal Popup */}
      {showDepositModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 99999, padding: '1rem', paddingTop: '3.5rem', overflowY: 'auto' }} onClick={() => setShowDepositModal(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '460px', width: '100%', padding: '1.75rem', color: '#0f172a', margin: '0 auto' }} onClick={(e) => e.stopPropagation()}>
            
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
              <button onClick={() => setShowDepositModal(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justify: 'center', color: '#64748b', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textAlign: 'left' }}>Deposit Amount (INR)</label>
                <input 
                  type="number" 
                  value={depositAmount} 
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  min="100"
                  required 
                />
              </div>

              {/* Quick Preset Chips */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[1000, 5000, 10000, 25000].map(val => (
                  <button 
                    key={val} 
                    type="button" 
                    onClick={() => setDepositAmount(val)} 
                    style={{ fontSize: '0.775rem', padding: '0.4rem 0.8rem', flex: 1, fontWeight: 700, borderRadius: '30px', border: depositAmount === val ? '1px solid #1a73e8' : '1px solid #cbd5e1', background: depositAmount === val ? '#e8f0fe' : '#f8fafc', color: depositAmount === val ? '#1a73e8' : '#334155', cursor: 'pointer', transition: 'all 0.15s ease' }}
                  >
                    +₹{val.toLocaleString()}
                  </button>
                ))}
              </div>

              <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.8rem', color: '#475569', textAlign: 'left' }}>
                <ShieldCheck size={16} color="#10b981" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Instant Escrow Deposit via <strong>Razorpay Gateway</strong> (UPI, Credit/Debit Card, NetBanking).
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowDepositModal(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '40px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={depositing} style={{ padding: '0.65rem 1.5rem', borderRadius: '40px', background: '#1a73e8', border: '1px solid #1a73e8', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {depositing ? <RefreshCw size={14} className="spin" /> : <Zap size={14} />}
                  {depositing ? 'Connecting Razorpay...' : `Pay ${formatINR(depositAmount)} via Razorpay`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Freelancer Payout Withdrawal Modal */}
      {showWithdrawModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 99999, padding: '1rem', paddingTop: '3.5rem', overflowY: 'auto' }} onClick={() => setShowWithdrawModal(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '460px', width: '100%', padding: '1.75rem', color: '#0f172a', margin: '0 auto' }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justify: 'center' }}>
                  <Building2 size={20} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Withdraw Earnings</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Instant UPI & Bank Payout</span>
                </div>
              </div>
              <button onClick={() => setShowWithdrawModal(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justify: 'center', color: '#64748b', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', color: '#475569', textAlign: 'left' }}>
                Available Balance: <strong style={{ color: '#0f172a', fontWeight: 800 }}>{formatINR(walletBalance)}</strong>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textAlign: 'left' }}>Withdrawal Amount (INR)</label>
                <input 
                  type="number" 
                  value={withdrawAmount} 
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Max: ${walletBalance}`}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  max={walletBalance}
                  min="100"
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textAlign: 'left' }}>Payout Destination</label>
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

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowWithdrawModal(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '40px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={withdrawing} style={{ padding: '0.65rem 1.5rem', borderRadius: '40px', background: '#0f172a', border: '1px solid #0f172a', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {withdrawing ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
                  {withdrawing ? 'Submitting Request...' : 'Submit Withdrawal Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank & UPI Details Modal */}
      {showBankModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 99999, padding: '1rem', paddingTop: '3.5rem', overflowY: 'auto' }} onClick={() => setShowBankModal(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '480px', width: '100%', padding: '1.75rem', color: '#0f172a', margin: '0 auto' }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justify: 'center' }}>
                  <Building2 size={20} color="#1a73e8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Bank & UPI Setup</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Saved Payout Details</span>
                </div>
              </div>
              <button onClick={() => setShowBankModal(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justify: 'center', color: '#64748b', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBankSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Account Holder Name</label>
                <input 
                  type="text" 
                  value={bankForm.accountHolder}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Full Legal Account Holder Name"
                  required 
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>UPI ID (Instant Payouts)</label>
                <input 
                  type="text" 
                  value={bankForm.upiId}
                  onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="e.g. name@okicici or mobile@upi"
                />
              </div>

              <div className="grid-responsive-2" style={{ gap: '0.75rem', textAlign: 'left' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Bank Name</label>
                  <input 
                    type="text" 
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="e.g. HDFC Bank"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>IFSC Code</label>
                  <input 
                    type="text" 
                    value={bankForm.ifscCode}
                    onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="e.g. HDFC0001234"
                  />
                </div>
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Bank Account Number</label>
                <input 
                  type="text" 
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Account Number"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowBankModal(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '40px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={savingBank} style={{ padding: '0.65rem 1.5rem', borderRadius: '40px', background: '#0f172a', border: '1px solid #0f172a', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {savingBank ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
                  {savingBank ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
