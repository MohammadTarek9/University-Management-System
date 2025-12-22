const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');

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
// router.get('/performance', protect, authorize('admin', 'staff'), getPerformanceData);
// router.get('/payroll', protect, getPayrollInfo);
// router.post('/leave-requests', protect, createLeaveRequest);

module.exports = router;