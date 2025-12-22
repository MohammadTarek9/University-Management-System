import api from './api';

export const staffService = {
  // Save assignment
  assignTAResponsibility(data) {
    // { taUserId, courseId, responsibilityType, notes }
    return api.post('/staff/ta-assignments', data);
  },

  // Get TAs eligible for a given course (subject-based on backend)
  getEligibleTAs(courseId) {
    return api.get('/staff/ta-eligible', {
      params: { courseId },
    });
  },
  getMyResponsibilities() {
    return api.get('/staff/my-ta-responsibilities');
  },
};
