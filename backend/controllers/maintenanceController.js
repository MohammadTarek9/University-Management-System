const maintenanceRepo = require('../repositories/maintenanceEavRepoNew'); // Using 3-table EAV repository
const userRepo = require('../repositories/userRepo');
const { validationResult } = require('express-validator');

// Helper function for consistent API responses
const sendResponse = (res, statusCode, success, message, data = null, errors = null) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    errors
  });
};

// @desc    Create new maintenance request
// @route   POST /api/facilities/maintenance
// @access  Private (Student)
exports.createMaintenanceRequest = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation failed', null, errors.array());
    }

    const { 
      title, 
      description, 
      category, 
      priority, 
      location,
      // Category-specific flexible attributes
      categorySpecific
    } = req.body;

    // Create new maintenance request with EAV attributes
    const maintenanceRequest = await maintenanceRepo.createMaintenanceRequest({
      title,
      description,
      category,
      priority: priority || 'Medium',
      location,
      submittedBy: req.user.id,
      status: 'Submitted',
      categorySpecific: categorySpecific || {}
    });

    // Populate submitter info
    const submitter = await userRepo.getUserById(maintenanceRequest.submittedBy);
    const response = {
      ...maintenanceRequest,
      submittedBy: submitter ? { id: submitter.id, firstName: submitter.firstName, lastName: submitter.lastName, email: submitter.email } : null
    };

    sendResponse(res, 201, true, 'Maintenance request submitted successfully', response);

  } catch (error) {
    console.error('Error creating maintenance request:', error);
    sendResponse(res, 500, false, 'Server error while submitting maintenance request');
  }
};

// @desc    Get all maintenance requests (with filters for admin)
// @route   GET /api/facilities/maintenance
// @access  Private (Student - own requests, Admin - all requests)
exports.getAllMaintenanceRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      search
    } = req.query;

    // Build filter object for EAV query
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    // Students can only see their own requests
    if (req.user.role === 'student') {
      options.submittedBy = req.user.id;
    }

    // Admin filters
    if (status && status !== 'all') {
      options.status = status;
    }
    
    if (category && category !== 'all') {
      options.category = category;
    }
    
    if (priority && priority !== 'all') {
      options.priority = priority;
    }

    // Execute EAV query
    const { maintenanceRequests, total, totalPages } = await maintenanceRepo.getAllMaintenanceRequests(options);

    // Populate user details for each request
    const enrichedRequests = await Promise.all(
      maintenanceRequests.map(async (request) => {
        const [submitter, assigned] = await Promise.all([
          request.submittedBy ? userRepo.getUserById(request.submittedBy) : null,
          request.assignedTo ? userRepo.getUserById(request.assignedTo) : null
        ]);

        return {
          ...request,
          submittedBy: submitter ? { id: submitter.id, firstName: submitter.firstName, lastName: submitter.lastName, email: submitter.email } : null,
          assignedTo: assigned ? { id: assigned.id, firstName: assigned.firstName, lastName: assigned.lastName, email: assigned.email } : null
        };
      })
    );

    sendResponse(res, 200, true, 'Maintenance requests retrieved successfully', {
      requests: enrichedRequests,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRequests: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    sendResponse(res, 500, false, 'Server error while fetching maintenance requests');
  }
};

// @desc    Get single maintenance request
// @route   GET /api/facilities/maintenance/:id
// @access  Private (Student - own requests, Admin - all requests)
exports.getMaintenanceRequestById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!Number.isInteger(id)) {
      return sendResponse(res, 400, false, 'Invalid maintenance request ID');
    }

    const request = await maintenanceRepo.getMaintenanceRequestById(id);

    if (!request) {
      return sendResponse(res, 404, false, 'Maintenance request not found');
    }

    // Students can only view their own requests
    if (req.user.role === 'student' && request.submittedBy !== req.user.id) {
      return sendResponse(res, 403, false, 'Access denied');
    }

    // Populate user details
    const [submitter, assigned] = await Promise.all([
      request.submittedBy ? userRepo.getUserById(request.submittedBy) : null,
      request.assignedTo ? userRepo.getUserById(request.assignedTo) : null
    ]);

    const response = {
      ...request,
      submittedBy: submitter ? { id: submitter.id, firstName: submitter.firstName, lastName: submitter.lastName, email: submitter.email } : null,
      assignedTo: assigned ? { id: assigned.id, firstName: assigned.firstName, lastName: assigned.lastName, email: assigned.email } : null
    };

    sendResponse(res, 200, true, 'Maintenance request retrieved successfully', response);

  } catch (error) {
    console.error('Error fetching maintenance request:', error);
    sendResponse(res, 500, false, 'Server error while fetching maintenance request');
  }
};

// @desc    Update maintenance request status (Admin only)
// @route   PUT /api/facilities/maintenance/:id/status
// @access  Private (Admin)
exports.updateMaintenanceRequestStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!Number.isInteger(id)) {
      return sendResponse(res, 400, false, 'Invalid maintenance request ID');
    }

    const { status, assignedTo, adminNotes, estimatedCompletion } = req.body;
    
    const request = await maintenanceRepo.getMaintenanceRequestById(id);
    
    if (!request) {
      return sendResponse(res, 404, false, 'Maintenance request not found');
    }

    // Validate status
    const validStatuses = ['Submitted', 'In Progress', 'Completed', 'Cancelled'];
    if (status && !validStatuses.includes(status)) {
      return sendResponse(res, 400, false, 'Invalid status');
    }

    // Prepare update data
    const updateData = {
      status,
      adminNotes,
      estimatedCompletion,
      assignedTo
    };

    // Set actual completion date if status is completed
    if (status === 'Completed' && !request.actualCompletion) {
      updateData.actualCompletion = new Date();
    }

    // Update request
    const updatedRequest = await maintenanceRepo.updateMaintenanceRequest(id, updateData);

    // Populate user details
    const [submitter, assigned] = await Promise.all([
      updatedRequest.submittedBy ? userRepo.getUserById(updatedRequest.submittedBy) : null,
      updatedRequest.assignedTo ? userRepo.getUserById(updatedRequest.assignedTo) : null
    ]);

    const response = {
      ...updatedRequest,
      submittedBy: submitter ? { id: submitter.id, firstName: submitter.firstName, lastName: submitter.lastName, email: submitter.email } : null,
      assignedTo: assigned ? { id: assigned.id, firstName: assigned.firstName, lastName: assigned.lastName, email: assigned.email } : null
    };

    sendResponse(res, 200, true, `Maintenance request ${status.toLowerCase()} successfully`, response);

  } catch (error) {
    console.error('Error updating maintenance request status:', error);
    sendResponse(res, 500, false, 'Server error while updating maintenance request');
  }
};

// @desc    Submit feedback for completed request
// @route   POST /api/facilities/maintenance/:id/feedback
// @access  Private (Student - own requests)
exports.submitFeedback = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!Number.isInteger(id)) {
      return sendResponse(res, 400, false, 'Invalid maintenance request ID');
    }

    const { rating, comment } = req.body;
    
    const request = await maintenanceRepo.getMaintenanceRequestById(id);
    
    if (!request) {
      return sendResponse(res, 404, false, 'Maintenance request not found');
    }

    // Students can only submit feedback for their own completed requests
    if (request.submittedBy !== req.user.id) {
      return sendResponse(res, 403, false, 'Access denied');
    }

    if (request.status !== 'Completed') {
      return sendResponse(res, 400, false, 'Feedback can only be submitted for completed requests');
    }

    // Update feedback
    const updatedRequest = await maintenanceRepo.submitFeedback(id, { rating, comment });

    sendResponse(res, 200, true, 'Feedback submitted successfully', updatedRequest);

  } catch (error) {
    console.error('Error submitting feedback:', error);
    sendResponse(res, 500, false, 'Server error while submitting feedback');
  }
};

// @desc    Delete maintenance request
// @route   DELETE /api/facilities/maintenance/:id
// @access  Private (Admin)
exports.deleteMaintenanceRequest = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!Number.isInteger(id)) {
      return sendResponse(res, 400, false, 'Invalid maintenance request ID');
    }

    const request = await maintenanceRepo.getMaintenanceRequestById(id);
    
    if (!request) {
      return sendResponse(res, 404, false, 'Maintenance request not found');
    }

    const deleted = await maintenanceRepo.deleteMaintenanceRequest(id);

    if (!deleted) {
      return sendResponse(res, 400, false, 'Failed to delete maintenance request');
    }

    sendResponse(res, 200, true, 'Maintenance request deleted successfully');

  } catch (error) {
    console.error('Error deleting maintenance request:', error);
    sendResponse(res, 500, false, 'Server error while deleting maintenance request');
  }
};

// @desc    Get maintenance statistics
// @route   GET /api/facilities/maintenance/stats
// @access  Private (Admin)
exports.getMaintenanceStats = async (req, res) => {
  try {
    // Get all maintenance requests from EAV
    const { maintenanceRequests } = await maintenanceRepo.getAllMaintenanceRequests({ 
      limit: 10000 // Get all for stats
    });

    // Calculate stats from EAV data
    const total = maintenanceRequests.length;
    
    const byStatus = maintenanceRequests.reduce((acc, req) => {
      const status = req.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const byCategory = maintenanceRequests.reduce((acc, req) => {
      const category = req.category || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const byPriority = maintenanceRequests.reduce((acc, req) => {
      const priority = req.priority || req.severity || 'Unknown';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    // Count completed this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const completedThisWeek = maintenanceRequests.filter(req => 
      req.status === 'Completed' && 
      req.completedDate && 
      new Date(req.completedDate) >= oneWeekAgo
    ).length;

    const responseData = {
      total,
      byStatus,
      byCategory,
      byPriority,
      completedThisWeek
    };

    sendResponse(res, 200, true, 'Maintenance statistics retrieved successfully', responseData);

  } catch (error) {
    console.error('Error fetching maintenance statistics:', error);
    sendResponse(res, 500, false, 'Server error while fetching statistics');
  }
};