// controllers/teachingStaffProfileController.js
const { errorResponse, successResponse } = require('../utils/responseHelpers');
const teachingStaffProfileRepo = require('../repositories/teachingStaffProfileRepo');
const userRepo = require('../repositories/userRepo');

/**
 * @desc    Get current user's teaching staff profile
 * @route   GET /api/teaching-staff/profile/me
 * @access  Private (professor, ta)
 */
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user is professor or TA
    const user = await userRepo.getUserById(userId);
    if (!['professor', 'ta'].includes(user.role)) {
      return errorResponse(res, 403, 'Only professors and TAs can access teaching staff profiles');
    }
    
    const profile = await teachingStaffProfileRepo.getTeachingStaffProfileWithDetails(userId);
    
    // If no profile exists, return empty structure with user info
    if (!profile) {
      return successResponse(res, 200, 'Profile not found', {
        profile: null,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber,
          profilePicture: user.profilePicture,
          department: user.department,
          employeeId: user.employeeId
        }
      });
    }
    
    successResponse(res, 200, 'Profile retrieved successfully', {
      profile
    });
  } catch (error) {
    console.error('Error getting my profile:', error);
    errorResponse(res, 500, 'Server error while retrieving profile');
  }
};

/**
 * @desc    Create or update teaching staff profile
 * @route   PUT /api/teaching-staff/profile/me
 * @access  Private (professor, ta)
 */
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { officeHours, officeLocation, phoneNumber, email } = req.body;
    
    // Check if user is professor or TA
    const user = await userRepo.getUserById(userId);
    if (!['professor', 'ta'].includes(user.role)) {
      return errorResponse(res, 403, 'Only professors and TAs can update teaching staff profiles');
    }
    
    // Validate at least one field is provided
    if (!officeHours && !officeLocation && phoneNumber === undefined && email === undefined) {
      return errorResponse(res, 400, 'At least one field is required');
    }
    
    // Validate email if provided
    if (email !== undefined) {
      if (!email || email.trim() === '') {
        return errorResponse(res, 400, 'Email cannot be empty');
      }
      
      // Check if email already exists (excluding current user)
      const existingUser = await userRepo.getUserByEmail(email);
      if (existingUser && existingUser.id !== parseInt(userId)) {
        return errorResponse(res, 400, 'Email already exists');
      }
    }
    
    // Validate phone number if provided
    if (phoneNumber !== undefined && phoneNumber && phoneNumber.trim() !== '') {
      // Basic phone validation (adjust as needed)
      const phoneRegex = /^[\d\s\-+()]+$/;
      if (!phoneRegex.test(phoneNumber)) {
        return errorResponse(res, 400, 'Invalid phone number format');
      }
    }
    
    const profileData = { 
      officeHours, 
      officeLocation,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
      email: email !== undefined ? email : undefined
    };
    
    const updatedProfile = await teachingStaffProfileRepo.upsertTeachingStaffProfile(userId, profileData);
    
    successResponse(res, 200, 'Profile updated successfully', {
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    errorResponse(res, 500, 'Server error while updating profile');
  }
};

/**
 * @desc    Get all teaching staff profiles
 * @route   GET /api/teaching-staff/profiles
 * @access  Public (authenticated users)
 */
const getAllProfiles = async (req, res) => {
  try {
    const { department = '' } = req.query;
    
    let profiles;
    
    if (department && department.trim() !== '') {
      // Get profiles filtered by department
      profiles = await teachingStaffProfileRepo.getTeachingStaffByDepartment(department);
    } else {
      // Get all profiles
      profiles = await teachingStaffProfileRepo.getAllTeachingStaffProfiles();
    }
    
    // Filter only active users
    profiles = profiles.filter(profile => profile.user.isActive);
    
    // Extract unique departments for filters
    const departments = [...new Set(
      profiles
        .map(profile => profile.user.department)
        .filter(Boolean)
        .sort()
    )];
    
    successResponse(res, 200, 'Teaching staff profiles retrieved successfully', {
      profiles,
      filters: {
        departments
      },
      total: profiles.length
    });
  } catch (error) {
    console.error('Error getting all profiles:', error);
    errorResponse(res, 500, 'Server error while retrieving profiles');
  }
};

/**
 * @desc    Get teaching staff profile by user ID
 * @route   GET /api/teaching-staff/profiles/user/:userId
 * @access  Public (authenticated users)
 */
const getProfileByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user exists and is professor/TA
    const user = await userRepo.getUserById(userId);
    if (!user || !['professor', 'ta'].includes(user.role)) {
      return errorResponse(res, 404, 'Teaching staff member not found');
    }
    
    const profile = await teachingStaffProfileRepo.getTeachingStaffProfileWithDetails(userId);
    
    if (!profile) {
      return successResponse(res, 200, 'Profile not found', {
        profile: null,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber,
          profilePicture: user.profilePicture,
          department: user.department,
          employeeId: user.employeeId
        }
      });
    }
    
    successResponse(res, 200, 'Profile retrieved successfully', {
      profile
    });
  } catch (error) {
    console.error('Error getting profile by user ID:', error);
    errorResponse(res, 500, 'Server error while retrieving profile');
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getAllProfiles,
  getProfileByUserId
};