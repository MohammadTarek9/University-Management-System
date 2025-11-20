const express = require('express');
const { body } = require('express-validator');
const {
  createMaintenanceRequest,
  getAllMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequestStatus,
  submitFeedback,
  getMaintenanceStats
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Maintenance request validation rules
const maintenanceValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  
  body('category')
    .isIn(['Electrical', 'Plumbing', 'HVAC', 'Furniture', 'Equipment', 'Structural', 'Cleaning', 'Other'])
    .withMessage('Please select a valid category'),
  
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('Please select a valid priority'),
  
  body('location.building')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Building is required'),
  
  body('location.roomNumber')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Room number is required')
];

// Feedback validation
const feedbackValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

// Apply authentication to all routes
router.use(protect);

// GET /api/facilities/maintenance/stats - Get maintenance statistics (Admin only)
router.get('/stats', authorize(['admin']), getMaintenanceStats);

// GET /api/facilities/maintenance - Get all maintenance requests
router.get('/', getAllMaintenanceRequests);

// POST /api/facilities/maintenance - Create new maintenance request 
router.post('/', maintenanceValidation, createMaintenanceRequest);

// GET /api/facilities/maintenance/:id - Get single maintenance request
router.get('/:id', getMaintenanceRequestById);

// PUT /api/facilities/maintenance/:id/status - Update maintenance request status (Admin only)
router.put('/:id/status', authorize(['admin']), updateMaintenanceRequestStatus);

// POST /api/facilities/maintenance/:id/feedback - Submit feedback (Student only)
router.post('/:id/feedback', authorize(['student']), feedbackValidation, submitFeedback);

module.exports = router;