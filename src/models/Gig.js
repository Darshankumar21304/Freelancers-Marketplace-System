const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: { type: String, default: 'Basic' },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  deliveryDays: { type: Number, default: 7 },
  revisions: { type: Number, default: 1 },
  features: [{ type: String }]
}, { _id: false });

const gigSchema = new mongoose.Schema({
  freelancer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'General' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  packages: {
    basic: { type: packageSchema },
    standard: { type: packageSchema },
    premium: { type: packageSchema }
  },
  requirements: { type: String, default: '' },
  images: [{ type: String }],
  tags: [{ type: String }],
  deliveryDays: { type: Number, default: 7 },
  isActive: { type: Boolean, default: true },
  totalOrders: { type: Number, default: 0 },
  rating: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Gig', gigSchema);
