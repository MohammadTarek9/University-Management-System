// routes/benefits.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyBenefits,
  getUserBenefits,
  createBenefits,
  updateBenefits
} = require('../controllers/benefitsController');

// All routes require authentication
router.use(protect);
router.use(authorize('professor', 'ta', 'staff', 'admin'));

// Get my benefits
router.get('/', getMyBenefits);

// Admin routes
router.post('/', authorize('admin'), createBenefits);
router.get('/:userId', authorize('admin'), getUserBenefits);
router.put('/:userId', authorize('admin'), updateBenefits);

module.exports = router;
