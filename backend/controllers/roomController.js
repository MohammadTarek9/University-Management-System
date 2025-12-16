const roomRepo = require('../repositories/roomEavRepoNew'); // Using 3-table EAV repository
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
    const roomType = req.query.type || '';
    const building = req.query.building || '';
    const capacity = req.query.capacity || '';
    const isActive = req.query.isActive;

    const options = { page, limit };

    if (building && building !== 'all') {
      options.building = building;
    }

    if (roomType && roomType !== 'all') {
      options.roomType = roomType;
    }

    if (isActive !== undefined && isActive !== 'all') {
      options.isActive = isActive === 'true' || isActive === true;
    }

    if (capacity && !isNaN(capacity)) {
      options.minCapacity = parseInt(capacity);
    }

    const { rooms, total, totalPages } = await roomRepo.getAllRooms(options);

    const pagination = {
      currentPage: page,
      totalPages,
      totalRooms: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return successResponse(res, 200, 'Rooms retrieved successfully', {
      rooms,
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
    const roomId = parseInt(req.params.id);
    if (!Number.isInteger(roomId) || isNaN(roomId)) {
      return errorResponse(res, 400, 'Invalid room ID');
    }
    const room = await roomRepo.getRoomById(roomId);

    if (!room) {
      return errorResponse(res, 404, 'Room not found');
    }

    return successResponse(res, 200, 'Room retrieved successfully', { room });
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

    const { 
      roomNumber, 
      roomName, 
      building, 
      floor, 
      capacity, 
      roomType, 
      description,
      isActive,
      // Type-specific EAV attributes
      typeSpecific
    } = req.body;

    // Check for duplicate room by building + room number
    const existingRoom = await roomRepo.getRoomByNumber(building, roomNumber);
    if (existingRoom) {
      return errorResponse(res, 409, 'A room with this number already exists in this building');
    }

    const room = await roomRepo.createRoom({
      roomNumber,
      roomName,
      building,
      floor,
      capacity,
      roomType,
      description,
      isActive: isActive !== undefined ? isActive : true,
      typeSpecific: typeSpecific || {}
    });

    return successResponse(res, 201, 'Room created successfully', { room });
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
    if (!Number.isInteger(roomId) || isNaN(roomId)) {
      return errorResponse(res, 400, 'Invalid room ID');
    }

    const room = await roomRepo.getRoomById(roomId);
    if (!room) {
      return errorResponse(res, 404, 'Room not found');
    }

    const { 
      roomNumber, 
      roomName, 
      building, 
      floor, 
      capacity, 
      roomType, 
      description,
      isActive,
      // Type-specific EAV attributes
      typeSpecific
    } = req.body;

    const updateData = {};
    if (roomNumber !== undefined) updateData.roomNumber = roomNumber;
    if (roomName !== undefined) updateData.roomName = roomName;
    if (building !== undefined) updateData.building = building;
    if (floor !== undefined) updateData.floor = floor;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (roomType !== undefined) updateData.roomType = roomType;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (typeSpecific !== undefined) updateData.typeSpecific = typeSpecific;

    const updatedRoom = await roomRepo.updateRoom(roomId, updateData);

    return successResponse(res, 200, 'Room updated successfully', { room: updatedRoom });
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
    if (!Number.isInteger(roomId) || isNaN(roomId)) {
      return errorResponse(res, 400, 'Invalid room ID');
    }
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