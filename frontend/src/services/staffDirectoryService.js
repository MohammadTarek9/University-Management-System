// services/staffDirectoryService.js
import api from './api';

export const staffDirectoryService = {
  /**
   * Get staff directory with filtering and pagination
   * @param {Object} params - Filter and pagination parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.search - Search query
   * @param {string} params.department - Filter by department
   * @param {string} params.role - Filter by role
   * @returns {Promise<Object>} Staff directory data with pagination
   */
  getStaffDirectory: async (params = {}) => {
    try {
      const response = await api.get('/staff/directory', { params });
      console.log('getStaffDirectory response:', response.data);
      
      // Extract data from response - handle different response structures
      const responseData = response.data.data || response.data;
      
      return {
        staff: responseData.staff || [],
        pagination: responseData.pagination || {
          currentPage: params.page || 1,
          totalPages: 1,
          totalEmployees: responseData.staff?.length || 0
        },
        filters: responseData.filters || {
          departments: [],
          roles: []
        }
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load staff directory';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Get individual staff member details
   * @param {string|number} staffId - Staff member ID
   * @returns {Promise<Object>} Staff member details
   */
  getStaffMember: async (staffId) => {
    try {
      const response = await api.get(`/staff/directory/${staffId}`);
      console.log('getStaffMember response:', response.data);
      
      // Extract data from response
      const responseData = response.data.data || response.data;
      
      return {
        staffMember: responseData.staffMember || responseData
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load staff member details';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  }
};