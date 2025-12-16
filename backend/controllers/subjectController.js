const { errorResponse, successResponse } = require('../utils/responseHelpers');
const subjectRepo = require('../repositories/subjectEavRepoNew'); // Using 3-table EAV repository
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
    const { 
      name, 
      code, 
      description, 
      credits, 
      classification, 
      departmentId, 
      isActive, 
      semester, 
      academicYear,
      // EAV flexible attributes
      prerequisites,
      corequisites,
      learningOutcomes,
      textbooks,
      labRequired,
      labHours,
      studioRequired,
      studioHours,
      certifications,
      repeatability,
      syllabusTemplate,
      typicalOffering
    } = req.body;

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

    // Validate semester if provided 
    if (semester && semester.trim() !== '') {
      const validSemesters = ['Fall', 'Spring', 'Summer'];
      if (!validSemesters.includes(semester.trim())) {
        return errorResponse(
          res,
          400,
          'Invalid semester value. Must be Fall, Spring, or Summer.'
        );
      }
    }

    // Validate academic year format if provided 
    if (academicYear && academicYear.trim() !== '' && !/^\d{4}-\d{4}$/.test(academicYear)) {
      return errorResponse(
        res,
        400,
        'Invalid academic year format. Must be in format YYYY-YYYY (e.g., 2024-2025)'
      );
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

    // Prepare flexible attributes
    const flexibleAttributes = {};
    if (prerequisites) flexibleAttributes.prerequisites = prerequisites;
    if (corequisites) flexibleAttributes.corequisites = corequisites;
    if (learningOutcomes) flexibleAttributes.learningOutcomes = learningOutcomes;
    if (textbooks) flexibleAttributes.textbooks = textbooks;
    if (labRequired !== undefined) flexibleAttributes.labRequired = labRequired;
    if (labHours) flexibleAttributes.labHours = labHours;
    if (studioRequired !== undefined) flexibleAttributes.studioRequired = studioRequired;
    if (studioHours) flexibleAttributes.studioHours = studioHours;
    if (certifications) flexibleAttributes.certifications = certifications;
    if (repeatability) flexibleAttributes.repeatability = repeatability;
    if (syllabusTemplate) flexibleAttributes.syllabusTemplate = syllabusTemplate;
    if (typicalOffering) flexibleAttributes.typicalOffering = typicalOffering;

    // Create subject (created_by is the authenticated user)
    const subject = await subjectRepo.createSubject({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || null,
      credits: parseFloat(credits),
      classification,
      departmentId: parseInt(departmentId, 10),
      isActive: isActive !== undefined ? !!isActive : true,
      semester: semester?.trim() || null,           
      academicYear: academicYear?.trim() || null,
      flexibleAttributes
    });

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
    const { 
      name, 
      code, 
      description, 
      credits, 
      classification, 
      departmentId, 
      isActive,
      // EAV flexible attributes
      prerequisites,
      corequisites,
      learningOutcomes,
      textbooks,
      labRequired,
      labHours,
      studioRequired,
      studioHours,
      certifications,
      repeatability,
      syllabusTemplate,
      typicalOffering
    } = req.body;

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

    // Prepare flexible attributes
    const flexibleAttributes = {};
    if (prerequisites !== undefined) flexibleAttributes.prerequisites = prerequisites;
    if (corequisites !== undefined) flexibleAttributes.corequisites = corequisites;
    if (learningOutcomes !== undefined) flexibleAttributes.learningOutcomes = learningOutcomes;
    if (textbooks !== undefined) flexibleAttributes.textbooks = textbooks;
    if (labRequired !== undefined) flexibleAttributes.labRequired = labRequired;
    if (labHours !== undefined) flexibleAttributes.labHours = labHours;
    if (studioRequired !== undefined) flexibleAttributes.studioRequired = studioRequired;
    if (studioHours !== undefined) flexibleAttributes.studioHours = studioHours;
    if (certifications !== undefined) flexibleAttributes.certifications = certifications;
    if (repeatability !== undefined) flexibleAttributes.repeatability = repeatability;
    if (syllabusTemplate !== undefined) flexibleAttributes.syllabusTemplate = syllabusTemplate;
    if (typicalOffering !== undefined) flexibleAttributes.typicalOffering = typicalOffering;

    updateData.flexibleAttributes = flexibleAttributes;

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
// ===================================================================
// @desc    Update subject semester availability
// @route   PUT /api/curriculum/subjects/:id/semester
// @access  Private/Admin/Staff
// ===================================================================
const updateSubjectSemester = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const { semester, academicYear } = req.body;

    // Normalize values
    let finalSemester = semester;
    let finalAcademicYear = academicYear ?? null;

    if (semester === null || semester === '' || semester === undefined) {
      // Clearing semester
      finalSemester = null;
      finalAcademicYear = null;
    } else {
      // Validate semester value
      const trimmedSemester = semester.trim();
      const validSemesters = ['Fall', 'Spring', 'Summer'];

      if (!validSemesters.includes(trimmedSemester)) {
        return errorResponse(
          res,
          400,
          'Invalid semester value. Must be Fall, Spring, or Summer.'
        );
      }

      finalSemester = trimmedSemester;

      // Academic year is optional; validate only if provided
      if (
        finalAcademicYear &&
        !/^\d{4}-\d{4}$/.test(finalAcademicYear)
      ) {
        return errorResponse(
          res,
          400,
          'Invalid academic year format. Must be in format YYYY-YYYY e.g., 2024-2025'
        );
      }
    }

    // Check if subject exists (keep your existing code here)
    const existingSubject = await subjectRepo.getSubjectById(subjectId);
    if (!existingSubject) {
      return errorResponse(res, 404, 'Subject not found');
    }

    // Call repo with normalized values
    const subject = await subjectRepo.updateSubjectSemester(
      subjectId,
      {
        semester: finalSemester,
        academicYear: finalAcademicYear,
      },
      req.user.id
    );

    if (!subject) {
      return errorResponse(res, 500, 'Failed to update subject semester');
    }

    return successResponse(res, 200, 'Subject semester updated successfully', {
      subject,
    });
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Server error during semester update');
  }
};


// ===================================================================
// @desc    Get subjects by semester
// @route   GET /api/curriculum/subjects/semester/:semester
// @access  Private
// ===================================================================
const getSubjectsBySemester = async (req, res) => {
  try {
    const { semester } = req.params;
    const { academicYear } = req.query;

    // Validate semester
    const validSemesters = ['Fall', 'Spring', 'Summer'];
    if (!validSemesters.includes(semester)) {
      return errorResponse(
        res,
        400,
        'Invalid semester value. Must be Fall, Spring, or Summer.'
      );
    }

    const subjects = await subjectRepo.getSubjectsBySemester(semester, academicYear);

    successResponse(res, 200, 'Subjects retrieved successfully', { 
      subjects,
      semester,
      academicYear: academicYear || 'all',
      count: subjects.length
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'Server error while retrieving subjects');
  }
};


module.exports = {
  getAllSubjects,
  getSubjectById,
  getSubjectsByDepartment,
  createSubject,
  updateSubject,
  deleteSubject,
   updateSubjectSemester,   
  getSubjectsBySemester    
};
