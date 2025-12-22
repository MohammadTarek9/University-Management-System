const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
  assignTaResponsibility,
  getEligibleTAs,
  getMyTaResponsibilities,
} = require('../../controllers/taAssignmentController');


// Import leave request routes
const leaveRequestRoutes = require('../../routes/leaveRequestRoutes');
const staffDirectoryRoutes = require('../../routes/staffDirectoryRoutes');

// Placeholder routes for future implementation
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Staff module is active',
    features: [
      'Professor and Teaching Assistant Management',
      'Performance Tracking',
      'Payroll and Human Resources Integration'
    ],
    activeRoutes: [
      'GET /api/staff/leave-requests - leave request management',
      'GET /api/staff/directory - teaching staff directory'
    ]
  });
});

// Mount leave request management routes
router.use('/leave-requests', leaveRequestRoutes);
router.use('/directory', staffDirectoryRoutes);
// Assign TA responsibilities (professors only)
router.post(
  '/ta-assignments',
  protect,
  authorize('professor'),           
  assignTaResponsibility
);

// Get eligible TAs for assignment (professors only)
router.get(
  '/ta-eligible',
  protect,
  authorize('professor'),
  getEligibleTAs
);

// TA’s own responsibilities
router.get(
  '/my-ta-responsibilities',
  protect,
  authorize('ta'),
  getMyTaResponsibilities
);




// router.get('/directory', protect, getStaffDirectory);
// router.get('/performance', protect, authorize('admin', 'staff'), getPerformanceData);
// router.get('/payroll', protect, getPayrollInfo);
// router.post('/leave-requests', protect, createLeaveRequest);

module.exports = router;