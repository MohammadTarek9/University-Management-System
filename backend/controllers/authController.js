const User = require('../models/User');
const { body } = require('express-validator');
const { errorResponse, successResponse } = require('../utils/responseHelpers');
const crypto = require('crypto');


const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, studentId, employeeId, department, phoneNumber, securityAnswer } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, 'User already exists with this email');
    }

    if (studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return errorResponse(res, 400, 'Student ID already exists');
      }
    }

    if (employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        return errorResponse(res, 400, 'Employee ID already exists');
      }
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'student',
      studentId,
      employeeId,
      department,
      phoneNumber,
      securityAnswer: securityAnswer || "default"
    });

    const token = user.getSignedJwtToken();

    user.password = undefined;

    successResponse(res, 201, 'User registered successfully', {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId,
        department: user.department,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error during registration');
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide an email and password');
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    if (!user.isActive) {
      return errorResponse(res, 401, 'Account is deactivated. Please contact admin.');
    }

    user.lastLogin = new Date();
    await user.save();

    const token = user.getSignedJwtToken();

    user.password = undefined;

    successResponse(res, 200, 'Login successful', {
      token,
      requirePasswordChange: user.firstLogin && user.mustChangePassword,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId,
        department: user.department,
        phoneNumber: user.phoneNumber,
        lastLogin: user.lastLogin,
        firstLogin: user.firstLogin,
        mustChangePassword: user.mustChangePassword
      }
    });

  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error during login');
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    successResponse(res, 200, 'User profile retrieved successfully', {
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
    console.error(error);
    errorResponse(res, 500, 'Server error');
  }
};

const logout = async (req, res) => {
  successResponse(res, 200, 'Logout successful');
};

// Get Security Question by Email
const getSecurityQuestion = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return errorResponse(res, 400, 'Please provide email address');
    }

    const user = await User.findOne({ email }).select('securityQuestion');
    
    if (!user) {
      return errorResponse(res, 404, 'No user found with this email address');
    }

    if (!user.securityQuestion) {
      return errorResponse(res, 400, 'No security question set for this user');
    }

    successResponse(res, 200, 'Security question retrieved', {
      securityQuestion: user.securityQuestion
    });

  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error retrieving security question');
  }
};

// Password Reset Functions
const forgotPassword = async (req, res) => {
  try {
    const { email, securityAnswer } = req.body;

    if (!email || !securityAnswer) {
      return errorResponse(res, 400, 'Please provide email and security answer');
    }

    const user = await User.findOne({ email }).select('+securityAnswer');
    
    if (!user) {
      return errorResponse(res, 401, 'No user found with this email');
    }

    // Check security answer (case insensitive)
    if (user.securityAnswer.toLowerCase() !== securityAnswer.toLowerCase()) {
      return errorResponse(res, 401, 'Incorrect security answer');
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    console.log('Generated reset token:', resetToken); // Debug log

    successResponse(res, 200, 'Security question verified', {
      resetToken, // Make sure this is included
      message: 'You can now reset your password'
    });

  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error during password reset');
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log('Reset password request - Token:', token); // Debug log

    if (!password) {
      return errorResponse(res, 400, 'Please provide a new password');
    }

    // Hash token to compare with stored hash
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    console.log('Hashed token:', resetPasswordToken); // Debug log

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    console.log('Found user:', user ? user.email : 'No user found'); // Debug log

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    successResponse(res, 200, 'Password reset successful');

  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error during password reset');
  }
};

// Validation Arrays
const registerValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['student', 'professor', 'staff', 'parent', 'ta'])
    .withMessage('Role must be one of: student, professor, staff, parent, ta'),
  
  body('role')
    .custom((value) => {
      if (value === 'admin') {
        throw new Error('Admin accounts cannot be created through public registration');
      }
      return true;
    }),
  
  body('phoneNumber')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('securityAnswer')
    .notEmpty()
    .withMessage('Security answer is required')
    .isLength({ min: 2 })
    .withMessage('Security answer must be at least 2 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('securityAnswer')
    .notEmpty()
    .withMessage('Security answer is required')
    .isLength({ min: 2 })
    .withMessage('Security answer must be at least 2 characters')
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// @desc    First-time login password change with security question setup
// @route   POST /api/auth/first-login-change-password
// @access  Private (First-time login users only)
const firstLoginChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, securityQuestion, securityAnswer } = req.body;

    // Get user with password and security fields
    const user = await User.findById(req.user.id).select('+password +securityAnswer');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Check if this is indeed a first-time login user
    if (!user.firstLogin || !user.mustChangePassword) {
      return errorResponse(res, 400, 'This endpoint is only for first-time login users');
    }

    // Verify current password
    const isValidPassword = await user.matchPassword(currentPassword);
    if (!isValidPassword) {
      return errorResponse(res, 400, 'Current password is incorrect');
    }

    // Validate new password is different from current
    const isSamePassword = await user.matchPassword(newPassword);
    if (isSamePassword) {
      return errorResponse(res, 400, 'New password must be different from current password');
    }

    // Update user with new password and security question
    user.password = newPassword;
    user.securityQuestion = securityQuestion;
    user.securityAnswer = securityAnswer;
    user.firstLogin = false;
    user.mustChangePassword = false;
    user.isEmailVerified = true; // Mark as verified since they completed first login
    user.lastLogin = new Date();

    await user.save();

    // Generate new token
    const token = user.getSignedJwtToken();

    // Remove sensitive fields from response
    user.password = undefined;
    user.securityAnswer = undefined;

    successResponse(res, 200, 'Password changed successfully. You can now access the system.', {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        isEmailVerified: user.isEmailVerified,
        firstLogin: user.firstLogin
      }
    });

  } catch (error) {
    console.error('First login password change error:', error);
    errorResponse(res, 500, 'Server error during password change');
  }
};

const firstLoginChangePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('securityQuestion')
    .notEmpty()
    .withMessage('Security question is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Security question must be between 5 and 200 characters'),
  
  body('securityAnswer')
    .notEmpty()
    .withMessage('Security answer is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Security answer must be between 2 and 100 characters')
];

module.exports = {
  register,
  login,
  getMe,
  logout,
  getSecurityQuestion,
  forgotPassword,
  resetPassword,
  firstLoginChangePassword,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  firstLoginChangePasswordValidation
};