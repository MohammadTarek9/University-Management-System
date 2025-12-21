const pool = require('../db/mysql');

/**
 * Subjects-Specific EAV Utility Functions
 * Works with: subjects_eav_entities, subjects_eav_attributes, subjects_eav_values
 */

/**
 * Generate a human-readable description for a subject attribute
 */
function generateAttributeDescription(attributeName) {
  const descriptions = {
    'code': 'Subject code identifier',
    'credits': 'Number of credit hours',
    'description': 'Subject description',
    'classification': 'Subject classification (core/elective)',
    'semester': 'Typical semester offering',
    'academic_year': 'Academic year',
    'department_id': 'Department ID',
    'prerequisites': 'Prerequisites for the subject',
    'corequisites': 'Corequisites for the subject',
    'learning_outcomes': 'Expected learning outcomes',
    'textbooks': 'Required or recommended textbooks',
    'lab_required': 'Whether lab component is required',
    'lab_hours': 'Number of lab hours per week',
    'studio_required': 'Whether studio component is required',
    'studio_hours': 'Number of studio hours per week',
    'certifications': 'Related professional certifications',
    'repeatability': 'Repeatability policy',
    'syllabus_template': 'Default syllabus template',
    'typical_offering': 'Typical offering pattern'
  };

  return descriptions[attributeName] || `Subject attribute: ${attributeName.replace(/_/g, ' ')}`;
}

/**
 * Get or create an attribute by name
 */
async function getOrCreateAttribute(attributeName, dataType = 'string') {
  // Try to get existing attribute
  const [existing] = await pool.query(
    'SELECT attribute_id FROM subjects_eav_attributes WHERE attribute_name = ?',
    [attributeName]
  );

  if (existing.length > 0) {
    return existing[0].attribute_id;
  }

  // Generate description
  const description = generateAttributeDescription(attributeName);

  // Create new attribute
  const [result] = await pool.query(
    'INSERT INTO subjects_eav_attributes (attribute_name, data_type, description) VALUES (?, ?, ?)',
    [attributeName, dataType, description]
  );

  return result.insertId;
}

/**
 * Create a new subject entity
 */
async function createEntity(name, additionalFields = {}) {
  const fields = {
    name: name,
    is_active: additionalFields.isActive !== undefined ? additionalFields.isActive : 1
  };

  const [result] = await pool.query(
    `INSERT INTO subjects_eav_entities (name, is_active, created_at, updated_at)
     VALUES (?, ?, NOW(), NOW())`,
    [fields.name, fields.is_active]
  );

  return result.insertId;
}

/**
 * Set an attribute value for a subject entity
 */
async function setAttributeValue(entityId, attributeName, value, dataType) {
  if (value === null || value === undefined) {
    // Delete the value if null
    const attributeId = await getOrCreateAttribute(attributeName, dataType);
    await pool.query(
      'DELETE FROM subjects_eav_values WHERE entity_id = ? AND attribute_id = ?',
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
    `INSERT INTO subjects_eav_values (entity_id, attribute_id, ${columnName})
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE ${columnName} = VALUES(${columnName}), ${setNullPart}`,
    [entityId, attributeId, finalValue]
  );
}

/**
 * Set multiple attribute values for a subject entity
 */
async function setEntityAttributes(entityId, attributes) {
  for (const [key, config] of Object.entries(attributes)) {
    if (config.value !== undefined) {
      await setAttributeValue(entityId, key, config.value, config.type);
    }
  }
}

/**
 * Get subject entity with all its attribute values
 */
async function getEntityById(entityId) {
  const [entities] = await pool.query(
    'SELECT * FROM subjects_eav_entities WHERE entity_id = ?',
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
    FROM subjects_eav_values v
    INNER JOIN subjects_eav_attributes a ON v.attribute_id = a.attribute_id
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
 * Get all subject entities
 */
async function getAllEntities(options = {}) {
  const { includeInactive = false } = options;
  
  let query = 'SELECT * FROM subjects_eav_entities';
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
 * Update subject entity
 */
async function updateEntity(entityId, updates) {
  // Update core entity fields
  if (updates.name !== undefined) {
    await pool.query(
      'UPDATE subjects_eav_entities SET name = ?, updated_at = NOW() WHERE entity_id = ?',
      [updates.name, entityId]
    );
  }
  
  if (updates.isActive !== undefined) {
    await pool.query(
      'UPDATE subjects_eav_entities SET is_active = ?, updated_at = NOW() WHERE entity_id = ?',
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
 * Delete subject entity
 */
async function deleteEntity(entityId) {
  // Delete entity (cascade will handle values)
  await pool.query('DELETE FROM subjects_eav_entities WHERE entity_id = ?', [entityId]);
}

/**
 * Get all attribute definitions for subjects
 */
async function getAllAttributes() {
  const [attributes] = await pool.query(
    'SELECT * FROM subjects_eav_attributes ORDER BY attribute_name'
  );
  return attributes;
}

/**
 * Search subjects by attribute values
 */
async function searchEntities(searchTerm, attributeName = null) {
  let query = `
    SELECT DISTINCT e.*
    FROM subjects_eav_entities e
    INNER JOIN subjects_eav_values v ON e.entity_id = v.entity_id
    INNER JOIN subjects_eav_attributes a ON v.attribute_id = a.attribute_id
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
