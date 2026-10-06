const express = require('express');
const router = express.Router();
const { Gig, User, FreelancerProfile } = require('../models');
const authenticateToken = require('../middleware/authMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');

// 1. Get all gigs (Public / Marketplace)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let filter = { isActive: true };

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const gigs = await Gig.find(filter)
      .populate('freelancer_id', 'name email avatar profilePhoto title rating numReviews location')
      .sort({ createdAt: -1 })
      .lean();

    res.json(gigs);
  } catch (error) {
    console.error('Error fetching gigs:', error);
    res.status(500).json({ message: 'Error fetching gigs' });
  }
});

// 2. Get freelancer's own gigs
router.get('/my-gigs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const gigs = await Gig.find({ freelancer_id: userId }).sort({ createdAt: -1 }).lean();
    res.json(gigs);
  } catch (error) {
    console.error('Error fetching my gigs:', error);
    res.status(500).json({ message: 'Error fetching my gigs' });
  }
});

// 3. Get single gig by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('freelancer_id', 'name email avatar profilePhoto title rating numReviews location bio')
      .lean();
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.json(gig);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gig' });
  }
});

// 4. Create new gig (Freelancer)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { title, description, price, category, deliveryDays, tags, images, packages } = req.body;

    const newGig = await Gig.create({
      freelancer_id: userId,
      title: title || 'Professional Service Gig',
      description: description || 'High-quality marketplace deliverable.',
      price: Number(price || 1500),
      category: category || 'Web Development',
      deliveryDays: Number(deliveryDays || 5),
      tags: Array.isArray(tags) ? tags : [],
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800'],
      packages: packages || {
        basic: { name: 'Basic', description: 'Standard deliverable', price: Number(price || 1500), deliveryDays: 5 }
      },
      isActive: true
    });

    res.status(201).json({ success: true, gig: newGig });
  } catch (error) {
    console.error('Error creating gig:', error);
    res.status(500).json({ message: 'Error creating gig' });
  }
});

module.exports = router;
