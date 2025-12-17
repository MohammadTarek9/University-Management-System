const pool = require('../db/mysql');

/**
 * Enrollment Repository
 * Manages student course enrollments
 */

/**
 * Create a new enrollment
 */
async function createEnrollment(enrollmentData) {
  const { studentId, courseId, status = 'enrolled' } = enrollmentData;
  
  const now = new Date();
  
  const [result] = await pool.query(
    `INSERT INTO enrollments (student_id, course_id, status, enrollment_date, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    [studentId, courseId, status, now, now, now]
  );
  
  return await getEnrollmentById(result.insertId);
}

/**
 * Get enrollment by ID
 */
async function getEnrollmentById(enrollmentId) {
  const [rows] = await pool.query(
    `SELECT * FROM enrollments WHERE enrollment_id = ?`,
    [enrollmentId]
  );
  
  return rows[0] || null;
}

/**
 * Get enrollments by student ID
 */
async function getEnrollmentsByStudent(studentId, options = {}) {
  const { status, isActive, semester, year } = options;
  
  let query = `
    SELECT 
      e.*,
      u.first_name, u.last_name, u.email
    FROM enrollments e
    JOIN users u ON e.student_id = u.id
    WHERE e.student_id = ?
  `;
  
  const params = [studentId];
  
  if (status) {
    query += ` AND e.status = ?`;
    params.push(status);
  }
  
  if (isActive !== undefined) {
    query += ` AND e.is_active = ?`;
    params.push(isActive ? 1 : 0);
  }
  
  query += ` ORDER BY e.created_at DESC`;
  
  const [rows] = await pool.query(query, params);
  return rows;
}

/**
 * Get enrollments by course ID
 */
async function getEnrollmentsByCourse(courseId, options = {}) {
  const { status, isActive } = options;
  
  let query = `
    SELECT 
      e.*,
      u.first_name, u.last_name, u.email, u.student_id as user_student_id
    FROM enrollments e
    JOIN users u ON e.student_id = u.id
    WHERE e.course_id = ?
  `;
  
  const params = [courseId];
  
  if (status) {
    query += ` AND e.status = ?`;
    params.push(status);
  }
  
  if (isActive !== undefined) {
    query += ` AND e.is_active = ?`;
    params.push(isActive ? 1 : 0);
  }
  
  query += ` ORDER BY u.last_name, u.first_name`;
  
  const [rows] = await pool.query(query, params);
  return rows;
}

/**
 * Check if student is enrolled in a course
 */
async function isStudentEnrolled(studentId, courseId) {
  const [rows] = await pool.query(
    `SELECT enrollment_id FROM enrollments 
     WHERE student_id = ? AND course_id = ? AND status = 'enrolled' AND is_active = 1`,
    [studentId, courseId]
  );
  
  return rows.length > 0;
}

/**
 * Get enrollment count for a course
 */
async function getCourseEnrollmentCount(courseId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM enrollments 
     WHERE course_id = ? AND status = 'enrolled' AND is_active = 1`,
    [courseId]
  );
  
  return rows[0].count;
}

/**
 * Update enrollment status
 */
async function updateEnrollmentStatus(enrollmentId, status) {
  const now = new Date();
  
  await pool.query(
    `UPDATE enrollments SET status = ?, updated_at = ? WHERE enrollment_id = ?`,
    [status, now, enrollmentId]
  );
  
  return await getEnrollmentById(enrollmentId);
}

/**
 * Drop enrollment (set status to dropped)
 */
async function dropEnrollment(enrollmentId) {
  return await updateEnrollmentStatus(enrollmentId, 'dropped');
}

/**
 * Update enrollment grade
 */
async function updateEnrollmentGrade(enrollmentId, grade, gradePoints) {
  const now = new Date();
  
  await pool.query(
    `UPDATE enrollments SET grade = ?, grade_points = ?, updated_at = ? WHERE enrollment_id = ?`,
    [grade, gradePoints, now, enrollmentId]
  );
  
  return await getEnrollmentById(enrollmentId);
}

/**
 * Delete enrollment
 */
async function deleteEnrollment(enrollmentId) {
  await pool.query(
    `DELETE FROM enrollments WHERE enrollment_id = ?`,
    [enrollmentId]
  );
  
  return true;
}

/**
 * Get all enrollments with optional filters
 */
async function getAllEnrollments(options = {}) {
  const { status, isActive } = options;
  
  let query = `SELECT * FROM enrollments WHERE 1=1`;
  const params = [];
  
  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }
  
  if (isActive !== undefined) {
    query += ` AND is_active = ?`;
    params.push(isActive ? 1 : 0);
  }
  
  query += ` ORDER BY enrollment_date DESC`;
  
  const [rows] = await pool.query(query, params);
  return rows;
}

/**
 * Update enrollment status
 */
async function updateEnrollmentStatus(enrollmentId, status, reason = null) {
  const now = new Date();
  
  const query = reason
    ? `UPDATE enrollments SET status = ?, updated_at = ? WHERE enrollment_id = ?`
    : `UPDATE enrollments SET status = ?, updated_at = ? WHERE enrollment_id = ?`;
  
  const params = reason
    ? [status, now, enrollmentId]
    : [status, now, enrollmentId];
  
  await pool.query(query, params);
  
  return await getEnrollmentById(enrollmentId);
}

/**
 * Get student's current semester enrollments
 */
async function getStudentCurrentEnrollments(studentId) {
  const [rows] = await pool.query(
    `SELECT e.*, ee.entity_type, ee.name as course_name
     FROM enrollments e
     JOIN eav_entities ee ON e.course_id = ee.entity_id
     WHERE e.student_id = ? AND e.status = 'enrolled' AND e.is_active = 1
     ORDER BY e.created_at DESC`,
    [studentId]
  );
  
  return rows;
}

module.exports = {
  createEnrollment,
  getEnrollmentById,
  getEnrollmentsByStudent,
  getEnrollmentsByCourse,
  isStudentEnrolled,
  getCourseEnrollmentCount,
  getAllEnrollments,
  updateEnrollmentStatus,
  dropEnrollment,
  updateEnrollmentGrade,
  deleteEnrollment,
  getStudentCurrentEnrollments
};
