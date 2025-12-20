const roomRepo = require('../repositories/roomEavRepo'); // Using 3-table EAV repository
const userRepo = require('../repositories/userRepo');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const { validationResult } = require('express-validator');
const pool = require('../db/mysql');

// @desc    Get all rooms
// @route   GET /api/facilities/rooms
// @access  Private (Admin, Staff, Professor)
exports.getAllRooms = async (req, res) => {
  console.log('Fetching rooms with query:', req.query);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const roomType = req.query.type || '';
    const building = req.query.building || '';
    const capacity = req.query.capacity || '';
    const isActive = req.query.isActive;

    const options = { page, limit };

    if (search && search.trim()) {
      options.search = search.trim();
    }

    if (building && building !== 'all') {
      options.building = building;
    }

    if (roomType && roomType !== 'all') {
      // repository expects `type`
      options.type = roomType;
    }

    if (isActive !== undefined && isActive !== 'all') {
      options.isActive = isActive === 'true' || isActive === true;
    }

    if (capacity && !isNaN(capacity)) {
      // repository expects `capacity`
      options.capacity = parseInt(capacity);
    }

    const { rooms, total, pages } = await roomRepo.getAllRooms(options);
    const totalPages = pages;

    console.log(`fetched ${rooms.length} rooms`);

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

    // Extract fields - handle both flat and nested location structure
    const { 
      name,
      roomName,
      type,
      roomType,
      capacity, 
      description,
      equipment,
      amenities,
      typeSpecific,
      isActive,
      location
    } = req.body;

    // Handle nested location object or flat fields
    const building = location?.building || req.body.building;
    const floor = location?.floor || req.body.floor;
    const roomNumber = location?.roomNumber || req.body.roomNumber;
    const actualRoomName = name || roomName || `${building} ${roomNumber}`;
    const actualRoomType = type || roomType;

    // Check for duplicate room by building + room number
    let existingRoom = null;
    if (roomNumber) {
      existingRoom = await roomRepo.getRoomByNumber(roomNumber);
      if (existingRoom && existingRoom.location?.building === building) {
        return errorResponse(res, 409, 'A room with this number already exists in this building');
      }
    }

    const room = await roomRepo.createRoom({
      roomName: actualRoomName,
      name: actualRoomName,
      location: {
        building,
        floor,
        roomNumber
      },
      capacity,
      roomType: actualRoomType,
      type: actualRoomType,
      description,
      equipment,
      amenities,
      typeSpecific: typeSpecific || {},
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user?.id || null
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

    // Extract fields - handle both flat and nested location structure
    const { 
      name,
      roomName,
      type,
      roomType,
      capacity, 
      description,
      equipment,
      amenities,
      typeSpecific,
      isActive,
      location
    } = req.body;

    // Handle nested location object or flat fields
    const building = location?.building || req.body.building;
    const floor = location?.floor || req.body.floor;
    const roomNumber = location?.roomNumber || req.body.roomNumber;

    const updateData = {};
    if (name || roomName) updateData.roomName = name || roomName;
    if (name || roomName) updateData.name = name || roomName;
    // package location into nested object expected by repo
    const locationUpdates = {};
    if (roomNumber !== undefined) locationUpdates.roomNumber = roomNumber;
    if (building !== undefined) locationUpdates.building = building;
    if (floor !== undefined) locationUpdates.floor = floor;
    if (Object.keys(locationUpdates).length > 0) updateData.location = locationUpdates;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (type || roomType) updateData.roomType = type || roomType;
    if (type || roomType) updateData.type = type || roomType;
    if (description !== undefined) updateData.description = description;
    if (equipment !== undefined) updateData.equipment = equipment;
    if (amenities !== undefined) updateData.amenities = amenities;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (typeSpecific !== undefined) updateData.typeSpecific = typeSpecific;

    updateData.updatedBy = req.user?.id || null;
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