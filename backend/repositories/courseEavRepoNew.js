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

  // Helper to safely convert to integer
  const toInt = (val) => val != null ? Math.floor(Number(val)) : val;

  return {
    id: toInt(entity.entity_id || entity.id),
    subjectId: toInt(entity.subject_id || entity.subjectId),
    semester: entity.semester,
    year: toInt(entity.year),
    instructorId: toInt(entity.instructor_id || entity.instructorId),
    maxEnrollment: toInt(entity.max_enrollment || entity.maxEnrollment),
    currentEnrollment: toInt(entity.current_enrollment || entity.currentEnrollment),
    schedule: entity.schedule,
    isActive: entity.is_active !== undefined ? entity.is_active : (entity.isActive !== undefined ? entity.isActive : true),
    
    // EAV flexible attributes
    prerequisites: entity.prerequisites,
    corequisites: entity.corequisites,
    labRequired: entity.lab_required || entity.labRequired,
    labHours: toInt(entity.lab_hours || entity.labHours),
    gradingRubric: entity.grading_rubric || entity.gradingRubric,
    assessmentTypes: entity.assessment_types || entity.assessmentTypes,
    attendancePolicy: entity.attendance_policy || entity.attendancePolicy,
    onlineMeetingLink: entity.online_meeting_link || entity.onlineMeetingLink,
    syllabusUrl: entity.syllabus_url || entity.syllabusUrl,
    officeHours: entity.office_hours || entity.officeHours,
    textbookTitle: entity.textbook_title || entity.textbookTitle,
    textbookAuthor: entity.textbook_author || entity.textbookAuthor,
    textbookIsbn: entity.textbook_isbn || entity.textbookIsbn,
    textbookRequired: entity.textbook_required || entity.textbookRequired,
    
    createdAt: entity.created_at || entity.createdAt,
    updatedAt: entity.updated_at || entity.updatedAt
  };
}

/**
 * Get all courses with filtering and pagination
 */
async function getAllCourses(options = {}) {
  try {
    const { page = 1, limit = 50, search = '', subjectId, semester, year, instructorId, isActive } = options;
    
    // Get all courses
    const allEntities = await eav.getEntitiesByType(ENTITY_TYPE);
    let courses = allEntities.map(mapCourseEntity);
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(c => 
        c.schedule?.toLowerCase().includes(searchLower)
      );
    }
    
    if (subjectId) {
      courses = courses.filter(c => c.subjectId === subjectId);
    }
    
    if (semester) {
      courses = courses.filter(c => c.semester === semester);
    }
    
    if (year) {
      courses = courses.filter(c => c.year === parseInt(year));
    }
    
    if (instructorId) {
      courses = courses.filter(c => c.instructorId === instructorId);
    }
    
    if (isActive !== null && isActive !== undefined) {
      courses = courses.filter(c => c.isActive === isActive);
    }
    
    const totalCourses = courses.length;
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCourses = courses.slice(startIndex, endIndex);
    
    return {
      courses: paginatedCourses,
      totalCourses
    };
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
    if (!entity || entity.entity_type !== ENTITY_TYPE) {
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
    // Update entity base fields (only name and is_active)
    const entityUpdates = {};
    if (courseData.name) entityUpdates.name = courseData.name;
    if (courseData.isActive !== undefined) entityUpdates.is_active = courseData.isActive;

    if (Object.keys(entityUpdates).length > 0) {
      await eav.updateEntity(id, entityUpdates);
    }

    // Update attributes (subject_id is an attribute, not a column)
    const attributes = {
      subject_id: { value: courseData.subjectId, type: 'number' },
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
