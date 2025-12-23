// services/messageService.js
import api from './api';

const messageService = {
  /**
   * Get parent's children (students)
   * @returns {Promise} Response with children list
   */
  getParentChildren: async () => {
    try {
      const response = await api.get('/community/messages/children');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch children' };
    }
  },

  /**
   * Get teachers for a student
   * @param {number} studentId - Student user ID
   * @returns {Promise} Response with teachers list
   */
  getStudentTeachers: async (studentId) => {
    try {
      const response = await api.get(`/community/messages/teachers/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch teachers' };
    }
  },

  /**
   * Send a message to a teacher
   * @param {Object} messageData - Message data
   * @returns {Promise} Response with created message
   */
  sendMessage: async (messageData) => {
    try {
      const response = await api.post('/community/messages', messageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send message' };
    }
  },

  /**
   * Reply to a message (teacher)
   * @param {number} messageId - Message ID to reply to
   * @param {Object} replyData - Reply content
   * @returns {Promise} Response with reply message
   */
  replyToMessage: async (messageId, replyData) => {
    try {
      const response = await api.post(`/community/messages/${messageId}/reply`, replyData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send reply' };
    }
  },

  /**
   * Get sent messages
   * @returns {Promise} Response with sent messages
   */
  getSentMessages: async () => {
    try {
      const response = await api.get('/community/messages/sent');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch sent messages' };
    }
  },

  /**
   * Get received messages (for teachers)
   * @returns {Promise} Response with received messages
   */
  getReceivedMessages: async () => {
    try {
      const response = await api.get('/community/messages/received');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch received messages' };
    }
  },

  /**
   * Get a specific message
   * @param {number} id - Message ID
   * @returns {Promise} Response with message
   */
  getMessage: async (id) => {
    try {
      const response = await api.get(`/community/messages/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch message' };
    }
  },

  /**
   * Mark message as read
   * @param {number} id - Message ID
   * @returns {Promise} Response with updated message
   */
  markAsRead: async (id) => {
    try {
      const response = await api.put(`/community/messages/${id}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark message as read' };
    }
  },

  /**
   * Get unread message count (for teachers)
   * @returns {Promise} Response with unread count
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/community/messages/unread/count');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch unread count' };
    }
  },

  /**
   * Delete a message
   * @param {number} id - Message ID
   * @returns {Promise} Response
   */
  deleteMessage: async (id) => {
    try {
      const response = await api.delete(`/community/messages/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete message' };
    }
  }
};

export default messageService;
