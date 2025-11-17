const express = require('express');
const { body } = require('express-validator');
const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomStats
} = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Room validation rules
const roomValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Room name must be between 1 and 100 characters'),
  body('type')
    .isIn(['classroom', 'laboratory', 'lecture_hall', 'computer_lab', 'office', 'conference_room'])
    .withMessage('Invalid room type'),
  body('capacity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Capacity must be between 1 and 1000'),
  body('location.building')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Building name must be between 1 and 50 characters'),
  body('location.floor')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Floor must be between 1 and 10 characters'),
  body('location.roomNumber')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Room number must be between 1 and 20 characters')
];

// Apply authentication to all routes
router.use(protect);

// GET /api/facilities/rooms/stats - Get room statistics
router.get('/stats', authorize(['admin', 'staff']), getRoomStats);

// GET /api/facilities/rooms - Get all rooms (Admin, Staff, Professor can view)
router.get('/', authorize(['admin', 'staff', 'professor']), getAllRooms);

// POST /api/facilities/rooms - Create new room (Admin only)
router.post('/', authorize(['admin']), roomValidation, createRoom);

// GET /api/facilities/rooms/:id - Get single room
router.get('/:id', authorize(['admin', 'staff', 'professor']), getRoomById);

// PUT /api/facilities/rooms/:id - Update room (Admin only)
router.put('/:id', authorize(['admin']), roomValidation, updateRoom);

// DELETE /api/facilities/rooms/:id - Delete room (Admin only)
router.delete('/:id', authorize(['admin']), deleteRoom);

module.exports = router;