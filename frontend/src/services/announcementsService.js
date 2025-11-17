import api from './api';

export const announcementsService = {
  /**
   * Create new announcement
   */
  createAnnouncement: async (announcementData) => {
    try {
      const response = await api.post('/community/announcements', announcementData);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create announcement';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Get announcement by ID
   */
  getAnnouncementById: async (announcementId) => {
    try {
      const response = await api.get(`/community/announcements/${announcementId}`);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load announcement';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Get announcements for current user
   */
  getAnnouncements: async (filters = {}) => {
    try {
      const response = await api.get('/community/announcements', {
        params: filters
      });
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load announcements';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Get all announcements (admin only)
   */
  getAllAnnouncementsAdmin: async (filters = {}) => {
    try {
      const response = await api.get('/community/announcements/admin/all', {
        params: filters
      });
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load announcements';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Update announcement
   */
  updateAnnouncement: async (announcementId, announcementData) => {
    try {
      const response = await api.put(`/community/announcements/${announcementId}`, announcementData);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update announcement';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Toggle announcement status
   */
  toggleAnnouncementStatus: async (announcementId) => {
    try {
      const response = await api.patch(`/community/announcements/${announcementId}/toggle`);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to toggle announcement status';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Delete announcement
   */
  deleteAnnouncement: async (announcementId) => {
    try {
      const response = await api.delete(`/community/announcements/${announcementId}`);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete announcement';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  }
};