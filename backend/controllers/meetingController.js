// controllers/meetingController.js (SIMPLIFIED)
const { errorResponse, successResponse } = require('../utils/responseHelpers');
const meetingRepo = require('../repositories/meetingRepo');
const userRepo = require('../repositories/userRepo');
const teachingStaffProfileRepo = require('../repositories/teachingStaffProfileRepo');
/**
 * @desc    Request a meeting with a professor (SIMPLIFIED)
 * @route   POST /api/meetings/request
 * @access  Private (student)
 */
const requestMeeting = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { professorId, date, startTime, purpose } = req.body;
    
    // Validate required fields
    if (!professorId || !date || !startTime) {
      return errorResponse(res, 400, 'Professor ID, date, and start time are required');
    }
    
    // Check if student is trying to request a meeting with themselves
    if (parseInt(studentId) === parseInt(professorId)) {
      return errorResponse(res, 400, 'Cannot request a meeting with yourself');
    }
    
    // Check if professor exists and is a professor/TA
    const professor = await userRepo.getUserById(professorId);
    if (!professor || !['professor', 'ta'].includes(professor.role)) {
      return errorResponse(res, 404, 'Professor not found');
    }
    
    // Validate date (must be today or in the future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const meetingDate = new Date(date);
    meetingDate.setHours(0, 0, 0, 0);
    
    if (meetingDate < today) {
      return errorResponse(res, 400, 'Cannot request meetings in the past');
    }
    
    // Calculate end time (default 30 minutes)
    const startTimeObj = new Date(`${date}T${startTime}`);
    const endTimeObj = new Date(startTimeObj.getTime() + 30 * 60000); // Add 30 minutes
    const endTime = endTimeObj.toTimeString().split(' ')[0];
    
    // Create meeting request
    const meetingData = {
      studentId,
      professorId,
      meetingDate: date,
      startTime,
      endTime,
      durationMinutes: 30,
      purpose: purpose || 'Academic guidance'
    };
    
    const meeting = await meetingRepo.createMeetingRequest(meetingData);
    
    successResponse(res, 201, 'Meeting request submitted successfully', {
      meeting,
      message: 'Your meeting request has been sent to the professor. You will be notified when they respond.'
    });
  } catch (error) {
    console.error('Error requesting meeting:', error);
    
    if (error.message === 'You have already requested a meeting at this time') {
      errorResponse(res, 400, error.message);
    } else {
      errorResponse(res, 500, 'Server error while requesting meeting');
    }
  }
};

/**
 * @desc    Get my meetings (student or professor)
 * @route   GET /api/meetings/my-meetings
 * @access  Private
 */
const getMyMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    
    let meetings;
    let total = 0;
    
    if (userRole === 'student') {
      meetings = await meetingRepo.getMeetingsByStudent(userId, status);
      total = meetings.length;
      // Simple pagination for student
      meetings = meetings.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    } else if (['professor', 'ta'].includes(userRole)) {
      meetings = await meetingRepo.getMeetingsByProfessor(userId, status);
      total = meetings.length;
      // Simple pagination for professor
      meetings = meetings.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    } else {
      return errorResponse(res, 403, 'Only students and professors can view meetings');
    }
    
    // Get upcoming meetings
    const upcomingMeetings = await meetingRepo.getUpcomingMeetings(userId, userRole, 5);
    
    // Get statistics for professors
    let stats = null;
    if (['professor', 'ta'].includes(userRole)) {
      stats = await meetingRepo.getProfessorMeetingStats(userId);
    }
    
    successResponse(res, 200, 'Meetings retrieved successfully', {
      meetings,
      upcomingMeetings,
      stats,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        total,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error getting my meetings:', error);
    errorResponse(res, 500, 'Server error while retrieving meetings');
  }
};

/**
 * @desc    Update meeting status (approve/reject)
 * @route   PUT /api/meetings/:meetingId/status
 * @access  Private (professor)
 */
const updateMeetingStatus = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const professorId = req.user.id;
    const { status, notes } = req.body;
    console.log('Update meeting status request:', { meetingId, professorId, status, notes });
    // Validate status
    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 400, 'Status must be either "approved" or "rejected"');
    }
    
    // Check if meeting exists and belongs to this professor
    const meeting = await meetingRepo.getMeetingById(meetingId);
    if (!meeting) {
      return errorResponse(res, 404, 'Meeting not found');
    }
    
    if (parseInt(meeting.professorId) !== parseInt(professorId)) {
      return errorResponse(res, 403, 'Not authorized to update this meeting');
    }
    
    // Check if meeting is already processed
    if (meeting.status !== 'pending') {
      return errorResponse(res, 400, `Meeting is already ${meeting.status}`);
    }
    
    // Update status
    const updatedMeeting = await meetingRepo.updateMeetingStatus(
      meetingId, 
      status, 
      notes, 
      'professor'
    );
    
    successResponse(res, 200, `Meeting ${status} successfully`, {
      meeting: updatedMeeting
    });
  } catch (error) {
    console.error('Error updating meeting status:', error);
    errorResponse(res, 500, 'Server error while updating meeting status');
  }
};

/**
 * @desc    Cancel a meeting
 * @route   PUT /api/meetings/:meetingId/cancel
 * @access  Private (student or professor)
 */
const cancelMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;
    const { notes } = req.body;
    
    // Cancel meeting
    const cancelledMeeting = await meetingRepo.cancelMeeting(meetingId, userId, notes);
    
    successResponse(res, 200, 'Meeting cancelled successfully', {
      meeting: cancelledMeeting
    });
  } catch (error) {
    console.error('Error cancelling meeting:', error);
    
    if (error.message === 'Meeting not found') {
      errorResponse(res, 404, error.message);
    } else if (error.message === 'Not authorized to cancel this meeting') {
      errorResponse(res, 403, error.message);
    } else {
      errorResponse(res, 500, 'Server error while cancelling meeting');
    }
  }
};

/**
 * @desc    Get meeting details
 * @route   GET /api/meetings/:meetingId
 * @access  Private
 */
const getMeetingDetails = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const meeting = await meetingRepo.getMeetingById(meetingId);
    if (!meeting) {
      return errorResponse(res, 404, 'Meeting not found');
    }
    
    // Check if user is authorized to view this meeting
    const isAuthorized = 
      parseInt(meeting.studentId) === parseInt(userId) || 
      parseInt(meeting.professorId) === parseInt(userId) ||
      userRole === 'admin';
    
    if (!isAuthorized) {
      return errorResponse(res, 403, 'Not authorized to view this meeting');
    }
    
    successResponse(res, 200, 'Meeting details retrieved successfully', {
      meeting
    });
  } catch (error) {
    console.error('Error getting meeting details:', error);
    errorResponse(res, 500, 'Server error while retrieving meeting details');
  }
};

/**
 * @desc    Get all professors for meeting requests
 * @route   GET /api/meetings/professors
 * @access  Private (student)
 */
const getAvailableProfessors = async (req, res) => {
  try {
    const { department } = req.query;
    
    const profiles = await teachingStaffProfileRepo.getAllTeachingStaffProfiles();
    
    // Filter active professors/TAs
    const availableProfessors = profiles
      .filter(profile => 
        profile.user.isActive && 
        ['professor', 'ta'].includes(profile.user.role) &&
        (!department || profile.user.department === department)
      )
      .map(profile => ({
        id: profile.userId,
        name: profile.user.fullName,
        role: profile.user.role,
        department: profile.user.department,
        email: profile.user.email,
        officeHours: profile.officeHours, // Display-only
        officeLocation: profile.officeLocation
      }));
    
    // Extract unique departments for filters
    const departments = [...new Set(
      availableProfessors
        .map(prof => prof.department)
        .filter(Boolean)
        .sort()
    )];
    
    successResponse(res, 200, 'Professors retrieved successfully', {
      professors: availableProfessors,
      filters: {
        departments
      },
      total: availableProfessors.length
    });
  } catch (error) {
    console.error('Error getting available professors:', error);
    errorResponse(res, 500, 'Server error while retrieving professors');
  }
};


module.exports = {
  requestMeeting,
  getMyMeetings,
  updateMeetingStatus,
  cancelMeeting,
  getMeetingDetails,
  getAvailableProfessors
};