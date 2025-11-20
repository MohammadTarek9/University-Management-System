const MaintenanceRequest = require('../models/MaintenanceRequest');
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

    const { title, description, category, priority, location, images } = req.body;

    // Create new maintenance request
    const maintenanceRequest = new MaintenanceRequest({
      title,
      description,
      category,
      priority: priority || 'Medium',
      location,
      images: images || [],
      submittedBy: req.user.id
    });

    await maintenanceRequest.save();

    // Populate submitter info
    await maintenanceRequest.populate('submittedBy', 'firstName lastName email');

    sendResponse(res, 201, true, 'Maintenance request submitted successfully', maintenanceRequest);

  } catch (error) {
    console.error('Error creating maintenance request:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return sendResponse(res, 400, false, 'Validation failed', null, validationErrors);
    }
    
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
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    let filter = {};

    // Students can only see their own requests
    if (req.user.role === 'student') {
      filter.submittedBy = req.user.id;
    }

    // Admin filters
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    // Search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'location.building': searchRegex },
        { 'location.roomNumber': searchRegex }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute queries
    const [requests, totalRequests] = await Promise.all([
      MaintenanceRequest.find(filter)
        .populate('submittedBy', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      MaintenanceRequest.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalRequests / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    sendResponse(res, 200, true, 'Maintenance requests retrieved successfully', {
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRequests,
        hasNextPage,
        hasPrevPage,
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
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    if (!request) {
      return sendResponse(res, 404, false, 'Maintenance request not found');
    }

    // Students can only view their own requests
    if (req.user.role === 'student' && request.submittedBy._id.toString() !== req.user.id) {
      return sendResponse(res, 403, false, 'Access denied');
    }

    sendResponse(res, 200, true, 'Maintenance request retrieved successfully', request);

  } catch (error) {
    console.error('Error fetching maintenance request:', error);
    
    if (error.name === 'CastError') {
      return sendResponse(res, 400, false, 'Invalid maintenance request ID');
    }
    
    sendResponse(res, 500, false, 'Server error while fetching maintenance request');
  }
};

// @desc    Update maintenance request status (Admin only)
// @route   PUT /api/facilities/maintenance/:id/status
// @access  Private (Admin)
exports.updateMaintenanceRequestStatus = async (req, res) => {
  try {
    const { status, assignedTo, adminNotes, estimatedCompletion } = req.body;
    
    const request = await MaintenanceRequest.findById(req.params.id);
    
    if (!request) {
      return sendResponse(res, 404, false, 'Maintenance request not found');
    }

    // Validate status
    const validStatuses = ['Submitted', 'In Progress', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return sendResponse(res, 400, false, 'Invalid status');
    }

    // Update request
    request.status = status;
    
    if (assignedTo) {
      request.assignedTo = assignedTo;
    }
    
    if (adminNotes) {
      request.adminNotes = adminNotes;
    }
    
    if (estimatedCompletion) {
      request.estimatedCompletion = estimatedCompletion;
    }

    // Set actual completion date if status is completed
    if (status === 'Completed' && !request.actualCompletion) {
      request.actualCompletion = new Date();
    }

    await request.save();

    // Populate for response
    await request.populate('submittedBy', 'firstName lastName email');
    await request.populate('assignedTo', 'firstName lastName email');

    sendResponse(res, 200, true, `Maintenance request ${status.toLowerCase()} successfully`, request);

  } catch (error) {
    console.error('Error updating maintenance request status:', error);
    
    if (error.name === 'CastError') {
      return sendResponse(res, 400, false, 'Invalid maintenance request ID');
    }
    
    sendResponse(res, 500, false, 'Server error while updating maintenance request');
  }
};

// @desc    Submit feedback for completed request
// @route   POST /api/facilities/maintenance/:id/feedback
// @access  Private (Student - own requests)
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const request = await MaintenanceRequest.findById(req.params.id);
    
    if (!request) {
      return sendResponse(res, 404, false, 'Maintenance request not found');
    }

    // Students can only submit feedback for their own completed requests
    if (request.submittedBy.toString() !== req.user.id) {
      return sendResponse(res, 403, false, 'Access denied');
    }

    if (request.status !== 'Completed') {
      return sendResponse(res, 400, false, 'Feedback can only be submitted for completed requests');
    }

    // Update feedback
    request.userFeedback = {
      rating,
      comment,
      submittedAt: new Date()
    };

    await request.save();

    sendResponse(res, 200, true, 'Feedback submitted successfully', request);

  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    if (error.name === 'CastError') {
      return sendResponse(res, 400, false, 'Invalid maintenance request ID');
    }
    
    sendResponse(res, 500, false, 'Server error while submitting feedback');
  }
};

// @desc    Delete maintenance request
// @route   DELETE /api/facilities/maintenance/:id
// @access  Private (Admin)
exports.deleteMaintenanceRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    
    if (!request) {
      return sendResponse(res, 404, false, 'Maintenance request not found');
    }

    await MaintenanceRequest.findByIdAndDelete(req.params.id);

    sendResponse(res, 200, true, 'Maintenance request deleted successfully');

  } catch (error) {
    console.error('Error deleting maintenance request:', error);
    
    if (error.name === 'CastError') {
      return sendResponse(res, 400, false, 'Invalid maintenance request ID');
    }
    
    sendResponse(res, 500, false, 'Server error while deleting maintenance request');
  }
};

// @desc    Get maintenance statistics
// @route   GET /api/facilities/maintenance/stats
// @access  Private (Admin)
exports.getMaintenanceStats = async (req, res) => {
  try {
    const stats = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const priorityStats = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRequests = await MaintenanceRequest.countDocuments();
    const completedThisWeek = await MaintenanceRequest.countDocuments({
      status: 'Completed',
      actualCompletion: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const responseData = {
      total: totalRequests,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byCategory: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byPriority: priorityStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      completedThisWeek
    };

    sendResponse(res, 200, true, 'Maintenance statistics retrieved successfully', responseData);

  } catch (error) {
    console.error('Error fetching maintenance statistics:', error);
    sendResponse(res, 500, false, 'Server error while fetching statistics');
  }
};