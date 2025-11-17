const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');

// Import room routes
const roomRoutes = require('../../routes/rooms');

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Facilities module is active',
    features: [
      'Classroom and Laboratory Management',
      'Administrative Office Automation', 
      'Resource Allocation'
    ],
    activeRoutes: [
      'GET /api/facilities/rooms - Room management'
    ]
  });
});

// Mount room management routes
router.use('/rooms', roomRoutes);

// Future routes (commented for now)
// router.get('/classrooms', protect, getClassrooms);
// router.post('/classrooms', protect, authorize('admin', 'staff'), createClassroom);
// router.get('/labs', protect, getLabs);
// router.post('/bookings', protect, createBooking);
// router.get('/resources', protect, getResources);

module.exports = router;