import api from './api';

export const applicationService = {
  // Get all applications with pagination, search, and filters
  getAllApplications: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/facilities/applications?${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Application service error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      throw error.response?.data || { message: 'Failed to fetch applications', status: error.response?.status };
    }
  },

  // Get single application by ID
  getApplicationById: async (id) => {
    try {
      const response = await api.get(`/facilities/applications/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch application details' };
    }
  },

  // Create new application (admin only)
  createApplication: async (applicationData) => {
    try {
      const response = await api.post('/facilities/applications', applicationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create application' };
    }
  },

  // Update entire application (edit mode)
  updateApplication: async (id, applicationData) => {
    try {
      const response = await api.put(`/facilities/applications/${id}`, applicationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update application' };
    }
  },

  // Update application status (approve/reject/etc.)
  updateApplicationStatus: async (id, statusData) => {
    try {
      const response = await api.put(`/facilities/applications/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update application status' };
    }
  },

  // Delete application (admin only)
  deleteApplication: async (id) => {
    try {
      const response = await api.delete(`/facilities/applications/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete application' };
    }
  },

  // Get application statistics
  getApplicationStats: async () => {
    try {
      const response = await api.get('/facilities/applications/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch application statistics' };
    }
  },

  // Get filter options for dropdowns
  getFilterOptions: async () => {
    try {
      const response = await api.get('/facilities/applications/filters');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch filter options' };
    }
  },

  // Helper function to get available programs
  getAvailablePrograms: () => {
    return [
      'Computer Science',
      'Engineering',
      'Business Administration',
      'Medicine',
      'Law',
      'Arts',
      'Sciences',
      'Education',
      'Nursing',
      'Economics'
    ];
  },

  // Helper function to get degree levels
  getDegreeLevels: () => {
    return ['Bachelor', 'Master', 'Doctorate', 'Certificate'];
  },

  // Helper function to get application statuses
  getApplicationStatuses: () => {
    return ['Pending Review', 'Under Review', 'Approved', 'Rejected', 'Waitlisted'];
  },

  // Helper function to get status colors for UI
  getStatusColor: (status) => {
    const statusColors = {
      'Pending Review': 'warning',
      'Under Review': 'info',
      'Approved': 'success',
      'Rejected': 'error',
      'Waitlisted': 'secondary'
    };
    return statusColors[status] || 'default';
  },

  // Helper function to format application data for display
  formatApplicationForDisplay: (application) => {
    return {
      ...application,
      applicantName: `${application.personalInfo.firstName} ${application.personalInfo.lastName}`,
      submittedDate: new Date(application.submittedAt).toLocaleDateString(),
      lastModifiedDate: new Date(application.lastModified).toLocaleDateString(),
      programDisplay: application.academicInfo.program,
      statusDisplay: application.status,
      statusColor: applicationService.getStatusColor(application.status)
    };
  },

  // Helper function to validate application data
  validateApplicationData: (data) => {
    const errors = {};

    // Personal Information Validation
    if (!data.personalInfo?.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!data.personalInfo?.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!data.personalInfo?.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.personalInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!data.personalInfo?.phone?.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!data.personalInfo?.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    
    if (!data.personalInfo?.nationality?.trim()) {
      errors.nationality = 'Nationality is required';
    }

    // Address Validation
    if (!data.personalInfo?.address?.street?.trim()) {
      errors.street = 'Street address is required';
    }
    
    if (!data.personalInfo?.address?.city?.trim()) {
      errors.city = 'City is required';
    }
    
    if (!data.personalInfo?.address?.state?.trim()) {
      errors.state = 'State/Province is required';
    }
    
    if (!data.personalInfo?.address?.zipCode?.trim()) {
      errors.zipCode = 'ZIP/Postal code is required';
    }
    
    if (!data.personalInfo?.address?.country?.trim()) {
      errors.country = 'Country is required';
    }

    // Academic Information Validation
    if (!data.academicInfo?.program) {
      errors.program = 'Program is required';
    }
    
    if (!data.academicInfo?.degreeLevel) {
      errors.degreeLevel = 'Degree level is required';
    }
    
    if (!data.academicInfo?.intendedStartDate) {
      errors.intendedStartDate = 'Intended start date is required';
    }

    // Previous Education Validation
    if (!data.academicInfo?.previousEducation?.institution?.trim()) {
      errors.previousInstitution = 'Previous institution is required';
    }
    
    if (!data.academicInfo?.previousEducation?.degree?.trim()) {
      errors.previousDegree = 'Previous degree is required';
    }
    
    if (!data.academicInfo?.previousEducation?.graduationDate) {
      errors.graduationDate = 'Graduation date is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default applicationService;