import api from './api';

export const researchService = {
  /**
   * Create new research
   */
  createResearch: async (researchData) => {
    try {
      const response = await api.post('/staff/research', researchData);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to publish research';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Get research by ID
   */
  getResearchById: async (researchId) => {
    try {
      const response = await api.get(`/staff/research/${researchId}`);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load research';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Get current user's research
   */
  getUserResearch: async (filters = {}) => {
    try {
      const response = await api.get('/staff/research/my-research', {
        params: filters
      });
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load research';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Get published research by user (public)
   */
  getPublishedResearchByUser: async (userId, filters = {}) => {
    try {
      const response = await api.get(`/staff/research/user/${userId}/published`, {
        params: filters
      });
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load research';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Get all published research (public)
   * NEW FUNCTION
   */
  getAllPublishedResearch: async (filters = {}) => {
    try {
      const response = await api.get('/staff/research/published', {
        params: filters
      });
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load research';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Get all research (admin only)
   */
  getAllResearch: async (filters = {}) => {
    try {
      const response = await api.get('/staff/research/admin/all', {
        params: filters
      });
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load research';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Update research
   */
  updateResearch: async (researchId, researchData) => {
    try {
      const response = await api.put(`/staff/research/${researchId}`, researchData);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update research';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Delete research (soft delete)
   */
  deleteResearch: async (researchId) => {
    try {
      const response = await api.delete(`/staff/research/${researchId}`);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete research';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  }
};