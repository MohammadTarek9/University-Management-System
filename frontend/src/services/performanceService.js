import api from './api';

const performanceService = {
  // Get paginated/list of performance records
  getAllPerformanceRecords: async (params = {}) => {
    try {
      const response = await api.get('/staff/performance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch performance records' };
    }
  },

  // Alias for getAllPerformanceRecords
  listPerformances: async (params = {}) => {
    try {
      const response = await api.get('/staff/performance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch performance records' };
    }
  },

  // Get a single performance record
  getPerformanceRecordById: async (id) => {
    try {
      const response = await api.get(`/staff/performance/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch performance record' };
    }
  },

  // Create a performance record (admin)
  createPerformanceRecord: async (data) => {
    try {
      const response = await api.post('/staff/performance', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create performance record' };
    }
  },

  // Update a performance record (admin)
  updatePerformanceRecord: async (id, data) => {
    try {
      const response = await api.put(`/staff/performance/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update performance record' };
    }
  },

  // Delete a performance record (admin)
  deletePerformanceRecord: async (id) => {
    try {
      const response = await api.delete(`/staff/performance/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete performance record' };
    }
  }
};

export default performanceService;
