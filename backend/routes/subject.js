const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getAllSubjects,
  getSubjectById,
  getSubjectsByDepartment,
  createSubject,
  updateSubject,
  deleteSubject,
  updateSubjectSemester,
  getSubjectsBySemester,
  getAvailableSubjects, 
} = require('../controllers/subjectController');

const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../utils/responseHelpers');

// Validation rules for creating a subject
const createSubjectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Subject name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Subject name must be between 2 and 255 characters'),
  
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Subject code is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Subject code must contain only uppercase letters and numbers'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  
  body('credits')
    .notEmpty()
    .withMessage('Credits are required')
    .isFloat({ min: 0.5, max: 10.0 })
    .withMessage('Credits must be a number between 0.5 and 10.0'),
  
  body('classification')
    .notEmpty()
    .withMessage('Classification is required')
    .isIn(['core', 'elective'])
    .withMessage('Classification must be either "core" or "elective"'),
  
  body('departmentId')
    .notEmpty()
    .withMessage('Department is required')
    .isInt({ min: 1 })
    .withMessage('Department ID must be a valid positive integer'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

    
 body('semester')
  .optional({ nullable: true })
  .trim()
  .custom(value => {
    if (!value) return true; // allow null/empty = clear semester
    const valid = ['Fall', 'Spring', 'Summer'];
    return valid.includes(value);
  }).withMessage('Semester must be Fall, Spring, or Summer'),
body('academicYear')
  .optional({ nullable: true })
  .trim()
  .custom(value => {
    if (!value) return true; // allow missing/empty
    return /^\d{4}-\d{4}$/.test(value);
  }).withMessage('Academic year must be in format YYYY-YYYY e.g., 2024-2025'),

];

// Validation rules for updating a subject
const updateSubjectValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Subject name cannot be empty')
    .isLength({ min: 2, max: 255 })
    .withMessage('Subject name must be between 2 and 255 characters'),
  
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Subject code cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Subject code must contain only uppercase letters and numbers'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  
  body('credits')
    .optional()
    .isFloat({ min: 0.5, max: 10.0 })
    .withMessage('Credits must be a number between 0.5 and 10.0'),
  
  body('classification')
    .optional()
    .isIn(['core', 'elective'])
    .withMessage('Classification must be either "core" or "elective"'),
  
  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Department ID must be a valid positive integer'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Add validation for semester update
const updateSemesterValidation = [
  body('semester')
    .optional({ nullable: true })
    .trim()
    .custom((value) => {
      if (!value) return true; // allow null/empty → clear semester
      const valid = ['Fall', 'Spring', 'Summer'];
      return valid.includes(value);
    })
    .withMessage('Semester must be Fall, Spring, or Summer'),
  body('academicYear')
    .optional({ nullable: true })
    .trim()
    .custom((value) => {
      if (!value) return true; // allow missing/empty
      return /^\d{4}-\d{4}$/.test(value);
    })
    .withMessage('Academic year must be in format YYYY-YYYY e.g., 2024-2025'),
];



// All routes require authentication
router.use(protect);

// Routes accessible to all authenticated users (GET)
// Routes that modify data require admin or staff role (POST, PUT, DELETE)


router.route('/semester/:semester')
  .get(getSubjectsBySemester);

router.route('/:id/semester')
  .put(
    authorize('admin', 'staff'),
    updateSemesterValidation,
    handleValidationErrors,
    updateSubjectSemester
  );

router.route('/')
  .get(getAllSubjects)
  .post(
    authorize('admin', 'staff'),
    createSubjectValidation,
    handleValidationErrors,
    createSubject
  );

// Special route for getting subjects by department (must come before /:id)
router.route('/department/:departmentId')
  .get(getSubjectsByDepartment);

router.route('/:id')
  .get(getSubjectById)
  .put(
    authorize('admin', 'staff'),
    updateSubjectValidation,
    handleValidationErrors,
    updateSubject
  )
  .delete(authorize('admin'), deleteSubject);




module.exports = router;