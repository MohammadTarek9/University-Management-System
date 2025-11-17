const { errorResponse, successResponse } = require('../utils/responseHelpers');
const departmentRepo = require('../repositories/departmentRepo');

// ===================================================================
// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
// ===================================================================
const getAllDepartments = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', isActive = '' } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    
    // Convert isActive to boolean or null
    let isActiveFilter = null;
    if (isActive === 'true') isActiveFilter = true;
    if (isActive === 'false') isActiveFilter = false;

    const { departments, totalDepartments } = await departmentRepo.getAllDepartments({
      page: pageNum,
      limit: limitNum,
      search,
      isActive: isActiveFilter
    });

    const totalPages = Math.ceil(totalDepartments / limitNum) || 1;

    successResponse(res, 200, 'Departments retrieved successfully', {
      departments,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalDepartments,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving departments');
  }
};

// ===================================================================
// @desc    Get single department by ID
// @route   GET /api/departments/:id
// @access  Private
// ===================================================================
const getDepartmentById = async (req, res) => {
  try {
    const departmentId = req.params.id;

    const department = await departmentRepo.getDepartmentById(departmentId);
    if (!department) {
      return errorResponse(res, 404, 'Department not found');
    }

    successResponse(res, 200, 'Department retrieved successfully', { department });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving department');
  }
};

// ===================================================================
// @desc    Create new department (Admin/Staff only)
// @route   POST /api/departments
// @access  Private/Admin/Staff
// ===================================================================
const createDepartment = async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return errorResponse(res, 400, 'Department name is required');
    }
    if (!code || !code.trim()) {
      return errorResponse(res, 400, 'Department code is required');
    }

    // Check if code already exists
    const existingDept = await departmentRepo.getDepartmentByCode(code.trim().toUpperCase());
    if (existingDept) {
      return errorResponse(res, 400, 'Department code already exists');
    }

    // Create department
    const department = await departmentRepo.createDepartment({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || null,
      isActive: isActive !== undefined ? !!isActive : true
    });

    successResponse(res, 201, 'Department created successfully', { department });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error during department creation');
  }
};

// ===================================================================
// @desc    Update department (Admin/Staff only)
// @route   PUT /api/departments/:id
// @access  Private/Admin/Staff
// ===================================================================
const updateDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;
    const { name, code, description, isActive } = req.body;

    // Check if department exists
    const existingDept = await departmentRepo.getDepartmentById(departmentId);
    if (!existingDept) {
      return errorResponse(res, 404, 'Department not found');
    }

    // If code is being updated, check for duplicates (excluding current department)
    if (code && code.trim() !== '') {
      const codeUpper = code.trim().toUpperCase();
      if (codeUpper !== existingDept.code) {
        const duplicateCode = await departmentRepo.getDepartmentByCode(codeUpper);
        if (duplicateCode) {
          return errorResponse(res, 400, 'Department code already exists');
        }
      }
    }

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (code !== undefined) updateData.code = code.trim().toUpperCase();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isActive !== undefined) updateData.isActive = !!isActive;

    // Update department
    const department = await departmentRepo.updateDepartment(departmentId, updateData);

    successResponse(res, 200, 'Department updated successfully', { department });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error during department update');
  }
};

// ===================================================================
// @desc    Delete department (Admin only)
// @route   DELETE /api/departments/:id
// @access  Private/Admin
// ===================================================================
const deleteDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;

    // Check if department exists
    const existingDept = await departmentRepo.getDepartmentById(departmentId);
    if (!existingDept) {
      return errorResponse(res, 404, 'Department not found');
    }

    // Check if department has subjects assigned
    const hasSubjects = await departmentRepo.departmentHasSubjects(departmentId);
    if (hasSubjects) {
      return errorResponse(
        res,
        400,
        'Cannot delete department with assigned subjects. Please reassign or delete subjects first.'
      );
    }

    // Delete department
    const deleted = await departmentRepo.deleteDepartment(departmentId);
    if (!deleted) {
      return errorResponse(res, 500, 'Failed to delete department');
    }

    successResponse(res, 200, 'Department deleted successfully');
  } catch (error) {
    console.error(error);
    // Check if it's a foreign key constraint error
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return errorResponse(
        res,
        400,
        'Cannot delete department because it has associated records'
      );
    }
    errorResponse(res, 500, 'Server error during department deletion');
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};