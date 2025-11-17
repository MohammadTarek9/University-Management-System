const pool = require('../db/mysql');

// Helper: Get attribute_id by name (or create if not exists)
async function getAttributeId(attributeName, dataType = 'string') {
  const [rows] = await pool.query(
    'SELECT attribute_id FROM rooms_eav_attributes WHERE attribute_name = ?',
    [attributeName]
  );
  if (rows.length > 0) return rows[0].attribute_id;

  // Optionally, create the attribute if not found
  const [result] = await pool.query(
    'INSERT INTO rooms_eav_attributes (attribute_name, data_type) VALUES (?, ?)',
    [attributeName, dataType]
  );
  return result.insertId;
}

// Helper: Map EAV values to a room object
function mapRoom(entity, values) {
  const location = {
    building: '',
    floor: '',
    roomNumber: ''
  };
  let type = '';
  const room = {
    id: entity.entity_id,
    name: entity.name,
    isActive: !!entity.is_active,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
    location,
    type
  };
  for (const row of values) {
    let val = row.value_string ?? row.value_number ?? row.value_text ?? row.value_boolean ?? row.value_date;
    if (row.attribute_name === 'equipment' || row.attribute_name === 'amenities') {
      try { val = JSON.parse(val); } catch {}
    }
    if (row.attribute_name === 'building') location.building = val || '';
    else if (row.attribute_name === 'floor') location.floor = val || '';
    else if (row.attribute_name === 'room_number') location.roomNumber = val || '';
    else if (row.attribute_name === 'room_type' || row.attribute_name === 'type') room.type = val || '';
    else room[row.attribute_name] = val;
  }
  return room;
}

// Create a new room
async function createRoom(data) {
  const [entityResult] = await pool.query(
    'INSERT INTO rooms_eav_entities (name, is_active, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
    [data.name, data.isActive ? 1 : 0]
  );
  const entityId = entityResult.insertId;

  // Insert attribute values
  const attributes = {
    room_name: { value: data.name, dataType: 'string' },
    room_type: { value: data.type, dataType: 'string' },
    capacity: { value: data.capacity, dataType: 'number' },
    building: { value: data.location?.building, dataType: 'string' },
    floor: { value: data.location?.floor, dataType: 'string' },
    room_number: { value: data.location?.roomNumber, dataType: 'string' },
    is_active: { value: data.isActive ? 1 : 0, dataType: 'boolean' },
    maintenance_notes: { value: data.maintenanceNotes, dataType: 'text' },
    equipment: { value: JSON.stringify(data.equipment || []), dataType: 'text' },
    amenities: { value: JSON.stringify(data.amenities || []), dataType: 'text' },
    created_by: { value: data.createdBy, dataType: 'number' }
  };

  for (const [attr, { value, dataType }] of Object.entries(attributes)) {
    if (value !== undefined && value !== null) {
      const attrId = await getAttributeId(attr, dataType);
      await pool.query(
        `INSERT INTO rooms_eav_values (entity_id, attribute_id, value_string, value_number, value_text, value_boolean, value_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE value_string=VALUES(value_string), value_number=VALUES(value_number), value_text=VALUES(value_text), value_boolean=VALUES(value_boolean), value_date=VALUES(value_date)`,
        [
          entityId,
          attrId,
          dataType === 'string' ? value : null,
          dataType === 'number' ? value : null,
          dataType === 'text' ? value : null,
          dataType === 'boolean' ? value : null,
          dataType === 'date' ? value : null
        ]
      );
    }
  }

  return getRoomById(entityId);
}

// Get a room by ID
async function getRoomById(entityId) {
  const [entities] = await pool.query(
    'SELECT * FROM rooms_eav_entities WHERE entity_id = ?',
    [entityId]
  );
  if (entities.length === 0) return null;

  const [values] = await pool.query(
    `SELECT a.attribute_name, v.value_string, v.value_number, v.value_text, v.value_boolean, v.value_date
     FROM rooms_eav_values v
     JOIN rooms_eav_attributes a ON v.attribute_id = a.attribute_id
     WHERE v.entity_id = ?`,
    [entityId]
  );

  return mapRoom(entities[0], values);
}

// Update a room
async function updateRoom(entityId, data) {
  // Update entity name and is_active if provided
  if (data.name || data.isActive !== undefined) {
    await pool.query(
      'UPDATE rooms_eav_entities SET name = COALESCE(?, name), is_active = COALESCE(?, is_active), updated_at = NOW() WHERE entity_id = ?',
      [data.name, data.isActive !== undefined ? (data.isActive ? 1 : 0) : null, entityId]
    );
  }

  // Update attribute values
  const attributes = {
    room_name: { value: data.name, dataType: 'string' },
    room_type: { value: data.type, dataType: 'string' },
    capacity: { value: data.capacity, dataType: 'number' },
    building: { value: data.location?.building, dataType: 'string' },
    floor: { value: data.location?.floor, dataType: 'string' },
    room_number: { value: data.location?.roomNumber, dataType: 'string' },
    is_active: { value: data.isActive !== undefined ? (data.isActive ? 1 : 0) : undefined, dataType: 'boolean' },
    maintenance_notes: { value: data.maintenanceNotes, dataType: 'text' },
    equipment: { value: data.equipment ? JSON.stringify(data.equipment) : undefined, dataType: 'text' },
    amenities: { value: data.amenities ? JSON.stringify(data.amenities) : undefined, dataType: 'text' },
    updated_by: { value: data.updatedBy, dataType: 'number' }
  };

  for (const [attr, { value, dataType }] of Object.entries(attributes)) {
    if (value !== undefined && value !== null) {
      const attrId = await getAttributeId(attr, dataType);
      await pool.query(
        `INSERT INTO rooms_eav_values (entity_id, attribute_id, value_string, value_number, value_text, value_boolean, value_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE value_string=VALUES(value_string), value_number=VALUES(value_number), value_text=VALUES(value_text), value_boolean=VALUES(value_boolean), value_date=VALUES(value_date)`,
        [
          entityId,
          attrId,
          dataType === 'string' ? value : null,
          dataType === 'number' ? value : null,
          dataType === 'text' ? value : null,
          dataType === 'boolean' ? value : null,
          dataType === 'date' ? value : null
        ]
      );
    }
  }

  return getRoomById(entityId);
}

// Delete a room
async function deleteRoom(entityId) {
  const [result] = await pool.query(
    'DELETE FROM rooms_eav_entities WHERE entity_id = ?',
    [entityId]
  );
  return result.affectedRows > 0;
}

// Get all rooms (with optional filters and pagination)
/**
 * Get all rooms with EAV filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} - { rooms, total, page, pages }
 */
async function getAllRooms(filters = {}, page = 1, limit = 10) {
  const {
    search = '',
    type = null,
    building = null,
    capacity = null,
    isActive = null
  } = filters;

  let whereClauses = ['1=1'];
  let params = [];

  // Entity-level filter
  if (isActive !== null && isActive !== 'all') {
    whereClauses.push('e.is_active = ?');
    params.push(isActive === true || isActive === 'true' ? 1 : 0);
  }

  // EAV attribute filters
  const eavJoins = [];
  let joinIdx = 0;
  // Search filter (name or EAV attributes)
  if (search && search.trim() !== '') {
    const like = `%${search.trim()}%`;
    whereClauses.push('(e.name LIKE ? OR v_building.value_string LIKE ? OR v_room_number.value_string LIKE ?)');
    params.push(like, like, like);
    // Join for building
    eavJoins.push('LEFT JOIN rooms_eav_values v_building ON v_building.entity_id = e.entity_id AND v_building.attribute_id = (SELECT attribute_id FROM rooms_eav_attributes WHERE attribute_name = "building" LIMIT 1)');
    // Join for room_number
    eavJoins.push('LEFT JOIN rooms_eav_values v_room_number ON v_room_number.entity_id = e.entity_id AND v_room_number.attribute_id = (SELECT attribute_id FROM rooms_eav_attributes WHERE attribute_name = "room_number" LIMIT 1)');
  }
  // Type filter
  if (type && type !== 'all') {
    joinIdx++;
    eavJoins.push(`JOIN rooms_eav_values v_type ON v_type.entity_id = e.entity_id AND v_type.attribute_id = (SELECT attribute_id FROM rooms_eav_attributes WHERE attribute_name = 'room_type' LIMIT 1)`);
    whereClauses.push(`v_type.value_string = ?`);
    params.push(type);
  }
  // Building filter
  if (building && building !== 'all') {
    joinIdx++;
    eavJoins.push(`JOIN rooms_eav_values v_building2 ON v_building2.entity_id = e.entity_id AND v_building2.attribute_id = (SELECT attribute_id FROM rooms_eav_attributes WHERE attribute_name = 'building' LIMIT 1)`);
    whereClauses.push(`v_building2.value_string = ?`);
    params.push(building);
  }
  // Capacity filter
  if (capacity !== null && capacity !== '' && !isNaN(capacity)) {
    joinIdx++;
    eavJoins.push(`JOIN rooms_eav_values v_capacity ON v_capacity.entity_id = e.entity_id AND v_capacity.attribute_id = (SELECT attribute_id FROM rooms_eav_attributes WHERE attribute_name = 'capacity' LIMIT 1)`);
    whereClauses.push(`v_capacity.value_number >= ?`);
    params.push(parseInt(capacity));
  }

  const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
  const joinClause = eavJoins.join(' ');

  // Get total count
  const [countResult] = await pool.query(
    `SELECT COUNT(DISTINCT e.entity_id) as count FROM rooms_eav_entities e ${joinClause} ${whereClause}`,
    params
  );
  const total = countResult[0].count;

  // Get paginated results
  const offset = (page - 1) * limit;
  const [entities] = await pool.query(
    `SELECT DISTINCT e.* FROM rooms_eav_entities e ${joinClause} ${whereClause} ORDER BY e.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  // Get all attribute values for these entities
  const ids = entities.map(e => e.entity_id);
  let rooms = [];
  if (ids.length > 0) {
    const [values] = await pool.query(
      `SELECT v.entity_id, a.attribute_name, v.value_string, v.value_number, v.value_text, v.value_boolean, v.value_date
       FROM rooms_eav_values v
       JOIN rooms_eav_attributes a ON v.attribute_id = a.attribute_id
       WHERE v.entity_id IN (${ids.map(() => '?').join(',')})`,
      ids
    );
    // Group values by entity_id
    const valueMap = {};
    for (const v of values) {
      if (!valueMap[v.entity_id]) valueMap[v.entity_id] = [];
      valueMap[v.entity_id].push(v);
    }
    rooms = entities.map(e => mapRoom(e, valueMap[e.entity_id] || []));
  }

  return {
    rooms,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

// Search rooms by name, building, or number
async function searchRooms(query) {
  const [entities] = await pool.query(
    `SELECT * FROM rooms_eav_entities WHERE name LIKE ?`,
    [`%${query}%`]
  );
  if (entities.length === 0) return [];

  const ids = entities.map(e => e.entity_id);
  const [values] = await pool.query(
    `SELECT v.entity_id, a.attribute_name, v.value_string, v.value_number, v.value_text, v.value_boolean, v.value_date
     FROM rooms_eav_values v
     JOIN rooms_eav_attributes a ON v.attribute_id = a.attribute_id
     WHERE v.entity_id IN (${ids.map(() => '?').join(',')})`,
    ids
  );

  const valueMap = {};
  for (const v of values) {
    if (!valueMap[v.entity_id]) valueMap[v.entity_id] = [];
    valueMap[v.entity_id].push(v);
  }

  return entities.map(e => mapRoom(e, valueMap[e.entity_id] || []));
}

// Get available rooms (is_active = 1)
async function getAvailableRooms() {
  return getAllRooms({ isActive: true });
}

// Get rooms by building
async function getRoomsByBuilding(building) {
  // Find attribute_id for 'building'
  const attrId = await getAttributeId('building', 'string');
  const [values] = await pool.query(
    `SELECT entity_id FROM rooms_eav_values WHERE attribute_id = ? AND value_string = ?`,
    [attrId, building]
  );
  if (values.length === 0) return [];

  const ids = values.map(v => v.entity_id);
  const [entities] = await pool.query(
    `SELECT * FROM rooms_eav_entities WHERE entity_id IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  if (entities.length === 0) return [];

  const [allValues] = await pool.query(
    `SELECT v.entity_id, a.attribute_name, v.value_string, v.value_number, v.value_text, v.value_boolean, v.value_date
     FROM rooms_eav_values v
     JOIN rooms_eav_attributes a ON v.attribute_id = a.attribute_id
     WHERE v.entity_id IN (${ids.map(() => '?').join(',')})`,
    ids
  );

  const valueMap = {};
  for (const v of allValues) {
    if (!valueMap[v.entity_id]) valueMap[v.entity_id] = [];
    valueMap[v.entity_id].push(v);
  }

  return entities.map(e => mapRoom(e, valueMap[e.entity_id] || []));
}

// Get room by room number
async function getRoomByNumber(roomNumber) {
  const attrId = await getAttributeId('room_number', 'string');
  const [values] = await pool.query(
    `SELECT entity_id FROM rooms_eav_values WHERE attribute_id = ? AND value_string = ?`,
    [attrId, roomNumber]
  );
  if (values.length === 0) return null;

  return getRoomById(values[0].entity_id);
}

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  searchRooms,
  getAvailableRooms,
  getRoomsByBuilding,
  getRoomByNumber
};