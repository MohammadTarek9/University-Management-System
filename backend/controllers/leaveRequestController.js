const { body, validationResult } = require('express-validator');
const leaveRequestRepo = require('../repositories/leaveRequestRepo');
const { errorResponse, successResponse } = require('../utils/responseHelpers');

// ===================================================================
// @desc    Get all leave types
// @route   GET /api/leave-requests/types
// @access  Private
// ===================================================================
const getLeaveTypes = async (req, res) => {
  try {
    const types = await leaveRequestRepo.getAllLeaveTypes();
    successResponse(res, 200, 'Leave types retrieved successfully', { types });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving leave types');
  }
};

// ===================================================================
// @desc    Submit a new leave request
// @route   POST /api/leave-requests
// @access  Private (Staff/Professor/TA)
// ===================================================================
const submitLeaveRequest = async (req, res) => {
  try {
    const { leaveTypeId, start_date, end_date, reason } = req.body;
    const userId = req.user.id;
    
    // Validate dates
    const start = new Date(start_date);
    const end = new Date(end_date);
    
    if (start > end) {
      return errorResponse(res, 400, 'Start date must be before end date');
    }
    
    if (start < new Date()) {
      return errorResponse(res, 400, 'Cannot submit leave request for past dates');
    }
    
    // Check leave type exists
    const leaveType = await leaveRequestRepo.getLeaveTypeById(leaveTypeId);
    if (!leaveType) {
      return errorResponse(res, 404, 'Leave type not found');
    }
    
    // Calculate number of days (DATEDIFF equivalent: end - start + 1)
    const numberOfDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // Get fiscal year (usually January to December, can be customized)
    const fiscalYear = new Date().getFullYear();
    
    // Check leave availability
    const availability = await leaveRequestRepo.checkLeaveAvailability(
      userId,
      leaveTypeId,
      numberOfDays,
      fiscalYear
    );
    
    if (!availability.available) {
      return errorResponse(res, 400, availability.message);
    }
    
    // Create leave request
    const leaveRequest = await leaveRequestRepo.createLeaveRequest(
      userId,
      leaveTypeId,
      start_date,
      end_date,
      reason
    );
    
    successResponse(res, 201, 'Leave request submitted successfully', {
      leaveRequest
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while submitting leave request');
  }
};

// ===================================================================
// @desc    Get user's leave requests
// @route   GET /api/leave-requests/my-requests
// @access  Private
// ===================================================================
const getMyLeaveRequests = async (req, res) => {
  try {
    const { status = '', page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    
    const filters = {
      status: status || undefined,
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const result = await leaveRequestRepo.getUserLeaveRequests(userId, filters);
    
    successResponse(res, 200, 'Leave requests retrieved successfully', {
      requests: result.requests,
      pagination: {
        currentPage: result.page,
        totalPages: result.pages,
        totalRequests: result.total,
        limit: result.limit
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving leave requests');
  }
};

// ===================================================================
// @desc    Get single leave request details
// @route   GET /api/leave-requests/:id
// @access  Private
// ===================================================================
const getLeaveRequestDetails = async (req, res) => {
  try {
    const leaveRequestId = req.params.id;
    const userId = req.user.id;
    
    const leaveRequest = await leaveRequestRepo.getLeaveRequestById(leaveRequestId);
    
    if (!leaveRequest) {
      return errorResponse(res, 404, 'Leave request not found');
    }
    
    // Check authorization (user can view their own requests or admin can view all)
    if (leaveRequest.user_id !== userId && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return errorResponse(res, 403, 'Unauthorized to view this request');
    }
    
    successResponse(res, 200, 'Leave request retrieved successfully', {
      leaveRequest
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving leave request');
  }
};

// ===================================================================
// @desc    Get pending leave requests (Admin only)
// @route   GET /api/leave-requests/pending
// @access  Private/Admin
// ===================================================================
const getPendingRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, department = '', search = '' } = req.query;
    
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      department,
      search
    };
    
    const result = await leaveRequestRepo.getPendingLeaveRequests(filters);
    
    successResponse(res, 200, 'Pending leave requests retrieved successfully', {
      requests: result.requests,
      pagination: {
        currentPage: result.page,
        totalPages: result.pages,
        totalRequests: result.total,
        limit: result.limit
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving pending requests');
  }
};

// ===================================================================
// @desc    Approve leave request (Admin only)
// @route   PUT /api/leave-requests/:id/approve
// @access  Private/Admin
// ===================================================================
const approveLeaveRequest = async (req, res) => {
  try {
    const leaveRequestId = req.params.id;
    const approverId = req.user.id;
    
    const leaveRequest = await leaveRequestRepo.getLeaveRequestById(leaveRequestId);
    
    if (!leaveRequest) {
      return errorResponse(res, 404, 'Leave request not found');
    }
    
    if (leaveRequest.status !== 'pending') {
      return errorResponse(res, 400, `Cannot approve a ${leaveRequest.status} request`);
    }
    
    const approvedRequest = await leaveRequestRepo.approveLeaveRequest(
      leaveRequestId,
      approverId
    );
    
    successResponse(res, 200, 'Leave request approved successfully', {
      leaveRequest: approvedRequest
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while approving leave request');
  }
};

// ===================================================================
// @desc    Reject leave request (Admin only)
// @route   PUT /api/leave-requests/:id/reject
// @access  Private/Admin
// ===================================================================
const rejectLeaveRequest = async (req, res) => {
  try {
    const leaveRequestId = req.params.id;
    const approverId = req.user.id;
    const { rejectionReason = '' } = req.body;
    
    const leaveRequest = await leaveRequestRepo.getLeaveRequestById(leaveRequestId);
    
    if (!leaveRequest) {
      return errorResponse(res, 404, 'Leave request not found');
    }
    
    if (leaveRequest.status !== 'pending') {
      return errorResponse(res, 400, `Cannot reject a ${leaveRequest.status} request`);
    }
    
    const rejectedRequest = await leaveRequestRepo.rejectLeaveRequest(
      leaveRequestId,
      approverId,
      rejectionReason
    );

    successResponse(res, 200, 'Leave request rejected successfully', {
      leaveRequest: rejectedRequest
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while rejecting leave request');
  }
};

// ===================================================================
// @desc    Cancel leave request (User can cancel pending/approved)
// @route   PUT /api/leave-requests/:id/cancel
// @access  Private
// ===================================================================
const cancelLeaveRequest = async (req, res) => {
  try {
    const leaveRequestId = req.params.id;
    const userId = req.user.id;
    
    const leaveRequest = await leaveRequestRepo.getLeaveRequestById(leaveRequestId);
    
    if (!leaveRequest) {
      return errorResponse(res, 404, 'Leave request not found');
    }
    
    if (leaveRequest.user_id !== userId) {
      return errorResponse(res, 403, 'Unauthorized to cancel this request');
    }
    
    const cancelledRequest = await leaveRequestRepo.cancelLeaveRequest(
      leaveRequestId,
      userId
    );
    
    successResponse(res, 200, 'Leave request cancelled successfully', {
      leaveRequest: cancelledRequest
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, error.message || 'Server error while cancelling leave request');
  }
};

// Validation rules
const submitLeaveRequestValidation = [
  body('leaveTypeId')
    .notEmpty()
    .withMessage('Leave type is required')
    .isInt()
    .withMessage('Leave type ID must be an integer'),
  
  body('start_date')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('end_date')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters')
];

const rejectLeaveRequestValidation = [
  body('rejectionReason')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Rejection reason must not exceed 255 characters')
];

module.exports = {
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
};