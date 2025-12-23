// routes/messages.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStudentTeachers,
  sendMessage,
  getSentMessages,
  getReceivedMessages,
  getMessage,
  markMessageAsRead,
  getUnreadCount,
  deleteMessage
} = require('../controllers/messageController');

// All routes require authentication
router.use(protect);

// Get teachers for a student (parent access)
router.get('/teachers/:studentId', authorize('parent'), getStudentTeachers);

// Get sent messages (parent access)
router.get('/sent', authorize('parent'), getSentMessages);

// Get received messages (teacher access)
router.get('/received', authorize('professor', 'ta'), getReceivedMessages);

// Get unread count (teacher access)
router.get('/unread/count', authorize('professor', 'ta'), getUnreadCount);

// Get specific message (parent or teacher)
router.get('/:id', getMessage);

// Send a message (parent access)
router.post('/', authorize('parent'), sendMessage);

// Mark message as read (teacher access)
router.put('/:id/read', authorize('professor', 'ta'), markMessageAsRead);

// Delete a message (parent access)
router.delete('/:id', authorize('parent'), deleteMessage);

module.exports = router;
