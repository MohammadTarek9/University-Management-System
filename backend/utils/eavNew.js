const pool = require('../db/mysql');

/**
 * EAV (Entity-Attribute-Value) Utility Functions - 3-Table Model
 * Works with: eav_entities, eav_attributes, eav_values
 */

/**
 * Get or create an attribute by name
 */
async function getOrCreateAttribute(attributeName, dataType, description = null) {
  // Try to get existing attribute
  const [existing] = await pool.query(
    'SELECT attribute_id FROM eav_attributes WHERE attribute_name = ?',
    [attributeName]
  );

  if (existing.length > 0) {
    return existing[0].attribute_id;
  }

  // Create new attribute
  const [result] = await pool.query(
    'INSERT INTO eav_attributes (attribute_name, data_type, description) VALUES (?, ?, ?)',
    [attributeName, dataType, description]
  );

  return result.insertId;
}

/**
 * Create a new entity
 */
async function createEntity(entityType, name, additionalFields = {}) {
  const fields = {
    entity_type: entityType,
    name: name,
    is_active: additionalFields.isActive !== undefined ? additionalFields.isActive : 1
  };

  const [result] = await pool.query(
    `INSERT INTO eav_entities (entity_type, name, is_active, created_at, updated_at)
     VALUES (?, ?, ?, NOW(), NOW())`,
    [fields.entity_type, fields.name, fields.is_active]
  );

  return result.insertId;
}

/**
 * Set an attribute value for an entity
 */
async function setAttributeValue(entityId, attributeName, value, dataType) {
  if (value === null || value === undefined) {
    // Delete the value if null
    const attributeId = await getOrCreateAttribute(attributeName, dataType);
    await pool.query(
      'DELETE FROM eav_values WHERE entity_id = ? AND attribute_id = ?',
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
    `INSERT INTO eav_values (entity_id, attribute_id, ${columnName})
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE ${columnName} = VALUES(${columnName}), ${setNullPart}`,
    [entityId, attributeId, finalValue]
  );
}

/**
 * Set multiple attribute values for an entity
 */
async function setEntityAttributes(entityId, attributes) {
  for (const [key, config] of Object.entries(attributes)) {
    if (config.value !== undefined) {
      await setAttributeValue(entityId, key, config.value, config.type);
    }
  }
}

/**
 * Get entity with all its attribute values
 */
async function getEntityById(entityId) {
  // Get entity base info
  const [entities] = await pool.query(
    'SELECT * FROM eav_entities WHERE entity_id = ?',
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
     FROM eav_values v
     JOIN eav_attributes a ON v.attribute_id = a.attribute_id
     WHERE v.entity_id = ?`,
    [entityId]
  );

  // Reconstruct entity with attributes
  const result = {
    entity_id: entity.entity_id,
    entity_type: entity.entity_type,
    name: entity.name,
    is_active: entity.is_active,
    created_at: entity.created_at,
    updated_at: entity.updated_at
  };

  // Add attribute values
  values.forEach(row => {
    const dataType = row.data_type;
    let value = null;

    if (dataType === 'string') value = row.value_string;
    else if (dataType === 'number') value = row.value_number;
    else if (dataType === 'text') value = row.value_text;
    else if (dataType === 'boolean') value = row.value_boolean;
    else if (dataType === 'date') value = row.value_date;

    // Try to parse JSON strings back to objects
    if ((dataType === 'string' || dataType === 'text') && value) {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && parsed !== null) {
          // Only use parsed object if it has actual properties
          if (Array.isArray(parsed) || Object.keys(parsed).length > 0) {
            value = parsed;
          }
        }
      } catch (e) {
        // Not JSON, keep as string
      }
    }

    result[row.attribute_name] = value;
  });

  return result;
}

/**
 * Get all entities of a specific type
 */
async function getEntitiesByType(entityType, filters = {}) {
  let query = 'SELECT * FROM eav_entities WHERE entity_type = ?';
  const params = [entityType];

  if (filters.isActive !== undefined) {
    query += ' AND is_active = ?';
    params.push(filters.isActive);
  }

  query += ' ORDER BY entity_id DESC';

  const [entities] = await pool.query(query, params);

  // Get all attributes for these entities in one query
  if (entities.length === 0) {
    return [];
  }

  const entityIds = entities.map(e => e.entity_id);
  const [values] = await pool.query(
    `SELECT 
       v.entity_id,
       a.attribute_name,
       a.data_type,
       v.value_string,
       v.value_number,
       v.value_text,
       v.value_boolean,
       v.value_date
     FROM eav_values v
     JOIN eav_attributes a ON v.attribute_id = a.attribute_id
     WHERE v.entity_id IN (?)`,
    [entityIds]
  );

  // Group values by entity
  const valuesByEntity = {};
  values.forEach(row => {
    if (!valuesByEntity[row.entity_id]) {
      valuesByEntity[row.entity_id] = {};
    }

    const dataType = row.data_type;
    let value = null;

    if (dataType === 'string') value = row.value_string;
    else if (dataType === 'number') value = row.value_number;
    else if (dataType === 'text') value = row.value_text;
    else if (dataType === 'boolean') value = row.value_boolean;
    else if (dataType === 'date') value = row.value_date;

    // Try to parse JSON strings back to objects
    if ((dataType === 'string' || dataType === 'text') && value) {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && parsed !== null) {
          // Only use parsed object if it has actual properties
          if (Array.isArray(parsed) || Object.keys(parsed).length > 0) {
            value = parsed;
          }
        }
      } catch (e) {
        // Not JSON, keep as string
      }
    }

    valuesByEntity[row.entity_id][row.attribute_name] = value;
  });

  // Reconstruct entities with attributes using snake_case (consistent with getEntityById)
  return entities.map(entity => ({
    entity_id: entity.entity_id,
    entity_type: entity.entity_type,
    name: entity.name,
    is_active: entity.is_active,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
    ...(valuesByEntity[entity.entity_id] || {})
  }));
}

/**
 * Update entity base fields
 */
async function updateEntity(entityId, updates) {
  const allowedFields = ['name', 'department_id', 'subject_id', 'is_active'];
  const sets = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      sets.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (sets.length === 0) {
    return;
  }

  sets.push('updated_at = NOW()');
  values.push(entityId);

  await pool.query(
    `UPDATE eav_entities SET ${sets.join(', ')} WHERE entity_id = ?`,
    values
  );
}

/**
 * Delete an entity (cascade deletes values automatically)
 */
async function deleteEntity(entityId) {
  await pool.query('DELETE FROM eav_entities WHERE entity_id = ?', [entityId]);
}

/**
 * Search entities by attribute value
 */
async function searchEntitiesByAttribute(entityType, attributeName, searchValue) {
  const [results] = await pool.query(
    `SELECT DISTINCT e.entity_id
     FROM eav_entities e
     JOIN eav_values v ON e.entity_id = v.entity_id
     JOIN eav_attributes a ON v.attribute_id = a.attribute_id
     WHERE e.entity_type = ?
       AND a.attribute_name = ?
       AND (v.value_string LIKE ? OR v.value_text LIKE ?)`,
    [entityType, attributeName, `%${searchValue}%`, `%${searchValue}%`]
  );

  const entityIds = results.map(r => r.entity_id);
  if (entityIds.length === 0) {
    return [];
  }

  // Get full entities
  return Promise.all(entityIds.map(id => getEntityById(id)));
}

module.exports = {
  createEntity,
  getEntityById,
  getEntitiesByType,
  updateEntity,
  deleteEntity,
  setAttributeValue,
  setEntityAttributes,
  getOrCreateAttribute,
  searchEntitiesByAttribute
};
