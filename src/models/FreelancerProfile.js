const mongoose = require('mongoose');

const portfolioItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'Web Development' },
  skills: [{ type: String }],
  link: { type: String, default: '' },
  url: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  completionDate: { type: String, default: '' },
  clientName: { type: String, default: '' }
}, { _id: true });

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: { type: String, default: '' },
  issueDate: { type: String, default: '' },
  credentialUrl: { type: String, default: '' },
  docUrl: { type: String, default: '' }
}, { _id: true });

const workExperienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  role: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  isCurrent: { type: Boolean, default: false },
  description: { type: String, default: '' }
}, { _id: true });

const freelancerProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  category: { type: String, default: 'Web Development' },
  experience: { type: String, default: 'Entry Level' },
  availability: { type: String, default: 'Full-time (40 hrs/week)' },
  hourlyRate: { type: Number, default: 0 },
  languages: [{ type: String }],
  portfolioItems: [portfolioItemSchema],
  certifications: [certificationSchema],
  workExperience: [workExperienceSchema],
  profileCompletion: { type: Number, default: 0 },
  linkedinUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  websiteUrl: { type: String, default: '' },
  totalEarnings: { type: Number, default: 0 },
  completedProjects: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },
  numReviews: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-calculate profileCompletion before saving
freelancerProfileSchema.pre('save', function() {
  let score = 0;
  if (this.title && this.title.trim()) score += 20;
  if (this.bio && this.bio.trim()) score += 20;
  if (this.skills && this.skills.length > 0) score += 20;
  if (this.experience || this.availability) score += 10;
  if (this.portfolioItems && this.portfolioItems.length > 0) score += 10;
  if (this.certifications && this.certifications.length > 0) score += 10;
  if (this.workExperience && this.workExperience.length > 0) score += 10;
  this.profileCompletion = Math.min(score, 100);
});

module.exports = mongoose.model('FreelancerProfile', freelancerProfileSchema);
