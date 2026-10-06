const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: String, required: true },
  budgetType: { type: String, enum: ['Fixed Price', 'Hourly'], default: 'Fixed Price' },
  skills: [{ type: String }],
  category: { type: String },
  duration: { type: String },
  deadline: { type: String },
  experienceLevel: { type: String, enum: ['Beginner', 'Entry Level', 'Intermediate', 'Expert'], default: 'Intermediate' },
  status: { type: String, enum: ['Open', 'Active', 'In Progress', 'Submitted for Review', 'Revision Requested', 'Completed', 'Closed', 'Cancelled'], default: 'Open' },
  attachments: [mongoose.Schema.Types.Mixed],
  proposals: [{
    freelancer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    freelancer_name: { type: String },
    bidAmount: Number,
    coverLetter: String,
    deliveryTime: String,
    status: { type: String, enum: ['Pending', 'Shortlisted', 'Accepted', 'Hired', 'Rejected'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
