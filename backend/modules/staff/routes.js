const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
  assignTaResponsibility,
  getEligibleTAs,
  getMyTaResponsibilities,
} = require('../../controllers/taAssignmentController');


// Placeholder routes for future implementation
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Staff module is ready for development',
    features: [
      'Professor and Teaching Assistant Management',
      'Performance Tracking',
      'Payroll and Human Resources Integration'
    ]
  });
});

// Assign TA responsibilities (professors only)
router.post(
  '/ta-assignments',
  protect,
  authorize('professor'),           
  assignTaResponsibility
);

router.get(
  '/ta-eligible',
  protect,
  authorize('professor'),
  getEligibleTAs
);
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