const express = require('express');
const { body } = require('express-validator');
const {
  getAllApplications,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
  getApplicationStats
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Application validation rules
const applicationValidation = [
  // Personal Information Validation
  body('personalInfo.firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  
  body('personalInfo.lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
    
  body('personalInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('personalInfo.phone')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Phone number must be between 1 and 20 characters'),
    
  body('personalInfo.dateOfBirth')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date of birth'),
    
  body('personalInfo.nationality')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Nationality must be between 1 and 50 characters'),
    
  // Address Validation
  body('personalInfo.address.street')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Street address must be between 1 and 100 characters'),
    
  body('personalInfo.address.city')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('City must be between 1 and 50 characters'),
    
  body('personalInfo.address.state')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('State/Province must be between 1 and 50 characters'),
    
  body('personalInfo.address.zipCode')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('ZIP/Postal code must be between 1 and 20 characters'),
    
  body('personalInfo.address.country')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Country must be between 1 and 50 characters'),
    
  // Academic Information Validation
  body('academicInfo.program')
    .isIn([
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
    ])
    .withMessage('Please select a valid program'),
    
  body('academicInfo.degreeLevel')
    .isIn(['Bachelor', 'Master', 'Doctorate', 'Certificate'])
    .withMessage('Please select a valid degree level'),
    
  body('academicInfo.intendedStartDate')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid intended start date'),
    
  // Previous Education Validation
  body('academicInfo.previousEducation.institution')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Institution name must be between 1 and 100 characters'),
    
  body('academicInfo.previousEducation.degree')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Degree name must be between 1 and 100 characters'),
    
  body('academicInfo.previousEducation.graduationDate')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid graduation date'),
    
  body('academicInfo.previousEducation.gpa')
    .optional()
    .isFloat({ min: 0, max: 4.0 })
    .withMessage('GPA must be between 0 and 4.0')
];

// Status update validation
const statusUpdateValidation = [
  body('status')
    .isIn(['Pending Review', 'Under Review', 'Approved', 'Rejected', 'Waitlisted'])
    .withMessage('Please provide a valid status'),
    
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Rejection reason cannot exceed 500 characters'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// Apply authentication to all routes
router.use(protect);

// GET /api/facilities/applications/stats - Get application statistics
router.get('/stats', authorize(['admin', 'staff']), getApplicationStats);

// GET /api/facilities/applications - Get all applications (Admin, Staff can view)
router.get('/', authorize(['admin', 'staff']), getAllApplications);

// POST /api/facilities/applications - Create new application (Admin only)
router.post('/', authorize(['admin']), applicationValidation, createApplication);

// GET /api/facilities/applications/:id - Get single application
router.get('/:id', authorize(['admin', 'staff']), getApplicationById);

// PUT /api/facilities/applications/:id/status - Update application status (Admin, Staff)
router.put('/:id/status', authorize(['admin', 'staff']), statusUpdateValidation, updateApplicationStatus);

// DELETE /api/facilities/applications/:id - Delete application (Admin only)
router.delete('/:id', authorize(['admin']), deleteApplication);

module.exports = router;