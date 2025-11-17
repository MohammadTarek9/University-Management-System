const pool = require('../db/mysql');

/**
 * Map a room DB row -> JS object in the shape the API expects
 * Combines data from rooms table with equipment and amenities
 */
async function mapRoomRow(row) {
  if (!row) return null;

  // Fetch equipment for this room
  const [equipmentRows] = await pool.query(
    'SELECT id, name, quantity, condition_status FROM room_equipment WHERE room_id = ?',
    [row.id]
  );

  // Fetch amenities for this room
  const [amenityRows] = await pool.query(
    'SELECT amenity FROM room_amenities WHERE room_id = ?',
    [row.id]
  );

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    capacity: row.capacity,
    location: {
      building: row.location_building,
      floor: row.location_floor,
      roomNumber: row.location_room_number
    },
    equipment: equipmentRows.map(e => ({
      id: e.id,
      name: e.name,
      quantity: e.quantity,
      condition: e.condition_status
    })),
    amenities: amenityRows.map(a => a.amenity),
    isActive: !!row.is_active,
    maintenanceNotes: row.maintenance_notes,
    lastMaintenanceDate: row.last_maintenance_date,
    nextMaintenanceDate: row.next_maintenance_date,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Create a new room with equipment and amenities
 * @param {Object} data - Room data including equipment and amenities arrays
 * @returns {Object} - Created room with all related data
 */
async function createRoom(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      name,
      type,
      capacity,
      location,
      equipment = [],
      amenities = [],
      isActive = true,
      maintenanceNotes = null,
      createdBy
    } = data;

    // Insert room
    const [roomResult] = await connection.query(
      `INSERT INTO rooms (
        name, type, capacity,
        location_building, location_floor, location_room_number,
        is_active, maintenance_notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        type,
        capacity,
        location.building,
        location.floor,
        location.roomNumber,
        isActive ? 1 : 0,
        maintenanceNotes,
        createdBy
      ]
    );

    const roomId = roomResult.insertId;

    // Insert equipment
    if (equipment && equipment.length > 0) {
      for (const item of equipment) {
        await connection.query(
          `INSERT INTO room_equipment (
            room_id, name, quantity, condition_status
          ) VALUES (?, ?, ?, ?)`,
          [
            roomId,
            item.name,
            item.quantity || 1,
            item.condition || 'good'
          ]
        );
      }
    }

    // Insert amenities
    if (amenities && amenities.length > 0) {
      for (const amenity of amenities) {
        await connection.query(
          'INSERT INTO room_amenities (room_id, amenity) VALUES (?, ?)',
          [roomId, amenity]
        );
      }
    }

    await connection.commit();

    // Fetch and return the created room
    const [createdRoomRow] = await pool.query(
      'SELECT * FROM rooms WHERE id = ?',
      [roomId]
    );

    return mapRoomRow(createdRoomRow[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get a room by ID with all equipment and amenities
 * @param {number} roomId
 * @returns {Object|null} - Room object or null if not found
 */
async function getRoomById(roomId) {
  const [rows] = await pool.query(
    'SELECT * FROM rooms WHERE id = ?',
    [roomId]
  );

  if (rows.length === 0) return null;

  return mapRoomRow(rows[0]);
}

/**
 * Get all rooms with filtering and pagination
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

  let whereConditions = [];
  let params = [];

  // Build WHERE clause
  if (search && search.trim() !== '') {
    const like = `%${search.trim()}%`;
    whereConditions.push(
      '(name LIKE ? OR location_building LIKE ? OR location_room_number LIKE ?)'
    );
    params.push(like, like, like);
  }

  if (type && type !== 'all') {
    whereConditions.push('type = ?');
    params.push(type);
  }

  if (building && building !== 'all') {
    whereConditions.push('location_building = ?');
    params.push(building);
  }

  if (capacity !== null && !isNaN(capacity)) {
    whereConditions.push('capacity >= ?');
    params.push(parseInt(capacity));
  }

  if (isActive !== null && isActive !== 'all') {
    whereConditions.push('is_active = ?');
    params.push(isActive === true || isActive === 'true' ? 1 : 0);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // Get total count
  const [countResult] = await pool.query(
    `SELECT COUNT(*) as count FROM rooms ${whereClause}`,
    params
  );
  const total = countResult[0].count;

  // Get paginated results
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT * FROM rooms ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  // Map all rooms
  const rooms = await Promise.all(rows.map(row => mapRoomRow(row)));

  return {
    rooms,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

/**
 * Update a room and its equipment/amenities
 * @param {number} roomId
 * @param {Object} data - Updated room data
 * @returns {Object} - Updated room object
 */
async function updateRoom(roomId, data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      name,
      type,
      capacity,
      location,
      equipment = null,
      amenities = null,
      isActive,
      maintenanceNotes,
      nextMaintenanceDate,
      updatedBy
    } = data;

    // Build UPDATE query for rooms table
    let updateFields = [];
    let updateParams = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateParams.push(name);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateParams.push(type);
    }
    if (capacity !== undefined) {
      updateFields.push('capacity = ?');
      updateParams.push(capacity);
    }
    if (location !== undefined) {
      updateFields.push('location_building = ?');
      updateParams.push(location.building);
      updateFields.push('location_floor = ?');
      updateParams.push(location.floor);
      updateFields.push('location_room_number = ?');
      updateParams.push(location.roomNumber);
    }
    if (isActive !== undefined) {
      updateFields.push('is_active = ?');
      updateParams.push(isActive ? 1 : 0);
    }
    if (maintenanceNotes !== undefined) {
      updateFields.push('maintenance_notes = ?');
      updateParams.push(maintenanceNotes);
    }
    if (nextMaintenanceDate !== undefined) {
      updateFields.push('next_maintenance_date = ?');
      updateParams.push(nextMaintenanceDate);
    }
    if (updatedBy !== undefined) {
      updateFields.push('updated_by = ?');
      updateParams.push(updatedBy);
    }

    updateFields.push('updated_at = NOW()');

    // Update room
    if (updateFields.length > 1) { // Always has updated_at
      const updateQuery = `UPDATE rooms SET ${updateFields.join(', ')} WHERE id = ?`;
      updateParams.push(roomId);
      await connection.query(updateQuery, updateParams);
    }

    // Update equipment (if provided)
    if (equipment !== null) {
      // Delete old equipment
      await connection.query('DELETE FROM room_equipment WHERE room_id = ?', [roomId]);

      // Insert new equipment
      if (equipment.length > 0) {
        for (const item of equipment) {
          await connection.query(
            `INSERT INTO room_equipment (
              room_id, name, quantity, condition_status
            ) VALUES (?, ?, ?, ?)`,
            [
              roomId,
              item.name,
              item.quantity || 1,
              item.condition || 'good'
            ]
          );
        }
      }
    }

    // Update amenities (if provided)
    if (amenities !== null) {
      // Delete old amenities
      await connection.query('DELETE FROM room_amenities WHERE room_id = ?', [roomId]);

      // Insert new amenities
      if (amenities.length > 0) {
        for (const amenity of amenities) {
          await connection.query(
            'INSERT INTO room_amenities (room_id, amenity) VALUES (?, ?)',
            [roomId, amenity]
          );
        }
      }
    }

    await connection.commit();

    // Fetch and return updated room
    const [updatedRoomRow] = await pool.query(
      'SELECT * FROM rooms WHERE id = ?',
      [roomId]
    );

    if (updatedRoomRow.length === 0) {
      throw new Error('Room not found after update');
    }

    return mapRoomRow(updatedRoomRow[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Delete a room (cascades to equipment and amenities)
 * @param {number} roomId
 * @returns {boolean} - true if deleted, false if not found
 */
async function deleteRoom(roomId) {
  const [result] = await pool.query(
    'DELETE FROM rooms WHERE id = ?',
    [roomId]
  );

  return result.affectedRows > 0;
}

/**
 * Check room availability (no overlapping bookings)
 * @param {number} roomId
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {number|null} excludeBookingId - Booking ID to exclude (for updates)
 * @returns {boolean} - true if available
 */
async function isRoomAvailable(roomId, startTime, endTime, excludeBookingId = null) {
  let query = `
    SELECT COUNT(*) as count
    FROM bookings
    WHERE room_id = ?
    AND status = 'approved'
    AND (
      (start_time < ? AND end_time > ?)
      OR (start_time < ? AND end_time > ?)
      OR (start_time >= ? AND end_time <= ?)
    )
  `;
  const params = [roomId, endTime, startTime, endTime, startTime, startTime, endTime];

  if (excludeBookingId) {
    query += ' AND id != ?';
    params.push(excludeBookingId);
  }

  const [result] = await pool.query(query, params);
  return result[0].count === 0;
}

/**
 * Get rooms by building
 * @param {string} building
 * @returns {Array} - Array of rooms
 */
async function getRoomsByBuilding(building) {
  const [rows] = await pool.query(
    'SELECT * FROM rooms WHERE location_building = ? ORDER BY location_floor, location_room_number',
    [building]
  );

  return Promise.all(rows.map(row => mapRoomRow(row)));
}

/**
 * Get all available buildings
 * @returns {Array} - Array of building names
 */
async function getAvailableBuildings() {
  const [rows] = await pool.query(
    'SELECT DISTINCT location_building FROM rooms ORDER BY location_building'
  );

  return rows.map(row => row.location_building);
}

/**
 * Get room types
 * @returns {Array} - Array of room types
 */
async function getRoomTypes() {
  const types = ['classroom', 'laboratory', 'lecture_hall', 'computer_lab', 'office', 'conference_room'];
  return types;
}

module.exports = {
  createRoom,
  getRoomById,
  getAllRooms,
  updateRoom,
  deleteRoom,
  isRoomAvailable,
  getRoomsByBuilding,
  getAvailableBuildings,
  getRoomTypes
};
