const express = require('express');
const router = express.Router();
const {
  getLeaveTypes,
  submitLeaveRequest,
  getMyLeaveRequests,
  getLeaveRequestDetails,
  getPendingRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  submitLeaveRequestValidation,
  rejectLeaveRequestValidation
} = require('../controllers/leaveRequestController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../utils/responseHelpers');

// All routes require authentication
router.use(protect);

// ============================================
// SPECIFIC ROUTES FIRST (before generic /:id)
// ============================================

// Get all leave types
router.get('/types', getLeaveTypes);

// Get current user's leave requests
router.get('/my-requests', getMyLeaveRequests);

// Get pending requests (admin only) - BEFORE /:id
router.get('/admin/pending', authorize('admin'), getPendingRequests);


// ============================================
// Admin only routes
// ============================================

// Approve leave request (admin only)
router.put(
  '/:id/approve',
  authorize('admin'),
  approveLeaveRequest
);

// Reject leave request (admin only)
router.put(
  '/:id/reject',
  authorize('admin'),
  rejectLeaveRequestValidation,
  handleValidationErrors,
  rejectLeaveRequest
);
// ============================================
// GENERIC ROUTES LAST
// ============================================

// Get specific leave request details
router.get('/:id', getLeaveRequestDetails);

// Submit new leave request
router.post(
  '/',
  submitLeaveRequestValidation,
  handleValidationErrors,
  submitLeaveRequest
);

// Cancel own leave request
router.put('/:id/cancel', cancelLeaveRequest);

module.exports = router;
