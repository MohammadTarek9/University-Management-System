const eav = require('../utils/eav');

/**
 * Subject Repository using EAV Model
 * Handles CRUD operations for subjects (course catalog) stored in the EAV structure
 */

const ENTITY_TYPE_CODE = 'subject';

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
    classification: entity.classification,
    departmentId: entity['department_id'] || entity.departmentId,
    isActive: entity['is_active'] !== undefined ? entity['is_active'] : entity.isActive,
    createdBy: entity['created_by'] || entity.createdBy,
    updatedBy: entity['updated_by'] || entity.updatedBy,
    
    // EAV-specific flexible attributes
    prerequisites: entity.prerequisites,
    corequisites: entity.corequisites,
    learningOutcomes: entity['learning_outcomes'] || entity.learningOutcomes,
    requiredTextbooks: entity['required_textbooks'] || entity.requiredTextbooks,
    recommendedTextbooks: entity['recommended_textbooks'] || entity.recommendedTextbooks,
    labRequired: entity['lab_required'] || entity.labRequired,
    studioRequired: entity['studio_required'] || entity.studioRequired,
    specialPermissionNeeded: entity['special_permission_needed'] || entity.specialPermissionNeeded,
    industryCertifications: entity['industry_certifications'] || entity.industryCertifications,
    minimumGrade: entity['minimum_grade'] || entity.minimumGrade,
    repeatableForCredit: entity['repeatable_for_credit'] || entity.repeatableForCredit,
    maxRepeats: entity['max_repeats'] || entity.maxRepeats,
    syllabusTemplate: entity['syllabus_template'] || entity.syllabusTemplate,
    typicalOffering: entity['typical_offering'] || entity.typicalOffering,
    
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt
  };
}

/**
 * Prepare subject data for EAV storage
 */
function prepareSubjectAttributes(data) {
  const attributes = {
    // Core fields
    'name': data.name,
    'code': data.code,
    'description': data.description || null,
    'credits': data.credits,
    'classification': data.classification,
    'department_id': data.departmentId,
    'is_active': data.isActive !== undefined ? data.isActive : true,
    'created_by': data.createdBy,
    'updated_by': data.updatedBy || null,
    
    // Flexible EAV attributes
    'prerequisites': data.prerequisites || null,
    'corequisites': data.corequisites || null,
    'learning_outcomes': data.learningOutcomes || null,
    'required_textbooks': data.requiredTextbooks || null,
    'recommended_textbooks': data.recommendedTextbooks || null,
    'lab_required': data.labRequired || false,
    'studio_required': data.studioRequired || false,
    'special_permission_needed': data.specialPermissionNeeded || false,
    'industry_certifications': data.industryCertifications || null,
    'minimum_grade': data.minimumGrade || null,
    'repeatable_for_credit': data.repeatableForCredit || false,
    'max_repeats': data.maxRepeats || null,
    'syllabus_template': data.syllabusTemplate || null,
    'typical_offering': data.typicalOffering || null
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
 * Create a new subject
 */
async function createSubject(subjectData) {
  try {
    const attributes = prepareSubjectAttributes(subjectData);
    const naturalKey = subjectData.code;
    
    const entityId = await eav.createEntityWithAttributes(
      ENTITY_TYPE_CODE,
      attributes,
      naturalKey
    );

    return await getSubjectById(entityId);
  } catch (error) {
    console.error('Error creating subject:', error);
    throw error;
  }
}

/**
 * Get subject by ID
 */
async function getSubjectById(id) {
  try {
    const entity = await eav.getEntity(id, ENTITY_TYPE_CODE);
    return mapSubjectEntity(entity);
  } catch (error) {
    console.error('Error getting subject:', error);
    throw error;
  }
}

/**
 * Update subject
 */
async function updateSubject(id, subjectData) {
  try {
    const attributes = prepareSubjectAttributes(subjectData);
    await eav.updateEntityAttributes(id, attributes, ENTITY_TYPE_CODE);
    
    return await getSubjectById(id);
  } catch (error) {
    console.error('Error updating subject:', error);
    throw error;
  }
}

/**
 * Delete subject
 */
async function deleteSubject(id) {
  try {
    await eav.deleteEntity(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting subject:', error);
    throw error;
  }
}

/**
 * Get all subjects with filters and pagination
 */
async function getAllSubjects(options = {}) {
  try {
    const {
      page = 1,
      limit = 50,
      departmentId,
      classification,
      isActive
    } = options;

    const filters = {};
    
    if (departmentId) filters['department_id'] = departmentId;
    if (classification) filters['classification'] = classification;
    if (isActive !== undefined && isActive !== null) {
      filters['is_active'] = isActive ? 1 : 0;
    }

    const result = await eav.queryEntities(ENTITY_TYPE_CODE, filters, { page, limit });

    return {
      subjects: result.entities.map(mapSubjectEntity),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  } catch (error) {
    console.error('Error getting all subjects:', error);
    throw error;
  }
}

/**
 * Get subject by code (for uniqueness check)
 */
async function getSubjectByCode(code) {
  try {
    const result = await eav.queryEntities(ENTITY_TYPE_CODE, { code }, { page: 1, limit: 1 });
    
    if (result.entities.length > 0) {
      return mapSubjectEntity(result.entities[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting subject by code:', error);
    throw error;
  }
}

module.exports = {
  createSubject,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getAllSubjects,
  getSubjectByCode
};
