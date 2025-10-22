const User = require('../models/User');
const { body } = require('express-validator');
const { errorResponse, successResponse } = require('../utils/responseHelpers');


const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, studentId, employeeId, department, phoneNumber } = req.body;

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
      phoneNumber
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
        lastLogin: user.lastLogin
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
    .isIn(['student', 'professor', 'admin', 'staff', 'parent', 'ta'])
    .withMessage('Role must be one of: student, professor, admin, staff, parent, ta'),
  
  body('phoneNumber')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number')
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

module.exports = {
  register,
  login,
  getMe,
  logout,
  registerValidation,
  loginValidation
};