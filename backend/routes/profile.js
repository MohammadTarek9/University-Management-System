const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  updateProfileValidation
} = require('../controllers/profileController');
const { handleValidationErrors } = require('../utils/responseHelpers');

// All routes require authentication
router.use(protect);

// GET /api/profile - Get current user profile
router.get('/', getProfile);

// PUT /api/profile - Update current user profile
router.put('/', updateProfileValidation, handleValidationErrors, updateProfile);

module.exports = router;