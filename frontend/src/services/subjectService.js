import api from './api';

export const subjectService = {
  // Get all subjects with pagination and filters
  getAllSubjects: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/curriculum/subjects?${queryString}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subjects' };
    }
  },

  // Get single subject by ID
  getSubjectById: async (id) => {
    try {
      const response = await api.get(`/curriculum/subjects/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subject' };
    }
  },

  // Get subjects by department
  getSubjectsByDepartment: async (departmentId) => {
    try {
      const response = await api.get(`/curriculum/subjects/department/${departmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subjects for department' };
    }
  },

  // Create new subject (admin/staff only)
  createSubject: async (subjectData) => {
    try {
      const response = await api.post('/curriculum/subjects', subjectData);
      return response.data;
    } catch (error) {
      console.error('SubjectService createSubject error:', error.response?.data);
      const errorData = error.response?.data;
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Handle validation errors
        const errorMessages = errorData.errors.map(err => err.msg).join('; ');
        throw new Error(errorMessages);
      } else if (errorData?.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error('Failed to create subject');
      }
    }
  },

  // Update subject (admin/staff only)
  updateSubject: async (id, subjectData) => {
    try {
      const response = await api.put(`/curriculum/subjects/${id}`, subjectData);
      return response.data;
    } catch (error) {
      console.error('SubjectService updateSubject error:', error.response?.data);
      const errorData = error.response?.data;
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const errorMessages = errorData.errors.map(err => err.msg).join('; ');
        throw new Error(errorMessages);
      } else if (errorData?.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error('Failed to update subject');
      }
    }
  },

  // Delete subject (admin only)
  deleteSubject: async (id) => {
    try {
      const response = await api.delete(`/curriculum/subjects/${id}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error('Failed to delete subject');
      }
    }
  }
};
