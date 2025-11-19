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
      sortOrder = 'desc',
      dateFrom,
      dateTo,
      nationality
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
    
    if (nationality && nationality !== 'all') {
      filter['personalInfo.nationality'] = nationality;
    }
    
    // Date range filtering
    if (dateFrom || dateTo) {
      filter.submittedAt = {};
      if (dateFrom) {
        filter.submittedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.submittedAt.$lte = new Date(dateTo);
      }
    }
    
    // Search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { 'personalInfo.firstName': searchRegex },
        { 'personalInfo.lastName': searchRegex },
        { 'personalInfo.email': searchRegex },
        { applicationId: searchRegex },
        { 'academicInfo.program': searchRegex },
        { 'personalInfo.nationality': searchRegex },
        { 'academicInfo.previousEducation.institution': searchRegex }
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

// @desc    Update entire application (Edit mode)
// @route   PUT /api/facilities/applications/:id
// @access  Private (Admin only)
exports.updateApplication = async (req, res) => {
  try {
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation failed', null, errors.array());
    }

    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return sendResponse(res, 404, false, 'Application not found');
    }

    // Check if another application exists with the same email (excluding current one)
    if (req.body.personalInfo?.email && req.body.personalInfo.email !== application.personalInfo.email) {
      const existingApplication = await Application.findOne({
        'personalInfo.email': req.body.personalInfo.email,
        _id: { $ne: req.params.id }
      });

      if (existingApplication) {
        return sendResponse(res, 409, false, 'An application with this email already exists');
      }
    }

    // Update application fields
    Object.assign(application, req.body);
    
    // Update processing info
    application.processingInfo.lastModifiedBy = req.user._id;
    application.processingInfo.lastModified = new Date();
    
    await application.save();

    sendResponse(res, 200, true, 'Application updated successfully', application);

  } catch (error) {
    console.error('Error updating application:', error);
    
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
    
    sendResponse(res, 500, false, 'Server error while updating application');
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

    // Generate student credentials if application is approved and credentials don't exist
    if (status === 'Approved' && !application.studentCredentials.studentId) {
      try {
        const credentials = await Application.generateStudentCredentials(application.academicInfo.intendedStartDate);
        
        application.studentCredentials.studentId = credentials.studentId;
        application.studentCredentials.universityEmail = credentials.universityEmail;
        application.studentCredentials.temporaryPassword = credentials.temporaryPassword;
        application.studentCredentials.credentialsGeneratedAt = new Date();
        application.studentCredentials.credentialsGeneratedBy = req.user._id;
        
        console.log(`Generated student credentials for application ${application.applicationId}:`, {
          studentId: credentials.studentId,
          universityEmail: credentials.universityEmail,
          passwordGenerated: true // Don't log actual password
        });
      } catch (credentialsError) {
        console.error('Error generating student credentials:', credentialsError);
        return sendResponse(res, 500, false, 'Application approved but failed to generate student credentials');
      }
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

// @desc    Get filter options for dropdowns
// @route   GET /api/facilities/applications/filters
// @access  Private (Admin/Staff)
exports.getFilterOptions = async (req, res) => {
  try {
    // Get unique nationalities from existing applications
    const nationalities = await Application.distinct('personalInfo.nationality');
    
    // Get unique previous institutions
    const institutions = await Application.distinct('academicInfo.previousEducation.institution');
    
    // Static options
    const programs = [
      'Computer Science',
      'Engineering',
      'Business Administration',
      'Medicine',
      'Law',
      'Arts',
      'Sciences',
      'Education',
      'Nursing',
      'Economics'
    ];
    
    const degreeLevels = ['Bachelor', 'Master', 'Doctorate', 'Certificate'];
    const statuses = ['Pending Review', 'Under Review', 'Approved', 'Rejected', 'Waitlisted'];
    
    const filterOptions = {
      programs,
      degreeLevels,
      statuses,
      nationalities: nationalities.filter(n => n).sort(),
      institutions: institutions.filter(i => i).sort()
    };

    sendResponse(res, 200, true, 'Filter options retrieved successfully', filterOptions);

  } catch (error) {
    console.error('Error fetching filter options:', error);
    sendResponse(res, 500, false, 'Server error while fetching filter options');
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

// @desc    Get student credentials for approved application (Admin only)
// @route   GET /api/facilities/applications/:id/credentials
// @access  Private (Admin only)
exports.getStudentCredentials = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).select('+studentCredentials.temporaryPassword');
    
    if (!application) {
      return sendResponse(res, 404, false, 'Application not found');
    }

    if (application.status !== 'Approved') {
      return sendResponse(res, 400, false, 'Application must be approved to retrieve credentials');
    }

    if (!application.studentCredentials.studentId) {
      return sendResponse(res, 400, false, 'Student credentials not generated yet');
    }

    // Only return credentials to authorized admin
    const credentials = {
      studentId: application.studentCredentials.studentId,
      universityEmail: application.studentCredentials.universityEmail,
      temporaryPassword: application.studentCredentials.temporaryPassword,
      applicantName: `${application.personalInfo.firstName} ${application.personalInfo.lastName}`,
      credentialsGeneratedAt: application.studentCredentials.credentialsGeneratedAt
    };

    sendResponse(res, 200, true, 'Student credentials retrieved successfully', credentials);

  } catch (error) {
    console.error('Error retrieving student credentials:', error);
    sendResponse(res, 500, false, 'Server error while retrieving credentials');
  }
};

// @desc    Create student account from approved application
// @route   POST /api/facilities/applications/:id/create-account
// @access  Private (Admin only)
exports.createStudentAccount = async (req, res) => {
  const User = require('../models/User');
  
  try {
    const application = await Application.findById(req.params.id).select('+studentCredentials.temporaryPassword');
    
    if (!application) {
      return sendResponse(res, 404, false, 'Application not found');
    }

    if (application.status !== 'Approved') {
      return sendResponse(res, 400, false, 'Application must be approved to create student account');
    }

    if (!application.studentCredentials.studentId) {
      return sendResponse(res, 400, false, 'Student credentials not generated yet');
    }

    // Check if user account already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: application.studentCredentials.universityEmail },
        { studentId: application.studentCredentials.studentId }
      ]
    });

    if (existingUser) {
      return sendResponse(res, 409, false, 'Student account already exists');
    }

    // Create new student user account
    const newUser = new User({
      firstName: application.personalInfo.firstName,
      lastName: application.personalInfo.lastName,
      email: application.studentCredentials.universityEmail,
      password: application.studentCredentials.temporaryPassword,
      role: 'student',
      studentId: application.studentCredentials.studentId,
      phoneNumber: application.personalInfo.phone,
      isActive: true,
      isEmailVerified: false, // Will be verified on first login
      mustChangePassword: true, // Custom field to force password change
      firstLogin: true // Custom field to identify first-time login
    });

    await newUser.save();

    // Update application to mark account as created
    application.studentCredentials.accountCreated = true;
    application.studentCredentials.accountCreatedAt = new Date();
    application.studentCredentials.accountCreatedBy = req.user._id;
    await application.save();

    sendResponse(res, 201, true, 'Student account created successfully', {
      studentId: newUser.studentId,
      email: newUser.email,
      accountCreatedAt: new Date()
    });

  } catch (error) {
    console.error('Error creating student account:', error);
    
    if (error.code === 11000) {
      return sendResponse(res, 409, false, 'Student account with this email or ID already exists');
    }
    
    sendResponse(res, 500, false, 'Server error while creating student account');
  }
};