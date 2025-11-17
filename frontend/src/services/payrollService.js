import api from './api';

export const payrollService = {
  getStaffPayroll(staffId) {
    return api
      .get(`/payroll/${staffId}/payroll`)
      .then((res) => res.data.data || res.data);
  },

  updateStaffPayroll(staffId, payload) {
    return api
      .put(`/payroll/${staffId}/payroll`, payload)
      .then((res) => res.data.data || res.data);
  },

  getStaffPayrollHistory(staffId) {
    return api
      .get(`/payroll/${staffId}/payroll/history`)
      .then((res) => res.data.data || res.data);
  },
};
