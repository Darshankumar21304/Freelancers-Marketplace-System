const mongoose = require('mongoose');

const trustReviewSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userRole: { type: String, enum: ['freelancer', 'client'], required: true },
  trustScore: { type: Number, required: true },
  fraudRiskScore: { type: Number, required: true },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], required: true },
  status: {
    type: String,
    enum: ['Flagged', 'Under Investigation', 'Confirmed Risk', 'Dismissed'],
    default: 'Flagged'
  },
  detectedSignals: [{
    type: { type: String },
    category: { type: String },
    severity: { type: String },
    confidence: { type: Number },
    riskImpact: { type: Number },
    evidence: { type: String }
  }],
  adminDecision: {
    type: String,
    enum: ['confirm_fraud', 'dismiss_false_positive', 'pending'],
    default: 'pending'
  },
  adminNotes: { type: String, default: '' },
  reviewedAt: { type: Date }
}, { timestamps: true });

trustReviewSchema.index({ user_id: 1, status: 1 });
trustReviewSchema.index({ riskLevel: 1, createdAt: -1 });

module.exports = mongoose.model('TrustReview', trustReviewSchema);
