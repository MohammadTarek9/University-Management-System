const { errorResponse, successResponse } = require('../utils/responseHelpers');
const userRepo = require('../repositories/userRepo');
const payrollRepo = require('../repositories/payrollRepo');

// GET /api/staff/:id/payroll  (latest)
const getStaffPayroll = async (req, res) => {
  try {
    const staffId = parseInt(req.params.id, 10);
    const user = await userRepo.getUserById(staffId);
    if (!user) {
      return errorResponse(res, 404, 'Staff member not found');
    }

    const isAdmin =
      req.user.role === 'admin' ||
      (Array.isArray(req.user.roles) && req.user.roles.includes('admin'));
    const isSelf = req.user.id === staffId;

    if (!isAdmin && !isSelf) {
      return errorResponse(res, 403, 'Not authorized to view this payroll');
    }

    const payroll = await payrollRepo.getPayrollByUserId(staffId);
    if (!payroll) {
      return successResponse(res, 200, 'No payroll record found', { payroll: null });
    }

    return successResponse(res, 200, 'Payroll retrieved successfully', { payroll });
  } catch (error) {
    console.error('Error getting staff payroll:', error);
    return errorResponse(res, 500, 'Server error while retrieving payroll');
  }
};

// PUT /api/staff/:id/payroll  (append new row)
const updateStaffPayroll = async (req, res) => {
  try {
    const staffId = parseInt(req.params.id, 10);
    const { baseSalary, allowances = 0, deductions = 0, currency = 'EGP' } = req.body;

    const user = await userRepo.getUserById(staffId);
    if (!user) {
      return errorResponse(res, 404, 'Staff member not found');
    }

    const numericBase = Number(baseSalary);
    const numericAllowances = Number(allowances);
    const numericDeductions = Number(deductions);

    if (
      Number.isNaN(numericBase) ||
      Number.isNaN(numericAllowances) ||
      Number.isNaN(numericDeductions)
    ) {
      return errorResponse(res, 400, 'Salary fields must be numeric');
    }

    if (numericBase < 0 || numericAllowances < 0 || numericDeductions < 0) {
      return errorResponse(res, 400, 'Salary fields cannot be negative');
    }

    const netSalary = numericBase + numericAllowances - numericDeductions;

    const payroll = await payrollRepo.insertPayrollForUser({
      userId: staffId,
      baseSalary: numericBase,
      allowances: numericAllowances,
      deductions: numericDeductions,
      netSalary,
      currency,
      adminId: req.user.id,
    });

    return successResponse(res, 200, 'Payroll updated successfully', { payroll });
  } catch (error) {
    console.error('Error updating staff payroll:', error);
    return errorResponse(res, 500, 'Server error while updating payroll');
  }
};

// NEW: GET /api/staff/:id/payroll/history
const getStaffPayrollHistory = async (req, res) => {
  try {
    const staffId = parseInt(req.params.id, 10);

    const user = await userRepo.getUserById(staffId);
    if (!user) {
      return errorResponse(res, 404, 'Staff member not found');
    }

    const isAdmin =
      req.user.role === 'admin' ||
      (Array.isArray(req.user.roles) && req.user.roles.includes('admin'));
    const isSelf = req.user.id === staffId;

    if (!isAdmin && !isSelf) {
      return errorResponse(res, 403, 'Not authorized to view this payroll history');
    }

    const history = await payrollRepo.getPayrollHistoryByUserId(staffId);

    return successResponse(res, 200, 'Payroll history retrieved', { history });
  } catch (error) {
    console.error('Error getting staff payroll history:', error);
    return errorResponse(res, 500, 'Server error while retrieving payroll history');
  }
};

// NEW: list all staff for payroll
// @route GET /api/payroll/staff
// @access Private (admin only)
const getPayrollStaffList = async (req, res) => {
  try {
    const isAdmin =
      req.user.role === 'admin' ||
      (Array.isArray(req.user.roles) && req.user.roles.includes('admin'));

    if (!isAdmin) {
      return errorResponse(res, 403, 'Only admins can view payroll staff list');
    }

    const roles = ['professor', 'ta', 'staff', 'admin'];
    const users = await userRepo.getUsersByRoles(roles);

    return successResponse(res, 200, 'Payroll staff list retrieved', { users });
  } catch (error) {
    console.error('Error getting payroll staff list:', error);
    return errorResponse(res, 500, 'Server error while retrieving payroll staff list');
  }
};

module.exports = {
  getStaffPayroll,
  updateStaffPayroll,
  getStaffPayrollHistory,
  getPayrollStaffList, 
};
