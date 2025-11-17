import api from './api';

export const roomService = {
  // Get all rooms with pagination, search, and filters
  getAllRooms: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/facilities/rooms?${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Room service error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      throw error.response?.data || { message: 'Failed to fetch rooms', status: error.response?.status };
    }
  },

  // Get single room by ID
  getRoomById: async (id) => {
    try {
      const response = await api.get(`/facilities/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch room' };
    }
  },

  // Create new room (admin only)
  createRoom: async (roomData) => {
    try {
      const response = await api.post('/facilities/rooms', roomData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create room' };
    }
  },

  // Update room (admin only)
  updateRoom: async (id, roomData) => {
    try {
      const response = await api.put(`/facilities/rooms/${id}`, roomData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update room' };
    }
  },

  // Delete room (admin only)
  deleteRoom: async (id) => {
    try {
      const response = await api.delete(`/facilities/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete room' };
    }
  },

  // Get room statistics
  getRoomStats: async () => {
    try {
      const response = await api.get('/facilities/rooms/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch room statistics' };
    }
  }
};