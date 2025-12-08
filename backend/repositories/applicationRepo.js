const pool = require('../db/mysql');


// Map a DB row -> JS object in the shape your API/frontend expects
function mapApplicationRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    applicationId: row.application_id,
    status: row.status,
    submittedAt: row.submitted_at,
    lastModified: row.last_modified || row.updated_at || row.submitted_at,

    personalInfo: {
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      dateOfBirth: row.date_of_birth,
      nationality: row.nationality,
      department: row.department,
      address: {
        street: row.address_street,
        city: row.address_city,
        state: row.address_state,
        zipCode: row.address_zip_code,
        country: row.address_country
      }
    },

    academicInfo: {
      major: row.major,
      degreeLevel: row.degree_level,
      intendedStartDate: row.intended_start_date,
      previousEducation: {
        institution: row.previous_institution,
        degree: row.previous_degree,
        graduationDate: row.graduation_date,
        gpa: row.gpa
      }
    },

    processingInfo: {
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      rejectionReason: row.rejection_reason,
      notes: row.notes
    },

    studentCredentials: {
      studentId: row.student_credentials_student_id,
      universityEmail: row.student_credentials_university_email,
      temporaryPassword: row.student_credentials_temporary_password,
      credentialsGeneratedAt: row.student_credentials_generated_at,
      credentialsGeneratedBy: row.student_credentials_generated_by,
      accountCreated: !!row.student_credentials_account_created,
      accountCreatedAt: row.student_credentials_account_created_at,
      accountCreatedBy: row.student_credentials_account_created_by
    }
  };
}

// Generate APP-YYYY-XXXXXX like the old Mongoose pre-save
function generateApplicationId() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `APP-${year}-${random}`;
}

// Flatten the old request body into columns of the applications table
function buildInsertParams(data, reviewerUserId) {
  const p = data.personalInfo || {};
  const addr = (p.address || {});
  const a = data.academicInfo || {};
  const prev = (a.previousEducation || {});

  return [
    // basic
    p.firstName,
    p.lastName,
    p.email,
    p.phone,
    p.dateOfBirth,
    p.nationality,
    p.department,

    // address
    addr.street,
    addr.city,
    addr.state,
    addr.zipCode,
    addr.country,

    // academic
    a.major,
    a.degreeLevel,
    a.intendedStartDate,
    prev.institution,
    prev.degree,
    prev.graduationDate,
    prev.gpa,

    // status / processing
    data.status || 'Pending Review',
    reviewerUserId || null,
    null,              // reviewed_at – you can set this later
    data.processingInfo?.rejectionReason || null,
    data.processingInfo?.notes || null,

    // student credentials (initially null)
    null, // student_credentials_student_id
    null, // student_credentials_university_email
    null, // student_credentials_temporary_password
    null, // student_credentials_generated_at
    null, // student_credentials_generated_by

    // application_id (we generate)
    generateApplicationId()
  ];
}

// ---------- Repository API ----------

async function createApplication(data, reviewerUserId) {
  const sql = `
    INSERT INTO applications (
      first_name, last_name, email, phone, date_of_birth, nationality, department,
      address_street, address_city, address_state, address_zip_code, address_country,
      major, degree_level, intended_start_date,
      previous_institution, previous_degree, graduation_date, gpa,
      status, reviewed_by, reviewed_at, rejection_reason, notes,
      student_credentials_student_id,
      student_credentials_university_email,
      student_credentials_temporary_password,
      student_credentials_generated_at,
      student_credentials_generated_by,
      application_id
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const params = buildInsertParams(data, reviewerUserId);
  const [result] = await pool.query(sql, params);

  return getApplicationById(result.insertId);
}

async function getApplicationById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM applications WHERE id = ?',
    [id]
  );
  return mapApplicationRow(rows[0]);
}

async function getApplications(options = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    department,
    search,
    sortBy = 'submitted_at',
    sortOrder = 'DESC'
  } = options;

  const whereClauses = [];
  const params = [];

  if (status && status !== 'all') {
    whereClauses.push('status = ?');
    params.push(status);
  }

  if (department && department !== 'all') {
    whereClauses.push('department = ?');
    params.push(department);
  }

  if (search && search.trim()) {
    const like = `%${search.trim()}%`;
    whereClauses.push(
      '(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR application_id LIKE ?)'
    );
    params.push(like, like, like, like);
  }

  const whereSql = whereClauses.length
    ? `WHERE ${whereClauses.join(' AND ')}`
    : '';

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [rows] = await pool.query(
    `
      SELECT *
      FROM applications
      ${whereSql}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}
      LIMIT ? OFFSET ?
    `,
    [...params, parseInt(limit, 10), offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM applications ${whereSql}`,
    params
  );
  const total = countRows[0].total;
  const totalPages = Math.ceil(total / parseInt(limit, 10));

  return {
    applications: rows.map(mapApplicationRow),
    pagination: {
      currentPage: parseInt(page, 10),
      totalPages,
      totalApplications: total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit: parseInt(limit, 10)
    }
  };
}

async function updateApplication(id, data, reviewerUserId) {
  const p = data.personalInfo || {};
  const addr = p.address || {};
  const a = data.academicInfo || {};
  const prev = a.previousEducation || {};
  const processing = data.processingInfo || {};

  const sql = `
    UPDATE applications
    SET
      first_name = ?,
      last_name = ?,
      email = ?,
      phone = ?,
      date_of_birth = ?,
      nationality = ?,
      department = ?,
      address_street = ?,
      address_city = ?,
      address_state = ?,
      address_zip_code = ?,
      address_country = ?,
      major = ?,
      degree_level = ?,
      intended_start_date = ?,
      previous_institution = ?,
      previous_degree = ?,
      graduation_date = ?,
      gpa = ?,
      reviewed_by = ?,
      reviewed_at = ?,
      rejection_reason = ?,
      notes = ?
    WHERE id = ?
  `;

  const params = [
    p.firstName,
    p.lastName,
    p.email,
    p.phone,
    p.dateOfBirth,
    p.nationality,
    p.department,
    addr.street,
    addr.city,
    addr.state,
    addr.zipCode,
    addr.country,
    a.major,
    a.degreeLevel,
    a.intendedStartDate,
    prev.institution,
    prev.degree,
    prev.graduationDate,
    prev.gpa,
    reviewerUserId || null,
    processing.reviewedAt || new Date(),
    processing.rejectionReason || null,
    processing.notes || null,
    id
  ];

  await pool.query(sql, params);
  return getApplicationById(id);
}

async function updateApplicationStatus(id, { status, rejectionReason, notes, reviewerId, studentCredentials }) {
  let sql = `
    UPDATE applications
    SET
      status = ?,
      rejection_reason = ?,
      notes = ?,
      reviewed_by = ?,
      reviewed_at = NOW()
  `;
  
  const params = [
    status,
    rejectionReason || null,
    notes || null,
    reviewerId || null
  ];

  // If student credentials provided (on approval), update those fields too
  if (studentCredentials) {
    sql += `,
      student_credentials_student_id = ?,
      student_credentials_university_email = ?,
      student_credentials_temporary_password = ?,
      student_credentials_generated_at = NOW(),
      student_credentials_generated_by = ?
    `;
    params.push(
      studentCredentials.studentId,
      studentCredentials.universityEmail,
      studentCredentials.temporaryPassword,
      studentCredentials.credentialsGeneratedBy
    );
  }
  
  sql += ` WHERE id = ?`;
  params.push(id);
  
  await pool.query(sql, params);
  return getApplicationById(id);
}

async function deleteApplication(id) {
  const [result] = await pool.query(
    'DELETE FROM applications WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

async function getStatistics() {
  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'Pending Review' THEN 1 ELSE 0 END) AS pending_review,
      SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) AS under_review,
      SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected,
      SUM(CASE WHEN status = 'Waitlisted' THEN 1 ELSE 0 END) AS waitlisted
    FROM applications
  `);

  return rows[0];
}

async function getDistinctInstitutions() {
  const [rows] = await pool.query(
    'SELECT DISTINCT previous_institution AS institution FROM applications WHERE previous_institution IS NOT NULL AND previous_institution <> \'\''
  );
  return rows.map(r => r.institution);
}

async function getStudentCredentialsForApplication(id) {
  const [rows] = await pool.query(
    `
      SELECT
        student_credentials_student_id     AS studentId,
        student_credentials_university_email AS universityEmail,
        student_credentials_temporary_password AS temporaryPassword,
        student_credentials_generated_at  AS credentialsGeneratedAt
      FROM applications
      WHERE id = ?
    `,
    [id]
  );
  return rows[0] || null;
}

async function saveStudentCredentials(id, credentials, adminUserId) {
  const sql = `
    UPDATE applications
    SET
      student_credentials_student_id = ?,
      student_credentials_university_email = ?,
      student_credentials_temporary_password = ?,
      student_credentials_generated_at = NOW(),
      student_credentials_generated_by = ?
    WHERE id = ?
  `;
  const params = [
    credentials.studentId,
    credentials.universityEmail,
    credentials.temporaryPassword,
    adminUserId || null,
    id
  ];
  await pool.query(sql, params);
  return getStudentCredentialsForApplication(id);
}

async function markAccountCreated(id, adminUserId) {
  const sql = `
    UPDATE applications
    SET
      student_credentials_account_created = 1,
      student_credentials_account_created_at = NOW(),
      student_credentials_account_created_by = ?
    WHERE id = ?
  `;
  const params = [adminUserId || null, id];
  
  await pool.query(sql, params);
  return getApplicationById(id);
}

module.exports = {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  getStatistics,
  getDistinctInstitutions,
  getStudentCredentialsForApplication,
  saveStudentCredentials,
  markAccountCreated
};
