const childProgressRepo = require('../repositories/childProgressRepo');

// GET /api/parent/progress/children
exports.getLinkedChildren = async (req, res) => {
  try {
    const parentUserId = req.user.id;
   
    const children = await childProgressRepo.getLinkedChildren(parentUserId);
   
    res.json({
      success: true,
      count: children.length,
      children,
    });
  } catch (err) {
   
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to load linked children',
    });
  }
};

// GET /api/parent/progress/children/:childId/courses
exports.getChildCourses = async (req, res) => {
  try {
    const parentUserId = req.user.id;
    const studentId = Number(req.params.childId);

    const { academicYear, term } = req.query;

    const courses = await childProgressRepo.getChildCourses(parentUserId, studentId, {
      academicYear,
      term,
    });

    res.json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (err) {
   
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to load child courses',
    });
  }
};

// GET /api/parent/progress/children/:childId/courses/:courseId
exports.getChildCourseDetails = async (req, res) => {
  try {
    const parentUserId = req.user.id;
    const studentId = Number(req.params.childId);
    const courseId = Number(req.params.courseId);

    const details = await childProgressRepo.getChildCourseDetails(
      parentUserId,
      studentId,
      courseId
    );

    // If no grades published yet, frontend can show “information not available”
    res.json({
      success: true,
      ...details,
    });
  } catch (err) {
   
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to load course details',
    });
  }
};
