import api from './api';

export const leaveRequestService = {
  /**
   * Get all leave types
   */
  getLeaveTypes: async () => {
  try {
    const response = await api.get('/staff/leave-requests/types');
    return response.data.data; // Unwrap the nested data
  } catch (error) {
    throw error.response?.data || error;
  }
},

getMyLeaveRequests: async (filters = {}) => {
  try {
    const response = await api.get('/staff/leave-requests/my-requests', {
      params: filters
    });
    return response.data.data; // Unwrap once
  } catch (error) {
    throw error.response?.data || error;
  }
},

  /**
   * Submit a new leave request
   */
  submitLeaveRequest: async (leaveData) => {
    try {
      const response = await api.post('/staff/leave-requests', leaveData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get specific leave request details
   */
  getLeaveRequestDetails: async (leaveRequestId) => {
    try {
      const response = await api.get(`/staff/leave-requests/${leaveRequestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get pending leave requests (admin only)
   */
  getPendingRequests: async (filters = {}) => {
    try {
      const response = await api.get('/staff/leave-requests/admin/pending', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Approve leave request (admin only)
   */
  approveLeaveRequest: async (leaveRequestId) => {
    try {
      const response = await api.put(`/staff/leave-requests/${leaveRequestId}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Reject leave request (admin only)
   */
  rejectLeaveRequest: async (leaveRequestId, rejectionReason) => {
    try {
      const response = await api.put(`/staff/leave-requests/${leaveRequestId}/reject`, {
        rejectionReason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Cancel leave request (user can cancel their own)
   */
  cancelLeaveRequest: async (leaveRequestId) => {
    try {
      const response = await api.put(`/staff/leave-requests/${leaveRequestId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};