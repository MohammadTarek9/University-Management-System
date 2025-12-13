const { errorResponse, successResponse } = require('../utils/responseHelpers');
const subjectRepo = require('../repositories/subjectRepo');
const departmentRepo = require('../repositories/departmentRepo');

// ===================================================================
// @desc    Get all subjects with filters
// @route   GET /api/subjects
// @access  Private
// ===================================================================
const getAllSubjects = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      departmentId = '',
      classification = '',
      isActive = '' 
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    
    // Convert isActive to boolean or null
    let isActiveFilter = null;
    if (isActive === 'true') isActiveFilter = true;
    if (isActive === 'false') isActiveFilter = false;

    // Convert departmentId to number or null
    const deptId = departmentId ? parseInt(departmentId, 10) : null;

    const { subjects, totalSubjects } = await subjectRepo.getAllSubjects({
      page: pageNum,
      limit: limitNum,
      search,
      departmentId: deptId,
      classification: classification || null,
      isActive: isActiveFilter
    });

    const totalPages = Math.ceil(totalSubjects / limitNum) || 1;

    successResponse(res, 200, 'Subjects retrieved successfully', {
      subjects,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalSubjects,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving subjects');
  }
};

// ===================================================================
// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
// @access  Private
// ===================================================================
const getSubjectById = async (req, res) => {
  try {
    const subjectId = req.params.id;

    const subject = await subjectRepo.getSubjectById(subjectId);
    if (!subject) {
      return errorResponse(res, 404, 'Subject not found');
    }

    successResponse(res, 200, 'Subject retrieved successfully', { subject });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving subject');
  }
};

// ===================================================================
// @desc    Get subjects by department
// @route   GET /api/subjects/department/:departmentId
// @access  Private
// ===================================================================
const getSubjectsByDepartment = async (req, res) => {
  try {
    const departmentId = req.params.departmentId;

    // Check if department exists
    const department = await departmentRepo.getDepartmentById(departmentId);
    if (!department) {
      return errorResponse(res, 404, 'Department not found');
    }

    const subjects = await subjectRepo.getSubjectsByDepartment(departmentId);

    successResponse(res, 200, 'Subjects retrieved successfully', { 
      subjects,
      department: {
        id: department.id,
        name: department.name,
        code: department.code
      }
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving subjects');
  }
};

// ===================================================================
// @desc    Create new subject (Admin/Staff only)
// @route   POST /api/subjects
// @access  Private/Admin/Staff
// ===================================================================
const createSubject = async (req, res) => {
  try {
    const { name, code, description, credits, classification, departmentId, isActive } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return errorResponse(res, 400, 'Subject name is required');
    }
    if (!code || !code.trim()) {
      return errorResponse(res, 400, 'Subject code is required');
    }
    if (!credits || isNaN(credits) || parseFloat(credits) <= 0) {
      return errorResponse(res, 400, 'Valid credits value is required');
    }
    if (!classification || !['core', 'elective'].includes(classification)) {
      return errorResponse(res, 400, 'Classification must be either "core" or "elective"');
    }
    if (!departmentId || isNaN(departmentId)) {
      return errorResponse(res, 400, 'Valid department is required');
    }

    // Check if code already exists
    const existingSubject = await subjectRepo.getSubjectByCode(code.trim().toUpperCase());
    if (existingSubject) {
      return errorResponse(res, 400, 'Subject code already exists');
    }

    // Check if department exists
    const department = await departmentRepo.getDepartmentById(departmentId);
    if (!department) {
      return errorResponse(res, 404, 'Department not found');
    }
    if (!department.isActive) {
      return errorResponse(res, 400, 'Cannot assign subject to inactive department');
    }

    // Create subject (created_by is the authenticated user)
    const subject = await subjectRepo.createSubject(
      {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        credits: parseFloat(credits),
        classification,
        departmentId: parseInt(departmentId, 10),
        isActive: isActive !== undefined ? !!isActive : true
      },
      req.user.id  // createdBy user ID from auth middleware
    );

    successResponse(res, 201, 'Subject created successfully', { subject });
  } catch (error) {
    console.error(error);
    // Check for foreign key constraint errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return errorResponse(res, 400, 'Invalid department or user reference');
    }
    errorResponse(res, 500, 'Server error during subject creation');
  }
};

// ===================================================================
// @desc    Update subject (Admin/Staff only)
// @route   PUT /api/subjects/:id
// @access  Private/Admin/Staff
// ===================================================================
const updateSubject = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const { name, code, description, credits, classification, departmentId, isActive } = req.body;

    // Check if subject exists
    const existingSubject = await subjectRepo.getSubjectById(subjectId);
    if (!existingSubject) {
      return errorResponse(res, 404, 'Subject not found');
    }

    // Validate classification if provided
    if (classification && !['core', 'elective'].includes(classification)) {
      return errorResponse(res, 400, 'Classification must be either "core" or "elective"');
    }

    // Validate credits if provided
    if (credits !== undefined && (isNaN(credits) || parseFloat(credits) <= 0)) {
      return errorResponse(res, 400, 'Valid credits value is required');
    }

    // If code is being updated, check for duplicates (excluding current subject)
    if (code && code.trim() !== '') {
      const codeUpper = code.trim().toUpperCase();
      if (codeUpper !== existingSubject.code) {
        const duplicateCode = await subjectRepo.getSubjectByCode(codeUpper);
        if (duplicateCode) {
          return errorResponse(res, 400, 'Subject code already exists');
        }
      }
    }

    // If department is being updated, validate it
    if (departmentId) {
      const deptId = parseInt(departmentId, 10);
      if (isNaN(deptId)) {
        return errorResponse(res, 400, 'Invalid department ID');
      }
      
      const department = await departmentRepo.getDepartmentById(deptId);
      if (!department) {
        return errorResponse(res, 404, 'Department not found');
      }
      if (!department.isActive) {
        return errorResponse(res, 400, 'Cannot assign subject to inactive department');
      }
    }

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (code !== undefined) updateData.code = code.trim().toUpperCase();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (credits !== undefined) updateData.credits = parseFloat(credits);
    if (classification !== undefined) updateData.classification = classification;
    if (departmentId !== undefined) updateData.departmentId = parseInt(departmentId, 10);
    if (isActive !== undefined) updateData.isActive = !!isActive;

    // Update subject (updated_by is the authenticated user)
    const subject = await subjectRepo.updateSubject(
      subjectId,
      updateData,
      req.user.id  // updatedBy user ID from auth middleware
    );

    successResponse(res, 200, 'Subject updated successfully', { subject });
  } catch (error) {
    console.error(error);
    // Check for foreign key constraint errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return errorResponse(res, 400, 'Invalid department or user reference');
    }
    errorResponse(res, 500, 'Server error during subject update');
  }
};

// ===================================================================
// @desc    Delete subject (Admin only)
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
// ===================================================================
const deleteSubject = async (req, res) => {
  try {
    const subjectId = req.params.id;

    // Check if subject exists
    const existingSubject = await subjectRepo.getSubjectById(subjectId);
    if (!existingSubject) {
      return errorResponse(res, 404, 'Subject not found');
    }

    // Delete subject
    const deleted = await subjectRepo.deleteSubject(subjectId);
    if (!deleted) {
      return errorResponse(res, 500, 'Failed to delete subject');
    }

    successResponse(res, 200, 'Subject deleted successfully');
  } catch (error) {
    console.error(error);
    // Check if it's a foreign key constraint error
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return errorResponse(
        res,
        400,
        'Cannot delete subject because it has associated records (courses, enrollments, etc.)'
      );
    }
    errorResponse(res, 500, 'Server error during subject deletion');
  }
};

module.exports = {
  getAllSubjects,
  getSubjectById,
  getSubjectsByDepartment,
  createSubject,
  updateSubject,
  deleteSubject
};