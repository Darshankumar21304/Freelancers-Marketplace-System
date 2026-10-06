const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  contract_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewer_role: { type: String, enum: ['client', 'freelancer'], default: 'client' },
  freelancer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  projectTitle: { type: String },
  response: {
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
