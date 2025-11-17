const User = require('../models/User');
const { body } = require('express-validator');
const { errorResponse, successResponse } = require('../utils/responseHelpers');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== '') {
      filter.role = role;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    successResponse(res, 200, 'Users retrieved successfully', {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving users');
  }
};

// @desc    Get single user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    successResponse(res, 200, 'User retrieved successfully', { user });

  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return errorResponse(res, 404, 'User not found');
    }
    errorResponse(res, 500, 'Server error while retrieving user');
  }
};

// @desc    Create new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, studentId, employeeId, department, phoneNumber } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, 'User already exists with this email');
    }

    // Check for duplicate studentId or employeeId
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

    // Create user
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

    // Remove password from output
    user.password = undefined;

    successResponse(res, 201, 'User created successfully', {
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
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error during user creation');
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role, studentId, employeeId, department, phoneNumber, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return errorResponse(res, 400, 'Email already exists');
      }
    }

    // Check for duplicate studentId
    if (studentId && studentId !== user.studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return errorResponse(res, 400, 'Student ID already exists');
      }
    }

    // Check for duplicate employeeId
    if (employeeId && employeeId !== user.employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        return errorResponse(res, 400, 'Employee ID already exists');
      }
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (studentId !== undefined) user.studentId = studentId;
    if (employeeId !== undefined) user.employeeId = employeeId;
    if (department !== undefined) user.department = department;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    successResponse(res, 200, 'User updated successfully', {
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
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return errorResponse(res, 404, 'User not found');
    }
    errorResponse(res, 500, 'Server error while updating user');
  }
};

// @desc    Promote user to admin (Admin only)
// @route   PUT /api/users/:id/promote-admin
// @access  Private/Admin
const promoteToAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    if (user.role === 'admin') {
      return errorResponse(res, 400, 'User is already an administrator');
    }

    // Promote to admin
    user.role = 'admin';
    await user.save();

    successResponse(res, 200, 'User promoted to administrator successfully', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return errorResponse(res, 404, 'User not found');
    }
    errorResponse(res, 500, 'Server error while promoting user');
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id.toString()) {
      return errorResponse(res, 400, 'You cannot delete your own account');
    }

    await User.findByIdAndDelete(req.params.id);

    successResponse(res, 200, 'User deleted successfully', {
      deletedUser: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return errorResponse(res, 404, 'User not found');
    }
    errorResponse(res, 500, 'Server error while deleting user');
  }
};

// Validation rules for creating users
const createUserValidation = [
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
    .isIn(['student', 'professor', 'admin', 'staff', 'parent', 'ta'])
    .withMessage('Role must be one of: student, professor, admin, staff, parent, ta'),
  
  body('phoneNumber')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number')
];

// Validation rules for updating users
const updateUserValidation = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('role')
    .optional()
    .isIn(['student', 'professor', 'admin', 'staff', 'parent', 'ta'])
    .withMessage('Role must be one of: student, professor, admin, staff, parent, ta'),
  
  body('phoneNumber')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  promoteToAdmin,
  createUserValidation,
  updateUserValidation
};