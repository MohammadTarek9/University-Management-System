const User = require('../models/User');
const { body } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/responseHelpers');

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    successResponse(res, 200, 'Profile retrieved successfully', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
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

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Update allowed fields (users can only update specific fields)
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (department !== undefined) user.department = department;

    await user.save();

    successResponse(res, 200, 'Profile updated successfully', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
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
        updatedAt: user.updatedAt
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