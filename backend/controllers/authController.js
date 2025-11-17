const { body } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
  errorResponse,
  successResponse
} = require('../utils/responseHelpers');

const userRepo = require('../repositories/userRepo');

// Helper: generate JWT like user.getSignedJwtToken() used to
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

// ===================================================================
// REGISTER
// ===================================================================
const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      studentId,
      employeeId,
      department,
      phoneNumber,
      securityAnswer
    } = req.body;

    // Check email uniqueness
    const existingUser = await userRepo.getUserByEmail(email);
    if (existingUser) {
      return errorResponse(res, 400, 'User already exists with this email');
    }

    // Student ID uniqueness
    if (studentId) {
      const existingStudent = await userRepo.getUserByStudentId(studentId);
      if (existingStudent) {
        return errorResponse(res, 400, 'Student ID already exists');
      }
    }

    // Employee ID uniqueness
    if (employeeId) {
      const existingEmployee = await userRepo.getUserByEmployeeId(employeeId);
      if (existingEmployee) {
        return errorResponse(res, 400, 'Employee ID already exists');
      }
    }

    // Hash password (was done in Mongoose pre-save before)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in MySQL
    const user = await userRepo.createUser({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'student',
      studentId,
      employeeId,
      department,
      phoneNumber,
      securityQuestion: null,                      // set later in first login flow
      securityAnswer: securityAnswer || 'default',
      firstLogin: true,
      mustChangePassword: true
    });

    const token = generateToken(user);

    successResponse(res, 201, 'User registered successfully', {
      token,
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
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error during registration');
  }
};

// ===================================================================
// LOGIN
// ===================================================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide an email and password');
    }

    // Fetch user with password + flags from MySQL
    const userRow = await userRepo.getUserAuthByEmail(email);
    if (!userRow) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, userRow.password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    if (!userRow.is_active) {
      return errorResponse(
        res,
        401,
        'Account is deactivated. Please contact admin.'
      );
    }

    // Update last_login
    await userRepo.updateLastLogin(userRow.id);

    // Map to same public shape as other controllers
    const user = {
      id: userRow.id,
      firstName: userRow.first_name,
      lastName: userRow.last_name,
      email: userRow.email,
      role: userRow.role,
      studentId: userRow.student_id,
      employeeId: userRow.employee_id,
      department: userRow.department,
      phoneNumber: userRow.phone_number,
      lastLogin: userRow.last_login,
      firstLogin: !!userRow.first_login,
      mustChangePassword: !!userRow.must_change_password
    };

    const token = generateToken(user);

    successResponse(res, 200, 'Login successful', {
      token,
      requirePasswordChange:
        user.firstLogin && user.mustChangePassword,
      user
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error during login');
  }
};

// ===================================================================
// GET CURRENT USER PROFILE (getMe)
// ===================================================================
const getMe = async (req, res) => {
  try {
    // req.user.id is set by auth middleware (we'll refactor that next)
    const user = await userRepo.getUserById(req.user.id);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    successResponse(res, 200, 'User profile retrieved successfully', {
      user: {
        id: user.id,
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

// ===================================================================
// GET SECURITY QUESTION BY EMAIL
// ===================================================================
const getSecurityQuestion = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return errorResponse(res, 400, 'Please provide email address');
    }

    const userSec = await userRepo.getUserSecurityByEmail(email);
    if (!userSec) {
      return errorResponse(res, 404, 'No user found with this email address');
    }

    if (!userSec.security_question) {
      return errorResponse(
        res,
        400,
        'No security question set for this user'
      );
    }

    successResponse(res, 200, 'Security question retrieved', {
      securityQuestion: userSec.security_question
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error retrieving security question');
  }
};

// ===================================================================
// FORGOT PASSWORD (verify security answer, generate reset token)
// ===================================================================
const forgotPassword = async (req, res) => {
  try {
    const { email, securityAnswer } = req.body;

    if (!email || !securityAnswer) {
      return errorResponse(res, 400, 'Please provide email and security answer');
    }

    // Need securityAnswer from DB
    const userAuth = await userRepo.getUserAuthByEmail(email);
    if (!userAuth) {
      return errorResponse(res, 401, 'No user found with this email');
    }

    if (!userAuth.security_answer) {
      return errorResponse(
        res,
        400,
        'No security answer set for this user'
      );
    }

    // Case-insensitive comparison
    if (
      userAuth.security_answer.toLowerCase() !==
      securityAnswer.toLowerCase()
    ) {
      return errorResponse(res, 401, 'Incorrect security answer');
    }

    // Generate plain token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token for storing in DB
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expiry (e.g. 10 minutes)
    const expireAt = new Date(Date.now() + 10 * 60 * 1000);

    await userRepo.saveResetPasswordToken(userAuth.id, resetPasswordToken, expireAt);

    successResponse(res, 200, 'Security question verified', {
      resetToken,
      message: 'You can now reset your password'
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error during password reset');
  }
};

// ===================================================================
// RESET PASSWORD
// ===================================================================
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return errorResponse(res, 400, 'Please provide a new password');
    }

    // Hash provided token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await userRepo.findUserByValidResetToken(resetPasswordToken);
    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userRepo.updatePasswordAndClearReset(user.id, hashedPassword);

    successResponse(res, 200, 'Password reset successful');
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error during password reset');
  }
};

// @desc    First-time login password change with security question setup
// @route   POST /api/auth/first-login-change-password
// @access  Private (First-time login users only)
const firstLoginChangePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      securityQuestion,
      securityAnswer
    } = req.body;

    // Get user with password + securityAnswer from MySQL
    const userAuth = await userRepo.getUserAuthById(req.user.id);

    if (!userAuth) {
      return errorResponse(res, 404, 'User not found');
    }

    if (!userAuth.first_login || !userAuth.must_change_password) {
      return errorResponse(
        res,
        400,
        'This endpoint is only for first-time login users'
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      userAuth.password
    );
    if (!isValidPassword) {
      return errorResponse(res, 400, 'Current password is incorrect');
    }

    // Ensure new password is different
    const isSamePassword = await bcrypt.compare(
      newPassword,
      userAuth.password
    );
    if (isSamePassword) {
      return errorResponse(
        res,
        400,
        'New password must be different from current password'
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user fields in DB
    const updatedUser = await userRepo.firstLoginChangePasswordRepo(
      userAuth.id,
      hashedPassword,
      securityQuestion,
      securityAnswer
    );

    const token = generateToken(updatedUser);

    successResponse(
      res,
      200,
      'Password changed successfully. You can now access the system.',
      {
        token,
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          role: updatedUser.role,
          studentId: updatedUser.studentId,
          isEmailVerified: updatedUser.isEmailVerified,
          firstLogin: updatedUser.firstLogin
        }
      }
    );
  } catch (error) {
    console.error('First login password change error:', error);
    errorResponse(res, 500, 'Server error during password change');
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