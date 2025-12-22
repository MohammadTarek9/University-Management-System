// routes/teachingStaffProfileRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyProfile,
  updateMyProfile,
  getAllProfiles,
  getProfileByUserId
} = require('../controllers/teachingStaffProfileController');

// Public routes (all authenticated users can view)
router.get('/profiles', protect, getAllProfiles);
router.get('/profiles/user/:userId', protect, getProfileByUserId);

// Protected routes (only for professors and TAs)
router.get('/profile/me', protect, authorize(['professor', 'ta']), getMyProfile);
router.put('/profile/me', protect, authorize(['professor', 'ta']), updateMyProfile);

module.exports = router;