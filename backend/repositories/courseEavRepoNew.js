const eav = require('../utils/eavNew');

/**
 * Course Repository using 3-Table EAV Model
 * Works with: eav_entities, eav_attributes, eav_values
 */

const ENTITY_TYPE = 'course';

/**
 * Map EAV entity to Course object format
 */
function mapCourseEntity(entity) {
  if (!entity) return null;

  return {
    id: entity.id,
    subjectId: entity.subjectId || entity.subject_id,
    semester: entity.semester,
    year: entity.year,
    instructorId: entity.instructorId || entity.instructor_id,
    maxEnrollment: entity.maxEnrollment || entity.max_enrollment,
    currentEnrollment: entity.currentEnrollment || entity.current_enrollment,
    schedule: entity.schedule,
    isActive: entity.isActive !== undefined ? entity.isActive : true,
    
    // EAV flexible attributes
    prerequisites: entity.prerequisites,
    corequisites: entity.corequisites,
    labRequired: entity.labRequired || entity.lab_required,
    labHours: entity.labHours || entity.lab_hours,
    gradingRubric: entity.gradingRubric || entity.grading_rubric,
    assessmentTypes: entity.assessmentTypes || entity.assessment_types,
    attendancePolicy: entity.attendancePolicy || entity.attendance_policy,
    onlineMeetingLink: entity.onlineMeetingLink || entity.online_meeting_link,
    syllabusUrl: entity.syllabusUrl || entity.syllabus_url,
    officeHours: entity.officeHours || entity.office_hours,
    textbookTitle: entity.textbookTitle || entity.textbook_title,
    textbookAuthor: entity.textbookAuthor || entity.textbook_author,
    textbookIsbn: entity.textbookIsbn || entity.textbook_isbn,
    textbookRequired: entity.textbookRequired || entity.textbook_required,
    
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt
  };
}

/**
 * Get all courses
 */
async function getAllCourses() {
  try {
    const entities = await eav.getEntitiesByType(ENTITY_TYPE, { isActive: 1 });
    return entities.map(mapCourseEntity);
  } catch (error) {
    console.error('Error in getAllCourses:', error);
    throw error;
  }
}

/**
 * Get course by ID
 */
async function getCourseById(id) {
  try {
    const entity = await eav.getEntityById(id);
    if (!entity || entity.entityType !== ENTITY_TYPE) {
      return null;
    }
    return mapCourseEntity(entity);
  } catch (error) {
    console.error('Error in getCourseById:', error);
    throw error;
  }
}

/**
 * Get courses by subject ID
 */
async function getCoursesBySubjectId(subjectId) {
  try {
    const entities = await eav.getEntitiesByType(ENTITY_TYPE, { subjectId, isActive: 1 });
    return entities.map(mapCourseEntity);
  } catch (error) {
    console.error('Error in getCoursesBySubjectId:', error);
    throw error;
  }
}

/**
 * Create a new course
 */
async function createCourse(courseData) {
  try {
    // Generate course name from subject info
    const courseName = courseData.name || `Course ${courseData.semester} ${courseData.year}`;
    
    // Create entity (truly generic - no specific columns)
    const entityId = await eav.createEntity(ENTITY_TYPE, courseName, {
      isActive: courseData.isActive !== undefined ? courseData.isActive : 1
    });

    // Set ALL attributes including subject_id (now stored as attribute, not column)
    const attributes = {
      subject_id: { value: courseData.subjectId, type: 'number' },
      semester: { value: courseData.semester, type: 'string' },
      year: { value: courseData.year, type: 'number' },
      instructor_id: { value: courseData.instructorId, type: 'number' },
      max_enrollment: { value: courseData.maxEnrollment || 30, type: 'number' },
      current_enrollment: { value: courseData.currentEnrollment || 0, type: 'number' },
      schedule: { value: courseData.schedule, type: 'text' },
      
      // Flexible EAV attributes
      prerequisites: { value: courseData.prerequisites, type: 'text' },
      corequisites: { value: courseData.corequisites, type: 'text' },
      lab_required: { value: courseData.labRequired, type: 'boolean' },
      lab_hours: { value: courseData.labHours, type: 'number' },
      grading_rubric: { value: courseData.gradingRubric, type: 'text' },
      assessment_types: { value: courseData.assessmentTypes, type: 'text' },
      attendance_policy: { value: courseData.attendancePolicy, type: 'text' },
      online_meeting_link: { value: courseData.onlineMeetingLink, type: 'string' },
      syllabus_url: { value: courseData.syllabusUrl, type: 'string' },
      office_hours: { value: courseData.officeHours, type: 'string' },
      textbook_title: { value: courseData.textbookTitle, type: 'string' },
      textbook_author: { value: courseData.textbookAuthor, type: 'string' },
      textbook_isbn: { value: courseData.textbookIsbn, type: 'string' },
      textbook_required: { value: courseData.textbookRequired, type: 'boolean' }
    };

    await eav.setEntityAttributes(entityId, attributes);

    return await getCourseById(entityId);
  } catch (error) {
    console.error('Error in createCourse:', error);
    throw error;
  }
}

/**
 * Update a course
 */
async function updateCourse(id, courseData) {
  try {
    // Update entity base fields if provided
    const entityUpdates = {};
    if (courseData.name) entityUpdates.name = courseData.name;
    if (courseData.subjectId !== undefined) entityUpdates.subject_id = courseData.subjectId;
    if (courseData.isActive !== undefined) entityUpdates.is_active = courseData.isActive;

    if (Object.keys(entityUpdates).length > 0) {
      await eav.updateEntity(id, entityUpdates);
    }

    // Update attributes
    const attributes = {
      semester: { value: courseData.semester, type: 'string' },
      year: { value: courseData.year, type: 'number' },
      instructor_id: { value: courseData.instructorId, type: 'number' },
      max_enrollment: { value: courseData.maxEnrollment, type: 'number' },
      current_enrollment: { value: courseData.currentEnrollment, type: 'number' },
      schedule: { value: courseData.schedule, type: 'text' },
      
      // Flexible attributes
      prerequisites: { value: courseData.prerequisites, type: 'text' },
      corequisites: { value: courseData.corequisites, type: 'text' },
      lab_required: { value: courseData.labRequired, type: 'boolean' },
      lab_hours: { value: courseData.labHours, type: 'number' },
      grading_rubric: { value: courseData.gradingRubric, type: 'text' },
      assessment_types: { value: courseData.assessmentTypes, type: 'text' },
      attendance_policy: { value: courseData.attendancePolicy, type: 'text' },
      online_meeting_link: { value: courseData.onlineMeetingLink, type: 'string' },
      syllabus_url: { value: courseData.syllabusUrl, type: 'string' },
      office_hours: { value: courseData.officeHours, type: 'string' },
      textbook_title: { value: courseData.textbookTitle, type: 'string' },
      textbook_author: { value: courseData.textbookAuthor, type: 'string' },
      textbook_isbn: { value: courseData.textbookIsbn, type: 'string' },
      textbook_required: { value: courseData.textbookRequired, type: 'boolean' }
    };

    await eav.setEntityAttributes(id, attributes);

    return await getCourseById(id);
  } catch (error) {
    console.error('Error in updateCourse:', error);
    throw error;
  }
}

/**
 * Delete a course
 */
async function deleteCourse(id) {
  try {
    await eav.deleteEntity(id);
    return true;
  } catch (error) {
    console.error('Error in deleteCourse:', error);
    throw error;
  }
}

module.exports = {
  getAllCourses,
  getCourseById,
  getCoursesBySubjectId,
  createCourse,
  updateCourse,
  deleteCourse
};
