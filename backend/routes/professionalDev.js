const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyActivities,
  getActivitiesByStatus,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getStatistics,
  getUserActivities
} = require('../controllers/professionalDevController');

// All routes require authentication and are accessible to staff, professors, TAs, and admins
router.use(protect);
router.use(authorize('professor', 'ta', 'staff', 'admin'));

// Get statistics (must come before /:id route to avoid conflict)
router.get('/statistics', getStatistics);

// Get activities for a specific user (admin or own profile)
router.get('/user/:userId', getUserActivities);

// Get activities by status
router.get('/status/:status', getActivitiesByStatus);

// Get all activities for current user
router.get('/', getMyActivities);

// Get, update, delete specific activity
router.route('/:id')
  .get(getActivityById)
  .put(updateActivity)
  .delete(deleteActivity);

// Create new activity (POST to base route)
router.post('/', createActivity);

module.exports = router;
