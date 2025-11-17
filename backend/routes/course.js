const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getAllCourses,
  getCourseById,
  getCoursesBySubject,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../utils/responseHelpers');
const { getMyCourses } = require('../controllers/courseController');
router.get('/api/curriculum/my-courses', protect, getMyCourses);

// Validation rules for creating a course
const createCourseValidation = [
  body('subjectId')
    .notEmpty()
    .withMessage('Subject is required')
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a valid positive integer'),
  
  body('semester')
    .notEmpty()
    .withMessage('Semester is required')
    .isIn(['Fall', 'Spring', 'Summer'])
    .withMessage('Semester must be Fall, Spring, or Summer'),
  
  body('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
  
  body('instructorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Instructor ID must be a valid positive integer'),
  
  body('maxEnrollment')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Max enrollment must be between 1 and 500'),
  
  body('schedule')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Schedule must not exceed 500 characters')
];

// Validation rules for updating a course
const updateCourseValidation = [
  body('subjectId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a valid positive integer'),
  
  body('semester')
    .optional()
    .isIn(['Fall', 'Spring', 'Summer'])
    .withMessage('Semester must be Fall, Spring, or Summer'),
  
  body('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
  
  body('instructorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Instructor ID must be a valid positive integer'),
  
  body('maxEnrollment')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Max enrollment must be between 1 and 500'),
  
  body('currentEnrollment')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current enrollment must be a non-negative integer'),
  
  body('schedule')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Schedule must not exceed 500 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// All routes require authentication
router.use(protect);

// Routes accessible to all authenticated users (GET)
// Routes that modify data require admin or staff role (POST, PUT, DELETE)

// Get courses by subject
router.get('/subject/:subjectId', getCoursesBySubject);

// Show Courses for Instructors
router.get('/my-courses', protect, getMyCourses);



router.route('/')
  .get(getAllCourses)
  .post(
    authorize('admin', 'staff','professor'),
    createCourseValidation,
    handleValidationErrors,
    createCourse
  );

router.route('/:id')
  .get(getCourseById)
  .put(
    authorize('admin', 'staff','professor'),
    updateCourseValidation,
    handleValidationErrors,
    updateCourse
  )
  .delete(authorize('admin'), deleteCourse);

module.exports = router;
