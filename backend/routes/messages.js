// routes/messages.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getParentChildren,
  getStudentTeachers,
  sendMessage,
  getSentMessages,
  getReceivedMessages,
  getMessage,
  markMessageAsRead,
  getUnreadCount,
  deleteMessage,
  replyToMessage,
  getAvailableStaff,
  sendStudentMessage,
  getStudentConversations
} = require('../controllers/messageController');

// All routes require authentication
router.use(protect);

// Get parent's children (parent access)
router.get('/children', authorize('parent'), getParentChildren);

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

// Reply to a message (teacher access)
router.post('/:id/reply', authorize('professor', 'ta'), replyToMessage);

// Mark message as read (teacher access)
router.put('/:id/read', authorize('professor', 'ta'), markMessageAsRead);

// Delete a message (parent access)
router.delete('/:id', authorize('parent'), deleteMessage);

// Get available staff (student access)
router.get('/staff', authorize('student'), getAvailableStaff);

// Send message (student access)
router.post('/student', authorize('student'), sendStudentMessage);

// Get student conversations (student access)
router.get('/student/conversations', authorize('student'), getStudentConversations);

module.exports = router;
