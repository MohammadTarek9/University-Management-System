import api from './api';

export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },



  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user profile' };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // ADDED PASSWORD RESET METHODS
  getSecurityQuestion: async (email) => {
    try {
      const response = await api.get(`/auth/security-question?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch security question' };
    }
  },

  forgotPassword: async (credentials) => {
    try {
      const response = await api.post('/auth/forgot-password', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password reset failed' };
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.put(`/auth/reset-password/${token}`, { password: newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password reset failed' };
    }
  },

  firstLoginChangePassword: async (passwordData) => {
    try {
      const response = await api.post('/auth/first-login-change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password change failed' };
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};