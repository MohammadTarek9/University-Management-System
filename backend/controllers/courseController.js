const { errorResponse, successResponse } = require('../utils/responseHelpers');
const courseRepo = require('../repositories/courseEavRepoNew'); // Using 3-table EAV repository
const subjectRepo = require('../repositories/subjectEavRepoNew'); // Using 3-table EAV repository
const userRepo = require('../repositories/userRepo');
const departmentRepo = require('../repositories/departmentRepo');
// ===================================================================
// @desc    Get all courses with filters
// @route   GET /api/curriculum/courses
// @access  Private
// ===================================================================
const getAllCourses = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      subjectId = '',
      departmentId = '',
      semester = '',
      year = '',
      instructorId = '',
      isActive = '' 
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    
    // Convert isActive to boolean or null
    let isActiveFilter = null;
    if (isActive === 'true') isActiveFilter = true;
    if (isActive === 'false') isActiveFilter = false;

    // Convert IDs to numbers or null
    const subjId = subjectId ? parseInt(subjectId, 10) : null;
    const deptId = departmentId ? parseInt(departmentId, 10) : null;
    const instrId = instructorId ? parseInt(instructorId, 10) : null;
    const yearNum = year ? parseInt(year, 10) : null;

    const { courses, totalCourses } = await courseRepo.getAllCourses({
      page: pageNum,
      limit: limitNum,
      search,
      subjectId: subjId,
      departmentId: deptId,
      semester: semester || null,
      year: yearNum,
      instructorId: instrId,
      isActive: isActiveFilter
    });

    // Populate subject and instructor details for each course
    const populatedCourses = await Promise.all(courses.map(async (course) => {
      const courseWithDetails = { ...course };
      
      // Populate subject info
      if (course.subjectId) {
        const subject = await subjectRepo.getSubjectById(course.subjectId);
        if (subject) {
          courseWithDetails.subject = {
            id: subject.id,
            name: subject.name,
            code: subject.code
          };
        }
      }
      
      // Populate instructor info
      if (course.instructorId) {
        const instructor = await userRepo.getUserById(course.instructorId);
        if (instructor) {
          courseWithDetails.instructor = {
            id: instructor.id,
            firstName: instructor.firstName,
            lastName: instructor.lastName,
            email: instructor.email
          };
        }
      }
      
      return courseWithDetails;
    }));

    const totalPages = Math.ceil(totalCourses / limitNum) || 1;

    successResponse(res, 200, 'Courses retrieved successfully', {
      courses: populatedCourses,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCourses,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving courses');
  }
};

// ===================================================================
// @desc    Get single course by ID
// @route   GET /api/curriculum/courses/:id
// @access  Private
// ===================================================================
const getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await courseRepo.getCourseById(courseId);
    if (!course) {
      return errorResponse(res, 404, 'Course not found');
    }

    successResponse(res, 200, 'Course retrieved successfully', { course });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving course');
  }
};

// ===================================================================
// @desc    Get courses by subject
// @route   GET /api/curriculum/courses/subject/:subjectId
// @access  Private
// ===================================================================
const getCoursesBySubject = async (req, res) => {
  try {
    const subjectId = req.params.subjectId;

    // Check if subject exists
    const subject = await subjectRepo.getSubjectById(subjectId);
    if (!subject) {
      return errorResponse(res, 404, 'Subject not found');
    }

    const courses = await courseRepo.getCoursesBySubject(subjectId);

    successResponse(res, 200, 'Courses retrieved successfully', { 
      courses,
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        credits: subject.credits
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving courses');
  }
};

// ===================================================================
// @desc    Create new course (Admin/Staff only)
// @route   POST /api/curriculum/courses
// @access  Private/Admin/Staff
// ===================================================================
const createCourse = async (req, res) => {
  try {
    const { 
      subjectId, 
      semester, 
      year, 
      instructorId, 
      maxEnrollment, 
      schedule,
      // EAV flexible attributes
      prerequisites,
      corequisites,
      labRequired,
      labHours,
      gradingRubric,
      assessmentTypes,
      attendancePolicy,
      onlineMeetingLink,
      syllabusUrl,
      officeHours,
      textbookTitle,
      textbookAuthor,
      textbookIsbn,
      textbookRequired
    } = req.body;

    // Validate required fields
    if (!subjectId || isNaN(subjectId)) {
      return errorResponse(res, 400, 'Valid subject is required');
    }
    if (!semester || !['Fall', 'Spring', 'Summer'].includes(semester)) {
      return errorResponse(res, 400, 'Semester must be Fall, Spring, or Summer');
    }
    if (!year || isNaN(year) || year < 2000 || year > 2100) {
      return errorResponse(res, 400, 'Valid year is required (2000-2100)');
    }
    if (maxEnrollment && (isNaN(maxEnrollment) || maxEnrollment < 1)) {
      return errorResponse(res, 400, 'Max enrollment must be a positive number');
    }

    // Check if subject exists and is active
    const subject = await subjectRepo.getSubjectById(subjectId);
    if (!subject) {
      return errorResponse(res, 404, 'Subject not found');
    }
    if (!subject.isActive) {
      return errorResponse(res, 400, 'Cannot create course for inactive subject');
    }

    // If instructor is provided, validate they exist and have proper role
    if (instructorId) {
      const instructor = await userRepo.getUserById(instructorId);
      if (!instructor) {
        return errorResponse(res, 404, 'Instructor not found');
      }
      if (!['professor', 'ta', 'admin'].includes(instructor.role)) {
        return errorResponse(res, 400, 'Instructor must have professor, TA, or admin role');
      }
      if (!instructor.isActive) {
        return errorResponse(res, 400, 'Cannot assign inactive instructor to course');
      }
    }

    // Create the course with EAV attributes (passed at top level, not nested)
    const course = await courseRepo.createCourse({
      subjectId,
      semester,
      year,
      instructorId: instructorId || null,
      maxEnrollment: maxEnrollment || 30,
      currentEnrollment: 0,
      schedule: schedule || null,
      isActive: true,
      // Flexible attributes at top level
      prerequisites,
      corequisites,
      labRequired,
      labHours,
      gradingRubric,
      assessmentTypes,
      attendancePolicy,
      onlineMeetingLink,
      syllabusUrl,
      officeHours,
      textbookTitle,
      textbookAuthor,
      textbookIsbn,
      textbookRequired
    });

    successResponse(res, 201, 'Course created successfully', { course });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse(res, 400, 'A course with these details already exists');
    }
    errorResponse(res, 500, 'Server error while creating course');
  }
};

// ===================================================================
// @desc    Update course (Admin/Staff only)
// @route   PUT /api/curriculum/courses/:id
// @access  Private/Admin/Staff
// ===================================================================
const updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { 
      subjectId, 
      semester, 
      year, 
      instructorId, 
      maxEnrollment, 
      currentEnrollment, 
      schedule, 
      isActive,
      // EAV flexible attributes
      prerequisites,
      corequisites,
      labRequired,
      labHours,
      gradingRubric,
      assessmentTypes,
      attendancePolicy,
      onlineMeetingLink,
      syllabusUrl,
      officeHours,
      textbookTitle,
      textbookAuthor,
      textbookIsbn,
      textbookRequired
    } = req.body;

    // Check if course exists
    const existingCourse = await courseRepo.getCourseById(courseId);
    if (!existingCourse) {
      return errorResponse(res, 404, 'Course not found');
    }

    // Validate semester if provided
    if (semester && !['Fall', 'Spring', 'Summer'].includes(semester)) {
      return errorResponse(res, 400, 'Semester must be Fall, Spring, or Summer');
    }

    // Validate year if provided
    if (year && (isNaN(year) || year < 2000 || year > 2100)) {
      return errorResponse(res, 400, 'Valid year is required (2000-2100)');
    }

    // Validate maxEnrollment if provided
    if (maxEnrollment !== undefined && (isNaN(maxEnrollment) || maxEnrollment < 1)) {
      return errorResponse(res, 400, 'Max enrollment must be a positive number');
    }

    // Validate currentEnrollment if provided
    if (currentEnrollment !== undefined && (isNaN(currentEnrollment) || currentEnrollment < 0)) {
      return errorResponse(res, 400, 'Current enrollment cannot be negative');
    }

    // If changing subject, validate it exists and is active
    if (subjectId && subjectId !== existingCourse.subjectId) {
      const subject = await subjectRepo.getSubjectById(subjectId);
      if (!subject) {
        return errorResponse(res, 404, 'Subject not found');
      }
      if (!subject.isActive) {
        return errorResponse(res, 400, 'Cannot assign course to inactive subject');
      }
    }

    // If changing instructor, validate they exist and have proper role
    if (instructorId && instructorId !== existingCourse.instructorId) {
      const instructor = await userRepo.getUserById(instructorId);
      if (!instructor) {
        return errorResponse(res, 404, 'Instructor not found');
      }
      if (!['professor', 'ta', 'admin'].includes(instructor.role)) {
        return errorResponse(res, 400, 'Instructor must have professor, TA, or admin role');
      }
      if (!instructor.isActive) {
        return errorResponse(res, 400, 'Cannot assign inactive instructor to course');
      }
    }

    // Ensure current enrollment doesn't exceed max enrollment
    const newMaxEnrollment = maxEnrollment !== undefined ? maxEnrollment : existingCourse.maxEnrollment;
    const newCurrentEnrollment = currentEnrollment !== undefined ? currentEnrollment : existingCourse.currentEnrollment;
    if (newCurrentEnrollment > newMaxEnrollment) {
      return errorResponse(res, 400, 'Current enrollment cannot exceed max enrollment');
    }

    // Update the course with core attributes
    const updateData = {};
    if (subjectId !== undefined) updateData.subjectId = subjectId;
    if (semester !== undefined) updateData.semester = semester;
    if (year !== undefined) updateData.year = year;
    if (instructorId !== undefined) updateData.instructorId = instructorId;
    if (maxEnrollment !== undefined) updateData.maxEnrollment = maxEnrollment;
    if (currentEnrollment !== undefined) updateData.currentEnrollment = currentEnrollment;
    if (schedule !== undefined) updateData.schedule = schedule;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Add flexible attributes directly to updateData (not nested)
    if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
    if (corequisites !== undefined) updateData.corequisites = corequisites;
    if (labRequired !== undefined) updateData.labRequired = labRequired;
    if (labHours !== undefined) updateData.labHours = labHours;
    if (gradingRubric !== undefined) updateData.gradingRubric = gradingRubric;
    if (assessmentTypes !== undefined) updateData.assessmentTypes = assessmentTypes;
    if (attendancePolicy !== undefined) updateData.attendancePolicy = attendancePolicy;
    if (onlineMeetingLink !== undefined) updateData.onlineMeetingLink = onlineMeetingLink;
    if (syllabusUrl !== undefined) updateData.syllabusUrl = syllabusUrl;
    if (officeHours !== undefined) updateData.officeHours = officeHours;
    if (textbookTitle !== undefined) updateData.textbookTitle = textbookTitle;
    if (textbookAuthor !== undefined) updateData.textbookAuthor = textbookAuthor;
    if (textbookIsbn !== undefined) updateData.textbookIsbn = textbookIsbn;
    if (textbookRequired !== undefined) updateData.textbookRequired = textbookRequired;

    const course = await courseRepo.updateCourse(courseId, updateData);

    successResponse(res, 200, 'Course updated successfully', { course });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse(res, 400, 'A course with these details already exists');
    }
    errorResponse(res, 500, 'Server error while updating course');
  }
};

// ===================================================================
// @desc    Delete course (Admin only)
// @route   DELETE /api/curriculum/courses/:id
// @access  Private/Admin
// ===================================================================
const deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check if course exists
    const course = await courseRepo.getCourseById(courseId);
    if (!course) {
      return errorResponse(res, 404, 'Course not found');
    }

    // Check if course has enrollments
    if (course.currentEnrollment > 0) {
      return errorResponse(
        res, 
        400, 
        'Cannot delete course with active enrollments. Please unenroll all students first.'
      );
    }

    // Delete the course
    const deleted = await courseRepo.deleteCourse(courseId);
    if (!deleted) {
      return errorResponse(res, 500, 'Failed to delete course');
    }

    successResponse(res, 200, 'Course deleted successfully');
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return errorResponse(
        res, 
        400, 
        'Cannot delete course because it has associated records (enrollments, grades, etc.)'
      );
    }
    errorResponse(res, 500, 'Server error while deleting course');
  }
};

// @desc Get courses for the logged-in instructor
// @route GET /api/curriculum/my-courses
// @access Private (professor/ta)

const getMyCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      subjectId = '',
      departmentId = '',
      semester = '',
      year = '',
      isActive = ''
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    let isActiveFilter = null;
    if (isActive === 'true') isActiveFilter = true;
    if (isActive === 'false') isActiveFilter = false;

    const subjId = subjectId ? parseInt(subjectId, 10) : null;
    const deptId = departmentId ? parseInt(departmentId, 10) : null;
    const yearNum = year ? parseInt(year, 10) : null;

    // 1) get courses from EAV repo, filtered by instructor
    const { courses, totalCourses } = await courseRepo.getAllCourses({
      page: pageNum,
      limit: limitNum,
      search,
      subjectId: subjId,
      semester: semester || null,
      year: yearNum,
      instructorId: req.user.id,
      isActive: isActiveFilter
    }); // courseRepo is courseEavRepoNew [file:4][file:5]

    // 2) enrich each course with subject and department (via subjectEavRepoNew)
    const populatedCourses = await Promise.all(
      courses.map(async (course) => {
        const courseWithDetails = { ...course };

        if (course.subjectId) {
          const subject = await subjectRepo.getSubjectById(course.subjectId); // subjectEavRepoNew [file:4]
          if (subject) {
            courseWithDetails.subject = {
              id: subject.id,
              name: subject.name,
              code: subject.code
            };

            // depending on how subjectEavRepoNew returns department info:
            if (subject.department) {
              courseWithDetails.department = {
                id: subject.department.id,
                name: subject.department.name,
                code: subject.department.code
              };
            } else if (subject.departmentId) {
              // if you only get departmentId here, call your department repo
              const department = await departmentRepo.getDepartmentById(subject.departmentId);
              if (department) {
                courseWithDetails.department = {
                  id: department.id,
                  name: department.name,
                  code: department.code
                };
              }
            }
          }
        }

        return courseWithDetails;
      })
    );

    const totalPages = Math.ceil(totalCourses / limitNum) || 1;

    return successResponse(res, 200, 'My courses retrieved successfully', {
      courses: populatedCourses,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCourses,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Server error while retrieving courses');
  }
};



module.exports = {
  getAllCourses,
  getCourseById,
  getCoursesBySubject,
  createCourse,
  updateCourse,
  deleteCourse,
  getMyCourses
};
