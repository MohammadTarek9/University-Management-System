const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getStaffPayroll,
  updateStaffPayroll,
  getStaffPayrollHistory,
  getPayrollStaffList, // <-- must be included
} = require('../controllers/payrollController');

// list for admin table: GET /api/payroll/staff
router.get('/staff', protect, authorize('admin'), getPayrollStaffList);

// current and history
router.get('/:id/payroll', protect, getStaffPayroll);
router.put('/:id/payroll', protect, authorize('admin'), updateStaffPayroll);
router.get('/:id/payroll/history', protect, getStaffPayrollHistory);

module.exports = router;
