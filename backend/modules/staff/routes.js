const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');

// Import leave request routes
const leaveRequestRoutes = require('../../routes/leaveRequestRoutes');

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
      'GET /api/staff/leave-requests - leave request management'
    ]
  });
});

// Mount leave request management routes
router.use('/leave-requests', leaveRequestRoutes);
// router.get('/directory', protect, getStaffDirectory);
// router.get('/performance', protect, authorize('admin', 'staff'), getPerformanceData);
// router.get('/payroll', protect, getPayrollInfo);
// router.post('/leave-requests', protect, createLeaveRequest);

module.exports = router;