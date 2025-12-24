const enrollmentRepo = require("../repositories/enrollmentRepo");
const courseRepo = require("../repositories/courseEavRepoNew");
const subjectRepo = require("../repositories/subjectEavRepoNew");
const userRepo = require("../repositories/userRepo");
const eav = require("../utils/eavNew");
const { successResponse, errorResponse } = require("../utils/responseHelpers");

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
      return errorResponse(res, 404, "Course not found");
    }

    if (!course.isActive) {
      return errorResponse(res, 400, "This course is not currently active");
    }

    // Check if already enrolled or has pending request
    const existingEnrollment = await enrollmentRepo.isStudentEnrolled(
      studentId,
      courseId
    );
    if (existingEnrollment) {
      if (existingEnrollment.status === "pending") {
        return errorResponse(
          res,
          400,
          "You already have a pending registration request for this course"
        );
      } else if (existingEnrollment.status === "enrolled") {
        return errorResponse(
          res,
          400,
          "You are already enrolled in this course"
        );
      } else if (existingEnrollment.status === "rejected") {
        return errorResponse(
          res,
          400,
          "Your previous registration request for this course was rejected. Please contact the administrator."
        );
      } else {
        return errorResponse(
          res,
          400,
          "You already have a registration record for this course"
        );
      }
    }

    // Check course capacity
    const currentEnrollment = await enrollmentRepo.getCourseEnrollmentCount(
      courseId
    );
    if (currentEnrollment >= course.maxEnrollment) {
      return errorResponse(res, 400, "Class is full");
    }

    // Get subject details to check prerequisites
    const subject = await subjectRepo.getSubjectById(course.subjectId);
    if (!subject) {
      return errorResponse(res, 404, "Subject not found");
    }

    // Check prerequisites if they exist
    if (subject.prerequisites && subject.prerequisites.trim() !== "") {
      // Prerequisites are stored as text (e.g., "CS101, CS102" or JSON array)
      // For now, we'll do basic validation - in production, you'd check completed courses
      const hasPrerequisites = await checkPrerequisites(
        studentId,
        subject.prerequisites
      );
      if (!hasPrerequisites.met) {
        return errorResponse(
          res,
          400,
          `Prerequisites not met: ${hasPrerequisites.message}`
        );
      }
    }

    // Create enrollment request (pending status)
    const enrollment = await enrollmentRepo.createEnrollment({
      studentId,
      courseId,
      status: "pending",
    });

    // Note: Course enrollment count is NOT updated until admin approves

    successResponse(res, 201, "Registration request submitted successfully", {
      enrollment,
      course: {
        id: course.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        semester: course.semester,
        year: course.year,
      },
    });
  } catch (error) {
    console.error("Error in registerForCourse:", error);
    errorResponse(res, 500, "Server error during course registration");
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

    const enrollments = await enrollmentRepo.getEnrollmentsByStudent(
      studentId,
      {
        status,
        isActive: true,
      }
    );

    // Enrich with course and subject details
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
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
            currentEnrollment: course.currentEnrollment,
          },
          subject: subject
            ? {
                id: subject.id,
                name: subject.name,
                code: subject.code,
                credits: subject.credits,
                description: subject.description,
              }
            : null,
        };
      })
    );

    // Filter out null entries
    const validEnrollments = enrichedEnrollments.filter((e) => e !== null);

    successResponse(res, 200, "Enrollments retrieved successfully", {
      enrollments: validEnrollments,
      count: validEnrollments.length,
    });
  } catch (error) {
    console.error("Error in getMyEnrollments:", error);
    errorResponse(res, 500, "Server error retrieving enrollments");
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
      return errorResponse(res, 404, "Enrollment not found");
    }

    // Verify the enrollment belongs to the student
    if (enrollment.student_id !== studentId) {
      return errorResponse(res, 403, "Not authorized to drop this enrollment");
    }

    if (enrollment.status !== "enrolled") {
      return errorResponse(
        res,
        400,
        "Can only drop courses with enrolled status"
      );
    }

    // Update enrollment status
    const updatedEnrollment = await enrollmentRepo.dropEnrollment(enrollmentId);

    // Update course current enrollment count
    const currentCount = await enrollmentRepo.getCourseEnrollmentCount(
      enrollment.course_id
    );
    await courseRepo.updateCourse(enrollment.course_id, {
      currentEnrollment: currentCount,
    });

    successResponse(res, 200, "Course dropped successfully", {
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error("Error in dropCourse:", error);
    errorResponse(res, 500, "Server error dropping course");
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
      limit: 100,
    });

    const courses = coursesResult.courses || [];

    // Get student's current enrollments
    const studentEnrollments = await enrollmentRepo.getEnrollmentsByStudent(
      studentId,
      {
        status: "enrolled",
        isActive: true,
      }
    );
    const enrolledCourseIds = studentEnrollments.map((e) => e.course_id);

    // Enrich courses with subject details and enrollment status
    const availableCourses = await Promise.all(
      courses.map(async (course) => {
        const subject = await subjectRepo.getSubjectById(course.subjectId);
        if (!subject || !subject.isActive) return null;

        // Filter by department if specified
        if (departmentId && subject.departmentId !== parseInt(departmentId)) {
          return null;
        }

        const enrollmentCount = await enrollmentRepo.getCourseEnrollmentCount(
          course.id
        );
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
          canRegister: !isEnrolled && !isFull,
        };
      })
    );

    // Filter out null entries
    const validCourses = availableCourses.filter((c) => c !== null);

    successResponse(res, 200, "Available courses retrieved successfully", {
      courses: validCourses,
      count: validCourses.length,
    });
  } catch (error) {
    console.error("Error in getAvailableCourses:", error);
    errorResponse(res, 500, "Server error retrieving available courses");
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
      return errorResponse(res, 404, "Course not found");
    }

    const enrollments = await enrollmentRepo.getEnrollmentsByCourse(courseId, {
      status: "enrolled",
      isActive: true,
    });

    successResponse(res, 200, "Course enrollments retrieved successfully", {
      enrollments,
      count: enrollments.length,
      course: {
        id: course.id,
        semester: course.semester,
        year: course.year,
        maxEnrollment: course.maxEnrollment,
      },
    });
  } catch (error) {
    console.error("Error in getCourseEnrollments:", error);
    errorResponse(res, 500, "Server error retrieving course enrollments");
  }
};

/**
 * Helper function to check prerequisites
 * Verifies if student has completed required prerequisite courses
 */
async function checkPrerequisites(studentId, prerequisites) {
  try {
    // Parse prerequisites - could be comma-separated list or JSON array
    let requiredCodes = [];

    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(prerequisites);
      if (Array.isArray(parsed)) {
        requiredCodes = parsed;
      } else {
        // If it's an object, treat it as comma-separated string
        requiredCodes = prerequisites.split(",").map((p) => p.trim());
      }
    } catch (e) {
      // Not JSON, treat as comma-separated list
      requiredCodes = prerequisites
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);
    }

    if (requiredCodes.length === 0) {
      return { met: true, message: "" };
    }

    // Get student's completed enrollments
    const studentEnrollments = await enrollmentRepo.getEnrollmentsByStudent(
      studentId,
      {
        status: "enrolled", // Consider both enrolled and completed as met
        isActive: true,
      }
    );

    // Get all subjects to match codes
    const completedSubjectIds = [];
    for (const enrollment of studentEnrollments) {
      const course = await courseRepo.getCourseById(enrollment.course_id);
      if (course) {
        completedSubjectIds.push(course.subjectId);
      }
    }

    // Get subject codes for completed subjects
    const completedCodes = [];
    for (const subjectId of completedSubjectIds) {
      const subject = await subjectRepo.getSubjectById(subjectId);
      if (subject) {
        completedCodes.push(subject.code);
      }
    }

    // Check if all required prerequisites are met
    const missingPrereqs = requiredCodes.filter(
      (code) => !completedCodes.includes(code)
    );

    if (missingPrereqs.length > 0) {
      return {
        met: false,
        message: `Missing prerequisites: ${missingPrereqs.join(", ")}`,
      };
    }

    return { met: true, message: "" };
  } catch (error) {
    console.error("Error checking prerequisites:", error);
    // If there's an error checking, fail safe and deny registration
    return {
      met: false,
      message: "Error validating prerequisites. Please contact administrator.",
    };
  }
}

/**
 * @desc    Get all pending enrollment requests (for admins)
 * @route   GET /api/enrollments/pending
 * @access  Private/Admin
 */
const getPendingEnrollments = async (req, res) => {
  try {
    const { departmentId, semester, year } = req.query;

    // Get all pending enrollments
    const enrollments = await enrollmentRepo.getAllEnrollments({
      status: "pending",
      isActive: true,
    });

    // Enrich with student, course, and subject details
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const student = await userRepo.getUserById(enrollment.student_id);
        if (!student) {
          console.error(
            `Student not found for enrollment ${enrollment.enrollment_id}, student_id: ${enrollment.student_id}`
          );
          return null;
        }

        const course = await courseRepo.getCourseById(enrollment.course_id);

        if (!course) return null;

        const subject = await subjectRepo.getSubjectById(course.subjectId);
        if (!subject) return null;

        // Filter by department if specified
        if (departmentId && subject.departmentId !== parseInt(departmentId)) {
          return null;
        }

        // Filter by semester if specified
        if (semester && course.semester !== semester) {
          return null;
        }

        // Filter by year if specified
        if (year && course.year !== parseInt(year)) {
          return null;
        }

        return {
          enrollmentId: enrollment.enrollment_id,
          status: enrollment.status,
          enrollmentDate: enrollment.enrollment_date,

          student: {
            id: student.id,
            firstName: student.first_name ?? student.firstName ?? "",
            lastName: student.last_name ?? student.lastName ?? "",
            email: student.email ?? "",
            studentId: student.student_id ?? student.studentId ?? null,
          },
          course: {
            id: course.id,
            semester: course.semester,
            year: course.year,
            schedule: course.schedule,
            maxEnrollment: course.maxEnrollment,
            currentEnrollment: course.currentEnrollment,
          },
          subject: {
            id: subject.id,
            name: subject.name,
            code: subject.code,
            credits: subject.credits,
            departmentId: subject.departmentId,
          },
        };
      })
    );

    const validEnrollments = enrichedEnrollments.filter((e) => e !== null);

    successResponse(res, 200, "Pending enrollments retrieved successfully", {
      enrollments: validEnrollments,
      count: validEnrollments.length,
    });
  } catch (error) {
    console.error("Error in getPendingEnrollments:", error);
    errorResponse(res, 500, "Server error retrieving pending enrollments");
  }
};

/**
 * @desc    Approve an enrollment request
 * @route   PUT /api/enrollments/:enrollmentId/approve
 * @access  Private/Admin
 */
const approveEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await enrollmentRepo.getEnrollmentById(enrollmentId);
    if (!enrollment) {
      return errorResponse(res, 404, "Enrollment not found");
    }

    if (enrollment.status !== "pending") {
      return errorResponse(
        res,
        400,
        "Only pending enrollments can be approved"
      );
    }

    // Check if course is still not full
    const course = await courseRepo.getCourseById(enrollment.course_id);
    const currentCount = await enrollmentRepo.getCourseEnrollmentCount(
      enrollment.course_id
    );

    if (currentCount >= course.maxEnrollment) {
      return errorResponse(res, 400, "Cannot approve - course is now full");
    }

    // Update enrollment status to enrolled
    await enrollmentRepo.updateEnrollmentStatus(enrollmentId, "enrolled");

    // Update course enrollment count
    await courseRepo.updateCourse(enrollment.course_id, {
      currentEnrollment: currentCount + 1,
    });

    const updatedEnrollment = await enrollmentRepo.getEnrollmentById(
      enrollmentId
    );

    successResponse(res, 200, "Enrollment approved successfully", {
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error("Error in approveEnrollment:", error);
    errorResponse(res, 500, "Server error approving enrollment");
  }
};

/**
 * @desc    Reject an enrollment request
 * @route   PUT /api/enrollments/:enrollmentId/reject
 * @access  Private/Admin
 */
const rejectEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { reason } = req.body;

    const enrollment = await enrollmentRepo.getEnrollmentById(enrollmentId);
    if (!enrollment) {
      return errorResponse(res, 404, "Enrollment not found");
    }

    if (enrollment.status !== "pending") {
      return errorResponse(
        res,
        400,
        "Only pending enrollments can be rejected"
      );
    }

    // Update enrollment status to rejected
    await enrollmentRepo.updateEnrollmentStatus(
      enrollmentId,
      "rejected",
      reason
    );

    const updatedEnrollment = await enrollmentRepo.getEnrollmentById(
      enrollmentId
    );

    successResponse(res, 200, "Enrollment rejected successfully", {
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error("Error in rejectEnrollment:", error);
    errorResponse(res, 500, "Server error rejecting enrollment");
  }
};

module.exports = {
  registerForCourse,
  getMyEnrollments,
  dropCourse,
  getAvailableCourses,
  getCourseEnrollments,
  getPendingEnrollments,
  approveEnrollment,
  rejectEnrollment,
};
