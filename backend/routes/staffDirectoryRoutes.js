// routes/staffDirectoryRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStaffDirectory,
  getStaffMember
} = require('../controllers/staffDirectoryController');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/staff/directory
 * @desc    Get staff directory (professors and TAs)
 * @access  Private (staff, professor, admin, ta)
 */
router.get('/', authorize(['admin', 'staff', 'professor', 'ta', 'student']), getStaffDirectory);

/**
 * @route   GET /api/staff/directory/:id
 * @desc    Get staff member details
 * @access  Private (staff, professor, admin, ta)
 */
router.get('/:id', authorize(['admin', 'staff', 'professor', 'ta', 'student']), getStaffMember);
module.exports = router;