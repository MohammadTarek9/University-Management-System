const pool = require('../db/mysql'); // your mysql2/promise pool

// Map a DB row -> JS object in the shape your API/frontend expects
function mapUserRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`,
    email: row.email,
    role: row.role,

    studentId: row.student_id,
    employeeId: row.employee_id,
    department: row.department,
    major: row.major,
    phoneNumber: row.phone_number,

    isActive: !!row.is_active,
    isEmailVerified: !!row.is_email_verified,
    profilePicture: row.profile_picture,

    lastLogin: row.last_login,
    firstLogin: !!row.first_login,
    mustChangePassword: !!row.must_change_password,
    securityQuestion: row.security_question,
    
    resetPasswordToken: row.reset_password_token,
    resetPasswordExpire: row.reset_password_expire,
    emailVerificationToken: row.email_verification_token,
    emailVerificationExpire: row.email_verification_expire,

    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Build WHERE clause for filtering in list endpoint
function buildUserFilter({ search, role }) {
  const where = [];
  const params = [];

  if (search && search.trim() !== '') {
    const like = `%${search.trim()}%`;
    where.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
    params.push(like, like, like);
  }

  if (role && role.trim() !== '') {
    where.push('role = ?');
    params.push(role);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { whereSql, params };
}

// List users with pagination + optional search/role filter
async function getUsers({ page = 1, limit = 10, search = '', role = '' }) {
  const offset = (page - 1) * limit;
  const { whereSql, params } = buildUserFilter({ search, role });

  const [rows] = await pool.query(
    `
    SELECT
      id,
      first_name,
      last_name,
      email,
      role,
      student_id,
      employee_id,
      department,
      major,
      phone_number,
      is_active,
      is_email_verified,
      profile_picture,
      last_login,
      first_login,
      must_change_password,
      security_question,
      reset_password_token,
      reset_password_expire,
      email_verification_token,
      email_verification_expire,
      created_at,
      updated_at
    FROM users
    ${whereSql}
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
    `,
    [...params, Number(limit), Number(offset)]
  );

  const users = rows.map(mapUserRow);

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM users ${whereSql}`,
    params
  );
  const totalUsers = countRows[0]?.total || 0;

  return { users, totalUsers };
}

// Get single user by ID
async function getUserById(id) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      first_name,
      last_name,
      email,
      role,
      student_id,
      employee_id,
      department,
      major,
      phone_number,
      is_active,
      is_email_verified,
      profile_picture,
      last_login,
      first_login,
      must_change_password,
      security_question,
      reset_password_token,
      reset_password_expire,
      email_verification_token,
      email_verification_expire,
      created_at,
      updated_at
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );

  return mapUserRow(rows[0]);
}

// Lookups for unique fields
async function getUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT * FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] ? mapUserRow(rows[0]) : null;
}

async function getUserByStudentId(studentId) {
  const [rows] = await pool.query(
    `SELECT * FROM users WHERE student_id = ? LIMIT 1`,
    [studentId]
  );
  return rows[0] ? mapUserRow(rows[0]) : null;
}

async function getUserByEmployeeId(employeeId) {
  const [rows] = await pool.query(
    `SELECT * FROM users WHERE employee_id = ? LIMIT 1`,
    [employeeId]
  );
  return rows[0] ? mapUserRow(rows[0]) : null;
}

// Create user (expects password already hashed)
async function createUser(userData) {
  const {
    firstName,
    lastName,
    email,
    password,
    role = 'student',
    studentId,
    employeeId,
    department,
    major,
    phoneNumber,
    firstLogin = false,
    mustChangePassword = false,
    securityQuestion,
    securityAnswer
  } = userData;

  const [result] = await pool.query(
    `
    INSERT INTO users (
      first_name,
      last_name,
      email,
      password,
      role,
      student_id,
      employee_id,
      department,
      major,
      phone_number,
      is_active,
      is_email_verified,
      profile_picture,
      last_login,
      first_login,
      must_change_password,
      security_question,
      security_answer,
      reset_password_token,
      reset_password_expire,
      email_verification_token,
      email_verification_expire,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, '', NULL, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NOW())
    `,
    [
      firstName,
      lastName,
      email,
      password,
      role,
      studentId || null,
      employeeId || null,
      department || null,
      major || null,
      phoneNumber || null,
      firstLogin ? 1 : 0,
      mustChangePassword ? 1 : 0,
      securityQuestion || null,
      securityAnswer || null
    ]
  );

  return getUserById(result.insertId);
}

// Update user (partial update)
async function updateUser(id, updates) {
  const fields = [];
  const params = [];

  const mapping = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    role: 'role',
    studentId: 'student_id',
    employeeId: 'employee_id',
    department: 'department',
    major: 'major',
    phoneNumber: 'phone_number',
    isActive: 'is_active'
  };

  Object.entries(mapping).forEach(([key, column]) => {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      fields.push(`${column} = ?`);

      if ((key === 'studentId' || key === 'employeeId') && updates[key] === '') {
        params.push(null); // treat empty string as NULL
      } else if (key === 'isActive') {
        params.push(updates[key] ? 1 : 0); // boolean -> tinyint
      } else {
        params.push(updates[key]);
      }
    }
  });

  if (!fields.length) {
    return getUserById(id);
  }

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);

  await pool.query(sql, params);
  return getUserById(id);
}

// Delete user
async function deleteUser(id) {
  const user = await getUserById(id);
  if (!user) return null;

  await pool.query(`DELETE FROM users WHERE id = ?`, [id]);
  return user;
}

// Promote to admin
async function promoteToAdmin(id) {
  await pool.query(
    `UPDATE users SET role = 'admin' WHERE id = ?`,
    [id]
  );
  return getUserById(id);
}

// === AUTH-RELATED HELPERS =======================================

// Fetch user including password + flags (for login)
async function getUserAuthByEmail(email) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      first_name,
      last_name,
      email,
      password,
      role,
      student_id,
      employee_id,
      department,
      major,
      phone_number,
      is_active,
      is_email_verified,
      first_login,
      must_change_password,
      security_question,
      security_answer,
      last_login,
      created_at,
      updated_at
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  );
  return rows[0] || null; // raw row
}

// Fetch user including password + securityAnswer (for first login flow)
async function getUserAuthById(id) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      first_name,
      last_name,
      email,
      password,
      role,
      student_id,
      employee_id,
      department,
      major,
      phone_number,
      is_active,
      is_email_verified,
      first_login,
      must_change_password,
      security_question,
      security_answer,
      last_login,
      created_at,
      updated_at
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );
  return rows[0] || null;
}

// Only security question/answer (for forgot password)
async function getUserSecurityByEmail(email) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      email,
      security_question,
      security_answer
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  );
  return rows[0] || null;
}

// Update last_login to NOW()
async function updateLastLogin(id) {
  await pool.query(
    `UPDATE users SET last_login = NOW() WHERE id = ?`,
    [id]
  );
}

// Store reset token + expiry
async function saveResetPasswordToken(id, hashedToken, expireAt) {
  await pool.query(
    `
    UPDATE users
    SET
      reset_password_token  = ?,
      reset_password_expire = ?
    WHERE id = ?
    `,
    [hashedToken, expireAt, id]
  );
}

// Find user by valid reset token (not expired)
async function findUserByValidResetToken(hashedToken) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      email
    FROM users
    WHERE
      reset_password_token = ?
      AND reset_password_expire > NOW()
    LIMIT 1
    `,
    [hashedToken]
  );
  return rows[0] || null;
}

// Update password and clear reset token
async function updatePasswordAndClearReset(id, hashedPassword) {
  await pool.query(
    `
    UPDATE users
    SET
      password             = ?,
      reset_password_token = NULL,
      reset_password_expire = NULL
    WHERE id = ?
    `,
    [hashedPassword, id]
  );
}

// First-login password change + security Q/A + flags
async function firstLoginChangePasswordRepo(id, hashedPassword, securityQuestion, securityAnswer) {
  await pool.query(
    `
    UPDATE users
    SET
      password          = ?,
      security_question = ?,
      security_answer   = ?,
      first_login       = 0,
      must_change_password = 0,
      is_email_verified = 1,
      last_login        = NOW()
    WHERE id = ?
    `,
    [hashedPassword, securityQuestion, securityAnswer, id]
  );

  // Return the updated (mapped) user
  return getUserById(id);
}



module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  getUserByStudentId,
  getUserByEmployeeId,
  createUser,
  updateUser,
  deleteUser,
  promoteToAdmin,

    // auth-related
  getUserAuthByEmail,
  getUserAuthById,
  getUserSecurityByEmail,
  updateLastLogin,
  saveResetPasswordToken,
  findUserByValidResetToken,
  updatePasswordAndClearReset,
  firstLoginChangePasswordRepo

};
