const enrollmentRepo = require('../repositories/enrollmentRepo');
const courseRepo = require('../repositories/courseEavRepoNew');
const subjectRepo = require('../repositories/subjectEavRepoNew');
const userRepo = require('../repositories/userRepo');
const eav = require('../utils/eavNew');
const { successResponse, errorResponse } = require('../utils/responseHelpers');

/**
 * @desc    Register for a course
 * @route   POST /api/enrollments
 * @access  Private/Student
 */
const registerForCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.id;

    // Validate course exists
    const course = await courseRepo.getCourseById(courseId);
    if (!course) {
      return errorResponse(res, 404, 'Course not found');
    }

    if (!course.isActive) {
      return errorResponse(res, 400, 'This course is not currently active');
    }

    // Check if already enrolled
    const alreadyEnrolled = await enrollmentRepo.isStudentEnrolled(studentId, courseId);
    if (alreadyEnrolled) {
      return errorResponse(res, 400, 'You are already enrolled in this course');
    }

    // Check course capacity
    const currentEnrollment = await enrollmentRepo.getCourseEnrollmentCount(courseId);
    if (currentEnrollment >= course.maxEnrollment) {
      return errorResponse(res, 400, 'Class is full');
    }

    // Get subject details to check prerequisites
    const subject = await subjectRepo.getSubjectById(course.subjectId);
    if (!subject) {
      return errorResponse(res, 404, 'Subject not found');
    }

    // Check prerequisites if they exist
    if (subject.prerequisites && subject.prerequisites.trim() !== '') {
      // Prerequisites are stored as text (e.g., "CS101, CS102" or JSON array)
      // For now, we'll do basic validation - in production, you'd check completed courses
      const hasPrerequisites = await checkPrerequisites(studentId, subject.prerequisites);
      if (!hasPrerequisites.met) {
        return errorResponse(res, 400, `Prerequisites not met: ${hasPrerequisites.message}`);
      }
    }

    // Create enrollment
    const enrollment = await enrollmentRepo.createEnrollment({
      studentId,
      courseId,
      status: 'enrolled'
    });

    // Update course current enrollment count
    const newEnrollmentCount = currentEnrollment + 1;
    await courseRepo.updateCourse(courseId, {
      currentEnrollment: newEnrollmentCount
    });

    successResponse(res, 201, 'Successfully registered for course', { 
      enrollment,
      course: {
        id: course.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        semester: course.semester,
        year: course.year
      }
    });
  } catch (error) {
    console.error('Error in registerForCourse:', error);
    errorResponse(res, 500, 'Server error during course registration');
  }
};

/**
 * @desc    Get student's enrollments
 * @route   GET /api/enrollments/my-enrollments
 * @access  Private/Student
 */
const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, semester, year } = req.query;

    const enrollments = await enrollmentRepo.getEnrollmentsByStudent(studentId, {
      status,
      isActive: true
    });

    // Enrich with course and subject details
    const enrichedEnrollments = await Promise.all(enrollments.map(async (enrollment) => {
      const course = await courseRepo.getCourseById(enrollment.course_id);
      if (!course) return null;

      const subject = await subjectRepo.getSubjectById(course.subjectId);
      
      return {
        enrollmentId: enrollment.enrollment_id,
        courseId: enrollment.course_id,
        status: enrollment.status,
        enrollmentDate: enrollment.enrollment_date,
        grade: enrollment.grade,
        gradePoints: enrollment.grade_points,
        course: {
          id: course.id,
          semester: course.semester,
          year: course.year,
          schedule: course.schedule,
          instructorId: course.instructorId,
          maxEnrollment: course.maxEnrollment,
          currentEnrollment: course.currentEnrollment
        },
        subject: subject ? {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          credits: subject.credits,
          description: subject.description
        } : null
      };
    }));

    // Filter out null entries
    const validEnrollments = enrichedEnrollments.filter(e => e !== null);

    successResponse(res, 200, 'Enrollments retrieved successfully', { 
      enrollments: validEnrollments,
      count: validEnrollments.length
    });
  } catch (error) {
    console.error('Error in getMyEnrollments:', error);
    errorResponse(res, 500, 'Server error retrieving enrollments');
  }
};

/**
 * @desc    Drop a course
 * @route   PUT /api/enrollments/:enrollmentId/drop
 * @access  Private/Student
 */
const dropCourse = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const studentId = req.user.id;

    const enrollment = await enrollmentRepo.getEnrollmentById(enrollmentId);
    if (!enrollment) {
      return errorResponse(res, 404, 'Enrollment not found');
    }

    // Verify the enrollment belongs to the student
    if (enrollment.student_id !== studentId) {
      return errorResponse(res, 403, 'Not authorized to drop this enrollment');
    }

    if (enrollment.status !== 'enrolled') {
      return errorResponse(res, 400, 'Can only drop courses with enrolled status');
    }

    // Update enrollment status
    const updatedEnrollment = await enrollmentRepo.dropEnrollment(enrollmentId);

    // Update course current enrollment count
    const currentCount = await enrollmentRepo.getCourseEnrollmentCount(enrollment.course_id);
    await courseRepo.updateCourse(enrollment.course_id, {
      currentEnrollment: currentCount
    });

    successResponse(res, 200, 'Course dropped successfully', { enrollment: updatedEnrollment });
  } catch (error) {
    console.error('Error in dropCourse:', error);
    errorResponse(res, 500, 'Server error dropping course');
  }
};

/**
 * @desc    Get available courses for registration
 * @route   GET /api/enrollments/available-courses
 * @access  Private/Student
 */
const getAvailableCourses = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { semester, year, departmentId } = req.query;

    // Get all active courses
    const coursesResult = await courseRepo.getAllCourses({
      semester,
      year,
      isActive: true,
      limit: 100
    });

    const courses = coursesResult.courses || [];

    // Get student's current enrollments
    const studentEnrollments = await enrollmentRepo.getEnrollmentsByStudent(studentId, {
      status: 'enrolled',
      isActive: true
    });
    const enrolledCourseIds = studentEnrollments.map(e => e.course_id);

    // Enrich courses with subject details and enrollment status
    const availableCourses = await Promise.all(courses.map(async (course) => {
      const subject = await subjectRepo.getSubjectById(course.subjectId);
      if (!subject || !subject.isActive) return null;

      // Filter by department if specified
      if (departmentId && subject.departmentId !== parseInt(departmentId)) {
        return null;
      }

      const enrollmentCount = await enrollmentRepo.getCourseEnrollmentCount(course.id);
      const isEnrolled = enrolledCourseIds.includes(course.id);
      const isFull = enrollmentCount >= course.maxEnrollment;

      return {
        courseId: course.id,
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        subjectCredits: subject.credits,
        subjectDescription: subject.description,
        classification: subject.classification,
        prerequisites: subject.prerequisites,
        semester: course.semester,
        year: course.year,
        schedule: course.schedule,
        instructorId: course.instructorId,
        instructorName: course.instructorName,
        maxEnrollment: course.maxEnrollment,
        currentEnrollment: enrollmentCount,
        availableSeats: course.maxEnrollment - enrollmentCount,
        isEnrolled,
        isFull,
        canRegister: !isEnrolled && !isFull
      };
    }));

    // Filter out null entries
    const validCourses = availableCourses.filter(c => c !== null);

    successResponse(res, 200, 'Available courses retrieved successfully', { 
      courses: validCourses,
      count: validCourses.length
    });
  } catch (error) {
    console.error('Error in getAvailableCourses:', error);
    errorResponse(res, 500, 'Server error retrieving available courses');
  }
};

/**
 * @desc    Get enrollments for a course (for instructors)
 * @route   GET /api/enrollments/course/:courseId
 * @access  Private/Instructor/Admin
 */
const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await courseRepo.getCourseById(courseId);
    if (!course) {
      return errorResponse(res, 404, 'Course not found');
    }

    const enrollments = await enrollmentRepo.getEnrollmentsByCourse(courseId, {
      status: 'enrolled',
      isActive: true
    });

    successResponse(res, 200, 'Course enrollments retrieved successfully', { 
      enrollments,
      count: enrollments.length,
      course: {
        id: course.id,
        semester: course.semester,
        year: course.year,
        maxEnrollment: course.maxEnrollment
      }
    });
  } catch (error) {
    console.error('Error in getCourseEnrollments:', error);
    errorResponse(res, 500, 'Server error retrieving course enrollments');
  }
};

/**
 * Helper function to check prerequisites
 * In a real system, this would verify completed courses with passing grades
 */
async function checkPrerequisites(studentId, prerequisites) {
  // For MVP, we'll assume prerequisites are met
  // In production, parse prerequisites and check against completed enrollments
  
  // Prerequisites could be stored as:
  // - Comma-separated list: "CS101, CS102"
  // - JSON array: ["CS101", "CS102"]
  // - JSON object with logic: { "any": ["CS101", "CS102"] }
  
  try {
    // Try to parse as JSON
    const parsedPrereqs = JSON.parse(prerequisites);
    // For MVP, return true - implement actual checking in production
    return { met: true, message: '' };
  } catch (e) {
    // Not JSON, treat as comma-separated list
    // For MVP, return true - implement actual checking in production
    return { met: true, message: '' };
  }
}

module.exports = {
  registerForCourse,
  getMyEnrollments,
  dropCourse,
  getAvailableCourses,
  getCourseEnrollments
};
