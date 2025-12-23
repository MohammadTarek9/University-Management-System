const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
  assignTaResponsibility,
  getEligibleTAs,
  getMyTaResponsibilities,
} = require('../../controllers/taAssignmentController');


const leaveRequestRoutes = require('../../routes/leaveRequestRoutes');
const staffDirectoryRoutes = require('../../routes/staffDirectoryRoutes');
const performanceEvalRoutes = require('../../routes/performanceEval');
const teachingStaffProfileRoutes = require('../../routes/teachingStaffProfileRoutes');
const researchRoutes = require('../../routes/researchRoutes');
const professionalDevRoutes = require('../../routes/professionalDev');

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
      'GET /api/staff/directory - teaching staff directory',
      'GET /api/staff/teaching-staff - teaching staff profiles',
      'GET /api/staff/research - research publication management',
      'GET /api/staff/professional-development - professional development activities'
    ]
  });
});

// Mount leave request management routes
router.use('/leave-requests', leaveRequestRoutes);
router.use('/directory', staffDirectoryRoutes);
// Mount performance evaluation routes (authenticated users can view; writes restricted in route)
router.use('/performance', protect, performanceEvalRoutes);
router.use('/teaching-staff', teachingStaffProfileRoutes);
router.use('/research', researchRoutes);
router.use('/professional-development', professionalDevRoutes);
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