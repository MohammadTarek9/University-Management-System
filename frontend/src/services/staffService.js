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
  
     getAllStaffForPayroll() {
    // backend route: GET /api/staff/directory
    return api.get('/staff/directory', {
      params: {
        // optional: override pagination so you get everyone
        page: 1,
        limit: 1000,
      },
    });
  },
    // used by StaffPayrollListPage ONLY
  getAllStaffForPayroll() {
    // backend: GET /api/payroll/staff
    return api.get('/payroll/staff');
  },

};
