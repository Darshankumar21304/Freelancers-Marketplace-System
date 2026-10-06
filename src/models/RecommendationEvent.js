const mongoose = require('mongoose');

const RecommendationEventSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  matchFactors: {
    skillMatchScore: Number,
    experienceScore: Number,
    ratingScore: Number,
    successScore: Number,
    relatedSkillsScore: Number,
    budgetScore: Number,
    availabilityScore: Number,
    learningScore: Number,
    matchedSkills: [String],
    relatedSkills: [String],
    confidence: String
  },
  shown: { type: Boolean, default: true },
  clicked: { type: Boolean, default: false },
  profileViewed: { type: Boolean, default: false },
  contacted: { type: Boolean, default: false },
  shortlisted: { type: Boolean, default: false },
  hired: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  rating: { type: Number, default: null },
  rejected: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('RecommendationEvent', RecommendationEventSchema);
