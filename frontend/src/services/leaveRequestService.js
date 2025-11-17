import api from './api';

export const leaveRequestService = {
  /**
   * Get all leave types
   */
  getLeaveTypes: async () => {
    try {
      const response = await api.get('/staff/leave-requests/types');
      console.log('getLeaveTypes response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load leave types';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Submit a new leave request
   */
  submitLeaveRequest: async (leaveData) => {
    try {
      const response = await api.post('/staff/leave-requests', leaveData);
      console.log('submitLeaveRequest response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit leave request';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Get current user's leave requests
   */
  getMyLeaveRequests: async (filters = {}) => {
    try {
      const response = await api.get('/staff/leave-requests/my-requests', {
        params: filters
      });
      console.log('getMyLeaveRequests response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load leave requests';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
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
      console.log('getPendingRequests response:', response.data);
      // ✓ IMPORTANT: response.data is already the unwrapped data object
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load pending requests';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Get specific leave request details
   */
  getLeaveRequestDetails: async (leaveRequestId) => {
    try {
      const response = await api.get(`/staff/leave-requests/${leaveRequestId}`);
      console.log('getLeaveRequestDetails response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load leave request';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Approve leave request (admin only)
   */
  approveLeaveRequest: async (leaveRequestId) => {
    try {
      const response = await api.put(`/staff/leave-requests/${leaveRequestId}/approve`);
      console.log('approveLeaveRequest response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to approve request';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
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
      console.log('rejectLeaveRequest response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject request';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  },

  /**
   * Cancel leave request (user can cancel their own)
   */
  cancelLeaveRequest: async (leaveRequestId) => {
    try {
      const response = await api.put(`/staff/leave-requests/${leaveRequestId}/cancel`);
      console.log('cancelLeaveRequest response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel request';
      const err = new Error(errorMessage);
      err.data = error.response?.data;
      throw err;
    }
  }
};