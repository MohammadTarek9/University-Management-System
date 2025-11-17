const pool = require('../config/db');

/**
 * Repository for managing role-specific user details
 * Handles student_details and employee_details tables
 */

// ==================== STUDENT DETAILS ====================

/**
 * Get student details by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Student details or null
 */
async function getStudentDetails(userId) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM student_details WHERE user_id = ?',
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error getting student details:', error);
    throw error;
  }
}

/**
 * Get student details by student ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object|null>} Student details or null
 */
async function getStudentDetailsByStudentId(studentId) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM student_details WHERE student_id = ?',
      [studentId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error getting student details by student_id:', error);
    throw error;
  }
}

/**
 * Create student details
 * @param {number} userId - User ID
 * @param {Object} details - Student details {student_id, enrollment_date, major, year, gpa}
 * @returns {Promise<Object>} Created student details
 */
async function createStudentDetails(userId, details) {
  try {
    const { student_id, enrollment_date, major, year, gpa } = details;
    
    await pool.query(
      `INSERT INTO student_details 
       (user_id, student_id, enrollment_date, major, year, gpa) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, student_id, enrollment_date || null, major || null, year || null, gpa || null]
    );
    
    return await getStudentDetails(userId);
  } catch (error) {
    console.error('Error creating student details:', error);
    throw error;
  }
}

/**
 * Update student details
 * @param {number} userId - User ID
 * @param {Object} details - Student details to update
 * @returns {Promise<Object>} Updated student details
 */
async function updateStudentDetails(userId, details) {
  try {
    const { student_id, enrollment_date, major, year, gpa } = details;
    
    await pool.query(
      `UPDATE student_details 
       SET student_id = COALESCE(?, student_id),
           enrollment_date = COALESCE(?, enrollment_date),
           major = COALESCE(?, major),
           year = COALESCE(?, year),
           gpa = COALESCE(?, gpa)
       WHERE user_id = ?`,
      [student_id, enrollment_date, major, year, gpa, userId]
    );
    
    return await getStudentDetails(userId);
  } catch (error) {
    console.error('Error updating student details:', error);
    throw error;
  }
}

/**
 * Delete student details
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteStudentDetails(userId) {
  try {
    await pool.query('DELETE FROM student_details WHERE user_id = ?', [userId]);
    return true;
  } catch (error) {
    console.error('Error deleting student details:', error);
    throw error;
  }
}

/**
 * Get all students with their details and user info
 * @param {Object} filters - Optional filters {major, year}
 * @returns {Promise<Array>} Array of student records
 */
async function getAllStudents(filters = {}) {
  try {
    let query = `
      SELECT u.id, u.name, u.email, 
             sd.student_id, sd.enrollment_date, sd.major, sd.year, sd.gpa,
             sd.created_at, sd.updated_at
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.role_id
      INNER JOIN student_details sd ON u.id = sd.user_id
      WHERE r.role_name = 'student'
    `;
    
    const params = [];
    
    if (filters.major) {
      query += ' AND sd.major = ?';
      params.push(filters.major);
    }
    
    if (filters.year) {
      query += ' AND sd.year = ?';
      params.push(filters.year);
    }
    
    query += ' ORDER BY u.name';
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error getting all students:', error);
    throw error;
  }
}

// ==================== EMPLOYEE DETAILS ====================

/**
 * Get employee details by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Employee details or null
 */
async function getEmployeeDetails(userId) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM employee_details WHERE user_id = ?',
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error getting employee details:', error);
    throw error;
  }
}

/**
 * Get employee details by employee ID
 * @param {string} employeeId - Employee ID
 * @returns {Promise<Object|null>} Employee details or null
 */
async function getEmployeeDetailsByEmployeeId(employeeId) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM employee_details WHERE employee_id = ?',
      [employeeId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error getting employee details by employee_id:', error);
    throw error;
  }
}

/**
 * Create employee details
 * @param {number} userId - User ID
 * @param {Object} details - Employee details {employee_id, department, hire_date, position, office_location, phone_extension}
 * @returns {Promise<Object>} Created employee details
 */
async function createEmployeeDetails(userId, details) {
  try {
    const { employee_id, department, hire_date, position, office_location, phone_extension } = details;
    
    await pool.query(
      `INSERT INTO employee_details 
       (user_id, employee_id, department, hire_date, position, office_location, phone_extension) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, employee_id, department || null, hire_date || null, position || null, office_location || null, phone_extension || null]
    );
    
    return await getEmployeeDetails(userId);
  } catch (error) {
    console.error('Error creating employee details:', error);
    throw error;
  }
}

/**
 * Update employee details
 * @param {number} userId - User ID
 * @param {Object} details - Employee details to update
 * @returns {Promise<Object>} Updated employee details
 */
async function updateEmployeeDetails(userId, details) {
  try {
    const { employee_id, department, hire_date, position, office_location, phone_extension } = details;
    
    await pool.query(
      `UPDATE employee_details 
       SET employee_id = COALESCE(?, employee_id),
           department = COALESCE(?, department),
           hire_date = COALESCE(?, hire_date),
           position = COALESCE(?, position),
           office_location = COALESCE(?, office_location),
           phone_extension = COALESCE(?, phone_extension)
       WHERE user_id = ?`,
      [employee_id, department, hire_date, position, office_location, phone_extension, userId]
    );
    
    return await getEmployeeDetails(userId);
  } catch (error) {
    console.error('Error updating employee details:', error);
    throw error;
  }
}

/**
 * Delete employee details
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteEmployeeDetails(userId) {
  try {
    await pool.query('DELETE FROM employee_details WHERE user_id = ?', [userId]);
    return true;
  } catch (error) {
    console.error('Error deleting employee details:', error);
    throw error;
  }
}

/**
 * Get all employees with their details and user info
 * @param {Object} filters - Optional filters {department, position, role_name}
 * @returns {Promise<Array>} Array of employee records
 */
async function getAllEmployees(filters = {}) {
  try {
    let query = `
      SELECT u.id, u.name, u.email, r.role_name,
             ed.employee_id, ed.department, ed.hire_date, ed.position, 
             ed.office_location, ed.phone_extension,
             ed.created_at, ed.updated_at
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.role_id
      INNER JOIN employee_details ed ON u.id = ed.user_id
      WHERE r.role_name IN ('professor', 'staff', 'admin')
    `;
    
    const params = [];
    
    if (filters.department) {
      query += ' AND ed.department = ?';
      params.push(filters.department);
    }
    
    if (filters.position) {
      query += ' AND ed.position = ?';
      params.push(filters.position);
    }
    
    if (filters.role_name) {
      query += ' AND r.role_name = ?';
      params.push(filters.role_name);
    }
    
    query += ' ORDER BY u.name';
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error getting all employees:', error);
    throw error;
  }
}

// ==================== COMBINED FUNCTIONS ====================

/**
 * Get user with role-specific details
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User object with role-specific details
 */
async function getUserWithRoleDetails(userId) {
  try {
    // Get basic user info
    const [userRows] = await pool.query(
      `SELECT u.*, r.role_name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.role_id
       WHERE u.id = ?`,
      [userId]
    );
    
    if (userRows.length === 0) {
      return null;
    }
    
    const user = userRows[0];
    
    // Get role-specific details
    if (user.role_name === 'student') {
      user.student_details = await getStudentDetails(userId);
    } else if (['professor', 'staff', 'admin'].includes(user.role_name)) {
      user.employee_details = await getEmployeeDetails(userId);
    }
    
    return user;
  } catch (error) {
    console.error('Error getting user with role details:', error);
    throw error;
  }
}

module.exports = {
  // Student functions
  getStudentDetails,
  getStudentDetailsByStudentId,
  createStudentDetails,
  updateStudentDetails,
  deleteStudentDetails,
  getAllStudents,
  
  // Employee functions
  getEmployeeDetails,
  getEmployeeDetailsByEmployeeId,
  createEmployeeDetails,
  updateEmployeeDetails,
  deleteEmployeeDetails,
  getAllEmployees,
  
  // Combined functions
  getUserWithRoleDetails
};
