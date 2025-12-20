const applicationRepo = require('../repositories/applicationRepo');
const userRepo = require('../repositories/userRepo');
const { validationResult } = require('express-validator');
const { generateSecurePassword } = require('../utils/passwordValidator');
const { generateSequentialId, generateUniversityEmail } = require('../utils/idGenerator');
const bcrypt = require('bcryptjs');


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
      department,
      degreeLevel,
      search,
      sortBy = 'submitted_at',
      sortOrder = 'DESC',
      dateFrom,
      dateTo,
      nationality
    } = req.query;

    // Build filter options for repository
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    // Add filters if provided
    if (status && status !== 'all') {
      options.status = status;
    }

    if (department && department !== 'all') {
      options.department = department;
    }

    if (degreeLevel && degreeLevel !== 'all') {
      options.degreeLevel = degreeLevel;
    }

    if (search && search.trim()) {
      options.search = search.trim();
    }

    const result = await applicationRepo.getApplications(options);

    sendResponse(res, 200, true, 'Applications retrieved successfully', {
      applications: result.applications,
      pagination: result.pagination
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
    const application = await applicationRepo.getApplicationById(req.params.id);

    if (!application) {
      return sendResponse(res, 404, false, 'Application not found');
    }

    sendResponse(res, 200, true, 'Application retrieved successfully', application);

  } catch (error) {
    console.error('Error fetching application:', error);
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

    // Create application via repository
    const application = await applicationRepo.createApplication(req.body, req.user?.id);

    sendResponse(res, 201, true, 'Application created successfully', application);

  } catch (error) {
    console.error('Error creating application:', error);
    
    // Handle duplicate email error from database constraint
    if (error.code === 'ER_DUP_ENTRY') {
      return sendResponse(res, 409, false, 'An application with this email already exists');
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

    const application = await applicationRepo.getApplicationById(req.params.id);

    if (!application) {
      return sendResponse(res, 404, false, 'Application not found');
    }

    // Update application via repository
    const updatedApplication = await applicationRepo.updateApplication(
      req.params.id,
      req.body,
      req.user?.id
    );

    sendResponse(res, 200, true, 'Application updated successfully', updatedApplication);

  } catch (error) {
    console.error('Error updating application:', error);
    
    // Handle duplicate email error from database constraint
    if (error.code === 'ER_DUP_ENTRY') {
      return sendResponse(res, 409, false, 'An application with this email already exists');
    }
    
    sendResponse(res, 500, false, 'Server error while updating application');
  }
};


// Helper function to generate student credentials
async function generateStudentCredentials(intendedStartDate) {
  const year = new Date(intendedStartDate).getFullYear();
  
  // Generate sequential student ID based on year
  const studentId = await generateSequentialId('student', year);

  const temporaryPassword = generateSecurePassword(9);

  // Generate university email based on student ID
  const universityEmail = generateUniversityEmail(studentId);

  return {
    studentId,
    universityEmail,
    temporaryPassword
  };
}

// @desc    Update application status (Approve/Reject/etc.)
// @route   PUT /api/facilities/applications/:id/status
// @access  Private (Admin/Staff)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, rejectionReason, notes } = req.body;

    const application = await applicationRepo.getApplicationById(req.params.id);

    if (!application) {
      return sendResponse(res, 404, false, 'Application not found');
    }

    // Validate status
    const validStatuses = ['Pending Review', 'Under Review', 'Approved', 'Rejected', 'Waitlisted'];
    if (!validStatuses.includes(status)) {
      return sendResponse(res, 400, false, 'Invalid status');
    }

    // Build update payload
    const updateData = {
      status,
      processingInfo: {
        reviewedBy: req.user?.id,
        reviewedAt: new Date(),
        rejectionReason: status === 'Rejected' ? rejectionReason : null,
        notes: notes || null
      }
    };

    // Generate student credentials if application is approved and doesn't have credentials yet
    let credentials = null;
    if (status === 'Approved' && !application.studentCredentials?.studentId) {
      try {
        credentials = await generateStudentCredentials(application.academicInfo.intendedStartDate);

        updateData.studentCredentials = {
          studentId: credentials.studentId,
          universityEmail: credentials.universityEmail,
          temporaryPassword: credentials.temporaryPassword,
          credentialsGeneratedAt: new Date(),
          credentialsGeneratedBy: req.user?.id
        };

        console.log(`Generated student credentials for application ${application.applicationId}:`, {
          studentId: credentials.studentId,
          universityEmail: credentials.universityEmail,
          passwordGenerated: true // Don't log actual password
        });
      } catch (credentialsError) {
        console.error('Error generating student credentials:', credentialsError);
        return sendResponse(res, 500, false, 'Application status updated but failed to generate student credentials');
      }
    }

    // Update application status via repository
    const updatedApplication = await applicationRepo.updateApplicationStatus(
      req.params.id,
      {
        status: updateData.status,
        rejectionReason: updateData.processingInfo.rejectionReason,
        notes: updateData.processingInfo.notes,
        reviewerId: updateData.processingInfo.reviewedBy,
        studentCredentials: updateData.studentCredentials,
        accountCreated: updateData.accountCreated,
        accountCreatedAt: updateData.accountCreatedAt,
        accountCreatedBy: updateData.accountCreatedBy
      }
    );

    sendResponse(res, 200, true, `Application ${status.toLowerCase()} successfully`, updatedApplication);

  } catch (error) {
    console.error('Error updating application status:', error);
    sendResponse(res, 500, false, 'Server error while updating application');
  }
};

// @desc    Delete application
// @route   DELETE /api/facilities/applications/:id
// @access  Private (Admin only)
exports.deleteApplication = async (req, res) => {
  try {
    const application = await applicationRepo.getApplicationById(req.params.id);

    if (!application) {
      return sendResponse(res, 404, false, 'Application not found');
    }

    const deleted = await applicationRepo.deleteApplication(req.params.id);

    if (!deleted) {
      return sendResponse(res, 500, false, 'Failed to delete application');
    }

    sendResponse(res, 200, true, 'Application deleted successfully');

  } catch (error) {
    console.error('Error deleting application:', error);
    sendResponse(res, 500, false, 'Server error while deleting application');
  }
};

// @desc    Get filter options for dropdowns
// @route   GET /api/facilities/applications/filters
// @access  Private (Admin/Staff)
exports.getFilterOptions = async (req, res) => {
  try {
    // Comprehensive list of nationalities
    const nationalities = [
      'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine',
      'Armenian', 'Australian', 'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini',
      'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian', 'Belizean', 'Beninese',
      'Bhutanese', 'Bolivian', 'Bosnian', 'Brazilian', 'British', 'Bruneian', 'Bulgarian',
      'Burkinabe', 'Burmese', 'Burundian', 'Cambodian', 'Cameroonian', 'Canadian',
      'Cape Verdean', 'Central African', 'Chadian', 'Chilean', 'Chinese', 'Colombian',
      'Comoran', 'Congolese', 'Costa Rican', 'Croatian', 'Cuban', 'Cypriot', 'Czech',
      'Danish', 'Djiboutian', 'Dominican', 'Dutch', 'East Timorese', 'Ecuadorian',
      'Egyptian', 'Emirian', 'Equatorial Guinean', 'Eritrean', 'Estonian', 'Ethiopian',
      'Fijian', 'Filipino', 'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian',
      'German', 'Ghanaian', 'Greek', 'Grenadian', 'Guatemalan', 'Guinea-Bissauan',
      'Guinean', 'Guyanese', 'Haitian', 'Herzegovinian', 'Honduran', 'Hungarian',
      'Icelander', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli',
      'Italian', 'Ivorian', 'Jamaican', 'Japanese', 'Jordanian', 'Kazakhstani',
      'Kenyan', 'Kittian and Nevisian', 'Kuwaiti', 'Kyrgyz', 'Laotian', 'Latvian',
      'Lebanese', 'Liberian', 'Libyan', 'Liechtensteiner', 'Lithuanian', 'Luxembourgish',
      'Macedonian', 'Malagasy', 'Malawian', 'Malaysian', 'Maldivan', 'Malian', 'Maltese',
      'Marshallese', 'Mauritanian', 'Mauritian', 'Mexican', 'Micronesian', 'Moldovan',
      'Monacan', 'Mongolian', 'Moroccan', 'Mosotho', 'Motswana', 'Mozambican',
      'Namibian', 'Nauruan', 'Nepalese', 'New Zealander', 'Nicaraguan', 'Nigerian',
      'Nigerien', 'North Korean', 'Norwegian', 'Omani', 'Pakistani', 'Palauan',
      'Palestinian', 'Panamanian', 'Papua New Guinean', 'Paraguayan', 'Peruvian',
      'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Rwandan',
      'Saint Lucian', 'Salvadoran', 'Samoan', 'San Marinese', 'Sao Tomean',
      'Saudi Arabian', 'Scottish', 'Senegalese', 'Serbian', 'Seychellois',
      'Sierra Leonean', 'Singaporean', 'Slovakian', 'Slovenian', 'Solomon Islander',
      'Somali', 'South African', 'South Korean', 'Spanish', 'Sri Lankan', 'Sudanese',
      'Surinamer', 'Swazi', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Tajik',
      'Tanzanian', 'Thai', 'Togolese', 'Tongan', 'Trinidadian or Tobagonian',
      'Tunisian', 'Turkish', 'Tuvaluan', 'Ugandan', 'Ukrainian', 'Uruguayan',
      'Uzbekistani', 'Venezuelan', 'Vietnamese', 'Welsh', 'Yemenite', 'Zambian', 'Zimbabwean'
    ];

    // Get unique previous institutions from existing applications
    const institutions = await applicationRepo.getDistinctInstitutions();

    // Static options
    const departments = [
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
      departments,
      degreeLevels,
      statuses,
      nationalities: nationalities.sort(),
      institutions: institutions.sort()
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
    const stats = await applicationRepo.getStatistics();

    sendResponse(res, 200, true, 'Application statistics retrieved successfully', stats);

  } catch (error) {
    console.error('Error fetching application statistics:', error);
    sendResponse(res, 500, false, 'Server error while fetching statistics');
  }
};

// @desc    Get student credentials for approved application (Admin only)
// @route   GET /api/facilities/applications/:id/credentials
// @access  Private (Admin only) edit
exports.getStudentCredentials = async (req, res) => {
  try {
    const application = await applicationRepo.getStudentCredentialsForApplication(req.params.id);

    if (!application) {
      return sendResponse(res, 404, false, 'Application not found');
    }

    if (!application.studentId) {
      return sendResponse(res, 400, false, 'Student credentials not generated yet');
    }

    // Return credentials
    const credentials = {
      studentId: application.studentId,
      universityEmail: application.universityEmail,
      temporaryPassword: application.temporaryPassword,
      credentialsGeneratedAt: application.credentialsGeneratedAt
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
  try {
    console.log(`Creating student account for application ID: ${req.params.id}`);
    
    const application = await applicationRepo.getApplicationById(req.params.id);

    if (!application) {
      console.error(`Application not found: ${req.params.id}`);
      return sendResponse(res, 404, false, 'Application not found');
    }

    console.log(`Application found:`, {
      id: application.id,
      status: application.status,
      hasCredentials: !!application.studentCredentials?.studentId
    });

    if (application.status !== 'Approved') {
      console.error(`Application status is not Approved: ${application.status}`);
      return sendResponse(res, 400, false, 'Application must be approved to create student account');
    }

    if (!application.studentCredentials?.studentId) {
      console.error(`Student credentials not generated for application: ${req.params.id}`);
      return sendResponse(res, 400, false, 'Student credentials not generated yet');
    }

    // Check if account already created
    if (application.studentCredentials?.accountCreated) {
      console.warn(`Account already created for application: ${req.params.id}`);
      return sendResponse(res, 409, false, 'Student account has already been created for this application');
    }

    // Check if user account already exists
    console.log(`Checking if user already exists with email: ${application.studentCredentials.universityEmail}`);
    const existingUserByEmail = await userRepo.getUserByEmail(application.studentCredentials.universityEmail);
    const existingUserByStudentId = await userRepo.getUserByStudentId(application.studentCredentials.studentId);

    if (existingUserByEmail || existingUserByStudentId) {
      console.error(`User already exists with email or student ID`);
      return sendResponse(res, 409, false, 'Student account already exists with this email or student ID');
    }

    // Hash the temporary password before storing
    console.log(`Hashing password for student: ${application.studentCredentials.studentId}`);
    const hashedPassword = await bcrypt.hash(application.studentCredentials.temporaryPassword, 10);

    // Create new student user account via userRepo
    console.log(`Creating user in database for student: ${application.studentCredentials.studentId}`);
    const newUser = await userRepo.createUser({
      firstName: application.personalInfo.firstName,
      lastName: application.personalInfo.lastName,
      email: application.studentCredentials.universityEmail,
      password: hashedPassword,
      role: 'student',
      studentId: application.studentCredentials.studentId,
      phoneNumber: application.personalInfo.phone,
      department: application.personalInfo.department,
      major: application.academicInfo.major,
      isActive: true,
      isEmailVerified: false,
      firstLogin: true,
      mustChangePassword: true,
      securityQuestion: null,
      securityAnswer: null,
      createdAt: new Date(),
      // Include role-specific details
      roleDetails: {
        student_id: application.studentCredentials.studentId,
        enrollment_date: new Date(),
        major: application.academicInfo.major,
        year: 1, // Freshmen by default
        gpa: null
      }
    });

    console.log(`User created successfully:`, {
      userId: newUser.id,
      studentId: newUser.studentId,
      email: newUser.email
    });

    // Mark account as created in the application record
    console.log(`Marking account as created in application: ${req.params.id}`);
    const updatedApplication = await applicationRepo.markAccountCreated(
      req.params.id,
      req.user?.id
    );

    console.log(`Student account created successfully for application ${application.applicationId}:`, {
      studentId: newUser.studentId,
      email: newUser.email,
      userId: newUser.id,
      createdAt: new Date()
    });

    sendResponse(res, 201, true, 'Student account created successfully', {
      user: {
        id: newUser.id,
        studentId: newUser.studentId,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role
      },
      application: {
        id: updatedApplication.id,
        applicationId: updatedApplication.applicationId,
        status: updatedApplication.status
      },
      accountCreatedAt: new Date()
    });

  } catch (error) {
    console.error('Error creating student account:', error);
    console.error('Error stack:', error.stack);

    // Handle duplicate email/student ID error from database constraint
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('Duplicate entry error:', error.message);
      return sendResponse(res, 409, false, 'Student account with this email or student ID already exists');
    }

    sendResponse(res, 500, false, `Server error while creating student account: ${error.message}`);
  }
};