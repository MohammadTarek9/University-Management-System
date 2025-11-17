import api from './api';

export const userService = {
  // Get all users with pagination and search
  getAllUsers: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/users?${queryString}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  // Get single user by ID
  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user' };
    }
  },

  // Create new user (admin only)
  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('UserService createUser error:', error.response?.data);
      const errorData = error.response?.data;
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Handle validation errors
        const errorMessages = errorData.errors.map(err => err.msg).join('; ');
        throw new Error(errorMessages);
      } else if (errorData?.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error('Failed to create user');
      }
    }
  },

  // Update user (admin only)
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  // Delete user (admin only)
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  },

  // Promote user to admin (admin only)
  promoteToAdmin: async (id) => {
    try {
      const response = await api.put(`/users/${id}/promote-admin`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to promote user to admin' };
    }
  }
};