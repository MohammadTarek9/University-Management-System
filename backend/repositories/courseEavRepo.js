const eav = require('../utils/eav');

/**
 * Course Repository using EAV Model
 * Handles CRUD operations for courses stored in the EAV structure
 */

const ENTITY_TYPE_CODE = 'course';

/**
 * Map EAV entity to Course object format
 */
function mapCourseEntity(entity) {
  if (!entity) return null;

  return {
    id: entity.id,
    subjectId: entity['subject_id'] || entity.subjectId,
    semester: entity.semester,
    year: entity.year,
    instructorId: entity['instructor_id'] || entity.instructorId,
    maxEnrollment: entity['max_enrollment'] || entity.maxEnrollment,
    currentEnrollment: entity['current_enrollment'] || entity.currentEnrollment,
    schedule: entity.schedule,
    isActive: entity['is_active'] !== undefined ? entity['is_active'] : entity.isActive,
    
    // EAV-specific flexible attributes
    prerequisites: entity.prerequisites,
    labRequired: entity['lab_required'] || entity.labRequired,
    labHours: entity['lab_hours'] || entity.labHours,
    gradingRubric: entity['grading_rubric'] || entity.gradingRubric,
    assessmentTypes: entity['assessment_types'] || entity.assessmentTypes,
    attendancePolicy: entity['attendance_policy'] || entity.attendancePolicy,
    onlineMeetingLink: entity['online_meeting_link'] || entity.onlineMeetingLink,
    syllabusUrl: entity['syllabus_url'] || entity.syllabusUrl,
    officeHours: entity['office_hours'] || entity.officeHours,
    textbookRequired: entity['textbook_required'] || entity.textbookRequired,
    textbookInfo: entity['textbook_info'] || entity.textbookInfo,
    
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt
  };
}

/**
 * Prepare course data for EAV storage
 */
function prepareCourseAttributes(data) {
  const attributes = {
    // Core fields
    'subject_id': data.subjectId,
    'semester': data.semester,
    'year': data.year,
    'instructor_id': data.instructorId,
    'max_enrollment': data.maxEnrollment || 30,
    'current_enrollment': data.currentEnrollment || 0,
    'schedule': data.schedule,
    'is_active': data.isActive !== undefined ? data.isActive : true,
    
    // Flexible EAV attributes
    'prerequisites': data.prerequisites || null,
    'lab_required': data.labRequired || false,
    'lab_hours': data.labHours || null,
    'grading_rubric': data.gradingRubric || null,
    'assessment_types': data.assessmentTypes || null,
    'attendance_policy': data.attendancePolicy || null,
    'online_meeting_link': data.onlineMeetingLink || null,
    'syllabus_url': data.syllabusUrl || null,
    'office_hours': data.officeHours || null,
    'textbook_required': data.textbookRequired || false,
    'textbook_info': data.textbookInfo || null
  };

  // Remove undefined values
  Object.keys(attributes).forEach(key => {
    if (attributes[key] === undefined) {
      delete attributes[key];
    }
  });

  return attributes;
}

/**
 * Create a new course
 */
async function createCourse(courseData) {
  try {
    const attributes = prepareCourseAttributes(courseData);
    const naturalKey = `${courseData.subjectId}-${courseData.semester}-${courseData.year}`;
    
    const entityId = await eav.createEntityWithAttributes(
      ENTITY_TYPE_CODE,
      attributes,
      naturalKey
    );

    return await getCourseById(entityId);
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

/**
 * Get course by ID
 */
async function getCourseById(id) {
  try {
    const entity = await eav.getEntity(id, ENTITY_TYPE_CODE);
    return mapCourseEntity(entity);
  } catch (error) {
    console.error('Error getting course:', error);
    throw error;
  }
}

/**
 * Update course
 */
async function updateCourse(id, courseData) {
  try {
    const attributes = prepareCourseAttributes(courseData);
    await eav.updateEntityAttributes(id, attributes, ENTITY_TYPE_CODE);
    
    return await getCourseById(id);
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}

/**
 * Delete course
 */
async function deleteCourse(id) {
  try {
    await eav.deleteEntity(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}

/**
 * Get all courses with filters and pagination
 */
async function getAllCourses(options = {}) {
  try {
    const {
      page = 1,
      limit = 50,
      subjectId,
      semester,
      year,
      instructorId,
      isActive
    } = options;

    const filters = {};
    
    if (subjectId) filters['subject_id'] = subjectId;
    if (semester) filters['semester'] = semester;
    if (year) filters['year'] = year;
    if (instructorId) filters['instructor_id'] = instructorId;
    if (isActive !== undefined && isActive !== null) {
      filters['is_active'] = isActive ? 1 : 0;
    }

    const result = await eav.queryEntities(ENTITY_TYPE_CODE, filters, { page, limit });

    return {
      courses: result.entities.map(mapCourseEntity),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  } catch (error) {
    console.error('Error getting all courses:', error);
    throw error;
  }
}

/**
 * Update enrollment count
 */
async function updateEnrollmentCount(id, increment = true) {
  try {
    const course = await getCourseById(id);
    if (!course) {
      throw new Error('Course not found');
    }

    const newCount = increment 
      ? (course.currentEnrollment || 0) + 1
      : Math.max((course.currentEnrollment || 0) - 1, 0);

    await updateCourse(id, {
      ...course,
      currentEnrollment: newCount
    });

    return await getCourseById(id);
  } catch (error) {
    console.error('Error updating enrollment count:', error);
    throw error;
  }
}

module.exports = {
  createCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  getAllCourses,
  updateEnrollmentCount
};
