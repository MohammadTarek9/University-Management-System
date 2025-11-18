import api from './api';

export const bookingService = {
  // Get all bookings with pagination and filters
  getAllBookings: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/facilities/bookings?${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Room service error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      throw error.response?.data || { message: 'Failed to fetch bookings' };
    }
  },

  // Get single booking by ID
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/facilities/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch booking' };
    }
  },

  // Create new booking
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/facilities/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create booking' };
    }
  },

  // Update booking
  updateBooking: async (id, bookingData) => {
    try {
      const response = await api.put(`/facilities/bookings/${id}`, bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update booking' };
    }
  },

  // Cancel booking
  cancelBooking: async (id) => {
    try {
      const response = await api.patch(`/facilities/bookings/${id}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel booking' };
    }
  },

  // Get room availability
  getRoomAvailability: async (roomId, date) => {
    try {
      const response = await api.get(`/facilities/rooms/${roomId}/availability?date=${date}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch availability' };
    }
  }
};