const bookingRepo = require('../repositories/bookingRepo');
const roomRepo = require('../repositories/roomEavRepoNew'); // Using EAV repository
const userRepo = require('../repositories/userRepo');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const { validationResult } = require('express-validator');

// @desc    Get all bookings with filters
// @route   GET /api/facilities/bookings
// @access  Private (Admin, Staff, Professor)
exports.getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, room, startDate, endDate } = req.query;
    const filters = {};
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : req.user.role === 'admin';
    if (!isAdmin) {
      filters.userId = req.user.id;
    }
    if (status && status !== 'all' && status !== 'undefined') {
      filters.status = status;
    }
    if (room && room !== 'all' && room !== 'undefined') {
      filters.roomId = parseInt(room);
    }
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    const result = await bookingRepo.getAllBookings(filters, page, limit);
    // Populate room and user details
    const bookingsWithDetails = await Promise.all(result.bookings.map(async (booking) => {
      const room = booking.roomId ? await roomRepo.getRoomById(booking.roomId) : null;
      const user = booking.userId ? await userRepo.getUserById(booking.userId) : null;
      return {
        ...booking,
        room,
        user
      };
    }));
    const pagination = {
      currentPage: page,
      totalPages: result.pages,
      totalBookings: result.total,
      hasNext: page < result.pages,
      hasPrev: page > 1
    };
    return successResponse(res, 200, 'Bookings retrieved successfully', {
      bookings: bookingsWithDetails,
      pagination
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return errorResponse(res, 500, 'Failed to fetch bookings');
  }
};

// @desc    Create new booking
// @route   POST /api/facilities/bookings
// @access  Private (Admin, Staff, Professor)
exports.createBooking = async (req, res) => {
  try {
    console.log("debug point 1");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }
    const { roomId, title, description, startTime, endTime, attendees, isRecurring, recurringFrequency, recurringEndDate, recurringOccurrences } = req.body;
    // Check if room exists and is active
    const room = await roomRepo.getRoomById(roomId);
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
    const isAvailable = await bookingRepo.checkAvailability(roomId, startTime, endTime);
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
    console.log("debug point 2");
    const booking = await bookingRepo.createBooking({
      roomId,
      userId: req.user.id,
      title,
      description,
      startTime,
      endTime,
      attendees,
      isRecurring,
      recurringFrequency,
      recurringEndDate,
      recurringOccurrences,
      status: 'approved',
      createdBy: req.user.id
    });
    const roomDetails = await roomRepo.getRoomById(booking.roomId);
    const userDetails = await userRepo.getUserById(booking.userId);
    return successResponse(res, 201, 'Booking created successfully', {
      booking: {
        ...booking,
        room: roomDetails,
        user: userDetails
      }
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
    const bookingId = parseInt(req.params.id);
    const booking = await bookingRepo.getBookingById(bookingId);
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }
    // Staff and professors can only view their own bookings
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : req.user.role === 'admin';
    if (!isAdmin && booking.userId.toString() !== req.user.id.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }
    const roomDetails = booking.roomId ? await roomRepo.getRoomById(booking.roomId) : null;
    const userDetails = booking.userId ? await userRepo.getUserById(booking.userId) : null;
    return successResponse(res, 200, 'Booking retrieved successfully', {
      booking: {
        ...booking,
        room: roomDetails,
        user: userDetails
      }
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
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
    const bookingId = parseInt(req.params.id);
    const booking = await bookingRepo.getBookingById(bookingId);
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }
    // Only admin or booking owner can update
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : req.user.role === 'admin';
    if (!isAdmin && booking.userId.toString() !== req.user.id.toString()) {
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
    let newStartTime = startTime ? startTime : booking.startTime;
    let newEndTime = endTime ? endTime : booking.endTime;
    if (startTime || endTime) {
      const isAvailable = await bookingRepo.checkAvailability(
        booking.roomId,
        newStartTime,
        newEndTime,
        bookingId
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
      ...(attendees && { attendees }),
      updatedBy: req.user.id
    };
    const updatedBooking = await bookingRepo.updateBooking(bookingId, updateData);
    const roomDetails = updatedBooking.roomId ? await roomRepo.getRoomById(updatedBooking.roomId) : null;
    const userDetails = updatedBooking.userId ? await userRepo.getUserById(updatedBooking.userId) : null;
    return successResponse(res, 200, 'Booking updated successfully', {
      booking: {
        ...updatedBooking,
        room: roomDetails,
        user: userDetails
      }
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return errorResponse(res, 500, 'Failed to update booking');
  }
};

// @desc    Cancel booking
// @route   PATCH /api/facilities/bookings/:id/cancel
// @access  Private (Admin, Staff, Professor)
exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await bookingRepo.getBookingById(bookingId);
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }
    // Only admin or booking owner can cancel
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : req.user.role === 'admin';
    if (!isAdmin && booking.userId.toString() !== req.user.id.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }
    // Cannot cancel past bookings
    if (new Date(booking.startTime) < new Date()) {
      return errorResponse(res, 400, 'Cannot cancel past bookings');
    }
    const cancelledBooking = await bookingRepo.cancelBooking(bookingId);
    const roomDetails = cancelledBooking.roomId ? await roomRepo.getRoomById(cancelledBooking.roomId) : null;
    const userDetails = cancelledBooking.userId ? await userRepo.getUserById(cancelledBooking.userId) : null;
    return successResponse(res, 200, 'Booking cancelled successfully', {
      booking: {
        ...cancelledBooking,
        room: roomDetails,
        user: userDetails
      }
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
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
    const filters = {
      roomId: parseInt(roomId),
      status: 'approved',
      startDate: startOfDay.toISOString().slice(0, 19).replace('T', ' '),
      endDate: endOfDay.toISOString().slice(0, 19).replace('T', ' ')
    };
    const result = await bookingRepo.getAllBookings(filters, 1, 100);
    const bookings = result.bookings.map(b => ({
      startTime: b.startTime,
      endTime: b.endTime
    })).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
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
    // Validate and build time range
    let start = startTime ? new Date(startTime) : new Date(Date.now() + 1 * 60 * 60 * 1000);
    let end = endTime ? new Date(endTime) : new Date(Date.now() + 2 * 60 * 60 * 1000);
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return errorResponse(res, 400, 'Invalid date/time format provided');
    }
    if (start >= end) {
      return errorResponse(res, 400, 'End time must be after start time');
    }
    const duration = (end - start) / (1000 * 60);
    if (duration < 30) {
      return errorResponse(res, 400, 'Minimum booking duration is 30 minutes');
    }
    if (duration > 480) {
      return errorResponse(res, 400, 'Maximum booking duration is 8 hours');
    }
    // Build room filter
    const roomFilters = { isActive: true };
    if (capacity && !isNaN(capacity)) {
      roomFilters.capacity = parseInt(capacity);
    }
    if (building && building !== 'all') {
      roomFilters.building = building;
    }
    if (roomType && roomType !== 'all') {
      roomFilters.type = roomType;
    }
    // Find all rooms that match the criteria
    const roomResult = await roomRepo.getAllRooms(roomFilters, 1, 1000);
    const rooms = roomResult.rooms;
    // Check availability for each room
    const availableRooms = [];
    for (const room of rooms) {
      const isAvailable = await bookingRepo.checkAvailability(
        room.id,
        start.toISOString().slice(0, 19).replace('T', ' '),
        end.toISOString().slice(0, 19).replace('T', ' ')
      );
      if (isAvailable) {
        availableRooms.push(room);
      }
    }
    // Extract unique buildings for filter options
    const uniqueBuildings = [...new Set(rooms.map(room => room.location.building))];
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
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        capacity,
        building,
        roomType,
        date
      },
      filterOptions: {
        buildings: uniqueBuildings
      }
    });
  } catch (error) {
    console.error('Error searching available rooms:', error);
    return errorResponse(res, 500, 'Failed to search available rooms');
  }
};