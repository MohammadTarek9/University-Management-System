const userRepo = require('../repositories/userRepo');
const { body } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/responseHelpers');

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await userRepo.getUserById(req.user.id);
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    successResponse(res, 200, 'Profile retrieved successfully', {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId,
        department: user.department,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    errorResponse(res, 500, 'Server error while retrieving profile');
  }
};

// @desc    Update current user profile
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      department
    } = req.body;

    const user = await userRepo.getUserById(req.user.id);
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Prepare update data (only non-undefined fields)
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (department !== undefined) updateData.department = department;

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      await userRepo.updateUser(req.user.id, updateData);
    }

    // Fetch updated user
    const updatedUser = await userRepo.getUserById(req.user.id);

    successResponse(res, 200, 'Profile updated successfully', {
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        studentId: updatedUser.studentId,
        employeeId: updatedUser.employeeId,
        department: updatedUser.department,
        phoneNumber: updatedUser.phoneNumber,
        isActive: updatedUser.isActive,
        isEmailVerified: updatedUser.isEmailVerified,
        profilePicture: updatedUser.profilePicture,
        lastLogin: updatedUser.lastLogin,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    errorResponse(res, 500, 'Server error while updating profile');
  }
};

// Validation rules for profile update
exports.updateProfileValidation = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('phoneNumber')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters')
];