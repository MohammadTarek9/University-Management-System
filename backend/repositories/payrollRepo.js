const pool = require('../db/mysql');
const Payroll = require('../models/Payroll');

// Get latest payroll for a user
const getPayrollByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT *
       FROM payroll
      WHERE user_id = ?
      ORDER BY effective_from DESC, last_updated_at DESC
      LIMIT 1`,
    [userId]
  );

  if (!rows || rows.length === 0) return null;
  return new Payroll(rows[0]);
};

// NEW: get full payroll history for a user
const getPayrollHistoryByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT *
       FROM payroll
      WHERE user_id = ?
      ORDER BY effective_from DESC, last_updated_at DESC`,
    [userId]
  );

  if (!rows || rows.length === 0) return [];
  return rows.map((row) => new Payroll(row));
};

// INSERT ONLY: every update creates a new row
const insertPayrollForUser = async ({
  userId,
  baseSalary,
  allowances,
  deductions,
  netSalary,
  currency,
  adminId,
}) => {
  const [result] = await pool.query(
    `INSERT INTO payroll (
       user_id,
       base_salary,
       allowances,
       deductions,
       net_salary,
       currency,
       effective_from,
       last_updated_at,
       last_updated_by
     ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE, NOW(), ?)`,
    [userId, baseSalary, allowances, deductions, netSalary, currency, adminId]
  );

  // result.insertId is the new row's id
  const insertedId = result.insertId;
  const [rows] = await pool.query(
    `SELECT *
       FROM payroll
      WHERE id = ?`,
    [insertedId]
  );

  return new Payroll(rows[0]);
};

module.exports = {
  getPayrollByUserId,
  insertPayrollForUser,
  getPayrollHistoryByUserId,
};
