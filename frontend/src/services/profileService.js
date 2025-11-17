import api from './api';

export const profileService = {
  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },

  // Update current user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  }
};