// controllers/benefitsController.js
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const benefitsRepo = require('../repositories/benefitsRepo');

/**
 * Get benefits for current user
 * @route GET /api/staff/benefits
 * @access Private (staff, professor, ta, admin)
 */
const getMyBenefits = async (req, res) => {
  try {
    const userId = req.user.id;
    const benefits = await benefitsRepo.getBenefitsByUserId(userId);
    
    if (!benefits) {
      return errorResponse(res, 404, 'No benefits information found. Please contact HR.');
    }
    
    return successResponse(res, 200, 'Benefits retrieved successfully', { benefits });
  } catch (error) {
    console.error('Error fetching benefits:', error);
    return errorResponse(res, 500, 'Server error while retrieving benefits');
  }
};

/**
 * Get benefits for a specific user (Admin only)
 * @route GET /api/staff/benefits/:userId
 * @access Private (admin only)
 */
const getUserBenefits = async (req, res) => {
  try {
    const { userId } = req.params;
    const benefits = await benefitsRepo.getBenefitsByUserId(userId);
    
    if (!benefits) {
      return errorResponse(res, 404, 'No benefits information found for this user');
    }
    
    return successResponse(res, 200, 'Benefits retrieved successfully', { benefits });
  } catch (error) {
    console.error('Error fetching user benefits:', error);
    return errorResponse(res, 500, 'Server error while retrieving benefits');
  }
};

/**
 * Create benefits for a user (Admin only)
 * @route POST /api/staff/benefits
 * @access Private (admin only)
 */
const createBenefits = async (req, res) => {
  try {
    const benefitsData = req.body;
    
    // Check if benefits already exist for this user
    const existing = await benefitsRepo.benefitsExist(benefitsData.user_id);
    if (existing) {
      return errorResponse(res, 400, 'Benefits already exist for this user. Use update instead.');
    }
    
    const benefits = await benefitsRepo.createBenefits(benefitsData);
    return successResponse(res, 201, 'Benefits created successfully', { benefits });
  } catch (error) {
    console.error('Error creating benefits:', error);
    return errorResponse(res, 500, error.message || 'Server error while creating benefits');
  }
};

/**
 * Update benefits for a user (Admin only)
 * @route PUT /api/staff/benefits/:userId
 * @access Private (admin only)
 */
const updateBenefits = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Check if benefits exist
    const existing = await benefitsRepo.benefitsExist(userId);
    if (!existing) {
      return errorResponse(res, 404, 'Benefits not found for this user');
    }
    
    const benefits = await benefitsRepo.updateBenefits(userId, updates);
    return successResponse(res, 200, 'Benefits updated successfully', { benefits });
  } catch (error) {
    console.error('Error updating benefits:', error);
    return errorResponse(res, 500, 'Server error while updating benefits');
  }
};

module.exports = {
  getMyBenefits,
  getUserBenefits,
  createBenefits,
  updateBenefits
};
