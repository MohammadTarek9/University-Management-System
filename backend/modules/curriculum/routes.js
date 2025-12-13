const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');

// Import department routes
const departmentRoutes = require('../../routes/department');
// Import subject routes
const subjectRoutes = require('../../routes/subject');
// Import course routes
const courseRoutes = require('../../routes/course');

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Curriculum module is active',
    features: [
      'Department Management',
      'Core and Elective Subject Management',
      'Course Instance Management',
      'Instructor Assignment',
      'Enrollment Tracking'
    ],
    activeRoutes: [
      'GET /api/curriculum/departments - Department management',
      'GET /api/curriculum/subjects - Subject management',
      'GET /api/curriculum/courses - Course instance management'
    ]
  });
});

// Mount department management routes
router.use('/departments', departmentRoutes);
// Mount subject management routes
router.use('/subjects', subjectRoutes);
// Mount course management routes
router.use('/courses', courseRoutes);

// Future routes (commented for now)
// router.get('/courses', protect, getCourses);
// router.post('/courses', protect, authorize('admin', 'professor'), createCourse);
// router.get('/assignments', protect, getAssignments);
// router.post('/assignments', protect, authorize('professor', 'ta'), createAssignment);
// router.get('/grades', protect, getGrades);

module.exports = router;