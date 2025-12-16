const eav = require('../utils/eavNew');

/**
 * Subject Repository using 3-Table EAV Model
 * Works with: eav_entities, eav_attributes, eav_values
 */

const ENTITY_TYPE = 'subject';

/**
 * Map EAV entity to Subject object format
 */
function mapSubjectEntity(entity) {
  if (!entity) return null;

  return {
    id: entity.id,
    name: entity.name,
    code: entity.code,
    description: entity.description,
    credits: entity.credits,
    departmentId: entity.departmentId || entity.department_id,
    isActive: entity.isActive !== undefined ? entity.isActive : true,
    
    // EAV flexible attributes
    prerequisites: entity.prerequisites,
    corequisites: entity.corequisites,
    learningOutcomes: entity.learningOutcomes || entity.learning_outcomes,
    textbooks: entity.textbooks,
    labRequired: entity.labRequired || entity.lab_required,
    labHours: entity.labHours || entity.lab_hours,
    studioRequired: entity.studioRequired || entity.studio_required,
    studioHours: entity.studioHours || entity.studio_hours,
    certifications: entity.certifications,
    repeatability: entity.repeatability,
    syllabusTemplate: entity.syllabusTemplate || entity.syllabus_template,
    typicalOffering: entity.typicalOffering || entity.typical_offering,
    
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt
  };
}

/**
 * Get all subjects
 */
async function getAllSubjects() {
  try {
    const entities = await eav.getEntitiesByType(ENTITY_TYPE, { isActive: 1 });
    return entities.map(mapSubjectEntity);
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
    const entity = await eav.getEntityById(id);
    if (!entity || entity.entityType !== ENTITY_TYPE) {
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
    const entities = await eav.getEntitiesByType(ENTITY_TYPE, { departmentId, isActive: 1 });
    return entities.map(mapSubjectEntity);
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
    // Create entity (truly generic - no specific columns)
    const entityId = await eav.createEntity(ENTITY_TYPE, subjectData.name, {
      isActive: subjectData.isActive !== undefined ? subjectData.isActive : 1
    });

    // Set ALL attributes including department_id (now stored as attribute, not column)
    const attributes = {
      department_id: { value: subjectData.departmentId, type: 'number' },
      code: { value: subjectData.code, type: 'string' },
      description: { value: subjectData.description, type: 'text' },
      credits: { value: subjectData.credits, type: 'number' },
      
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

    await eav.setEntityAttributes(entityId, attributes);

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
    // Update entity base fields
    const entityUpdates = {};
    if (subjectData.name) entityUpdates.name = subjectData.name;
    if (subjectData.departmentId !== undefined) entityUpdates.department_id = subjectData.departmentId;
    if (subjectData.isActive !== undefined) entityUpdates.is_active = subjectData.isActive;

    if (Object.keys(entityUpdates).length > 0) {
      await eav.updateEntity(id, entityUpdates);
    }

    // Update attributes
    const attributes = {
      code: { value: subjectData.code, type: 'string' },
      description: { value: subjectData.description, type: 'text' },
      credits: { value: subjectData.credits, type: 'number' },
      
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

    await eav.setEntityAttributes(id, attributes);

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
    await eav.deleteEntity(id);
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
    const codeResults = await eav.searchEntitiesByAttribute(ENTITY_TYPE, 'code', searchTerm);
    return codeResults.map(mapSubjectEntity);
  } catch (error) {
    console.error('Error in searchSubjects:', error);
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
  searchSubjects
};
