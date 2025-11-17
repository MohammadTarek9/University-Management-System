// services/teachingStaffProfileService.js
import api from './api';

export const teachingStaffProfileService = {
  /**
   * Get current user's teaching staff profile
   * @returns {Promise<Object>} User's profile
   */
  getMyProfile: async () => {
    try {
      const response = await api.get('/staff/teaching-staff/profile/me');
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load profile';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Create or update teaching staff profile
   * @param {Object} profileData - Profile data
   * @param {string} profileData.officeHours - Office hours
   * @param {string} profileData.officeLocation - Office location
   * @param {string} profileData.phoneNumber - Phone number (optional)
   * @param {string} profileData.email - Email (optional)
   * @returns {Promise<Object>} Updated profile
   */
  updateMyProfile: async (profileData) => {
    try {
      const response = await api.put('/staff/teaching-staff/profile/me', profileData);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Get all teaching staff profiles
   * @param {Object} params - Filter parameters
   * @param {string} params.department - Filter by department
   * @returns {Promise<Object>} Teaching staff profiles
   */
  getAllProfiles: async (params = {}) => {
    try {
      const response = await api.get('/staff/teaching-staff/profiles', { params });
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load teaching staff profiles';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Get teaching staff profile by user ID
   * @param {string|number} userId - User ID
   * @returns {Promise<Object>} Profile details
   */
  getProfileByUserId: async (userId) => {
    try {
      const response = await api.get(`/staff/teaching-staff/profiles/user/${userId}`);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load profile';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  }
};