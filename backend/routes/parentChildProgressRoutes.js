const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const {
  getLinkedChildren,
  getChildCourses,
  getChildCourseDetails,
} = require('../controllers/childProgressController');

// All routes require logged-in parent
router.use(protect, authorize('parent'));

// GET /api/parent/progress/children
router.get('/children', getLinkedChildren);

// GET /api/parent/progress/children/:childId/courses
router.get('/children/:childId/courses', getChildCourses);

// GET /api/parent/progress/children/:childId/courses/:courseId
router.get('/children/:childId/courses/:courseId', getChildCourseDetails);

module.exports = router;
