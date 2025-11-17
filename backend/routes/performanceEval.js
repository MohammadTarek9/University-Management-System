const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const {
  createPerformance,
  getPerformance,
  listPerformances,
  updatePerformance,
  deletePerformance
} = require('../controllers/performanceEvalController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../utils/responseHelpers');

// All routes require authentication
router.use(protect);

// Validation rules
const createValidation = [
  body('userId').isInt().withMessage('userId is required and must be an integer'),
  body('evaluationDate').isISO8601().withMessage('evaluationDate is required and must be a valid date'),
  body('evaluatorId').optional().isInt().withMessage('evaluatorId must be an integer'),
  body('score').optional().isNumeric().withMessage('score must be a number'),
  body('rating').optional().isIn(['Outstanding','Exceeds Expectations','Meets Expectations','Needs Improvement','Unsatisfactory']),
  body('comments').optional().isString(),
  body('actionPlan').optional().isString(),
  body('reviewed').optional().isBoolean(),
  body('reviewDate').optional().isISO8601()
];

const updateValidation = [
  body('userId').optional().isInt(),
  body('evaluationDate').optional().isISO8601(),
  body('evaluatorId').optional().isInt(),
  body('score').optional().isNumeric(),
  body('rating').optional().isIn(['Outstanding','Exceeds Expectations','Meets Expectations','Needs Improvement','Unsatisfactory']),
  body('comments').optional().isString(),
  body('actionPlan').optional().isString(),
  body('reviewed').optional().isBoolean(),
  body('reviewDate').optional().isISO8601()
];

// Routes
router.get('/', listPerformances);
router.post('/', authorize('admin'), createValidation, handleValidationErrors, createPerformance);
router.get('/:id', getPerformance);
router.put('/:id', authorize('admin'), updateValidation, handleValidationErrors, updatePerformance);
router.delete('/:id', authorize('admin'), deletePerformance);

module.exports = router;
