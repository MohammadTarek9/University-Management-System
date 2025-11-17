const pool = require('../db/mysql');

// Map DB row to JS object with subject, department, and instructor info
function mapCourseRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    subjectId: row.subject_id,
    semester: row.semester,
    year: row.year,
    instructorId: row.instructor_id,
    maxEnrollment: row.max_enrollment,
    currentEnrollment: row.current_enrollment,
    schedule: row.schedule,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Subject information
    subject: row.subject_name ? {
      id: row.subject_id,
      name: row.subject_name,
      code: row.subject_code,
      credits: parseFloat(row.subject_credits),
      classification: row.subject_classification,
      departmentId: row.department_id
    } : null,
    // Department information
    department: row.department_name ? {
      id: row.department_id,
      name: row.department_name,
      code: row.department_code
    } : null,
    // Instructor information
    instructor: row.instructor_first_name ? {
      id: row.instructor_id,
      firstName: row.instructor_first_name,
      lastName: row.instructor_last_name,
      email: row.instructor_email
    } : null
  };
}

// Build WHERE clause for filtering
function buildCourseFilter({ search, subjectId, departmentId, semester, year, instructorId, isActive }) {
  const where = [];
  const params = [];

  if (search && search.trim() !== '') {
    const like = `%${search.trim()}%`;
    where.push('(s.name LIKE ? OR s.code LIKE ? OR c.schedule LIKE ?)');
    params.push(like, like, like);
  }

  if (subjectId) {
    where.push('c.subject_id = ?');
    params.push(subjectId);
  }

  if (departmentId) {
    where.push('s.department_id = ?');
    params.push(departmentId);
  }

  if (semester) {
    where.push('c.semester = ?');
    params.push(semester);
  }

  if (year) {
    where.push('c.year = ?');
    params.push(year);
  }

  if (instructorId) {
    where.push('c.instructor_id = ?');
    params.push(instructorId);
  }

  if (isActive !== undefined && isActive !== null && isActive !== '') {
    where.push('c.is_active = ?');
    params.push(isActive ? 1 : 0);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { whereSql, params };
}

// Get all courses with optional filtering and pagination
async function getAllCourses({ 
  page = 1, 
  limit = 50, 
  search = '', 
  subjectId = null,
  departmentId = null,
  semester = null,
  year = null,
  instructorId = null,
  isActive = null 
} = {}) {
  const offset = (page - 1) * limit;
  const { whereSql, params } = buildCourseFilter({ 
    search, subjectId, departmentId, semester, year, instructorId, isActive 
  });

  const [rows] = await pool.query(
    `
    SELECT
      c.id,
      c.subject_id,
      c.semester,
      c.year,
      c.instructor_id,
      c.max_enrollment,
      c.current_enrollment,
      c.schedule,
      c.is_active,
      c.created_at,
      c.updated_at,
      s.name AS subject_name,
      s.code AS subject_code,
      s.credits AS subject_credits,
      s.classification AS subject_classification,
      s.department_id,
      d.name AS department_name,
      d.code AS department_code,
      u.first_name AS instructor_first_name,
      u.last_name AS instructor_last_name,
      u.email AS instructor_email
    FROM courses c
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN users u ON c.instructor_id = u.id
    ${whereSql}
    ORDER BY c.year DESC, c.semester ASC, s.code ASC
    LIMIT ? OFFSET ?
    `,
    [...params, Number(limit), Number(offset)]
  );

  const courses = rows.map(mapCourseRow);

  const [countRows] = await pool.query(
    `
    SELECT COUNT(*) AS total 
    FROM courses c
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN users u ON c.instructor_id = u.id
    ${whereSql}
    `,
    params
  );

  const totalCourses = countRows[0]?.total || 0;

  return { courses, totalCourses };
}

// Get single course by ID with full details
async function getCourseById(id) {
  const [rows] = await pool.query(
    `
    SELECT
      c.id,
      c.subject_id,
      c.semester,
      c.year,
      c.instructor_id,
      c.max_enrollment,
      c.current_enrollment,
      c.schedule,
      c.is_active,
      c.created_at,
      c.updated_at,
      s.name AS subject_name,
      s.code AS subject_code,
      s.credits AS subject_credits,
      s.classification AS subject_classification,
      s.department_id,
      d.name AS department_name,
      d.code AS department_code,
      u.first_name AS instructor_first_name,
      u.last_name AS instructor_last_name,
      u.email AS instructor_email
    FROM courses c
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE c.id = ?
    `,
    [id]
  );

  return rows.length > 0 ? mapCourseRow(rows[0]) : null;
}

// Get courses by subject ID
async function getCoursesBySubject(subjectId) {
  const [rows] = await pool.query(
    `
    SELECT
      c.id,
      c.subject_id,
      c.semester,
      c.year,
      c.instructor_id,
      c.max_enrollment,
      c.current_enrollment,
      c.schedule,
      c.is_active,
      c.created_at,
      c.updated_at,
      s.name AS subject_name,
      s.code AS subject_code,
      s.credits AS subject_credits,
      s.classification AS subject_classification,
      s.department_id,
      d.name AS department_name,
      d.code AS department_code,
      u.first_name AS instructor_first_name,
      u.last_name AS instructor_last_name,
      u.email AS instructor_email
    FROM courses c
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE c.subject_id = ?
    ORDER BY c.year DESC, c.semester ASC
    `,
    [subjectId]
  );

  return rows.map(mapCourseRow);
}

// Create a new course
async function createCourse(courseData) {
  const { 
    subjectId, 
    semester, 
    year, 
    instructorId, 
    maxEnrollment, 
    schedule 
  } = courseData;

  const [result] = await pool.query(
    `
    INSERT INTO courses (
      subject_id,
      semester,
      year,
      instructor_id,
      max_enrollment,
      current_enrollment,
      schedule,
      is_active,
      created_at
    ) VALUES (?, ?, ?, ?, ?, 0, ?, 1, NOW())
    `,
    [subjectId, semester, year, instructorId, maxEnrollment, schedule]
  );

  return getCourseById(result.insertId);
}

// Update a course
async function updateCourse(id, updateData) {
  const fields = [];
  const params = [];

  if (updateData.subjectId !== undefined) {
    fields.push('subject_id = ?');
    params.push(updateData.subjectId);
  }
  if (updateData.semester !== undefined) {
    fields.push('semester = ?');
    params.push(updateData.semester);
  }
  if (updateData.year !== undefined) {
    fields.push('year = ?');
    params.push(updateData.year);
  }
  if (updateData.instructorId !== undefined) {
    fields.push('instructor_id = ?');
    params.push(updateData.instructorId);
  }
  if (updateData.maxEnrollment !== undefined) {
    fields.push('max_enrollment = ?');
    params.push(updateData.maxEnrollment);
  }
  if (updateData.currentEnrollment !== undefined) {
    fields.push('current_enrollment = ?');
    params.push(updateData.currentEnrollment);
  }
  if (updateData.schedule !== undefined) {
    fields.push('schedule = ?');
    params.push(updateData.schedule);
  }
  if (updateData.isActive !== undefined) {
    fields.push('is_active = ?');
    params.push(updateData.isActive ? 1 : 0);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  params.push(id);

  await pool.query(
    `UPDATE courses SET ${fields.join(', ')} WHERE id = ?`,
    params
  );

  return getCourseById(id);
}

// Delete a course
async function deleteCourse(id) {
  const [result] = await pool.query(
    'DELETE FROM courses WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
}

// Check if a subject has associated courses
async function checkSubjectHasCourses(subjectId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS count FROM courses WHERE subject_id = ?',
    [subjectId]
  );

  return rows[0].count > 0;
}

// Increment enrollment count
async function incrementEnrollment(courseId) {
  await pool.query(
    'UPDATE courses SET current_enrollment = current_enrollment + 1 WHERE id = ?',
    [courseId]
  );

  return getCourseById(courseId);
}

// Decrement enrollment count
async function decrementEnrollment(courseId) {
  await pool.query(
    'UPDATE courses SET current_enrollment = GREATEST(current_enrollment - 1, 0) WHERE id = ?',
    [courseId]
  );

  return getCourseById(courseId);
}

module.exports = {
  getAllCourses,
  getCourseById,
  getCoursesBySubject,
  createCourse,
  updateCourse,
  deleteCourse,
  checkSubjectHasCourses,
  incrementEnrollment,
  decrementEnrollment
};
