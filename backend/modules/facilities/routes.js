const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');

// Import room routes
const roomRoutes = require('../../routes/rooms');
// Import booking routes
const bookingRoutes = require('../../routes/bookings');
// Import application routes
const applicationRoutes = require('../../routes/applications'); 

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
      'GET /api/facilities/rooms - Room management',
      'GET /api/facilities/bookings - Booking management',
      'GET /api/facilities/applications - Admission applications management'
    ]
  });
});

// Mount room management routes
router.use('/rooms', roomRoutes);
// Mount booking routes 
router.use('/bookings', bookingRoutes);
// Mount application management routes
router.use('/applications', applicationRoutes);

// Future routes (commented for now)
// router.get('/classrooms', protect, getClassrooms);
// router.post('/classrooms', protect, authorize('admin', 'staff'), createClassroom);
// router.get('/labs', protect, getLabs);
// router.post('/bookings', protect, createBooking);
// router.get('/resources', protect, getResources);

module.exports = router;