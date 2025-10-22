const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Facilities module is ready for development',
    features: [
      'Classroom and Laboratory Management',
      'Administrative Office Automation', 
      'Resource Allocation'
    ]
  });
});

// router.get('/classrooms', protect, getClassrooms);
// router.post('/classrooms', protect, authorize('admin', 'staff'), createClassroom);
// router.get('/labs', protect, getLabs);
// router.post('/bookings', protect, createBooking);
// router.get('/resources', protect, getResources);

module.exports = router;