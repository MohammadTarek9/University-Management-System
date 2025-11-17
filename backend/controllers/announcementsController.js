const { body, validationResult } = require('express-validator');
const announcementsRepo = require('../repositories/announcementsRepo');
const { errorResponse, successResponse } = require('../utils/responseHelpers');

/**
 * Create new announcement (Admin/Staff only)
 */
const createAnnouncement = async (req, res) => {
  try {
    const authorId = req.user.id;
    const announcementData = req.body;

    const announcement = await announcementsRepo.createAnnouncement(authorId, announcementData);

    successResponse(res, 201, 'Announcement created successfully', {
      announcement
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while creating announcement');
  }
};

/**
 * Get announcement by ID
 */
const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await announcementsRepo.getAnnouncementById(id);

    if (!announcement) {
      return errorResponse(res, 404, 'Announcement not found');
    }

    successResponse(res, 200, 'Announcement retrieved successfully', {
      announcement
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving announcement');
  }
};

/**
 * Get announcements for users (filtered by role)
 */
const getAnnouncements = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category = '', 
      searchQuery = '' 
    } = req.query;

    const userRole = req.user?.role || 'all';
    
    // Map role to target audience
    const targetAudienceMap = {
      'student': 'student',
      'parent': 'parent',
      'professor': 'staff',
      'ta': 'staff',
      'admin': 'staff',
      'staff': 'staff'
    };

    const targetAudience = targetAudienceMap[userRole] || 'all';

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      category: category || '',
      targetAudience,
      searchQuery: searchQuery || '',
      activeOnly: true
    };

    const result = await announcementsRepo.getAnnouncements(filters);

    successResponse(res, 200, 'Announcements retrieved successfully', {
      announcements: result.announcements,
      pagination: {
        currentPage: result.page,
        totalPages: result.pages,
        totalItems: result.total,
        limit: result.limit
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving announcements');
  }
};

/**
 * Get all announcements (Admin only - includes inactive)
 */
const getAllAnnouncementsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, category = '', status = '' } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      category: category || '',
      status: status || ''
    };

    const result = await announcementsRepo.getAllAnnouncementsAdmin(filters);

    successResponse(res, 200, 'All announcements retrieved successfully', {
      announcements: result.announcements,
      pagination: {
        currentPage: result.page,
        totalPages: result.pages,
        totalItems: result.total,
        limit: result.limit
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving announcements');
  }
};

/**
 * Update announcement (Admin/Staff only)
 */
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcementData = req.body;

    const announcement = await announcementsRepo.updateAnnouncement(id, announcementData);

    successResponse(res, 200, 'Announcement updated successfully', {
      announcement
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while updating announcement');
  }
};

/**
 * Delete announcement (Admin/Staff only)
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get the announcement first to check ownership
    const announcement = await announcementsRepo.getAnnouncementById(id);

    if (!announcement) {
      return errorResponse(res, 404, 'Announcement not found');
    }

    // Check if user is owner or admin
    if (announcement.author_id !== userId && userRole !== 'admin') {
      return errorResponse(res, 403, 'You do not have permission to delete this announcement');
    }

    await announcementsRepo.deleteAnnouncement(id);

    successResponse(res, 200, 'Announcement deleted successfully', {
      deletedId: id
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while deleting announcement');
  }
};

/**
 * Toggle announcement active status
 */
const toggleAnnouncementStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await announcementsRepo.toggleAnnouncementStatus(id);

    successResponse(res, 200, 'Announcement status updated successfully', {
      announcement
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while toggling announcement status');
  }
};

// Validation rules
const createAnnouncementValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be between 5 and 255 characters'),

  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['general', 'academic', 'administrative', 'facilities', 'events', 'urgent'])
    .withMessage('Invalid category'),

  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high'])
    .withMessage('Invalid priority'),

  body('targetAudience')
    .notEmpty()
    .withMessage('Target audience is required')
    .isIn(['all', 'student', 'parent', 'staff'])
    .withMessage('Invalid target audience'),

  body('expiryDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
];

const updateAnnouncementValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be between 5 and 255 characters'),

  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['general', 'academic', 'administrative', 'facilities', 'events', 'urgent'])
    .withMessage('Invalid category'),

  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high'])
    .withMessage('Invalid priority'),

  body('targetAudience')
    .notEmpty()
    .withMessage('Target audience is required')
    .isIn(['all', 'student', 'parent', 'staff'])
    .withMessage('Invalid target audience'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('expiryDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
];

module.exports = {
  createAnnouncement,
  getAnnouncementById,
  getAnnouncements,
  getAllAnnouncementsAdmin,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
  createAnnouncementValidation,
  updateAnnouncementValidation
};