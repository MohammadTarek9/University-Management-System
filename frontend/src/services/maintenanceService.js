// services/maintenanceService.js
import api from './api';

const maintenanceService = {
  // Create new maintenance request
  createMaintenanceRequest: async (data) => {
    const response = await api.post('/facilities/maintenance', data);
    return response.data;
  },

  // Get all maintenance requests
  getAllMaintenanceRequests: async (params = {}) => {
    const response = await api.get('/facilities/maintenance', { params });
    return response.data;
  },

  // Get single maintenance request
  getMaintenanceRequestById: async (id) => {
    const response = await api.get(`/facilities/maintenance/${id}`);
    return response.data;
  },

  // Update maintenance request status
  updateMaintenanceRequestStatus: async (id, data) => {
    const response = await api.put(`/facilities/maintenance/${id}/status`, data);
    return response.data;
  },

  // Submit feedback
  submitFeedback: async (id, data) => {
    const response = await api.post(`/facilities/maintenance/${id}/feedback`, data);
    return response.data;
  },

  deleteMaintenanceRequest: async (id) => {
    const response = await api.delete(`/facilities/maintenance/${id}`);
    return response.data;
  },

  // Get maintenance statistics
  getMaintenanceStats: async () => {
    const response = await api.get('/facilities/maintenance/stats');
    return response.data;
  }
};

export default maintenanceService;