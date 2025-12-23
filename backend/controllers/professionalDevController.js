const professionalDevRepo = require('../repositories/professionalDevRepo');

// Helper functions for responses
const successResponse = (res, statusCode, message, data = {}) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message
  });
};

// ===================================================================
// @desc    Get all professional development activities for current user
// @route   GET /api/staff/professional-development
// @access  Private (Staff, Professor, TA, Admin)
// ===================================================================
const getMyActivities = async (req, res) => {
  try {
    const userId = req.user.id;

    const activities = await professionalDevRepo.getActivitiesByUserId(userId);
    const statistics = await professionalDevRepo.getActivityStatistics(userId);

    successResponse(res, 200, 'Professional development activities retrieved successfully', {
      activities,
      statistics
    });
  } catch (error) {
    console.error('Error fetching professional development activities:', error);
    errorResponse(res, 500, 'Server error while retrieving activities');
  }
};

// ===================================================================
// @desc    Get activities by status for current user
// @route   GET /api/staff/professional-development/status/:status
// @access  Private (Staff, Professor, TA, Admin)
// ===================================================================
const getActivitiesByStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.params;

    // Validate status
    const validStatuses = ['planned', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 400, 'Invalid status. Must be one of: planned, ongoing, completed, cancelled');
    }

    const activities = await professionalDevRepo.getActivitiesByStatus(userId, status);

    successResponse(res, 200, `${status.charAt(0).toUpperCase() + status.slice(1)} activities retrieved successfully`, {
      activities,
      status
    });
  } catch (error) {
    console.error('Error fetching activities by status:', error);
    errorResponse(res, 500, 'Server error while retrieving activities');
  }
};

// ===================================================================
// @desc    Get a single activity by ID
// @route   GET /api/staff/professional-development/:id
// @access  Private (Staff, Professor, TA, Admin)
// ===================================================================
const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const activity = await professionalDevRepo.getActivityById(id);

    if (!activity) {
      return errorResponse(res, 404, 'Activity not found');
    }

    // Verify ownership (unless admin)
    if (activity.user_id !== userId && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'You are not authorized to view this activity');
    }

    successResponse(res, 200, 'Activity retrieved successfully', { activity });
  } catch (error) {
    console.error('Error fetching activity:', error);
    errorResponse(res, 500, 'Server error while retrieving activity');
  }
};

// ===================================================================
// @desc    Create a new professional development activity
// @route   POST /api/staff/professional-development
// @access  Private (Staff, Professor, TA, Admin)
// ===================================================================
const createActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const activityData = {
      userId,
      ...req.body
    };

    // Validate required fields
    if (!activityData.activityType) {
      return errorResponse(res, 400, 'Activity type is required');
    }
    if (!activityData.title) {
      return errorResponse(res, 400, 'Title is required');
    }
    if (!activityData.startDate) {
      return errorResponse(res, 400, 'Start date is required');
    }

    const activity = await professionalDevRepo.createActivity(activityData);

    successResponse(res, 201, 'Professional development activity created successfully', { activity });
  } catch (error) {
    console.error('Error creating activity:', error);
    errorResponse(res, 500, 'Server error while creating activity');
  }
};

// ===================================================================
// @desc    Update a professional development activity
// @route   PUT /api/staff/professional-development/:id
// @access  Private (Staff, Professor, TA, Admin)
// ===================================================================
const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if activity exists
    const existingActivity = await professionalDevRepo.getActivityById(id);
    if (!existingActivity) {
      return errorResponse(res, 404, 'Activity not found');
    }

    // Verify ownership (unless admin)
    if (existingActivity.user_id !== userId && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'You are not authorized to update this activity');
    }

    const updatedActivity = await professionalDevRepo.updateActivity(id, req.body);

    successResponse(res, 200, 'Activity updated successfully', { activity: updatedActivity });
  } catch (error) {
    console.error('Error updating activity:', error);
    errorResponse(res, 500, 'Server error while updating activity');
  }
};

// ===================================================================
// @desc    Delete a professional development activity
// @route   DELETE /api/staff/professional-development/:id
// @access  Private (Staff, Professor, TA, Admin)
// ===================================================================
const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if activity exists
    const existingActivity = await professionalDevRepo.getActivityById(id);
    if (!existingActivity) {
      return errorResponse(res, 404, 'Activity not found');
    }

    // Verify ownership (unless admin)
    if (existingActivity.user_id !== userId && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'You are not authorized to delete this activity');
    }

    await professionalDevRepo.deleteActivity(id);

    successResponse(res, 200, 'Activity deleted successfully');
  } catch (error) {
    console.error('Error deleting activity:', error);
    errorResponse(res, 500, 'Server error while deleting activity');
  }
};

// ===================================================================
// @desc    Get activity statistics for current user
// @route   GET /api/staff/professional-development/statistics
// @access  Private (Staff, Professor, TA, Admin)
// ===================================================================
const getStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    const statistics = await professionalDevRepo.getActivityStatistics(userId);

    successResponse(res, 200, 'Statistics retrieved successfully', { statistics });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    errorResponse(res, 500, 'Server error while retrieving statistics');
  }
};

module.exports = {
  getMyActivities,
  getActivitiesByStatus,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getStatistics
};
