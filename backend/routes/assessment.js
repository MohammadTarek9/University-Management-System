const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getAssessmentsByCourse,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  submitAssessment,
  getAssessmentSubmissions,
  getMySubmission
} = require('../controllers/assessmentController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../utils/responseHelpers');

// Validation rules for creating assessment
const createAssessmentValidation = [
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .isInt({ min: 1 })
    .withMessage('Valid course ID is required'),
  
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Assessment title is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  
  body('assessmentType')
    .notEmpty()
    .withMessage('Assessment type is required')
    .isIn(['quiz', 'assignment', 'exam', 'project'])
    .withMessage('Invalid assessment type'),
  
  body('totalPoints')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Total points must be between 1 and 1000'),
  
  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Valid due date is required')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  
  body('availableFrom')
    .optional()
    .isISO8601()
    .withMessage('Valid available from date required'),
  
  body('availableUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid available until date required'),
  
  body('durationMinutes')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Duration must be between 1 and 600 minutes'),
  
  body('maxAttempts')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Max attempts must be between 1 and 10')
];

// Validation for updating assessment
const updateAssessmentValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Valid due date is required')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  
  body('assessmentType')
    .optional()
    .isIn(['quiz', 'assignment', 'exam', 'project'])
    .withMessage('Invalid assessment type')
];

// Validation for submission
const submitAssessmentValidation = [
  body('answers')
    .isArray()
    .withMessage('Answers must be an array'),
  
  body('answers.*.questionId')
    .isInt({ min: 1 })
    .withMessage('Valid question ID required'),
  
  body('answers.*.answerText')
    .notEmpty()
    .withMessage('Answer text is required'),
  
  body('timeSpentMinutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a positive number')
];

// All routes require authentication
router.use(protect);

// Get assessments by course - accessible to all authenticated users
router.get('/course/:courseId', getAssessmentsByCourse);

// Get single assessment and student's own submission
router.get('/:id', getAssessmentById);
router.get('/:id/my-submission', getMySubmission);

// Create, update, delete - faculty only
router.post(
  '/',
  authorize('professor', 'ta', 'admin'),
  createAssessmentValidation,
  handleValidationErrors,
  createAssessment
);

router.put(
  '/:id',
  authorize('professor', 'ta', 'admin'),
  updateAssessmentValidation,
  handleValidationErrors,
  updateAssessment
);

router.delete(
  '/:id',
  authorize('professor', 'admin'),
  deleteAssessment
);

// Submit assessment - students only
router.post(
  '/:id/submit',
  authorize('student'),
  submitAssessmentValidation,
  handleValidationErrors,
  submitAssessment
);

// Get submissions - faculty only
router.get(
  '/:id/submissions',
  authorize('professor', 'ta', 'admin'),
  getAssessmentSubmissions
);

module.exports = router;