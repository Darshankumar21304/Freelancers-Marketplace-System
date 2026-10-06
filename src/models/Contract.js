const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Under Review', 'Completed'], default: 'Pending' },
  submissionMessage: { type: String, default: '' },
  submissionFiles: [{
    name: { type: String },
    url: { type: String },
    size: { type: String },
    type: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  submittedAt: { type: Date }
});

const contractSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }, // The original job posting
  title: { type: String, required: true },
  status: { type: String, enum: ['In Progress', 'Submitted for Review', 'Revision Requested', 'Completed', 'Cancelled'], default: 'In Progress' },
  totalValue: { type: Number, required: true },
  amountEarned: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  deadline: { type: Date, required: true },
  milestones: [milestoneSchema]
}, { timestamps: true });

// Virtual for progress calculation based on milestones
contractSchema.virtual('progress').get(function() {
  if (!this.milestones || this.milestones.length === 0) return 0;
  const completed = this.milestones.filter(m => m.status === 'Completed').length;
  return Math.round((completed / this.milestones.length) * 100);
});

module.exports = mongoose.model('Contract', contractSchema);
