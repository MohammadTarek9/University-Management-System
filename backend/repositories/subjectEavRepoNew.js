const subjectsEav = require('../utils/subjectsEav');

/**
 * Subject Repository using Subjects-Specific 3-Table EAV Model
 * Works with: subjects_eav_entities, subjects_eav_attributes, subjects_eav_values
 */

/**
 * Map EAV entity to Subject object format
 */
function mapSubjectEntity(entity) {
  if (!entity) return null;

  // Helper to safely convert to integer
  const toInt = (val) => val != null ? Math.floor(Number(val)) : val;
  
  // Helper to convert to boolean (handles MySQL TINYINT)
  const toBool = (val) => {
    if (val === undefined || val === null) return true; // default to true
    return Boolean(val);
  };

  return {
    id: toInt(entity.entity_id || entity.id),
    name: entity.name,
    code: entity.code,
    description: entity.description,
    credits: toInt(entity.credits),
    classification: entity.classification || 'elective', // Default to elective if not specified
    semester: entity.semester,
    academicYear: entity.academic_year || entity.academicYear,
    departmentId: toInt(entity.department_id || entity.departmentId),
    isActive: toBool(entity.is_active !== undefined ? entity.is_active : entity.isActive),
    
    // EAV flexible attributes
    prerequisites: entity.prerequisites,
    corequisites: entity.corequisites,
    learningOutcomes: entity.learning_outcomes || entity.learningOutcomes,
    textbooks: entity.textbooks,
    labRequired: entity.lab_required || entity.labRequired,
    labHours: toInt(entity.lab_hours || entity.labHours),
    studioRequired: entity.studio_required || entity.studioRequired,
    studioHours: toInt(entity.studio_hours || entity.studioHours),
    certifications: entity.certifications,
    repeatability: entity.repeatability,
    syllabusTemplate: entity.syllabus_template || entity.syllabusTemplate,
    typicalOffering: entity.typical_offering || entity.typicalOffering,
    
    createdAt: entity.created_at || entity.createdAt,
    updatedAt: entity.updated_at || entity.updatedAt
  };
}

/**
 * Get all subjects with filtering and pagination
 */
async function getAllSubjects(options = {}) {
  try {
    const { page = 1, limit = 50, search = '', departmentId, classification, isActive } = options;
    
    // Get all subjects
    const allEntities = await subjectsEav.getAllEntities({ includeInactive: isActive === false || isActive === 0 });
    let subjects = allEntities.map(mapSubjectEntity);
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      subjects = subjects.filter(s => 
        s.name?.toLowerCase().includes(searchLower) ||
        s.code?.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (departmentId) {
      subjects = subjects.filter(s => s.departmentId === departmentId);
    }
    
    if (classification) {
      subjects = subjects.filter(s => s.classification === classification);
    }
    
    if (isActive !== null && isActive !== undefined) {
      subjects = subjects.filter(s => s.isActive === isActive);
    }
    
    const totalSubjects = subjects.length;
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSubjects = subjects.slice(startIndex, endIndex);
    
    return {
      subjects: paginatedSubjects,
      totalSubjects
    };
  } catch (error) {
    console.error('Error in getAllSubjects:', error);
    throw error;
  }
}

/**
 * Get subject by ID
 */
async function getSubjectById(id) {
  try {
    const entity = await subjectsEav.getEntityById(id);
    if (!entity) {
      return null;
    }
    return mapSubjectEntity(entity);
  } catch (error) {
    console.error('Error in getSubjectById:', error);
    throw error;
  }
}

/**
 * Get subjects by department
 */
async function getSubjectsByDepartment(departmentId) {
  try {
    const allEntities = await subjectsEav.getAllEntities({ includeInactive: false });
    const filtered = allEntities.filter(e => e.department_id == departmentId);
    return filtered.map(mapSubjectEntity);
  } catch (error) {
    console.error('Error in getSubjectsByDepartment:', error);
    throw error;
  }
}

/**
 * Create a new subject
 */
async function createSubject(subjectData) {
  try {
    console.log('Creating subject with data:', JSON.stringify(subjectData, null, 2));
    
    // Create entity
    const entityId = await subjectsEav.createEntity(subjectData.name, {
      isActive: subjectData.isActive !== undefined ? subjectData.isActive : 1
    });

    // Set ALL attributes including department_id (now stored as attribute, not column)
    const attributes = {
      department_id: { value: subjectData.departmentId, type: 'number' },
      code: { value: subjectData.code, type: 'string' },
      description: { value: subjectData.description, type: 'text' },
      credits: { value: subjectData.credits, type: 'number' },
      classification: { value: subjectData.classification, type: 'string' },
      semester: { value: subjectData.semester, type: 'string' },
      academic_year: { value: subjectData.academicYear, type: 'string' },
      
      // Flexible EAV attributes
      prerequisites: { value: subjectData.prerequisites, type: 'text' },
      corequisites: { value: subjectData.corequisites, type: 'text' },
      learning_outcomes: { value: subjectData.learningOutcomes, type: 'text' },
      textbooks: { value: subjectData.textbooks, type: 'text' },
      lab_required: { value: subjectData.labRequired, type: 'boolean' },
      lab_hours: { value: subjectData.labHours, type: 'number' },
      studio_required: { value: subjectData.studioRequired, type: 'boolean' },
      studio_hours: { value: subjectData.studioHours, type: 'number' },
      certifications: { value: subjectData.certifications, type: 'text' },
      repeatability: { value: subjectData.repeatability, type: 'string' },
      syllabus_template: { value: subjectData.syllabusTemplate, type: 'text' },
      typical_offering: { value: subjectData.typicalOffering, type: 'string' }
    };

    await subjectsEav.setEntityAttributes(entityId, attributes);

    return await getSubjectById(entityId);
  } catch (error) {
    console.error('Error in createSubject:', error);
    throw error;
  }
}

/**
 * Update a subject
 */
async function updateSubject(id, subjectData) {
  try {
    // Update entity base fields (only name and is_active)
    const entityUpdates = {};
    if (subjectData.name) entityUpdates.name = subjectData.name;
    if (subjectData.isActive !== undefined) entityUpdates.isActive = subjectData.isActive;

    if (Object.keys(entityUpdates).length > 0) {
      await subjectsEav.updateEntity(id, entityUpdates);
    }

    // Update attributes (department_id is an attribute, not a column)
    const attributes = {
      department_id: { value: subjectData.departmentId, type: 'number' },
      code: { value: subjectData.code, type: 'string' },
      description: { value: subjectData.description, type: 'text' },
      credits: { value: subjectData.credits, type: 'number' },
      classification: { value: subjectData.classification, type: 'string' },
      semester: { value: subjectData.semester, type: 'string' },
      academic_year: { value: subjectData.academicYear, type: 'string' },
      
      // Flexible attributes
      prerequisites: { value: subjectData.prerequisites, type: 'text' },
      corequisites: { value: subjectData.corequisites, type: 'text' },
      learning_outcomes: { value: subjectData.learningOutcomes, type: 'text' },
      textbooks: { value: subjectData.textbooks, type: 'text' },
      lab_required: { value: subjectData.labRequired, type: 'boolean' },
      lab_hours: { value: subjectData.labHours, type: 'number' },
      studio_required: { value: subjectData.studioRequired, type: 'boolean' },
      studio_hours: { value: subjectData.studioHours, type: 'number' },
      certifications: { value: subjectData.certifications, type: 'text' },
      repeatability: { value: subjectData.repeatability, type: 'string' },
      syllabus_template: { value: subjectData.syllabusTemplate, type: 'text' },
      typical_offering: { value: subjectData.typicalOffering, type: 'string' }
    };

    await subjectsEav.setEntityAttributes(id, attributes);

    return await getSubjectById(id);
  } catch (error) {
    console.error('Error in updateSubject:', error);
    throw error;
  }
}

/**
 * Delete a subject
 */
async function deleteSubject(id) {
  try {
    await subjectsEav.deleteEntity(id);
    return true;
  } catch (error) {
    console.error('Error in deleteSubject:', error);
    throw error;
  }
}

/**
 * Search subjects by code or name
 */
async function searchSubjects(searchTerm) {
  try {
    const codeResults = await subjectsEav.searchEntities(searchTerm, 'code');
    return codeResults.map(mapSubjectEntity);
  } catch (error) {
    console.error('Error in searchSubjects:', error);
    throw error;
  }
}

/**
 * Get subject by code
 */
async function getSubjectByCode(code) {
  try {
    const allEntities = await subjectsEav.getAllEntities();
    const subject = allEntities.find(entity => entity.code === code);
    return subject ? mapSubjectEntity(subject) : null;
  } catch (error) {
    console.error('Error in getSubjectByCode:', error);
    throw error;
  }
}

module.exports = {
  getAllSubjects,
  getSubjectById,
  getSubjectsByDepartment,
  createSubject,
  updateSubject,
  deleteSubject,
  searchSubjects,
  getSubjectByCode
};
