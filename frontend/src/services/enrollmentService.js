import api from './api';

/**
 * Register for a course
 */
export const registerForCourse = async (courseId) => {
  const response = await api.post('/enrollments', { courseId });
  return response.data;
};

/**
 * Get student's enrollments
 */
export const getMyEnrollments = async (params = {}) => {
  const response = await api.get('/enrollments/my-enrollments', { params });
  return response.data;
};

/**
 * Get available courses for registration
 */
export const getAvailableCourses = async (params = {}) => {
  const response = await api.get('/enrollments/available-courses', { params });
  return response.data;
};

/**
 * Drop a course
 */
export const dropCourse = async (enrollmentId) => {
  const response = await api.put(`/enrollments/${enrollmentId}/drop`);
  return response.data;
};

/**
 * Get enrollments for a course (for instructors)
 */
export const getCourseEnrollments = async (courseId) => {
  const response = await api.get(`/enrollments/course/${courseId}`);
  return response.data;
};

/**
 * Get pending enrollment requests (for admins)
 */
export const getPendingEnrollments = async (params = {}) => {
  const response = await api.get('/enrollments/pending', { params });
  return response.data;
};

/**
 * Approve an enrollment request (for admins)
 */
export const approveEnrollment = async (enrollmentId) => {
  const response = await api.put(`/enrollments/${enrollmentId}/approve`);
  return response.data;
};

/**
 * Reject an enrollment request (for admins)
 */
export const rejectEnrollment = async (enrollmentId, reason = '') => {
  const response = await api.put(`/enrollments/${enrollmentId}/reject`, { reason });
  return response.data;
};

const enrollmentService = {
  registerForCourse,
  getMyEnrollments,
  getAvailableCourses,
  dropCourse,
  getCourseEnrollments,
  getPendingEnrollments,
  approveEnrollment,
  rejectEnrollment
};

export default enrollmentService;
