// routes/meetingRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  requestMeeting,
  getMyMeetings,
  updateMeetingStatus,
  cancelMeeting,
  getMeetingDetails,
  getAvailableProfessors
} = require('../controllers/meetingController');

router.use(protect);

// @route   GET /api/meetings/professors
// @desc    Get all available professors
// @access  Private (student)
router.get('/professors', getAvailableProfessors);

// @route   POST /api/meetings/request
// @desc    Request a meeting with a professor
// @access  Private (student)
router.post('/request', requestMeeting);

// @route   GET /api/meetings/my-meetings
// @desc    Get user's meetings
// @access  Private
router.get('/my-meetings', getMyMeetings);

// @route   GET /api/meetings/:meetingId
// @desc    Get meeting details
// @access  Private
router.get('/:meetingId', getMeetingDetails);

// @route   PUT /api/meetings/:meetingId/status
// @desc    Update meeting status (approve/reject)
// @access  Private (professor)
router.put('/:meetingId/status', updateMeetingStatus);

// @route   PUT /api/meetings/:meetingId/cancel
// @desc    Cancel a meeting
// @access  Private (student or professor)
router.put('/:meetingId/cancel', cancelMeeting);

module.exports = router;