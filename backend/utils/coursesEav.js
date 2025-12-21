const pool = require('../db/mysql');

/**
 * Courses-Specific EAV Utility Functions
 * Works with: courses_eav_entities, courses_eav_attributes, courses_eav_values
 */

/**
 * Generate a human-readable description for a course attribute
 */
function generateAttributeDescription(attributeName) {
  const descriptions = {
    'subject_id': 'Subject ID that this course is based on',
    'semester': 'Semester (Fall, Spring, Summer)',
    'year': 'Academic year',
    'instructor_id': 'Instructor user ID',
    'max_enrollment': 'Maximum enrollment capacity',
    'current_enrollment': 'Current number of enrolled students',
    'schedule': 'Course schedule details',
    'prerequisites': 'Course-specific prerequisites',
    'corequisites': 'Course-specific corequisites',
    'lab_required': 'Whether lab is required for this course',
    'lab_hours': 'Lab hours per week for this course',
    'grading_rubric': 'Grading rubric for the course',
    'assessment_types': 'Types of assessments used',
    'attendance_policy': 'Attendance policy for this course',
    'online_meeting_link': 'Online meeting URL',
    'syllabus_url': 'URL to course syllabus',
    'office_hours': 'Instructor office hours',
    'textbook_title': 'Required textbook title',
    'textbook_author': 'Textbook author',
    'textbook_isbn': 'Textbook ISBN',
    'textbook_required': 'Whether textbook is required'
  };

  return descriptions[attributeName] || `Course attribute: ${attributeName.replace(/_/g, ' ')}`;
}

/**
 * Get or create an attribute by name
 */
async function getOrCreateAttribute(attributeName, dataType = 'string') {
  // Try to get existing attribute
  const [existing] = await pool.query(
    'SELECT attribute_id FROM courses_eav_attributes WHERE attribute_name = ?',
    [attributeName]
  );

  if (existing.length > 0) {
    return existing[0].attribute_id;
  }

  // Generate description
  const description = generateAttributeDescription(attributeName);

  // Create new attribute
  const [result] = await pool.query(
    'INSERT INTO courses_eav_attributes (attribute_name, data_type, description) VALUES (?, ?, ?)',
    [attributeName, dataType, description]
  );

  return result.insertId;
}

/**
 * Create a new course entity
 */
async function createEntity(name, additionalFields = {}) {
  const fields = {
    name: name,
    is_active: additionalFields.isActive !== undefined ? additionalFields.isActive : 1
  };

  const [result] = await pool.query(
    `INSERT INTO courses_eav_entities (name, is_active, created_at, updated_at)
     VALUES (?, ?, NOW(), NOW())`,
    [fields.name, fields.is_active]
  );

  return result.insertId;
}

/**
 * Set an attribute value for a course entity
 */
async function setAttributeValue(entityId, attributeName, value, dataType) {
  if (value === null || value === undefined) {
    // Delete the value if null
    const attributeId = await getOrCreateAttribute(attributeName, dataType);
    await pool.query(
      'DELETE FROM courses_eav_values WHERE entity_id = ? AND attribute_id = ?',
      [entityId, attributeId]
    );
    return;
  }

  const attributeId = await getOrCreateAttribute(attributeName, dataType);

  // Determine which column to use
  const valueColumns = {
    string: 'value_string',
    number: 'value_number',
    text: 'value_text',
    boolean: 'value_boolean',
    date: 'value_date'
  };

  const columnName = valueColumns[dataType];
  if (!columnName) {
    throw new Error(`Invalid data type: ${dataType}`);
  }

  // Convert boolean values and serialize objects/arrays
  let finalValue = value;
  if (dataType === 'boolean') {
    finalValue = value ? 1 : 0;
  } else if ((dataType === 'string' || dataType === 'text') && typeof value === 'object' && value !== null) {
    // Serialize objects/arrays as JSON string
    finalValue = JSON.stringify(value);
  }

  // Prepare the null columns
  const nullColumns = Object.values(valueColumns).filter(col => col !== columnName);
  const setNullPart = nullColumns.map(col => `${col} = NULL`).join(', ');

  // Use INSERT ... ON DUPLICATE KEY UPDATE
  await pool.query(
    `INSERT INTO courses_eav_values (entity_id, attribute_id, ${columnName})
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE ${columnName} = VALUES(${columnName}), ${setNullPart}`,
    [entityId, attributeId, finalValue]
  );
}

/**
 * Set multiple attribute values for a course entity
 */
async function setEntityAttributes(entityId, attributes) {
  for (const [key, config] of Object.entries(attributes)) {
    if (config.value !== undefined) {
      await setAttributeValue(entityId, key, config.value, config.type);
    }
  }
}

/**
 * Get course entity with all its attribute values
 */
async function getEntityById(entityId) {
  const [entities] = await pool.query(
    'SELECT * FROM courses_eav_entities WHERE entity_id = ?',
    [entityId]
  );

  if (entities.length === 0) {
    return null;
  }

  const entity = entities[0];

  // Get all attribute values
  const [values] = await pool.query(
    `SELECT 
      a.attribute_name,
      a.data_type,
      v.value_string,
      v.value_number,
      v.value_text,
      v.value_boolean,
      v.value_date
    FROM courses_eav_values v
    INNER JOIN courses_eav_attributes a ON v.attribute_id = a.attribute_id
    WHERE v.entity_id = ?`,
    [entityId]
  );

  // Merge entity with attribute values
  const result = { ...entity };
  for (const row of values) {
    const value = row.value_string ?? row.value_number ?? row.value_text ?? row.value_boolean ?? row.value_date;
    result[row.attribute_name] = value;
  }

  return result;
}

/**
 * Get all course entities
 */
async function getAllEntities(options = {}) {
  const { includeInactive = false } = options;
  
  let query = 'SELECT * FROM courses_eav_entities';
  const params = [];
  
  if (!includeInactive) {
    query += ' WHERE is_active = 1';
  }
  
  query += ' ORDER BY created_at DESC';

  const [entities] = await pool.query(query, params);

  // For each entity, get its attribute values
  const entitiesWithAttributes = [];
  for (const entity of entities) {
    const fullEntity = await getEntityById(entity.entity_id);
    entitiesWithAttributes.push(fullEntity);
  }

  return entitiesWithAttributes;
}

/**
 * Update course entity
 */
async function updateEntity(entityId, updates) {
  // Update core entity fields
  if (updates.name !== undefined) {
    await pool.query(
      'UPDATE courses_eav_entities SET name = ?, updated_at = NOW() WHERE entity_id = ?',
      [updates.name, entityId]
    );
  }
  
  if (updates.isActive !== undefined) {
    await pool.query(
      'UPDATE courses_eav_entities SET is_active = ?, updated_at = NOW() WHERE entity_id = ?',
      [updates.isActive ? 1 : 0, entityId]
    );
  }

  // Update attribute values
  if (updates.attributes) {
    await setEntityAttributes(entityId, updates.attributes);
  }

  return getEntityById(entityId);
}

/**
 * Delete course entity
 */
async function deleteEntity(entityId) {
  // Delete entity (cascade will handle values)
  await pool.query('DELETE FROM courses_eav_entities WHERE entity_id = ?', [entityId]);
}

/**
 * Get all attribute definitions for courses
 */
async function getAllAttributes() {
  const [attributes] = await pool.query(
    'SELECT * FROM courses_eav_attributes ORDER BY attribute_name'
  );
  return attributes;
}

/**
 * Search courses by attribute values
 */
async function searchEntities(searchTerm, attributeName = null) {
  let query = `
    SELECT DISTINCT e.*
    FROM courses_eav_entities e
    INNER JOIN courses_eav_values v ON e.entity_id = v.entity_id
    INNER JOIN courses_eav_attributes a ON v.attribute_id = a.attribute_id
    WHERE e.is_active = 1
  `;
  const params = [];

  if (attributeName) {
    query += ' AND a.attribute_name = ?';
    params.push(attributeName);
  }

  if (searchTerm) {
    query += ` AND (
      e.name LIKE ? OR
      v.value_string LIKE ? OR
      v.value_text LIKE ?
    )`;
    const searchPattern = `%${searchTerm}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  const [entities] = await pool.query(query, params);

  // Get full entity data with attributes
  const entitiesWithAttributes = [];
  for (const entity of entities) {
    const fullEntity = await getEntityById(entity.entity_id);
    entitiesWithAttributes.push(fullEntity);
  }

  return entitiesWithAttributes;
}

module.exports = {
  createEntity,
  getEntityById,
  getAllEntities,
  updateEntity,
  deleteEntity,
  setAttributeValue,
  setEntityAttributes,
  getOrCreateAttribute,
  getAllAttributes,
  searchEntities
};
