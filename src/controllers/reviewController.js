const { Review, Contract, Project, User, FreelancerProfile } = require('../models');
const { createNotification } = require('./notificationController');

// Helper to recalculate user rating & review count
const updateUserRatingStats = async (userId, role = 'freelancer') => {
  try {
    const reviews = await Review.find({
      $or: [
        { reviewee_id: userId },
        { freelancer_id: userId, reviewer_role: 'client' },
        { client_id: userId, reviewer_role: 'freelancer' }
      ]
    });
    const numReviews = reviews.length;
    const avgRating = numReviews > 0 
      ? Number((reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / numReviews).toFixed(1))
      : 5.0;

    if (role === 'freelancer') {
      await FreelancerProfile.findOneAndUpdate(
        { user_id: userId },
        { rating: avgRating, numReviews }
      );
    }
    await User.findByIdAndUpdate(
      userId,
      { rating: avgRating, numReviews }
    );
  } catch (err) {
    console.error('Error updating rating stats:', err);
  }
};

// 1. Submit review on a completed contract, project, or hire
exports.createReview = async (req, res) => {
  try {
    const { contractId, projectId, freelancerId, clientId, rating, comment } = req.body;
    const reviewerId = req.user.id;
    const reviewerRole = req.user.role || 'client';

    if (!rating || !comment || !comment.trim()) {
      return res.status(400).json({ message: 'Rating (1-5) and comment are required.' });
    }

    let targetUserId = reviewerRole === 'client' ? freelancerId : clientId;
    let title = 'Project Delivery';
    let contractObj = null;
    let projectObj = null;

    if (contractId) {
      contractObj = await Contract.findById(contractId);
      if (contractObj) {
        title = contractObj.title || title;
        if (reviewerRole === 'client') {
          targetUserId = contractObj.freelancer_id;
        } else {
          targetUserId = contractObj.client_id;
        }
      }
    }

    if (!targetUserId && projectId) {
      projectObj = await Project.findById(projectId);
      if (projectObj) {
        title = projectObj.title || title;
        if (reviewerRole === 'client') {
          const acceptedProp = projectObj.proposals?.find(p => p.status === 'Accepted');
          if (acceptedProp?.freelancer_id) {
            targetUserId = acceptedProp.freelancer_id;
          } else if (acceptedProp?.freelancer_email) {
            const u = await User.findOne({ email: acceptedProp.freelancer_email });
            if (u) targetUserId = u._id;
          }
        } else {
          targetUserId = projectObj.client_id;
        }
      }
    }

    if (!targetUserId) {
      return res.status(400).json({ message: 'Target user identification is required for submitting a review.' });
    }

    // Check duplicate review
    let queryFilter = { reviewer_id: reviewerId };
    if (contractId) queryFilter.contract_id = contractId;
    else if (projectId) queryFilter.project_id = projectId;
    else queryFilter.reviewee_id = targetUserId;

    const existing = await Review.findOne(queryFilter);
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted a review for this contract/project.' });
    }

    const targetUserObj = await User.findById(targetUserId);
    const targetRole = targetUserObj?.role || (reviewerRole === 'client' ? 'freelancer' : 'client');

    const reviewData = {
      contract_id: contractObj ? contractObj._id : undefined,
      project_id: projectObj ? projectObj._id : undefined,
      reviewer_id: reviewerId,
      reviewee_id: targetUserId,
      reviewer_role: reviewerRole,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment.trim(),
      projectTitle: title
    };

    if (reviewerRole === 'client') {
      reviewData.freelancer_id = targetUserId;
      reviewData.client_id = reviewerId;
    } else {
      reviewData.freelancer_id = reviewerId;
      reviewData.client_id = targetUserId;
    }

    const review = new Review(reviewData);
    await review.save();

    // Recalculate target user rating stats
    await updateUserRatingStats(targetUserId, targetRole);

    // Notify target user
    const reviewerName = req.user.name || (reviewerRole === 'client' ? 'A client' : 'A freelancer');
    await createNotification(
      targetUserId,
      'review',
      `New ${reviewerRole === 'client' ? 'Client' : 'Freelancer'} Review Received`,
      `${reviewerName} submitted a ${rating}-star review for "${title}": "${comment.slice(0, 60)}..."`
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Error submitting review.' });
  }
};

// 2. Get reviews written by client (given)
exports.getClientReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer_id: req.user.id })
      .populate('freelancer_id', 'name firstName lastName avatar email role companyName title')
      .populate('reviewee_id', 'name firstName lastName avatar email role companyName title')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Get client reviews error:', error);
    res.status(500).json({ message: 'Error fetching reviews.' });
  }
};

// 3. Get reviews received by freelancer
exports.getFreelancerReviews = async (req, res) => {
  try {
    const targetUserId = req.params.freelancerId || req.user.id;
    const reviews = await Review.find({
      $or: [
        { freelancer_id: targetUserId, reviewer_role: 'client' },
        { reviewee_id: targetUserId }
      ]
    })
      .populate('reviewer_id', 'name firstName lastName avatar companyName industry role')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Get freelancer reviews error:', error);
    res.status(500).json({ message: 'Error fetching reviews.' });
  }
};

// 4. Get reviews unified handler (supports ?type=given | ?type=received | ?type=all)
exports.getReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const type = req.query.type;

    if (type === 'given') {
      const given = await Review.find({ reviewer_id: userId })
        .populate('freelancer_id', 'name firstName lastName avatar email role companyName title')
        .populate('client_id', 'name firstName lastName avatar email role companyName title')
        .populate('reviewee_id', 'name firstName lastName avatar email role companyName title')
        .sort({ createdAt: -1 });
      return res.json(given);
    }

    if (type === 'received') {
      const received = await Review.find({
        $or: [
          { reviewee_id: userId },
          { freelancer_id: userId, reviewer_role: 'client' },
          { client_id: userId, reviewer_role: 'freelancer' }
        ]
      })
        .populate('reviewer_id', 'name firstName lastName avatar companyName industry role title')
        .sort({ createdAt: -1 });
      return res.json(received);
    }

    // Default: Return both or role-based default array with extra metadata
    const given = await Review.find({ reviewer_id: userId })
      .populate('freelancer_id', 'name firstName lastName avatar email role companyName title')
      .populate('client_id', 'name firstName lastName avatar email role companyName title')
      .populate('reviewee_id', 'name firstName lastName avatar email role companyName title')
      .sort({ createdAt: -1 });

    const received = await Review.find({
      $or: [
        { reviewee_id: userId },
        { freelancer_id: userId, reviewer_role: 'client' },
        { client_id: userId, reviewer_role: 'freelancer' }
      ]
    })
      .populate('reviewer_id', 'name firstName lastName avatar companyName industry role title')
      .sort({ createdAt: -1 });

    res.json({
      given,
      received,
      reviews: role === 'client' ? given : received // Backwards compatibility for single-array consumers
    });
  } catch (error) {
    console.error('Unified reviews fetch error:', error);
    res.status(500).json({ message: 'Error fetching reviews.' });
  }
};

// 5. Respond to a review
exports.respondToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Response text is required.' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    const isTarget = review.reviewee_id?.toString() === req.user.id || review.freelancer_id?.toString() === req.user.id || review.client_id?.toString() === req.user.id;
    if (!isTarget && review.reviewer_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the reviewed user can post a response.' });
    }

    review.response = {
      text: text.trim(),
      createdAt: new Date()
    };

    await review.save();

    res.json({
      success: true,
      message: 'Response posted successfully!',
      review
    });
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({ message: 'Error posting response to review.' });
  }
};
