import api from './api';

export const courseService = {
  // Get all courses with pagination and filters
  getAllCourses: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/curriculum/courses?${queryString}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch courses' };
    }
  },

  // Get single course by ID
  getCourseById: async (id) => {
    try {
      const response = await api.get(`/curriculum/courses/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch course' };
    }
  },

  // Get courses by subject
  getCoursesBySubject: async (subjectId) => {
    try {
      const response = await api.get(`/curriculum/courses/subject/${subjectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch courses for subject' };
    }
  },

  // Create new course (admin/staff only)
  createCourse: async (courseData) => {
    try {
      const response = await api.post('/curriculum/courses', courseData);
      return response.data;
    } catch (error) {
      console.error('CourseService createCourse error:', error.response?.data);
      const errorData = error.response?.data;
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Handle validation errors
        const errorMessages = errorData.errors.map(err => err.msg).join('; ');
        throw new Error(errorMessages);
      } else if (errorData?.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error('Failed to create course');
      }
    }
  },

  // Update course (admin/staff only)
  updateCourse: async (id, courseData) => {
    try {
      const response = await api.put(`/curriculum/courses/${id}`, courseData);
      return response.data;
    } catch (error) {
      console.error('CourseService updateCourse error:', error.response?.data);
      const errorData = error.response?.data;
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const errorMessages = errorData.errors.map(err => err.msg).join('; ');
        throw new Error(errorMessages);
      } else if (errorData?.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error('Failed to update course');
      }
    }
  },

  // Delete course (admin only)
  deleteCourse: async (id) => {
    try {
      const response = await api.delete(`/curriculum/courses/${id}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error('Failed to delete course');
      }
    }
  },

// Get courses for the logged‑in instructor
  getMyCourses: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
     const response = await api.get(`/curriculum/courses/my-courses?${queryString}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch my courses' };
    }
  },

};
