const express = require('express');
const { body } = require('express-validator');
const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  getRoomAvailability,
  searchAvailableRooms
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Booking validation rules
const bookingValidation = [
  body('roomId')
    .isMongoId()
    .withMessage('Valid room ID is required'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('startTime')
    .isISO8601()
    .withMessage('Valid start time is required'),
  body('endTime')
    .isISO8601()
    .withMessage('Valid end time is required'),
  body('attendees')
    .isInt({ min: 1 })
    .withMessage('Number of attendees must be at least 1')
];

// Apply authentication to all routes
router.use(protect);

// GET /api/facilities/bookings - Get all bookings
router.get('/', authorize(['admin', 'staff', 'professor']), getAllBookings);

// POST /api/facilities/bookings - Create new booking
router.post('/', authorize(['admin', 'staff', 'professor']), bookingValidation, createBooking);

// GET /api/facilities/bookings/:id - Get single booking
router.get('/:id', authorize(['admin', 'staff', 'professor']), getBookingById);

// PUT /api/facilities/bookings/:id - Update booking
router.put('/:id', authorize(['admin', 'staff', 'professor']), bookingValidation, updateBooking);

// PATCH /api/facilities/bookings/:id/cancel - Cancel booking
router.patch('/:id/cancel', authorize(['admin', 'staff', 'professor']), cancelBooking);

// GET /api/facilities/rooms/:id/availability - Get room availability
router.get('/rooms/:id/availability', authorize(['admin', 'staff', 'professor']), getRoomAvailability);

// GET /api/facilities/bookings/search/available - search available rooms with filters
router.get('/search/available', protect, authorize('admin', 'staff', 'professor'), searchAvailableRooms);
module.exports = router;