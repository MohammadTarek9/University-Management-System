const Room = require('../models/Room');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const { validationResult } = require('express-validator');

// @desc    Get all rooms
// @route   GET /api/facilities/rooms
// @access  Private (Admin, Staff, Professor)
exports.getAllRooms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const type = req.query.type || '';
    const building = req.query.building || '';
    const isActive = req.query.isActive;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'location.building': { $regex: search, $options: 'i' } },
        { 'location.roomNumber': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (building && building !== 'all') {
      filter['location.building'] = building;
    }
    
    if (isActive !== undefined && isActive !== 'all') {
      filter.isActive = isActive === 'true';
    }

    const totalRooms = await Room.countDocuments(filter);
    const rooms = await Room.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalRooms / limit),
      totalRooms,
      hasNext: page < Math.ceil(totalRooms / limit),
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
    const room = await Room.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!room) {
      return errorResponse(res, 404, 'Room not found');
    }

    return successResponse(res, 200, 'Room retrieved successfully', { room });
  } catch (error) {
    console.error('Error fetching room:', error);
    if (error.name === 'CastError') {
      return errorResponse(res, 404, 'Room not found');
    }
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
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return errorResponse(res, 409, 'A room with this name already exists');
    }

    // Check for duplicate location (building + floor + roomNumber)
    const existingLocation = await Room.findOne({
      'location.building': location.building,
      'location.floor': location.floor,
      'location.roomNumber': location.roomNumber
    });
    if (existingLocation) {
      return errorResponse(res, 409, 'A room already exists at this location');
    }

    const room = await Room.create({
      name,
      type,
      capacity,
      location,
      equipment,
      amenities,
      maintenanceNotes,
      createdBy: req.user.id
    });

    const populatedRoom = await Room.findById(room._id)
      .populate('createdBy', 'firstName lastName');

    return successResponse(res, 201, 'Room created successfully', {
      room: populatedRoom
    });
  } catch (error) {
    console.error('Error creating room:', error);
    if (error.code === 11000) {
      if (error.keyPattern?.name) {
        return errorResponse(res, 409, 'A room with this name already exists');
      }
      if (error.keyPattern?.['location.building']) {
        return errorResponse(res, 409, 'A room already exists at this location');
      }
    }
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

    const room = await Room.findById(req.params.id);
    if (!room) {
      return errorResponse(res, 404, 'Room not found');
    }

    const { name, type, capacity, location, equipment, amenities, isActive, maintenanceNotes, nextMaintenanceDate } = req.body;

    // Check for duplicate name (excluding current room)
    if (name && name !== room.name) {
      const existingRoom = await Room.findOne({ name });
      if (existingRoom) {
        return errorResponse(res, 409, 'A room with this name already exists');
      }
    }

    // Check for duplicate location (excluding current room)
    if (location) {
      const existingLocation = await Room.findOne({
        _id: { $ne: req.params.id },
        'location.building': location.building,
        'location.floor': location.floor,
        'location.roomNumber': location.roomNumber
      });
      if (existingLocation) {
        return errorResponse(res, 409, 'A room already exists at this location');
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(type && { type }),
      ...(capacity !== undefined && { capacity }),
      ...(location && { location }),
      ...(equipment && { equipment }),
      ...(amenities && { amenities }),
      ...(isActive !== undefined && { isActive }),
      ...(maintenanceNotes !== undefined && { maintenanceNotes }),
      ...(nextMaintenanceDate && { nextMaintenanceDate }),
      updatedBy: req.user.id
    };

    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    return successResponse(res, 200, 'Room updated successfully', {
      room: updatedRoom
    });
  } catch (error) {
    console.error('Error updating room:', error);
    if (error.name === 'CastError') {
      return errorResponse(res, 404, 'Room not found');
    }
    if (error.code === 11000) {
      if (error.keyPattern?.name) {
        return errorResponse(res, 409, 'A room with this name already exists');
      }
      if (error.keyPattern?.['location.building']) {
        return errorResponse(res, 409, 'A room already exists at this location');
      }
    }
    return errorResponse(res, 500, 'Failed to update room');
  }
};

// @desc    Delete room
// @route   DELETE /api/facilities/rooms/:id
// @access  Private (Admin only)
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return errorResponse(res, 404, 'Room not found');
    }

    await Room.findByIdAndDelete(req.params.id);

    return successResponse(res, 200, 'Room deleted successfully');
  } catch (error) {
    console.error('Error deleting room:', error);
    if (error.name === 'CastError') {
      return errorResponse(res, 404, 'Room not found');
    }
    return errorResponse(res, 500, 'Failed to delete room');
  }
};

// @desc    Get room statistics
// @route   GET /api/facilities/rooms/stats
// @access  Private (Admin, Staff)
exports.getRoomStats = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const activeRooms = await Room.countDocuments({ isActive: true });
    const roomsByType = await Room.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const roomsByBuilding = await Room.aggregate([
      { $group: { _id: '$location.building', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

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