const { body, validationResult } = require('express-validator');
const researchRepo = require('../repositories/researchRepo');
const { errorResponse, successResponse } = require('../utils/responseHelpers');

/**
 * Create new research
 */
const createResearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const researchData = req.body;

    const research = await researchRepo.createResearch(userId, researchData);

    successResponse(res, 201, 'Research published successfully', {
      research
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while publishing research');
  }
};

/**
 * Get research by ID
 */
const getResearchById = async (req, res) => {
  try {
    const { id } = req.params;

    const research = await researchRepo.getResearchById(id);

    if (!research) {
      return errorResponse(res, 404, 'Research not found');
    }

    // Check if draft - only owner can view
    if (research.status === 'draft' && research.user_id !== req.user?.id) {
      return errorResponse(res, 403, 'Cannot view draft research');
    }

    successResponse(res, 200, 'Research retrieved successfully', {
      research
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving research');
  }
};

/**
 * Get current user's research
 */
const getUserResearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = '', page = 1, limit = 10 } = req.query;

    const filters = {
      status: status || undefined,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await researchRepo.getUserResearch(userId, filters);

    successResponse(res, 200, 'User research retrieved successfully', {
      research: result.research,
      pagination: {
        currentPage: result.page,
        totalPages: result.pages,
        totalRequests: result.total,
        limit: result.limit
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving research');
  }
};

/**
 * Get published research by user (public endpoint)
 */
const getPublishedResearchByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await researchRepo.getPublishedResearchByUser(userId, filters);

    successResponse(res, 200, 'Published research retrieved successfully', {
      research: result.research,
      pagination: {
        currentPage: result.page,
        totalPages: result.pages,
        totalRequests: result.total,
        limit: result.limit
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving published research');
  }
};

/**
 * Get all published research (public endpoint)
 * NEW FUNCTION
 */
const getAllPublishedResearch = async (req, res) => {
  try {
    const { page = 1, limit = 10, researchType = '', keyword = '' } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      researchType: researchType || '',
      keyword: keyword || ''
    };

    const result = await researchRepo.getAllPublishedResearch(filters);

    successResponse(res, 200, 'Published research retrieved successfully', {
      research: result.research,
      pagination: {
        currentPage: result.page,
        totalPages: result.pages,
        totalRequests: result.total,
        limit: result.limit
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving published research');
  }
};

/**
 * Update research
 */
const updateResearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const researchData = req.body;

    const research = await researchRepo.updateResearch(id, userId, researchData);

    successResponse(res, 200, 'Research updated successfully', {
      research
    });
  } catch (error) {
    console.error(error);
    if (error.message === 'Unauthorized to update this research') {
      return errorResponse(res, 403, error.message);
    }
    errorResponse(res, 500, 'Server error while updating research');
  }
};

/**
 * Delete research (soft delete)
 */
const deleteResearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const research = await researchRepo.deleteResearch(id, userId);

    successResponse(res, 200, 'Research archived successfully', {
      research
    });
  } catch (error) {
    console.error(error);
    if (error.message === 'Unauthorized to delete this research') {
      return errorResponse(res, 403, error.message);
    }
    errorResponse(res, 500, 'Server error while deleting research');
  }
};

/**
 * Get all research (admin only)
 */
const getAllResearch = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', userId = '' } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      status: status || '',
      userId: userId || ''
    };

    const result = await researchRepo.getAllResearch(filters);

    successResponse(res, 200, 'All research retrieved successfully', {
      research: result.research,
      pagination: {
        currentPage: result.page,
        totalPages: result.pages,
        totalRequests: result.total,
        limit: result.limit
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving research');
  }
};

// Validation rules
const createResearchValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be between 5 and 255 characters'),

  body('researchType')
    .notEmpty()
    .withMessage('Research type is required')
    .isIn(['Paper', 'Article', 'Book', 'Conference', 'Project', 'Other'])
    .withMessage('Invalid research type'),

  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),

  body('publicationDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Publication date must be in YYYY-MM-DD format'),

  body('doi')
    .optional({ checkFalsy: true })
    .matches(/^10\.\d+\/[^\s]+$/)
    .withMessage('Invalid DOI format'),

  body('abstract')
    .optional({ checkFalsy: true })
    .isLength({ max: 2000 })
    .withMessage('Abstract must not exceed 2000 characters'),

  body('url')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Invalid URL format')
];

const updateResearchValidation = createResearchValidation;

module.exports = {
  createResearch,
  getResearchById,
  getUserResearch,
  getPublishedResearchByUser,
  getAllPublishedResearch,
  updateResearch,
  deleteResearch,
  getAllResearch,
  createResearchValidation,
  updateResearchValidation
};