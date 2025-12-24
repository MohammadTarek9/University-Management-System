// services/meetingService.js
import api from './api';

// Get all available professors
export const getAvailableProfessors = async (department = '') => {
  try {
    const response = await api.get('/community/meetings/professors', {
      params: { department }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting professors:', error);
    throw error;
  }
};

// Request a meeting (SIMPLIFIED)
export const requestMeeting = async (meetingData) => {
  try {
    const response = await api.post('/community/meetings/request', meetingData);
    return response.data;
  } catch (error) {
    console.error('Error requesting meeting:', error);
    throw error;
  }
};

// Get user's meetings
export const getMyMeetings = async (params = {}) => {
  try {
    const response = await api.get('/community/meetings/my-meetings', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting my meetings:', error);
    throw error;
  }
};

// Get meeting details
export const getMeetingDetails = async (meetingId) => {
  try {
    const response = await api.get(`/community/meetings/${meetingId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting meeting details:', error);
    throw error;
  }
};

// Update meeting status
export const updateMeetingStatus = async (meetingId, status, notes = '') => {
  try {
    const response = await api.put(`/community/meetings/${meetingId}/status`, {
      status,
      notes
    });
    return response.data;
  } catch (error) {
    console.error('Error updating meeting status:', error);
    throw error;
  }
};

// Cancel meeting
export const cancelMeeting = async (meetingId, notes = '') => {
  try {
    const response = await api.put(`/community/meetings/${meetingId}/cancel`, {
      notes
    });
    return response.data;
  } catch (error) {
    console.error('Error cancelling meeting:', error);
    throw error;
  }
};

// Get upcoming meetings
export const getUpcomingMeetings = async () => {
  try {
    const response = await api.get('/community/meetings/my-meetings', {
      params: { status: 'approved', limit: 5 }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting upcoming meetings:', error);
    throw error;
  }
};
