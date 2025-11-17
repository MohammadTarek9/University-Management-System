const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const enrollmentController = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../utils/responseHelpers');

// All enrollment routes require authentication
router.use(protect);

/**
 * @route   POST /api/enrollments
 * @desc    Register for a course
 * @access  Private/Student
 */
router.post(
  '/',
  authorize('student'),
  [
    body('courseId')
      .notEmpty()
      .withMessage('Course ID is required')
      .isInt({ min: 1 })
      .withMessage('Course ID must be a valid positive integer'),
    handleValidationErrors
  ],
  enrollmentController.registerForCourse
);

/**
 * @route   GET /api/enrollments/my-enrollments
 * @desc    Get student's enrollments
 * @access  Private/Student
 */
router.get(
  '/my-enrollments',
  authorize('student'),
  enrollmentController.getMyEnrollments
);

/**
 * @route   GET /api/enrollments/available-courses
 * @desc    Get available courses for registration
 * @access  Private/Student
 */
router.get(
  '/available-courses',
  authorize('student'),
  enrollmentController.getAvailableCourses
);

/**
 * @route   PUT /api/enrollments/:enrollmentId/drop
 * @desc    Drop a course
 * @access  Private/Student
 */
router.put(
  '/:enrollmentId/drop',
  authorize('student'),
  [
    param('enrollmentId')
      .isInt({ min: 1 })
      .withMessage('Enrollment ID must be a valid positive integer'),
    handleValidationErrors
  ],
  enrollmentController.dropCourse
);

/**
 * @route   GET /api/enrollments/pending
 * @desc    Get all pending enrollment requests
 * @access  Private/Admin
 */
router.get(
  '/pending',
  authorize('admin'),
  enrollmentController.getPendingEnrollments
);

/**
 * @route   PUT /api/enrollments/:enrollmentId/approve
 * @desc    Approve an enrollment request
 * @access  Private/Admin
 */
router.put(
  '/:enrollmentId/approve',
  authorize('admin'),
  [
    param('enrollmentId')
      .isInt({ min: 1 })
      .withMessage('Enrollment ID must be a valid positive integer'),
    handleValidationErrors
  ],
  enrollmentController.approveEnrollment
);

/**
 * @route   PUT /api/enrollments/:enrollmentId/reject
 * @desc    Reject an enrollment request
 * @access  Private/Admin
 */
router.put(
  '/:enrollmentId/reject',
  authorize('admin'),
  [
    param('enrollmentId')
      .isInt({ min: 1 })
      .withMessage('Enrollment ID must be a valid positive integer'),
    handleValidationErrors
  ],
  enrollmentController.rejectEnrollment
);

/**
 * @route   GET /api/enrollments/course/:courseId
 * @desc    Get enrollments for a course (for instructors)
 * @access  Private/Instructor/Admin/Staff
 */
router.get(
  '/course/:courseId',
  authorize('instructor', 'admin', 'staff'),
  [
    param('courseId')
      .isInt({ min: 1 })
      .withMessage('Course ID must be a valid positive integer'),
    handleValidationErrors
  ],
  enrollmentController.getCourseEnrollments
);

module.exports = router;
