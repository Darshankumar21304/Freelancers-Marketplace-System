const mongoose = require('mongoose');

const trustEventSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventType: {
    type: String,
    enum: [
      'profile_analyzed',
      'proposal_submitted',
      'proposal_accepted',
      'project_completed',
      'contract_cancelled',
      'dispute_opened',
      'dispute_resolved',
      'review_posted',
      'admin_fraud_confirmed',
      'admin_flag_dismissed'
    ],
    required: true
  },
  riskScore: { type: Number },
  trustScore: { type: Number },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

trustEventSchema.index({ user_id: 1, eventType: 1, createdAt: -1 });

module.exports = mongoose.model('TrustEvent', trustEventSchema);
