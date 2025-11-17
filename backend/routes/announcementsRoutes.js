const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAnnouncementById,
  getAnnouncements,
  getAllAnnouncementsAdmin,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
  createAnnouncementValidation,
  updateAnnouncementValidation
} = require('../controllers/announcementsController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../utils/responseHelpers');

// All routes require authentication
router.use(protect);

// ============================================
// USER ROUTES (All authenticated users)
// ============================================

// Get announcements for current user (filtered by role)
router.get('/', getAnnouncements);

// Get announcement by ID
router.get('/:id', getAnnouncementById);

// ============================================
// ADMIN/STAFF ROUTES
// ============================================

// Get all announcements (admin view - includes inactive)
router.get('/admin/all', authorize('admin', 'staff'), getAllAnnouncementsAdmin);

// Create announcement
router.post(
  '/',
  authorize('admin', 'staff', 'professor'),
  createAnnouncementValidation,
  handleValidationErrors,
  createAnnouncement
);

// Update announcement
router.put(
  '/:id',
  authorize('admin', 'staff', 'professor'),
  updateAnnouncementValidation,
  handleValidationErrors,
  updateAnnouncement
);

// Toggle announcement status
router.patch(
  '/:id/toggle',
  authorize('admin', 'staff'),
  toggleAnnouncementStatus
);

// Delete announcement
router.delete(
  '/:id',
  authorize('admin', 'staff', 'professor'),
  deleteAnnouncement
);

module.exports = router;