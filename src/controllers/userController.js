const { User, FreelancerProfile } = require('../models');

const getFreelancers = async (req, res) => {
  try {
    const freelancers = await User.find({ role: 'freelancer' }).select('-password_hash');

    // Fetch their profiles
    const freelancerIds = freelancers.map(f => f._id);
    const profiles = await FreelancerProfile.find({ user_id: { $in: freelancerIds } });

    const result = freelancers.map(freelancer => {
      const profile = profiles.find(p => p.user_id.toString() === freelancer._id.toString());
      return { ...freelancer.toObject(), profile: profile ? profile.toObject() : null };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching freelancers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/profile/me — Full freelancer profile (user + FreelancerProfile merged)
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let profile = null;
    if (user.role === 'freelancer') {
      profile = await FreelancerProfile.findOne({ user_id: userId });
      if (!profile) {
        profile = new FreelancerProfile({ user_id: userId });
      }
      await profile.save(); // Triggers pre('save') to auto-calculate profileCompletion
    }

    res.json({ user, profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/users/profile/me — Update full freelancer profile with Cloudinary-backed fields
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name, phone, location, language, avatar, profilePhoto,
      companyName, industry, companySize, website, companyDesc, gstin, state, country,
      title, bio, skills, experience, availability, hourlyRate, languages,
      portfolioItems, certifications, workExperience,
      linkedinUrl, githubUrl, websiteUrl
    } = req.body;

    const userUpdateFields = {};
    if (name !== undefined) userUpdateFields.name = name;
    if (phone !== undefined) userUpdateFields.phone = phone;
    if (location !== undefined) userUpdateFields.location = location;
    if (language !== undefined) userUpdateFields.language = language;
    if (companyName !== undefined) userUpdateFields.companyName = companyName;
    if (industry !== undefined) userUpdateFields.industry = industry;
    if (companySize !== undefined) userUpdateFields.companySize = companySize;
    if (website !== undefined) userUpdateFields.website = website;
    if (companyDesc !== undefined) userUpdateFields.companyDesc = companyDesc;
    if (gstin !== undefined) userUpdateFields.gstin = gstin;
    if (state !== undefined) userUpdateFields.state = state;
    if (country !== undefined) userUpdateFields.country = country;
    if (avatar || profilePhoto) {
      userUpdateFields.avatar = avatar || profilePhoto;
      userUpdateFields.profilePhoto = avatar || profilePhoto;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      userUpdateFields,
      { new: true, runValidators: true }
    ).select('-password_hash');

    let updatedProfile = null;
    if (updatedUser.role === 'freelancer') {
      updatedProfile = await FreelancerProfile.findOne({ user_id: userId });
      if (!updatedProfile) {
        updatedProfile = new FreelancerProfile({ user_id: userId });
      }

      if (title !== undefined) updatedProfile.title = title;
      if (bio !== undefined) updatedProfile.bio = bio;
      if (skills !== undefined) updatedProfile.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
      if (experience !== undefined) updatedProfile.experience = experience;
      if (availability !== undefined) updatedProfile.availability = availability;
      if (hourlyRate !== undefined) updatedProfile.hourlyRate = Number(hourlyRate);
      if (languages !== undefined) updatedProfile.languages = Array.isArray(languages) ? languages : [languages];
      if (portfolioItems !== undefined) updatedProfile.portfolioItems = portfolioItems;
      if (certifications !== undefined) updatedProfile.certifications = certifications;
      if (workExperience !== undefined) updatedProfile.workExperience = workExperience;
      if (linkedinUrl !== undefined) updatedProfile.linkedinUrl = linkedinUrl;
      if (githubUrl !== undefined) updatedProfile.githubUrl = githubUrl;
      if (websiteUrl !== undefined) updatedProfile.websiteUrl = websiteUrl;

      await updatedProfile.save();
    }

    res.json({ user: updatedUser, profile: updatedProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/users/profile/ai-analyze — Heuristic-based AI profile strength analyzer
const aiAnalyzeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password_hash');
    const profile = await FreelancerProfile.findOne({ user_id: userId });

    if (!profile) {
      return res.json({
        score: 0,
        grade: 'F',
        tips: ['Complete your profile setup to get started.'],
        missingFields: ['title', 'bio', 'skills', 'hourlyRate', 'portfolioItems'],
        strengths: []
      });
    }

    let score = 0;
    const tips = [];
    const strengths = [];
    const missingFields = [];

    // Title
    if (profile.title && profile.title.length > 5) {
      score += 15; strengths.push('Professional title set');
    } else {
      missingFields.push('title');
      tips.push('Add a compelling professional title (e.g., "Senior React Developer")');
    }

    // Bio
    if (profile.bio && profile.bio.length > 80) {
      score += 15; strengths.push('Detailed bio provided');
    } else if (profile.bio && profile.bio.length > 20) {
      score += 8;
      tips.push('Expand your bio to at least 150 characters for better client trust');
    } else {
      missingFields.push('bio');
      tips.push('Write a detailed bio describing your expertise, experience, and what you offer');
    }

    // Skills
    const skillsArr = profile.skills || [];
    if (skillsArr.length >= 5) {
      score += 15; strengths.push(`${skillsArr.length} skills listed`);
    } else if (skillsArr.length > 0) {
      score += 8;
      tips.push('Add at least 5 skills to increase your discoverability');
    } else {
      missingFields.push('skills');
      tips.push('Add your key skills to help clients find you');
    }

    // Hourly Rate
    if (profile.hourlyRate && profile.hourlyRate > 0) {
      score += 10; strengths.push('Hourly rate defined');
    } else {
      missingFields.push('hourlyRate');
      tips.push('Set your hourly rate to appear in client searches');
    }

    // Portfolio
    const portfolio = profile.portfolioItems || [];
    if (portfolio.length >= 3) {
      score += 20; strengths.push(`${portfolio.length} portfolio projects showcased`);
    } else if (portfolio.length > 0) {
      score += 10;
      tips.push('Add at least 3 portfolio projects to increase client confidence');
    } else {
      missingFields.push('portfolioItems');
      tips.push('Upload portfolio projects — clients trust freelancers with proven work samples');
    }

    // Certifications
    const certs = profile.certifications || [];
    if (certs.length > 0) {
      score += 10; strengths.push(`${certs.length} certification(s) added`);
    } else {
      missingFields.push('certifications');
      tips.push('Add certifications (Google, Coursera, etc.) to boost credibility');
    }

    // Work Experience
    const exp = profile.workExperience || [];
    if (exp.length > 0) {
      score += 10; strengths.push('Work experience history added');
    } else {
      missingFields.push('workExperience');
      tips.push('Add past work experience to build a complete professional profile');
    }

    // Avatar
    if (user.avatar || user.profilePhoto) {
      score += 5; strengths.push('Profile photo uploaded');
    } else {
      tips.push('Upload a professional profile photo — profiles with photos get 3x more views');
    }

    // Social Links
    if (profile.linkedinUrl || profile.githubUrl || profile.websiteUrl) {
      score += 5; strengths.push('Social/portfolio links added');
    } else {
      tips.push('Add your LinkedIn, GitHub, or website link to appear more credible');
    }

    const finalScore = Math.min(score, 100);
    let grade = 'F';
    if (finalScore >= 90) grade = 'A+';
    else if (finalScore >= 80) grade = 'A';
    else if (finalScore >= 70) grade = 'B';
    else if (finalScore >= 60) grade = 'C';
    else if (finalScore >= 50) grade = 'D';

    res.json({ score: finalScore, grade, tips: tips.slice(0, 5), missingFields, strengths });
  } catch (error) {
    console.error('Error analyzing profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let profile = null;
    if (user.role === 'freelancer') {
      profile = await FreelancerProfile.findOne({ user_id: userId });
      if (!profile) {
        profile = new FreelancerProfile({ user_id: userId });
      }
      await profile.save();
    }

    res.json({ user, profile });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const {
      name, phone, location, language, preferences, avatar, profilePhoto,
      title, bio, skills, experience, availability, hourlyRate
    } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (location !== undefined) updateFields.location = location;
    if (language !== undefined) updateFields.language = language;
    if (preferences !== undefined) updateFields.preferences = preferences;
    if (avatar || profilePhoto) {
      updateFields.avatar = avatar || profilePhoto;
      updateFields.profilePhoto = avatar || profilePhoto;
    }

    // Update User
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password_hash');

    let updatedProfile = null;
    if (updatedUser.role === 'freelancer') {
      updatedProfile = await FreelancerProfile.findOne({ user_id: userId });
      if (!updatedProfile) {
        updatedProfile = new FreelancerProfile({ user_id: userId });
      }

      if (title !== undefined) updatedProfile.title = title;
      if (bio !== undefined) updatedProfile.bio = bio;
      if (skills !== undefined) updatedProfile.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
      if (experience !== undefined) updatedProfile.experience = experience;
      if (availability !== undefined) updatedProfile.availability = availability;
      if (hourlyRate !== undefined) updatedProfile.hourlyRate = Number(hourlyRate);

      await updatedProfile.save();
    }

    res.json({ user: updatedUser, profile: updatedProfile });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const submitKyc = async (req, res) => {
  try {
    const userId = req.user.id;
    const { docUrl, docType } = req.body;

    if (!docUrl) {
      return res.status(400).json({ message: 'Document URL is required.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        kycStatus: 'Pending Approval',
        kycDocUrl: docUrl,
        kycDocType: docType || 'Aadhaar Card',
        kycSubmittedAt: new Date()
      },
      { new: true }
    ).select('-password_hash');

    res.json({ message: 'KYC Document submitted successfully for review.', user: updatedUser });
  } catch (error) {
    console.error('Error submitting KYC:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserDisputes = async (req, res) => {
  try {
    const { Dispute, User } = require('../models');
    const userId = req.user?.id || req.user?._id;
    const currentUser = await User.findById(userId).select('email name role');
    const userEmail = currentUser?.email || req.user?.email;

    const orClauses = [
      { client_id: userId },
      { freelancer_id: userId }
    ];
    if (userEmail) {
      orClauses.push({ clientEmail: userEmail }, { freelancerEmail: userEmail });
    }

    const myDisputes = await Dispute.find({ $or: orClauses }).sort({ createdAt: -1 });

    res.json({ success: true, disputes: myDisputes });
  } catch (error) {
    console.error('Error fetching user disputes:', error);
    res.status(500).json({ message: 'Error retrieving disputes' });
  }
};

const addUserDisputeMessage = async (req, res) => {
  try {
    const { Dispute, User } = require('../models');
    const { createNotification } = require('./notificationController');
    const { id } = req.params;
    const { text } = req.body;
    const userId = String(req.user?.id || req.user?._id || '');

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required.' });
    }

    const currentUser = await User.findById(userId).select('name email role');
    const userEmail = currentUser?.email || req.user?.email || '';
    const userRole = currentUser?.role || req.user?.role || 'client';
    const userName = currentUser?.name || req.user?.name || (userRole === 'freelancer' ? 'Freelancer' : 'Client');

    const isMongoId = id && id.match(/^[0-9a-fA-F]{24}$/);
    const dispute = await Dispute.findOne({
      $or: [
        { id: id },
        ...(isMongoId ? [{ _id: id }] : [])
      ]
    });

    if (!dispute) return res.status(404).json({ message: 'Dispute not found.' });

    const isClient = dispute.client_id?.toString() === userId || (userEmail && dispute.clientEmail === userEmail);
    const isFreelancer = dispute.freelancer_id?.toString() === userId || (userEmail && dispute.freelancerEmail === userEmail);

    if (!isClient && !isFreelancer && userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied to this dispute thread.' });
    }

    const senderRole = isClient ? 'Client' : isFreelancer ? 'Freelancer' : 'Admin';

    const newMessage = {
      id: `msg-${Date.now()}`,
      senderRole,
      senderName: `${userName} (${userEmail || senderRole})`,
      text: text.trim(),
      timestamp: new Date()
    };

    dispute.messages.push(newMessage);
    await dispute.save();

    // Trigger notification to the opposing party
    const targetUserId = isClient ? dispute.freelancer_id : dispute.client_id;
    if (targetUserId) {
      await createNotification(
        targetUserId,
        'system',
        'New Evidence in Dispute Thread',
        `${userName} posted a response regarding dispute #${dispute.id} (${dispute.projectTitle}).`
      ).catch(() => null);
    }

    res.json({ success: true, message: 'Message added successfully.', dispute });
  } catch (error) {
    console.error('Error adding dispute message:', error);
    res.status(500).json({ message: 'Error adding message to dispute' });
  }
};

const fileNewDispute = async (req, res) => {
  try {
    const { Dispute, User, Project, Contract } = require('../models');
    const { createNotification } = require('./notificationController');
    const { projectId, projectTitle, freelancerEmail, clientEmail, amount, issue } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!issue || !issue.trim()) {
      return res.status(400).json({ message: 'Issue description is required.' });
    }

    // Retrieve active authenticated user from DB
    const currentUser = await User.findById(userId).select('name email role');
    const isFreelancerFiler = currentUser?.role === 'freelancer';
    const userEmail = currentUser?.email || req.user?.email || (isFreelancerFiler ? 'freelancer@gigsphere.com' : 'client@gigsphere.com');
    const userName = currentUser?.name || req.user?.name || (isFreelancerFiler ? 'Freelancer' : 'Client');

    // Resolve project
    let projectObj = null;
    if (projectId) {
      projectObj = await Project.findById(projectId).catch(() => null);
    }

    let finalClientId = null;
    let finalClientName = 'Client';
    let finalClientEmail = 'client@gigsphere.com';

    let finalFreelancerId = null;
    let finalFreelancerName = 'Freelancer';
    let finalFreelancerEmail = 'freelancer@gigsphere.com';

    if (isFreelancerFiler) {
      // Authenticated user is the freelancer
      finalFreelancerId = currentUser ? currentUser._id : userId;
      finalFreelancerName = userName;
      finalFreelancerEmail = userEmail;

      // Resolve client from input, project, or contract
      let clientUser = null;
      if (clientEmail && clientEmail.trim()) {
        const cleanClientEmail = clientEmail.trim();
        clientUser = await User.findOne({
          $or: [
            { email: cleanClientEmail },
            { name: cleanClientEmail }
          ]
        }).catch(() => null);
      }

      if (!clientUser && projectObj?.client_id) {
        clientUser = await User.findById(projectObj.client_id).catch(() => null);
      }

      if (!clientUser && projectObj) {
        const contract = await Contract.findOne({ project_id: projectObj._id }).catch(() => null);
        if (contract?.client_id) {
          clientUser = await User.findById(contract.client_id).catch(() => null);
        }
      }

      if (clientUser) {
        finalClientId = clientUser._id;
        finalClientName = clientUser.name || 'Client';
        finalClientEmail = clientUser.email || 'client@gigsphere.com';
      } else {
        finalClientEmail = (clientEmail && clientEmail.includes('@'))
          ? clientEmail.trim()
          : 'client@gigsphere.com';
        finalClientName = clientEmail
          ? (clientEmail.includes('@') ? clientEmail.split('@')[0] : clientEmail)
          : 'Client';
      }
    } else {
      // Authenticated user is the client (or admin/other)
      finalClientId = currentUser ? currentUser._id : userId;
      finalClientName = userName;
      finalClientEmail = userEmail;

      // Resolve freelancer from input, project proposals, or contract
      let freelancerUser = null;
      if (freelancerEmail && freelancerEmail.trim()) {
        const cleanEmail = freelancerEmail.trim();
        freelancerUser = await User.findOne({
          $or: [
            { email: cleanEmail },
            { name: cleanEmail }
          ]
        }).catch(() => null);
      }

      if (!freelancerUser && projectObj) {
        const hiredProp = (projectObj.proposals || []).find(p => p.status === 'Hired' || p.status === 'Accepted')
          || (projectObj.proposals || [])[0];
        if (hiredProp?.freelancer_id) {
          freelancerUser = await User.findById(hiredProp.freelancer_id).catch(() => null);
        }
        if (!freelancerUser && hiredProp?.freelancer_email) {
          freelancerUser = await User.findOne({ email: hiredProp.freelancer_email }).catch(() => null);
        }
        if (!freelancerUser && hiredProp?.freelancer_name) {
          freelancerUser = await User.findOne({ name: hiredProp.freelancer_name }).catch(() => null);
        }
      }

      if (!freelancerUser && projectObj) {
        const contract = await Contract.findOne({ project_id: projectObj._id }).catch(() => null);
        if (contract?.freelancer_id) {
          freelancerUser = await User.findById(contract.freelancer_id).catch(() => null);
        }
      }

      if (freelancerUser) {
        finalFreelancerId = freelancerUser._id;
        finalFreelancerName = freelancerUser.name || 'Freelancer Partner';
        finalFreelancerEmail = freelancerUser.email || 'freelancer@gigsphere.com';
      } else {
        finalFreelancerEmail = (freelancerEmail && freelancerEmail.includes('@'))
          ? freelancerEmail.trim()
          : 'freelancer@gigsphere.com';
        finalFreelancerName = freelancerEmail
          ? (freelancerEmail.includes('@') ? freelancerEmail.split('@')[0] : freelancerEmail)
          : 'Freelancer Partner';
      }
    }

    const disputeId = `DISP-${Math.floor(100 + Math.random() * 900)}`;

    const newDisp = new Dispute({
      id: disputeId,
      project_id: projectObj ? projectObj._id : undefined,
      projectTitle: projectTitle || projectObj?.title || 'Marketplace Project',
      client_id: finalClientId,
      clientName: finalClientName,
      clientEmail: finalClientEmail,
      freelancer_id: finalFreelancerId,
      freelancerName: finalFreelancerName,
      freelancerEmail: finalFreelancerEmail,
      amount: Math.max(1, Number(amount) || Number(projectObj?.budget) || 1000),
      issue: issue.trim(),
      freelancerDefense: isFreelancerFiler ? issue.trim() : 'Awaiting response in discussion thread.',
      status: 'Open',
      messages: [{
        id: `msg-${Date.now()}`,
        senderRole: isFreelancerFiler ? 'Freelancer' : 'Client',
        senderName: `${userName} (${userEmail})`,
        text: `Dispute opened: ${issue.trim()}`,
        timestamp: new Date()
      }]
    });

    await newDisp.save();

    // Trigger notification to the counterparty
    const targetUserId = isFreelancerFiler ? finalClientId : finalFreelancerId;
    if (targetUserId) {
      await createNotification(
        targetUserId,
        'system',
        'Dispute Filed On Project',
        `A dispute (#${disputeId}) was filed by ${userName} for project "${newDisp.projectTitle}". Please review and respond in the evidence thread.`
      ).catch(() => null);
    }

    res.status(201).json({ success: true, message: 'Dispute filed successfully!', dispute: newDisp });
  } catch (error) {
    console.error('Error filing dispute:', error);
    res.status(500).json({ message: error.message || 'Error filing dispute' });
  }
};

const getUserPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { Gig, Contract, Review } = require('../models');
    let profile = await FreelancerProfile.findOne({ user_id: id });
    const gigs = await Gig.find({ freelancer_id: id });
    const contracts = await Contract.find({ freelancer_id: id });
    const reviews = await Review.find({ freelancer_id: id });

    res.json({
      user,
      profile,
      gigs,
      contracts,
      reviews
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getFreelancers,
  getMyProfile,
  updateMyProfile,
  aiAnalyzeProfile,
  getSettings,
  updateSettings,
  submitKyc,
  getUserDisputes,
  addUserDisputeMessage,
  fileNewDispute,
  getUserPublicProfile
};
