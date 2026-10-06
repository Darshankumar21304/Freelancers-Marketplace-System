const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['client', 'freelancer', 'admin'], default: 'client' },
  isBlocked: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['verified', 'unverified', 'flagged', 'suspended'], default: 'unverified' },
  aiRiskScore: { type: Number, default: 10 },
  aiReason: { type: String, default: 'Automated AI security audit pending.' },
  aiAuditedAt: { type: Date },
  walletBalance: { type: Number, default: 0 },
  escrowBalance: { type: Number, default: 0 },
  bankDetails: {
    accountHolder: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },
    upiId: { type: String }
  },
  phone: { type: String },
  location: { type: String },
  language: { type: String, default: 'English' },
  avatar: { type: String },
  profilePhoto: { type: String },
  companyName: { type: String },
  industry: { type: String },
  companySize: { type: String },
  website: { type: String },
  companyDesc: { type: String },
  gstin: { type: String },
  state: { type: String },
  country: { type: String },
  kycStatus: { type: String, enum: ['Unverified', 'Pending Approval', 'Verified', 'Rejected', 'Action Required'], default: 'Unverified' },
  kycDocUrl: { type: String, default: null },
  kycDocType: { type: String, default: 'Aadhaar Card' },
  kycSubmittedAt: { type: Date },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      message: { type: Boolean, default: true },
      project: { type: Boolean, default: true },
      proposal: { type: Boolean, default: true },
      payment: { type: Boolean, default: true },
      review: { type: Boolean, default: true }
    },
    payment: {
      bankAccount: { type: String },
      upiId: { type: String },
      withdrawalPref: { type: String, default: 'Weekly' }
    },
    privacy: {
      profileVisibility: { type: String, default: 'Public' },
      onlineStatus: { type: Boolean, default: true },
      searchVisibility: { type: Boolean, default: true }
    },
    appearance: {
      theme: { type: String, default: 'system' }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
