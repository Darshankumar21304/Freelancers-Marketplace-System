const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  related_entity_id: { type: mongoose.Schema.Types.ObjectId, refPath: 'related_entity_model' },
  related_entity_model: { type: String, enum: ['Order', 'Contract', 'Payment'] },
  type: { type: String, enum: ['deposit', 'earning', 'withdrawal', 'payment', 'refund', 'escrow_hold', 'escrow_release', 'commission', 'escrow_fund'], required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true }, // Positive for earnings/deposits, negative for withdrawals/payments
  status: { type: String, enum: ['pending', 'completed', 'failed', 'escrow'], default: 'pending' },
  paymentMethod: { type: String, default: 'Razorpay / Wallet' },
  reference: { type: String }, // e.g., bank account info, UPI ID, or dispute ticket
  razorpayPaymentId: { type: String },
  razorpayOrderId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
