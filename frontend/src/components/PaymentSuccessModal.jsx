import React from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { formatINR } from '../utils/currency';
import './PaymentSuccessModal.css';

export default function PaymentSuccessModal({ isOpen, onClose, amount, txnId, paymentMethod = 'Razorpay UPI' }) {
  if (!isOpen) return null;

  return (
    <div className="gpay-success-overlay" onClick={onClose}>
      <div className="gpay-success-card animate-gpay-pop" onClick={(e) => e.stopPropagation()}>
        
        {/* Google Pay Style Animated Checkmark Circle */}
        <div className="gpay-circle-wrapper">
          <div className="gpay-ripple-ring ring-1"></div>
          <div className="gpay-ripple-ring ring-2"></div>
          <div className="gpay-circle-icon">
            <CheckCircle2 size={56} color="#ffffff" strokeWidth={2.5} />
          </div>
        </div>

        {/* Success Header */}
        <div className="gpay-status-badge">
          <Sparkles size={13} /> Payment Successful
        </div>

        <h2 className="gpay-amount-title">{formatINR(amount || 5000)}</h2>
        <p className="gpay-subtitle">Funds deposited & secured in Escrow Vault</p>

        {/* Transaction Summary Card */}
        <div className="gpay-receipt-card">
          <div className="gpay-receipt-row">
            <span>Transaction Reference</span>
            <strong>{txnId || `RZP-${Math.floor(10000000 + Math.random() * 90000000)}`}</strong>
          </div>
          <div className="gpay-receipt-row">
            <span>Payment Method</span>
            <strong>{paymentMethod}</strong>
          </div>
          <div className="gpay-receipt-row">
            <span>Security Guarantee</span>
            <span className="gpay-secure-text"><ShieldCheck size={14} /> 100% Escrow Protection</span>
          </div>
          <div className="gpay-receipt-row">
            <span>Date & Time</span>
            <strong>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' })}</strong>
          </div>
        </div>

        {/* Action Button */}
        <button onClick={onClose} className="gpay-done-btn">
          Done <ArrowRight size={16} />
        </button>

      </div>
    </div>
  );
}
