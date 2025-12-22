// controllers/staffDirectoryController.js
const { errorResponse, successResponse } = require('../utils/responseHelpers');
const userRepo = require('../repositories/userRepo');

/**
 * @desc    Get staff directory (professors and TAs)
 * @route   GET /api/staff/directory
 * @access  Private (staff, professor, admin, ta)
 */
const getStaffDirectory = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', role = '' } = req.query;
    
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // Get all users and filter for staff roles
    const { users, totalUsers } = await userRepo.getUsers({
      page: pageNum,
      limit: limitNum,
      search,
      role: role || '' // Only filter by role if provided
    });

    // Filter for staff roles only (professor, ta, staff, admin)
    const staffRoles = ['professor', 'ta'];
    let filteredStaff = users.filter(user => staffRoles.includes(user.role));

    // Apply additional department filter if provided
    if (department && department.trim() !== '') {
      filteredStaff = filteredStaff.filter(staff => 
        staff.department && staff.department.toLowerCase().includes(department.toLowerCase())
      );
    }

    // Apply search filter if provided (additional to the repo search)
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase().trim();
      filteredStaff = filteredStaff.filter(staff => 
        staff.firstName.toLowerCase().includes(searchLower) ||
        staff.lastName.toLowerCase().includes(searchLower) ||
        staff.email.toLowerCase().includes(searchLower) ||
        (staff.employeeId && staff.employeeId.toLowerCase().includes(searchLower))
      );
    }

    // Apply additional role filter if provided (more specific than repo filter)
    if (role && role.trim() !== '' && staffRoles.includes(role.toLowerCase())) {
      filteredStaff = filteredStaff.filter(staff => staff.role === role.toLowerCase());
    }

    // Format response data
    const formattedStaff = filteredStaff.map(staff => ({
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      fullName: staff.fullName,
      email: staff.email,
      role: staff.role,
      department: staff.department || 'N/A',
      phoneNumber: staff.phoneNumber || 'N/A',
      phoneExtension: staff.employeeDetails?.phoneExtension || 'N/A',
      position: staff.employeeDetails?.position || 
        (staff.role === 'professor' ? 'Professor' : 
         staff.role === 'admin' ? 'Administrator' : 
         staff.role === 'ta' ? 'Teaching Assistant' : 'Staff'),
      employeeId: staff.employeeId || 'N/A',
      officeLocation: staff.employeeDetails?.officeLocation || 'N/A',
      hireDate: staff.employeeDetails?.hireDate,
      isActive: staff.isActive,
      lastLogin: staff.lastLogin,
      createdAt: staff.createdAt,
      employeeDetails: staff.employeeDetails || {}
    }));

    // Extract unique departments and roles for filters
    const departments = [...new Set(
      filteredStaff
        .map(staff => staff.department)
        .filter(Boolean)
        .sort()
    )];

    const roles = [...new Set(
      filteredStaff
        .map(staff => staff.role)
        .filter(role => staffRoles.includes(role))
        .sort()
    )];

    const totalStaff = filteredStaff.length;
    const totalPages = Math.ceil(totalStaff / limitNum) || 1;

    successResponse(res, 200, 'Staff directory retrieved successfully', {
      staff: formattedStaff,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalEmployees: totalStaff,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      filters: {
        departments,
        roles
      }
    });
  } catch (error) {
    console.error('Error getting staff directory:', error);
    errorResponse(res, 500, 'Server error while retrieving staff directory');
  }
};

/**
 * @desc    Get staff member details
 * @route   GET /api/staff/directory/:id
 * @access  Private (staff, professor, admin, ta)
 */
const getStaffMember = async (req, res) => {
  try {
    const staffId = req.params.id;

    const user = await userRepo.getUserById(staffId);
    if (!user) {
      return errorResponse(res, 404, 'Staff member not found');
    }

    // Check if user is a staff member
    const staffRoles = ['professor', 'ta', 'staff', 'admin'];
    if (!staffRoles.includes(user.role)) {
      return errorResponse(res, 400, 'User is not a staff member');
    }

    // Get employee details if available
    let employeeDetails = {};
    if (['professor', 'ta', 'staff', 'admin'].includes(user.role)) {
      try {
        employeeDetails = await userRepo.getEmployeeDetails(staffId) || {};
      } catch (error) {
        console.error('Error getting employee details:', error);
        // Continue without employee details
      }
    }

    const staffMember = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber || 'N/A',
      isActive: user.isActive,
      profilePicture: user.profilePicture,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      employeeId: user.employeeId || 'N/A',
      department: user.department || 'N/A',
      employeeDetails: employeeDetails
    };

    successResponse(res, 200, 'Staff member retrieved successfully', {
      staffMember
    });
  } catch (error) {
    console.error('Error getting staff member:', error);
    errorResponse(res, 500, 'Server error while retrieving staff member');
  }
};

module.exports = {
  getStaffDirectory,
  getStaffMember
};