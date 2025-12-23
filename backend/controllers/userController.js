const { body } = require('express-validator');
const bcrypt = require('bcryptjs');

const { errorResponse, successResponse } = require('../utils/responseHelpers');
const userRepo = require('../repositories/userRepo');
const { generateSequentialId, generateUniversityEmail } = require('../utils/idGenerator');

// ===================================================================
// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
// ===================================================================
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const { users, totalUsers } = await userRepo.getUsers({
      page: pageNum,
      limit: limitNum,
      search,
      role
    });

    const totalPages = Math.ceil(totalUsers / limitNum) || 1;

    successResponse(res, 200, 'Users retrieved successfully', {
      users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving users');
  }
};

// ===================================================================
// @desc    Get single user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
// ===================================================================
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await userRepo.getUserById(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // We already never include password in mapUserRow
    successResponse(res, 200, 'User retrieved successfully', { user });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving user');
  }
};

// ===================================================================
// @desc    Create new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
// ===================================================================
const createUser = async (req, res) => {
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
      major,
      phoneNumber,
      firstLogin,
      mustChangePassword,
      securityQuestion,
      securityAnswer,
      student_id // For parent-child relationship
    } = req.body;

    // 1) Check if email exists
    const existingUser = await userRepo.getUserByEmail(email);
    if (existingUser) {
      return errorResponse(res, 400, 'User already exists with this email');
    }

    // 2) Check for duplicate studentId (if provided)
    if (studentId && studentId.trim() !== '') {
      const existingStudent = await userRepo.getUserByStudentId(studentId);
      if (existingStudent) {
        return errorResponse(res, 400, 'Student ID already exists');
      }
    }

    // 3) Check for duplicate employeeId (if provided)
    if (employeeId && employeeId.trim() !== '') {
      const existingEmployee = await userRepo.getUserByEmployeeId(employeeId);
      if (existingEmployee) {
        return errorResponse(res, 400, 'Employee ID already exists');
      }
    }

    // 4) Hash password (in Mongo this was done in pre-save)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5) Generate sequential IDs if not provided
    let finalStudentId = studentId && studentId.trim() !== '' ? studentId : null;
    let finalEmployeeId = employeeId && employeeId.trim() !== '' ? employeeId : null;
    let finalEmail = email;

    const userRole = role || 'student';
    
    // Auto-generate ID if not provided
    if (userRole === 'student' && !finalStudentId) {
      finalStudentId = await generateSequentialId('student');
      // If email not customized, generate university email
      if (!email || email.trim() === '') {
        finalEmail = generateUniversityEmail(finalStudentId);
      }
    } else if (['professor', 'admin', 'staff', 'ta'].includes(userRole) && !finalEmployeeId) {
      finalEmployeeId = await generateSequentialId(userRole);
      // If email not customized, generate university email
      if (!email || email.trim() === '') {
        finalEmail = generateUniversityEmail(finalEmployeeId);
      }
    }

    // 6) Create user in MySQL
    const user = await userRepo.createUser({
      firstName,
      lastName,
      email: finalEmail,
      password: hashedPassword,
      role: userRole,
      studentId: finalStudentId,
      employeeId: finalEmployeeId,
      department,
      major,
      phoneNumber,
      // Default to true if not explicitly provided (for manually created users)
      firstLogin: firstLogin !== undefined ? !!firstLogin : true,
      mustChangePassword: mustChangePassword !== undefined ? !!mustChangePassword : true,
      securityQuestion,
      securityAnswer
    });

    // 7) If creating a parent, create parent-student relationship
    if (userRole === 'parent' && student_id) {
      console.log('Creating parent-student relationship for parent role:', userRole);
      console.log('student_id provided:', student_id);
      console.log('New user id:', user.id);
      const pool = require('../db/mysql');
      console.log('Inserting into parent_student_relationships');
      await pool.query(
        `INSERT INTO parent_student_relationships (parent_id, student_id, relationship_type, is_primary, created_at, updated_at)
         VALUES (?, ?, 'guardian', TRUE, NOW(), NOW())`,
        [user.id, student_id]
      );
      console.log('Parent-student relationship created successfully');
    } else {
      console.log('Not creating parent-student relationship. Role:', userRole, 'student_id:', student_id);
    }

    successResponse(res, 201, 'User created successfully', {
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
        major: user.major,
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

// ===================================================================
// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
// ===================================================================
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const existingUser = await userRepo.getUserById(userId);
    if (!existingUser) {
      return errorResponse(res, 404, 'User not found');
    }

    const {
      firstName,
      lastName,
      email,
      role,
      studentId,
      employeeId,
      department,
      major,
      phoneNumber,
      isActive
    } = req.body;

    // If email changed, ensure unique
    if (email && email !== existingUser.email) {
      const userByEmail = await userRepo.getUserByEmail(email);
      if (userByEmail && userByEmail.id !== existingUser.id) {
        return errorResponse(res, 400, 'Email already exists');
      }
    }

    // If studentId changed (non-empty), ensure unique
    if (
      studentId &&
      studentId.trim() !== '' &&
      studentId !== existingUser.studentId
    ) {
      const userByStudent = await userRepo.getUserByStudentId(studentId);
      if (userByStudent && userByStudent.id !== existingUser.id) {
        return errorResponse(res, 400, 'Student ID already exists');
      }
    }

    // If employeeId changed (non-empty), ensure unique
    if (
      employeeId &&
      employeeId.trim() !== '' &&
      employeeId !== existingUser.employeeId
    ) {
      const userByEmployee = await userRepo.getUserByEmployeeId(employeeId);
      if (userByEmployee && userByEmployee.id !== existingUser.id) {
        return errorResponse(res, 400, 'Employee ID already exists');
      }
    }

    const updatedUser = await userRepo.updateUser(userId, {
      firstName,
      lastName,
      email,
      role,
      studentId,
      employeeId,
      department,
      major,
      phoneNumber,
      isActive
    });

    successResponse(res, 200, 'User updated successfully', {
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while updating user');
  }
};

// ===================================================================
// @desc    Promote user to admin (Admin only)
// @route   PUT /api/users/:id/promote-admin
// @access  Private/Admin
// ===================================================================
const promoteToAdmin = async (req, res) => {
  try {
    const userId = req.params.id;

    const existingUser = await userRepo.getUserById(userId);
    if (!existingUser) {
      return errorResponse(res, 404, 'User not found');
    }

    if (existingUser.role === 'admin') {
      return errorResponse(res, 400, 'User is already an administrator');
    }

    const user = await userRepo.promoteToAdmin(userId);

    successResponse(res, 200, 'User promoted to administrator successfully', {
      user: {
        id: user.id,
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
    errorResponse(res, 500, 'Server error while promoting user');
  }
};

// ===================================================================
// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
// ===================================================================
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const existingUser = await userRepo.getUserById(userId);
    if (!existingUser) {
      return errorResponse(res, 404, 'User not found');
    }

    // Prevent admin from deleting themselves
    if (String(existingUser.id) === String(req.user.id)) {
      return errorResponse(res, 400, 'You cannot delete your own account');
    }

    const deletedUser = await userRepo.deleteUser(userId);

    successResponse(res, 200, 'User deleted successfully', {
      deletedUser: {
        id: deletedUser.id,
        firstName: deletedUser.firstName,
        lastName: deletedUser.lastName,
        email: deletedUser.email,
        role: deletedUser.role
      }
    });
  } catch (error) {
    console.error(error);
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