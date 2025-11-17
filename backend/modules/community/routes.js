const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const messageRoutes = require('../../routes/messages');
const announcementsRoutes = require('../../routes/announcementsRoutes');

// Placeholder routes for future implementation
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Community module is active',
    features: [
      'Parent-to-Teacher Communication',
      'Student-to-Staff Communication',
      'Announcements and Events'
    ],
    activeRoutes: [
      'GET /api/community/messages - parent-teacher messaging',
      'GET /api/community/announcements - university announcements'
    ]
  });
});

// Mount message routes
router.use('/messages', messageRoutes);
// Mount announcements routes
router.use('/announcements', announcementsRoutes);


// router.get('/announcements', protect, getAnnouncements);
// router.post('/announcements', protect, authorize('admin', 'professor', 'staff'), createAnnouncement);
// router.get('/events', protect, getEvents);

module.exports = router;