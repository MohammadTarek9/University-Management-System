const pool = require('../db/mysql'); // your mysql2/promise pool

// Map a DB row -> JS object in the shape your API/frontend expects
function mapUserRow(row) {
  if (!row) return null;

  const user = {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`,
    email: row.email,
    role: row.role, // Keep for backward compatibility
    roles: row.roles || [], // Array of role names from user_roles

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

  // Add helper methods for role checking
  user.hasRole = function(roleName) {
    return this.roles.includes(roleName);
  };

  user.hasAnyRole = function(...roleNames) {
    return roleNames.some(role => this.roles.includes(role));
  };

  return user;
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
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.role,
      u.student_id,
      u.employee_id,
      u.department,
      u.major,
      u.phone_number,
      u.is_active,
      u.is_email_verified,
      u.profile_picture,
      u.last_login,
      u.first_login,
      u.must_change_password,
      u.security_question,
      u.reset_password_token,
      u.reset_password_expire,
      u.email_verification_token,
      u.email_verification_expire,
      u.created_at,
      u.updated_at,
      GROUP_CONCAT(DISTINCT r.role_name) as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.role_id
    WHERE u.id = ?
    GROUP BY u.id
    LIMIT 1
    `,
    [id]
  );

  if (!rows[0]) return null;
  
  const user = rows[0];
  user.roles = user.roles ? user.roles.split(',') : [];
  
  return mapUserRow(user);
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
    firstLogin = true,
    mustChangePassword = true,
    securityQuestion,
    securityAnswer,
    roleDetails = null // Optional: student_details or employee_details
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

  const userId = result.insertId;

  // Assign role in user_roles table
  const roleRepo = require('./roleRepo');
  try {
    await roleRepo.assignRoleByNameToUser(userId, role);
  } catch (error) {
    console.error(`Failed to assign role ${role} to user ${userId}:`, error.message);
  }

  // Create role-specific details if provided
  if (roleDetails) {
    const userDetailsRepo = require('./userDetailsRepo');
    try {
      if (role === 'student' && roleDetails.student_id) {
        await userDetailsRepo.createStudentDetails(userId, roleDetails);
      } else if (['professor', 'staff', 'admin'].includes(role) && roleDetails.employee_id) {
        await userDetailsRepo.createEmployeeDetails(userId, roleDetails);
      }
    } catch (error) {
      console.error(`Failed to create role details for user ${userId}:`, error.message);
    }
  }

  return getUserById(userId);
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

// ==================== ROLES SYSTEM ====================

/**
 * Get all roles assigned to a user
 */
async function getUserRoles(userId) {
  const [rows] = await pool.query(
    `
    SELECT 
      r.id,
      r.role_code,
      r.role_name,
      r.description,
      ur.assigned_at,
      ur.assigned_by,
      u.first_name AS assigned_by_first_name,
      u.last_name AS assigned_by_last_name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    LEFT JOIN users u ON ur.assigned_by = u.id
    WHERE ur.user_id = ?
    ORDER BY ur.assigned_at DESC
    `,
    [userId]
  );

  return rows.map(row => ({
    id: row.id,
    roleCode: row.role_code,
    roleName: row.role_name,
    description: row.description,
    assignedAt: row.assigned_at,
    assignedBy: {
      id: row.assigned_by,
      firstName: row.assigned_by_first_name,
      lastName: row.assigned_by_last_name
    }
  }));
}

/**
 * Assign a role to a user
 */
async function assignRole(userId, roleCode, assignedById) {
  // First, get the role ID from role_code
  const [roleRows] = await pool.query(
    `SELECT id FROM roles WHERE role_code = ? LIMIT 1`,
    [roleCode]
  );

  if (!roleRows.length) {
    throw new Error(`Role not found: ${roleCode}`);
  }

  const roleId = roleRows[0].id;

  // Check if user already has this role
  const [existing] = await pool.query(
    `SELECT id FROM user_roles WHERE user_id = ? AND role_id = ? LIMIT 1`,
    [userId, roleId]
  );

  if (existing.length > 0) {
    throw new Error('User already has this role');
  }

  // Assign the role
  await pool.query(
    `
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (?, ?, ?)
    `,
    [userId, roleId, assignedById]
  );

  return { success: true, roleCode, roleName: roleRows[0].role_name };
}

/**
 * Remove a role from a user
 */
async function removeRole(userId, roleCode) {
  // Get the role ID
  const [roleRows] = await pool.query(
    `SELECT id FROM roles WHERE role_code = ? LIMIT 1`,
    [roleCode]
  );

  if (!roleRows.length) {
    throw new Error(`Role not found: ${roleCode}`);
  }

  const roleId = roleRows[0].id;

  // Remove the role assignment
  const [result] = await pool.query(
    `DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`,
    [userId, roleId]
  );

  if (result.affectedRows === 0) {
    throw new Error('User does not have this role');
  }

  return { success: true, roleCode };
}

/**
 * Check if a user has a specific role
 */
async function hasRole(userId, roleCode) {
  const [rows] = await pool.query(
    `
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ? AND r.role_code = ?
    LIMIT 1
    `,
    [userId, roleCode]
  );

  return rows.length > 0;
}

/**
 * Check if a user has any of the specified roles
 */
async function hasAnyRole(userId, roleCodes) {
  if (!Array.isArray(roleCodes) || roleCodes.length === 0) {
    return false;
  }

  const placeholders = roleCodes.map(() => '?').join(',');
  const [rows] = await pool.query(
    `
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ? AND r.role_code IN (${placeholders})
    LIMIT 1
    `,
    [userId, ...roleCodes]
  );

  return rows.length > 0;
}

/**
 * Get all available roles in the system
 */
async function getAllRoles() {
  const [rows] = await pool.query(
    `
    SELECT 
      id,
      role_code,
      role_name,
      description,
      created_at
    FROM roles
    ORDER BY role_name
    `
  );

  return rows.map(row => ({
    id: row.id,
    roleCode: row.role_code,
    roleName: row.role_name,
    description: row.description,
    createdAt: row.created_at
  }));
}

/**
 * Get users by role
 */
async function getUsersByRole(roleCode, { page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `
    SELECT DISTINCT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.role,
      u.department,
      u.student_id,
      u.employee_id,
      u.is_active,
      ur.assigned_at
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.role_code = ?
    ORDER BY ur.assigned_at DESC
    LIMIT ? OFFSET ?
    `,
    [roleCode, Number(limit), Number(offset)]
  );

  const users = rows.map(row => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`,
    email: row.email,
    role: row.role,
    department: row.department,
    studentId: row.student_id,
    employeeId: row.employee_id,
    isActive: !!row.is_active,
    assignedAt: row.assigned_at
  }));

  // Get total count
  const [countRows] = await pool.query(
    `
    SELECT COUNT(DISTINCT u.id) AS total
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.role_code = ?
    `,
    [roleCode]
  );

  const totalUsers = countRows[0]?.total || 0;

  return { users, totalUsers };
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
  firstLoginChangePasswordRepo,

  // roles system
  getUserRoles,
  assignRole,
  removeRole,
  hasRole,
  hasAnyRole,
  getAllRoles,
  getUsersByRole

};
