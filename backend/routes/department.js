const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../utils/responseHelpers');

// Validation rules for creating a department
const createDepartmentValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Department name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Department name must be between 2 and 255 characters'),
  
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Department code is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Department code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Department code must contain only uppercase letters and numbers'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Validation rules for updating a department
const updateDepartmentValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department name cannot be empty')
    .isLength({ min: 2, max: 255 })
    .withMessage('Department name must be between 2 and 255 characters'),
  
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department code cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Department code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Department code must contain only uppercase letters and numbers'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// All routes require authentication
router.use(protect);

// Routes accessible to all authenticated users (GET)
// Routes that modify data require admin or staff role (POST, PUT, DELETE)

router.route('/')
  .get(getAllDepartments)
  .post(
    authorize('admin', 'staff'),
    createDepartmentValidation,
    handleValidationErrors,
    createDepartment
  );

router.route('/:id')
  .get(getDepartmentById)
  .put(
    authorize('admin', 'staff'),
    updateDepartmentValidation,
    handleValidationErrors,
    updateDepartment
  )
  .delete(authorize('admin'), deleteDepartment);

module.exports = router;