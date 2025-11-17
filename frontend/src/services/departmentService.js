import api from './api';

export const departmentService = {
  // Get all departments with pagination and search
  getAllDepartments: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/curriculum/departments?${queryString}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch departments' };
    }
  },

  // Get single department by ID
  getDepartmentById: async (id) => {
    try {
      const response = await api.get(`/curriculum/departments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch department' };
    }
  },

  // Create new department (admin/staff only)
  createDepartment: async (departmentData) => {
    try {
      const response = await api.post('/curriculum/departments', departmentData);
      return response.data;
    } catch (error) {
      console.error('DepartmentService createDepartment error:', error.response?.data);
      const errorData = error.response?.data;
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Handle validation errors
        const errorMessages = errorData.errors.map(err => err.msg).join('; ');
        throw new Error(errorMessages);
      } else if (errorData?.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error('Failed to create department');
      }
    }
  },

  // Update department (admin/staff only)
  updateDepartment: async (id, departmentData) => {
    try {
      const response = await api.put(`/curriculum/departments/${id}`, departmentData);
      return response.data;
    } catch (error) {
      console.error('DepartmentService updateDepartment error:', error.response?.data);
      const errorData = error.response?.data;
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const errorMessages = errorData.errors.map(err => err.msg).join('; ');
        throw new Error(errorMessages);
      } else if (errorData?.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error('Failed to update department');
      }
    }
  },

  // Delete department (admin only)
  deleteDepartment: async (id) => {
    try {
      const response = await api.delete(`/curriculum/departments/${id}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error('Failed to delete department');
      }
    }
  }
};
