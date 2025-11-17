const pool = require('../db/mysql');

/**
 * Get all leave types
 */
async function getAllLeaveTypes() {
  const [types] = await pool.query(
    'SELECT * FROM leave_types WHERE is_active = TRUE ORDER BY type_name'
  );
  return types;
}

/**
 * Get leave type by ID
 */
async function getLeaveTypeById(leaveTypeId) {
  const [types] = await pool.query(
    'SELECT * FROM leave_types WHERE leave_type_id = ?',
    [leaveTypeId]
  );
  return types[0] || null;
}

/**
 * Create a leave request
 */
async function createLeaveRequest(userId, leaveTypeId, start_date, end_date, reason) {
  const start = new Date(start_date);
  const end = new Date(end_date);
  const numberOfDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  const [result] = await pool.query(
    `INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, reason, number_of_days, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [userId, leaveTypeId, start_date, end_date, reason, numberOfDays]
  );
  
  return getLeaveRequestById(result.insertId);
}

/**
 * Get leave request by ID
 */
async function getLeaveRequestById(leaveRequestId) {
  const [requests] = await pool.query(
    `SELECT lr.*, lt.type_name, 
            u.first_name, u.last_name, u.email,
            approver.first_name as approver_first_name, 
            approver.last_name as approver_last_name
     FROM leave_requests lr
     LEFT JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
     LEFT JOIN users u ON lr.user_id = u.id
     LEFT JOIN users approver ON lr.approved_by = approver.id
     WHERE lr.leave_request_id = ?`,
    [leaveRequestId]
  );
  return requests[0] || null;
}

/**
 * Get user's leave requests with filtering
 */
async function getUserLeaveRequests(userId, filters = {}) {
  const { status, page = 1, limit = 10 } = filters;
  
  let query = `SELECT lr.*, lt.type_name 
               FROM leave_requests lr
               LEFT JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
               WHERE lr.user_id = ?`;
  
  const params = [userId];
  
  if (status) {
    query += ' AND lr.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY lr.start_date DESC';
  
  const offset = (page - 1) * limit;
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const [requests] = await pool.query(query, params);
  
  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM leave_requests WHERE user_id = ?';
  const countParams = [userId];
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }
  
  const [countResult] = await pool.query(countQuery, countParams);
  
  return {
    requests,
    total: countResult[0].total,
    page,
    limit,
    pages: Math.ceil(countResult[0].total / limit)
  };
}

/**
 * Get all pending leave requests (for admin approval)
 */
async function getPendingLeaveRequests(filters = {}) {
  const { page = 1, limit = 10, search = '' } = filters;
  
  let query = `SELECT lr.*, lt.type_name, 
               u.first_name, u.last_name, u.email
               FROM leave_requests lr
               LEFT JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
               LEFT JOIN users u ON lr.user_id = u.id
               WHERE lr.status = 'pending'`;
  
  const params = [];
  
  if (search) {
    query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  query += ' ORDER BY lr.start_date DESC';
  
  const offset = (page - 1) * limit;
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const [requests] = await pool.query(query, params);
  
  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM leave_requests lr LEFT JOIN users u ON lr.user_id = u.id WHERE lr.status = ?';
  const countParams = ['pending'];
  
  if (search) {
    countQuery += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
    const searchTerm = `%${search}%`;
    countParams.push(searchTerm, searchTerm, searchTerm);
  }
  
  const [countResult] = await pool.query(countQuery, countParams);
  const total = countResult[0]?.total || 0;
  
  return {
    requests: requests || [],
    total: total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1
  };
}

/**
 * Approve leave request
 */
async function approveLeaveRequest(leaveRequestId, approvedBy) {
  await pool.query(
    `UPDATE leave_requests 
     SET status = 'approved', approved_by = ?, approval_date = NOW()
     WHERE leave_request_id = ?`,
    [approvedBy, leaveRequestId]
  );
  
  return getLeaveRequestById(leaveRequestId);
}

/**
 * Reject leave request
 */
async function rejectLeaveRequest(leaveRequestId, approvedBy, rejectionReason) {
  await pool.query(
    `UPDATE leave_requests 
     SET status = 'rejected', approved_by = ?, approval_date = NOW(), rejection_reason = ?
     WHERE leave_request_id = ?`,
    [approvedBy, rejectionReason, leaveRequestId]
  );
  
  return getLeaveRequestById(leaveRequestId);
}

/**
 * Cancel leave request (by user)
 */
async function cancelLeaveRequest(leaveRequestId, userId) {
  const request = await getLeaveRequestById(leaveRequestId);
  
  if (!request) {
    throw new Error('Leave request not found');
  }
  
  if (request.user_id !== userId) {
    throw new Error('Unauthorized to cancel this request');
  }
  
  if (request.status !== 'pending' && request.status !== 'approved') {
    throw new Error('Cannot cancel a ' + request.status + ' request');
  }
  
  await pool.query(
    'UPDATE leave_requests SET status = ? WHERE leave_request_id = ?',
    ['cancelled', leaveRequestId]
  );
  
  return getLeaveRequestById(leaveRequestId);
}

module.exports = {
  getAllLeaveTypes,
  getLeaveTypeById,
  createLeaveRequest,
  getLeaveRequestById,
  getUserLeaveRequests,
  getPendingLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest
};