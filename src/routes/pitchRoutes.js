const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  createPitch,
  getClientPitches,
  getFreelancerPitches,
  submitBidForPitch,
  declinePitch
} = require('../controllers/pitchController');

router.use(auth);

router.post('/', createPitch);
router.get('/client', getClientPitches);
router.get('/freelancer', getFreelancerPitches);
router.post('/:id/submit-bid', submitBidForPitch);
router.put('/:id/decline', declinePitch);

module.exports = router;
