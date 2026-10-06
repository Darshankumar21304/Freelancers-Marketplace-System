const mongoose = require('mongoose');

const pitchSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  message: { type: String, required: true },
  offeredBudget: { type: String },
  status: {
    type: String,
    enum: ['Pending', 'Bid Submitted', 'Accepted', 'Declined'],
    default: 'Pending'
  },
  bidDetails: {
    bidAmount: Number,
    deliveryTime: String,
    coverLetter: String,
    submittedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Pitch', pitchSchema);
