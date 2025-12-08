const roomRepo = require('../repositories/roomRepo');
const userRepo = require('../repositories/userRepo');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const { validationResult } = require('express-validator');
const pool = require('../db/mysql');

// @desc    Get all rooms
// @route   GET /api/facilities/rooms
// @access  Private (Admin, Staff, Professor)
exports.getAllRooms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const type = req.query.type || '';
    const building = req.query.building || '';
    const capacity = req.query.capacity || '';
    const isActive = req.query.isActive;

    const filters = {};

    if (search) {
      filters.search = search;
    }

    if (type && type !== 'all') {
      filters.type = type;
    }

    if (building && building !== 'all') {
      filters.building = building;
    }

    if (capacity && !isNaN(capacity)) {
      filters.capacity = parseInt(capacity);
    }

    if (isActive !== undefined && isActive !== 'all') {
      filters.isActive = isActive === 'true' || isActive === true;
    }

    const result = await roomRepo.getAllRooms(filters, page, limit);

    // Fetch user details for createdBy and updatedBy
    const roomsWithUsers = await Promise.all(
      result.rooms.map(async (room) => {
        const createdByUser = room.createdBy ? await userRepo.getUserById(room.createdBy) : null;
        const updatedByUser = room.updatedBy ? await userRepo.getUserById(room.updatedBy) : null;

        return {
          ...room,
          createdBy: createdByUser ? {
            id: createdByUser.id,
            firstName: createdByUser.firstName,
            lastName: createdByUser.lastName
          } : null,
          updatedBy: updatedByUser ? {
            id: updatedByUser.id,
            firstName: updatedByUser.firstName,
            lastName: updatedByUser.lastName
          } : null
        };
      })
    );

    const pagination = {
      currentPage: page,
      totalPages: result.pages,
      totalRooms: result.total,
      hasNext: page < result.pages,
      hasPrev: page > 1
    };

    return successResponse(res, 200, 'Rooms retrieved successfully', {
      rooms: roomsWithUsers,
      pagination
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return errorResponse(res, 500, 'Failed to fetch rooms');
  }
};

// @desc    Get single room
// @route   GET /api/facilities/rooms/:id
// @access  Private (Admin, Staff, Professor)
exports.getRoomById = async (req, res) => {
  try {
    const room = await roomRepo.getRoomById(parseInt(req.params.id));

    if (!room) {
      return errorResponse(res, 404, 'Room not found');
    }

    // Fetch user details
    const createdByUser = room.createdBy ? await userRepo.getUserById(room.createdBy) : null;
    const updatedByUser = room.updatedBy ? await userRepo.getUserById(room.updatedBy) : null;

    const roomWithUsers = {
      ...room,
      createdBy: createdByUser ? {
        id: createdByUser.id,
        firstName: createdByUser.firstName,
        lastName: createdByUser.lastName,
        email: createdByUser.email
      } : null,
      updatedBy: updatedByUser ? {
        id: updatedByUser.id,
        firstName: updatedByUser.firstName,
        lastName: updatedByUser.lastName,
        email: updatedByUser.email
      } : null
    };

    return successResponse(res, 200, 'Room retrieved successfully', { room: roomWithUsers });
  } catch (error) {
    console.error('Error fetching room:', error);
    return errorResponse(res, 500, 'Failed to fetch room');
  }
};

// @desc    Create new room
// @route   POST /api/facilities/rooms
// @access  Private (Admin only)
exports.createRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { name, type, capacity, location, equipment = [], amenities = [], maintenanceNotes } = req.body;

    // Check for duplicate room name
    const [existingByName] = await pool.query(
      'SELECT id FROM rooms WHERE name = ?',
      [name]
    );
    if (existingByName.length > 0) {
      return errorResponse(res, 409, 'A room with this name already exists');
    }

    // Check for duplicate location
    const [existingByLocation] = await pool.query(
      `SELECT id FROM rooms 
       WHERE location_building = ? AND location_floor = ? AND location_room_number = ?`,
      [location.building, location.floor, location.roomNumber]
    );
    if (existingByLocation.length > 0) {
      return errorResponse(res, 409, 'A room already exists at this location');
    }

    const room = await roomRepo.createRoom({
      name,
      type,
      capacity,
      location,
      equipment,
      amenities,
      maintenanceNotes,
      createdBy: req.user.id
    });

    const createdByUser = await userRepo.getUserById(room.createdBy);
    const roomWithUser = {
      ...room,
      createdBy: {
        id: createdByUser.id,
        firstName: createdByUser.firstName,
        lastName: createdByUser.lastName
      }
    };

    return successResponse(res, 201, 'Room created successfully', {
      room: roomWithUser
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return errorResponse(res, 500, 'Failed to create room');
  }
};

// @desc    Update room
// @route   PUT /api/facilities/rooms/:id
// @access  Private (Admin only)
exports.updateRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const roomId = parseInt(req.params.id);
    const room = await roomRepo.getRoomById(roomId);

    if (!room) {
      return errorResponse(res, 404, 'Room not found');
    }

    const { name, type, capacity, location, equipment, amenities, isActive, maintenanceNotes, nextMaintenanceDate } = req.body;

    // Check for duplicate name (excluding current room)
    if (name && name !== room.name) {
      const [existingByName] = await pool.query(
        'SELECT id FROM rooms WHERE name = ? AND id != ?',
        [name, roomId]
      );
      if (existingByName.length > 0) {
        return errorResponse(res, 409, 'A room with this name already exists');
      }
    }

    // Check for duplicate location (excluding current room)
    if (location) {
      const [existingByLocation] = await pool.query(
        `SELECT id FROM rooms 
         WHERE location_building = ? AND location_floor = ? AND location_room_number = ? AND id != ?`,
        [location.building, location.floor, location.roomNumber, roomId]
      );
      if (existingByLocation.length > 0) {
        return errorResponse(res, 409, 'A room already exists at this location');
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(type && { type }),
      ...(capacity !== undefined && { capacity }),
      ...(location && { location }),
      ...(equipment !== undefined && { equipment }),
      ...(amenities !== undefined && { amenities }),
      ...(isActive !== undefined && { isActive }),
      ...(maintenanceNotes !== undefined && { maintenanceNotes }),
      ...(nextMaintenanceDate && { nextMaintenanceDate }),
      updatedBy: req.user.id
    };

    const updatedRoom = await roomRepo.updateRoom(roomId, updateData);

    const createdByUser = updatedRoom.createdBy ? await userRepo.getUserById(updatedRoom.createdBy) : null;
    const updatedByUser = updatedRoom.updatedBy ? await userRepo.getUserById(updatedRoom.updatedBy) : null;

    const roomWithUsers = {
      ...updatedRoom,
      createdBy: createdByUser ? {
        id: createdByUser.id,
        firstName: createdByUser.firstName,
        lastName: createdByUser.lastName
      } : null,
      updatedBy: updatedByUser ? {
        id: updatedByUser.id,
        firstName: updatedByUser.firstName,
        lastName: updatedByUser.lastName
      } : null
    };

    return successResponse(res, 200, 'Room updated successfully', {
      room: roomWithUsers
    });
  } catch (error) {
    console.error('Error updating room:', error);
    return errorResponse(res, 500, 'Failed to update room');
  }
};

// @desc    Delete room
// @route   DELETE /api/facilities/rooms/:id
// @access  Private (Admin only)
exports.deleteRoom = async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const room = await roomRepo.getRoomById(roomId);

    if (!room) {
      return errorResponse(res, 404, 'Room not found');
    }

    const deleted = await roomRepo.deleteRoom(roomId);

    if (!deleted) {
      return errorResponse(res, 404, 'Room not found');
    }

    return successResponse(res, 200, 'Room deleted successfully');
  } catch (error) {
    console.error('Error deleting room:', error);
    return errorResponse(res, 500, 'Failed to delete room');
  }
};

// @desc    Get room statistics
// @route   GET /api/facilities/rooms/stats
// @access  Private (Admin, Staff)
exports.getRoomStats = async (req, res) => {
  try {
    const [totalResult] = await pool.query('SELECT COUNT(*) as count FROM rooms');
    const totalRooms = totalResult[0].count;

    const [activeResult] = await pool.query('SELECT COUNT(*) as count FROM rooms WHERE is_active = 1');
    const activeRooms = activeResult[0].count;

    const [typeResult] = await pool.query(
      'SELECT type, COUNT(*) as count FROM rooms GROUP BY type ORDER BY count DESC'
    );
    const roomsByType = typeResult.map(row => ({
      _id: row.type,
      count: row.count
    }));

    const [buildingResult] = await pool.query(
      'SELECT location_building, COUNT(*) as count FROM rooms GROUP BY location_building ORDER BY count DESC'
    );
    const roomsByBuilding = buildingResult.map(row => ({
      _id: row.location_building,
      count: row.count
    }));

    return successResponse(res, 200, 'Room statistics retrieved successfully', {
      totalRooms,
      activeRooms,
      inactiveRooms: totalRooms - activeRooms,
      roomsByType,
      roomsByBuilding
    });
  } catch (error) {
    console.error('Error fetching room statistics:', error);
    return errorResponse(res, 500, 'Failed to fetch room statistics');
  }
};