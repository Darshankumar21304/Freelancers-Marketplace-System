const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  senderRole: { type: String, required: true }, // 'Client', 'Freelancer', 'Admin', 'System Admin'
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const disputeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. DISP-101
  contract_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  projectTitle: { type: String, required: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  freelancer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  freelancerName: { type: String, required: true },
  freelancerEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  issue: { type: String, required: true },
  freelancerDefense: { type: String, default: 'Awaiting freelancer response.' },
  status: { 
    type: String, 
    enum: ['Open', 'Under Review', 'Resolved', 'Refunded Client', 'Released to Freelancer', 'Settled 50/50', 'Closed'],
    default: 'Open'
  },
  resolution: { type: String, default: null },
  adminReasoning: { type: String, default: null },
  aiRecommendation: {
    recommendedAction: { type: String },
    reasoning: { type: String },
    verdictSummary: { type: String }
  },
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
