const Application = require('../models/Application');
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

// @desc    Get all applications with pagination, filtering, and search
// @route   GET /api/facilities/applications
// @access  Private (Admin/Staff)
exports.getAllApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      program,
      degreeLevel,
      search,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (program && program !== 'all') {
      filter['academicInfo.program'] = program;
    }
    
    if (degreeLevel && degreeLevel !== 'all') {
      filter['academicInfo.degreeLevel'] = degreeLevel;
    }
    
    // Search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { 'personalInfo.firstName': searchRegex },
        { 'personalInfo.lastName': searchRegex },
        { 'personalInfo.email': searchRegex },
        { applicationId: searchRegex },
        { 'academicInfo.program': searchRegex }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute queries
    const [applications, totalApplications] = await Promise.all([
      Application.find(filter)
        .populate('processingInfo.reviewedBy', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Application.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalApplications / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    sendResponse(res, 200, true, 'Applications retrieved successfully', {
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalApplications,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    sendResponse(res, 500, false, 'Server error while fetching applications');
  }
};

// @desc    Get single application by ID
// @route   GET /api/facilities/applications/:id
// @access  Private (Admin/Staff)
exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('processingInfo.reviewedBy', 'firstName lastName email role');

    if (!application) {
      return sendResponse(res, 404, false, 'Application not found');
    }

    sendResponse(res, 200, true, 'Application retrieved successfully', application);

  } catch (error) {
    console.error('Error fetching application:', error);
    
    if (error.name === 'CastError') {
      return sendResponse(res, 400, false, 'Invalid application ID');
    }
    
    sendResponse(res, 500, false, 'Server error while fetching application');
  }
};

// @desc    Create new application
// @route   POST /api/facilities/applications
// @access  Private (Admin only - for admin-added entries)
exports.createApplication = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation failed', null, errors.array());
    }

    // Check if application with same email already exists
    const existingApplication = await Application.findOne({
      'personalInfo.email': req.body.personalInfo.email
    });

    if (existingApplication) {
      return sendResponse(res, 409, false, 'An application with this email already exists');
    }

    // Create new application
    const application = new Application(req.body);
    
    // Set initial processing info
    application.processingInfo.reviewedBy = req.user._id;
    
    await application.save();

    sendResponse(res, 201, true, 'Application created successfully', application);

  } catch (error) {
    console.error('Error creating application:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return sendResponse(res, 400, false, 'Validation failed', null, validationErrors);
    }
    
    if (error.code === 11000) {
      return sendResponse(res, 409, false, 'Application with this information already exists');
    }
    
    sendResponse(res, 500, false, 'Server error while creating application');
  }
};

// @desc    Update application status (Approve/Reject/etc.)
// @route   PUT /api/facilities/applications/:id/status
// @access  Private (Admin/Staff)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, rejectionReason, notes } = req.body;
    
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return sendResponse(res, 404, false, 'Application not found');
    }

    // Validate status
    const validStatuses = ['Pending Review', 'Under Review', 'Approved', 'Rejected', 'Waitlisted'];
    if (!validStatuses.includes(status)) {
      return sendResponse(res, 400, false, 'Invalid status');
    }

    // Update application
    application.status = status;
    application.processingInfo.reviewedBy = req.user._id;
    application.processingInfo.reviewedAt = new Date();
    
    if (status === 'Rejected' && rejectionReason) {
      application.processingInfo.rejectionReason = rejectionReason;
    }
    
    if (notes) {
      application.processingInfo.notes = notes;
    }

    await application.save();

    // Populate reviewer info for response
    await application.populate('processingInfo.reviewedBy', 'firstName lastName email');

    sendResponse(res, 200, true, `Application ${status.toLowerCase()} successfully`, application);

  } catch (error) {
    console.error('Error updating application status:', error);
    
    if (error.name === 'CastError') {
      return sendResponse(res, 400, false, 'Invalid application ID');
    }
    
    sendResponse(res, 500, false, 'Server error while updating application');
  }
};

// @desc    Delete application
// @route   DELETE /api/facilities/applications/:id
// @access  Private (Admin only)
exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return sendResponse(res, 404, false, 'Application not found');
    }

    await Application.findByIdAndDelete(req.params.id);

    sendResponse(res, 200, true, 'Application deleted successfully');

  } catch (error) {
    console.error('Error deleting application:', error);
    
    if (error.name === 'CastError') {
      return sendResponse(res, 400, false, 'Invalid application ID');
    }
    
    sendResponse(res, 500, false, 'Server error while deleting application');
  }
};

// @desc    Get application statistics
// @route   GET /api/facilities/applications/stats
// @access  Private (Admin/Staff)
exports.getApplicationStats = async (req, res) => {
  try {
    const stats = await Application.getStatistics();
    
    // Additional statistics
    const recentApplications = await Application.countDocuments({
      submittedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });
    
    const programStats = await Application.aggregate([
      {
        $group: {
          _id: '$academicInfo.program',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const responseData = {
      ...stats,
      recentApplications,
      byProgram: programStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };

    sendResponse(res, 200, true, 'Application statistics retrieved successfully', responseData);

  } catch (error) {
    console.error('Error fetching application statistics:', error);
    sendResponse(res, 500, false, 'Server error while fetching statistics');
  }
};