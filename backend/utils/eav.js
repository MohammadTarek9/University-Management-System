const pool = require('../db/mysql');

/**
 * EAV (Entity-Attribute-Value) Utility Functions
 * Provides CRUD operations for entities stored in the EAV model
 */

/**
 * Get entity type ID by code
 */
async function getEntityTypeId(entityTypeCode) {
  const [rows] = await pool.query(
    'SELECT id FROM entity_types WHERE code = ? LIMIT 1',
    [entityTypeCode]
  );
  return rows[0]?.id || null;
}

/**
 * Get all attributes for an entity type
 */
async function getAttributesForEntityType(entityTypeId) {
  const [rows] = await pool.query(
    `SELECT id, name, label, data_type, is_required, is_unique
     FROM attributes
     WHERE entity_type_id = ?
     ORDER BY name`,
    [entityTypeId]
  );
  return rows;
}

/**
 * Get attribute ID by entity type and attribute name
 */
async function getAttributeId(entityTypeId, attributeName) {
  const [rows] = await pool.query(
    'SELECT id FROM attributes WHERE entity_type_id = ? AND name = ? LIMIT 1',
    [entityTypeId, attributeName]
  );
  return rows[0]?.id || null;
}

/**
 * Create a new entity and return its ID
 */
async function createEntity(entityTypeId, naturalKey = null) {
  const [result] = await pool.query(
    `INSERT INTO entities (entity_type_id, natural_key, created_at, updated_at)
     VALUES (?, ?, NOW(), NOW())`,
    [entityTypeId, naturalKey]
  );
  return result.insertId;
}

/**
 * Set a single attribute value for an entity
 */
async function setEntityValue(entityId, attributeId, value, dataType) {
  // Determine which column to use based on data type
  const valueColumns = {
    string: 'value_string',
    number: 'value_number',
    date: 'value_date',
    boolean: 'value_bool'
  };

  const columnName = valueColumns[dataType];
  if (!columnName) {
    throw new Error(`Invalid data type: ${dataType}`);
  }

  // Convert boolean values
  if (dataType === 'boolean') {
    value = value ? 1 : 0;
  }

  // Convert date values
  if (dataType === 'date' && value) {
    value = new Date(value);
  }

  // Use INSERT ... ON DUPLICATE KEY UPDATE for upsert behavior
  await pool.query(
    `INSERT INTO entity_values (entity_id, attribute_id, ${columnName})
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE ${columnName} = VALUES(${columnName})`,
    [entityId, attributeId, value]
  );
}

/**
 * Get all attribute values for an entity as a flat object
 */
async function getEntityValues(entityId) {
  const [rows] = await pool.query(
    `SELECT 
       a.name,
       a.data_type,
       ev.value_string,
       ev.value_number,
       ev.value_date,
       ev.value_bool
     FROM entity_values ev
     JOIN attributes a ON ev.attribute_id = a.id
     WHERE ev.entity_id = ?`,
    [entityId]
  );

  const values = {};
  for (const row of rows) {
    // Get the value based on data type
    let value;
    switch (row.data_type) {
      case 'string':
        value = row.value_string;
        break;
      case 'number':
        value = row.value_number;
        break;
      case 'date':
        value = row.value_date;
        break;
      case 'boolean':
        value = !!row.value_bool;
        break;
    }
    values[row.name] = value;
  }

  return values;
}

/**
 * Create a complete entity with all its attributes
 */
async function createEntityWithAttributes(entityTypeCode, attributesData, naturalKey = null) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Get entity type ID
    const entityTypeId = await getEntityTypeId(entityTypeCode);
    if (!entityTypeId) {
      throw new Error(`Entity type not found: ${entityTypeCode}`);
    }

    // Create the entity
    const [entityResult] = await connection.query(
      `INSERT INTO entities (entity_type_id, natural_key, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())`,
      [entityTypeId, naturalKey]
    );
    const entityId = entityResult.insertId;

    // Get all attributes for this entity type
    const [attributes] = await connection.query(
      'SELECT id, name, data_type, is_required FROM attributes WHERE entity_type_id = ?',
      [entityTypeId]
    );

    // Create a map of attribute names to IDs
    const attributeMap = {};
    for (const attr of attributes) {
      attributeMap[attr.name] = attr;
    }

    // Insert all attribute values
    for (const [attrName, value] of Object.entries(attributesData)) {
      const attribute = attributeMap[attrName];
      if (!attribute) {
        console.warn(`Attribute ${attrName} not found for entity type ${entityTypeCode}`);
        continue;
      }

      if (value === null || value === undefined) {
        if (attribute.is_required) {
          throw new Error(`Required attribute ${attrName} is missing`);
        }
        continue;
      }

      // Determine which column to use
      const valueColumns = {
        string: 'value_string',
        number: 'value_number',
        date: 'value_date',
        boolean: 'value_bool'
      };

      const columnName = valueColumns[attribute.data_type];
      let processedValue = value;

      // Process value based on type
      if (attribute.data_type === 'boolean') {
        processedValue = value ? 1 : 0;
      } else if (attribute.data_type === 'date' && value) {
        processedValue = new Date(value);
      }

      await connection.query(
        `INSERT INTO entity_values (entity_id, attribute_id, ${columnName})
         VALUES (?, ?, ?)`,
        [entityId, attribute.id, processedValue]
      );
    }

    await connection.commit();
    return entityId;

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Update entity attributes
 */
async function updateEntityAttributes(entityId, attributesData, entityTypeCode) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get entity type ID
    const entityTypeId = await getEntityTypeId(entityTypeCode);
    if (!entityTypeId) {
      throw new Error(`Entity type not found: ${entityTypeCode}`);
    }

    // Get all attributes for this entity type
    const [attributes] = await connection.query(
      'SELECT id, name, data_type FROM attributes WHERE entity_type_id = ?',
      [entityTypeId]
    );

    const attributeMap = {};
    for (const attr of attributes) {
      attributeMap[attr.name] = attr;
    }

    // Update attribute values
    for (const [attrName, value] of Object.entries(attributesData)) {
      const attribute = attributeMap[attrName];
      if (!attribute) {
        console.warn(`Attribute ${attrName} not found for entity type ${entityTypeCode}`);
        continue;
      }

      const valueColumns = {
        string: 'value_string',
        number: 'value_number',
        date: 'value_date',
        boolean: 'value_bool'
      };

      const columnName = valueColumns[attribute.data_type];
      let processedValue = value;

      if (attribute.data_type === 'boolean') {
        processedValue = value ? 1 : 0;
      } else if (attribute.data_type === 'date' && value) {
        processedValue = new Date(value);
      }

      // Delete existing value if null
      if (value === null || value === undefined) {
        await connection.query(
          'DELETE FROM entity_values WHERE entity_id = ? AND attribute_id = ?',
          [entityId, attribute.id]
        );
        continue;
      }

      // Upsert the value
      await connection.query(
        `INSERT INTO entity_values (entity_id, attribute_id, ${columnName})
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE ${columnName} = VALUES(${columnName})`,
        [entityId, attribute.id, processedValue]
      );
    }

    // Update entity timestamp
    await connection.query(
      'UPDATE entities SET updated_at = NOW() WHERE id = ?',
      [entityId]
    );

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get complete entity with all attributes
 */
async function getEntity(entityId, entityTypeCode) {
  const [entityRows] = await pool.query(
    `SELECT e.id, e.entity_type_id, e.natural_key, e.created_at, e.updated_at
     FROM entities e
     WHERE e.id = ?
     LIMIT 1`,
    [entityId]
  );

  if (entityRows.length === 0) {
    return null;
  }

  const entity = entityRows[0];
  const attributes = await getEntityValues(entityId);

  return {
    id: entity.id,
    entityTypeId: entity.entity_type_id,
    naturalKey: entity.natural_key,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
    ...attributes
  };
}

/**
 * Delete an entity and all its attribute values
 */
async function deleteEntity(entityId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Delete attribute values (should cascade, but being explicit)
    await connection.query('DELETE FROM entity_values WHERE entity_id = ?', [entityId]);
    
    // Delete entity
    await connection.query('DELETE FROM entities WHERE id = ?', [entityId]);

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Query entities with filters
 */
async function queryEntities(entityTypeCode, filters = {}, pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;

  const entityTypeId = await getEntityTypeId(entityTypeCode);
  if (!entityTypeId) {
    throw new Error(`Entity type not found: ${entityTypeCode}`);
  }

  // Build WHERE clause from filters
  let whereConditions = [];
  let params = [entityTypeId];

  // Build query with filters
  let query = `
    SELECT DISTINCT e.id
    FROM entities e
    WHERE e.entity_type_id = ?
  `;

  // Add filters for specific attributes
  for (const [attrName, filterValue] of Object.entries(filters)) {
    const attrId = await getAttributeId(entityTypeId, attrName);
    if (!attrId) continue;

    query += `
      AND EXISTS (
        SELECT 1 FROM entity_values ev
        WHERE ev.entity_id = e.id
        AND ev.attribute_id = ?
        AND (
          ev.value_string = ? OR
          ev.value_number = ? OR
          ev.value_date = ? OR
          ev.value_bool = ?
        )
      )
    `;
    params.push(attrId, filterValue, filterValue, filterValue, filterValue);
  }

  query += ' ORDER BY e.id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const [rows] = await pool.query(query, params);

  // Fetch complete entity data for each result
  const entities = [];
  for (const row of rows) {
    const entity = await getEntity(row.id, entityTypeCode);
    if (entity) {
      entities.push(entity);
    }
  }

  // Get total count
  let countQuery = `
    SELECT COUNT(DISTINCT e.id) as total
    FROM entities e
    WHERE e.entity_type_id = ?
  `;
  let countParams = [entityTypeId];

  const [countRows] = await pool.query(countQuery, countParams);
  const total = countRows[0]?.total || 0;

  return {
    entities,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit)
  };
}

module.exports = {
  getEntityTypeId,
  getAttributesForEntityType,
  getAttributeId,
  createEntity,
  setEntityValue,
  getEntityValues,
  createEntityWithAttributes,
  updateEntityAttributes,
  getEntity,
  deleteEntity,
  queryEntities
};
