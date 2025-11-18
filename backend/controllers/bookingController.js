const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const { validationResult } = require('express-validator');

// @desc    Get all bookings with filters
// @route   GET /api/facilities/bookings
// @access  Private (Admin, Staff, Professor)
exports.getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, room, startDate, endDate } = req.query;

    // Build filter object
    const filter = {};
    
    // Staff and professors can only see their own bookings
    if (req.user.role !== 'admin') {
      filter.user = req.user.id;
    }
    
    if (status && status !== 'all' && status !== 'undefined') {
      filter.status = status;
    }
    
    if (room && room !== 'all' && room !== 'undefined') {
      // Validate if it's a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(room)) {
        filter.room = room;
      } else {
        return errorResponse(res, 400, 'Invalid room ID format');
      }
    }
    
    if (startDate && endDate) {
      filter.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalBookings = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('room', 'name type capacity location building equipment amenities isActive')
      .populate('user', 'firstName lastName email')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalBookings / limit),
      totalBookings,
      hasNext: page < Math.ceil(totalBookings / limit),
      hasPrev: page > 1
    };

    return successResponse(res, 200, 'Bookings retrieved successfully', {
      bookings,
      pagination
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    // Handle CastError specifically
    if (error.name === 'CastError') {
      return errorResponse(res, 400, `Invalid ID format: ${error.value}`);
    }
    return errorResponse(res, 500, 'Failed to fetch bookings');
  }
};

// @desc    Create new booking
// @route   POST /api/facilities/bookings
// @access  Private (Admin, Staff, Professor)
exports.createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { roomId, title, description, startTime, endTime, attendees, recurring } = req.body;

    // Check if room exists and is active
    const room = await Room.findById(roomId)
      .select('-equipmentCount -fullLocation') // Exclude virtual fields that cause issues
      .lean(); // Get plain JavaScript object instead of Mongoose document

    if (!room) {
      return errorResponse(res, 404, 'Room not found');
    }
    if (!room.isActive) {
      return errorResponse(res, 400, 'Room is not available for booking');
    }

    // Check capacity
    if (attendees > room.capacity) {
      return errorResponse(res, 400, `Room capacity exceeded. Maximum: ${room.capacity}`);
    }

    // Check for time conflicts
    const isAvailable = await Booking.checkAvailability(roomId, new Date(startTime), new Date(endTime));
    if (!isAvailable) {
      return errorResponse(res, 409, 'Room is already booked for the selected time slot');
    }

    // Validate time (minimum 30 minutes, maximum 8 hours)
    const duration = (new Date(endTime) - new Date(startTime)) / (1000 * 60);
    if (duration < 30) {
      return errorResponse(res, 400, 'Minimum booking duration is 30 minutes');
    }
    if (duration > 480) {
      return errorResponse(res, 400, 'Maximum booking duration is 8 hours');
    }

    // Cannot book in the past
    if (new Date(startTime) < new Date()) {
      return errorResponse(res, 400, 'Cannot book rooms in the past');
    }
    

    const booking = await Booking.create({
      room: roomId,
      user: req.user.id,
      title,
      description,
      startTime,
      endTime,
      attendees,
      recurring,
      status: 'approved',
      createdBy: req.user.id
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('room', 'name type capacity location building equipment amenities isActive')
      .populate('user', 'firstName lastName email');

    return successResponse(res, 201, 'Booking created successfully', {
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return errorResponse(res, 500, 'Failed to create booking');
  }
};

// @desc    Get single booking
// @route   GET /api/facilities/bookings/:id
// @access  Private (Admin, Staff, Professor)
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'name type capacity location building equipment amenities isActive')
      .populate('user', 'firstName lastName email');

    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    // Staff and professors can only view their own bookings
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied');
    }

    return successResponse(res, 200, 'Booking retrieved successfully', { booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    if (error.name === 'CastError') {
      return errorResponse(res, 404, 'Booking not found');
    }
    return errorResponse(res, 500, 'Failed to fetch booking');
  }
};

// @desc    Update booking
// @route   PUT /api/facilities/bookings/:id
// @access  Private (Admin, Staff, Professor)
exports.updateBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    // Only admin or booking owner can update
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied');
    }

    // Cannot update cancelled booking
    if (booking.status === 'cancelled') {
      return errorResponse(res, 400, 'Cannot update cancelled bookings');
    }

    if (new Date(booking.startTime) < new Date()) {
      return errorResponse(res, 400, 'Cannot update past bookings');
    }

    const { title, description, startTime, endTime, attendees } = req.body;

    // Check for time conflicts if time is being updated
    if (startTime || endTime) {
      const newStartTime = startTime ? new Date(startTime) : booking.startTime;
      const newEndTime = endTime ? new Date(endTime) : booking.endTime;
      
      const isAvailable = await Booking.checkAvailability(
        booking.room, 
        newStartTime, 
        newEndTime, 
        req.params.id
      );
      
      if (!isAvailable) {
        return errorResponse(res, 409, 'Room is already booked for the selected time slot');
      }
    }

    const updateData = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(attendees && { attendees })
    };

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('room', 'name type capacity location building equipment amenities isActive')
     .populate('user', 'firstName lastName email');

    return successResponse(res, 200, 'Booking updated successfully', {
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    if (error.name === 'CastError') {
      return errorResponse(res, 404, 'Booking not found');
    }
    return errorResponse(res, 500, 'Failed to update booking');
  }
};

// @desc    Cancel booking
// @route   PATCH /api/facilities/bookings/:id/cancel
// @access  Private (Admin, Staff, Professor)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    // Only admin or booking owner can cancel
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Access denied');
    }

    // Cannot cancel past bookings
    if (new Date(booking.startTime) < new Date()) {
      return errorResponse(res, 400, 'Cannot cancel past bookings');
    }

    booking.status = 'cancelled';
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('room', 'name type capacity location building equipment amenities isActive')
      .populate('user', 'firstName lastName email');

    return successResponse(res, 200, 'Booking cancelled successfully', {
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    if (error.name === 'CastError') {
      return errorResponse(res, 404, 'Booking not found');
    }
    return errorResponse(res, 500, 'Failed to cancel booking');
  }
};

// @desc    Get available time slots for a room
// @route   GET /api/facilities/rooms/:id/availability
// @access  Private (Admin, Staff, Professor)
exports.getRoomAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    const roomId = req.params.id;

    if (!date) {
      return errorResponse(res, 400, 'Date is required');
    }

    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    // Get all approved bookings for the room on selected date
    const bookings = await Booking.find({
      room: roomId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: 'approved'
    }).select('startTime endTime')
      .sort({ startTime: 1 });

    return successResponse(res, 200, 'Availability retrieved successfully', {
      date: selectedDate,
      bookings
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return errorResponse(res, 500, 'Failed to fetch availability');
  }
};


// @desc    Search available rooms with filters
// @route   GET /api/facilities/rooms/search/available
// @access  Private (Admin, Staff, Professor)
exports.searchAvailableRooms = async (req, res) => {
  try {
    const {
      startTime,
      endTime,
      capacity,
      building,
      roomType,
      date,
      page = 1,
      limit = 10
    } = req.query;

    // Validate required parameters
    if (!startTime || !endTime) {
      return errorResponse(res, 400, 'Start time and end time are required');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Validate time range
    if (start >= end) {
      return errorResponse(res, 400, 'End time must be after start time');
    }

    if (start < new Date()) {
      return errorResponse(res, 400, 'Cannot book rooms in the past');
    }

    // Validate duration (minimum 30 minutes, maximum 8 hours)
    const duration = (end - start) / (1000 * 60);
    if (duration < 30) {
      return errorResponse(res, 400, 'Minimum booking duration is 30 minutes');
    }
    if (duration > 480) {
      return errorResponse(res, 400, 'Maximum booking duration is 8 hours');
    }

    // Build room filter
    const roomFilter = { isActive: true };
    
    if (capacity && !isNaN(capacity)) {
      roomFilter.capacity = { $gte: parseInt(capacity) };
    }
    
    if (building && building !== 'all') {
      roomFilter['location.building'] = building;
    }
    
    if (roomType && roomType !== 'all') {
      roomFilter.type = roomType;
    }

    // Find all rooms that match the criteria
    const rooms = await Room.find(roomFilter)
      .select('-equipmentCount -fullLocation')
      .lean();

    // Check availability for each room
    const availableRooms = [];
    
    for (const room of rooms) {
      const isAvailable = await Booking.checkAvailability(
        room._id, 
        start, 
        end
      );
      
      if (isAvailable) {
        availableRooms.push(room);
      }
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRooms = availableRooms.slice(startIndex, endIndex);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(availableRooms.length / limit),
      totalRooms: availableRooms.length,
      hasNext: endIndex < availableRooms.length,
      hasPrev: startIndex > 0
    };

    return successResponse(res, 200, 'Available rooms retrieved successfully', {
      rooms: paginatedRooms,
      pagination,
      searchCriteria: {
        startTime,
        endTime,
        capacity,
        building,
        roomType
      }
    });

  } catch (error) {
    console.error('Error searching available rooms:', error);
    return errorResponse(res, 500, 'Failed to search available rooms');
  }
};