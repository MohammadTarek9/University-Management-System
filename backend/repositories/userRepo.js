const pool = require('../db/mysql');

// Map a DB row -> JS object
function mapUserRow(row) {
  if (!row) return null;

  const user = {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`,
    email: row.email,
    role: row.role,
    roles: row.roles || [],
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

// Enhanced user mapper with role-specific details
function mapUserWithDetails(userRow, studentDetails, employeeDetails) {
  const user = mapUserRow(userRow);
  if (!user) return null;

  // Add role-specific details
  if (studentDetails) {
    user.studentId = studentDetails.studentId;
    user.major = studentDetails.major;
    user.studentDetails = studentDetails;
  }

  if (employeeDetails) {
    user.employeeId = employeeDetails.employeeId;
    user.department = employeeDetails.department;
    user.employeeDetails = employeeDetails;
  }

  return user;
}

// Build WHERE clause for filtering
function buildUserFilter({ search, role }) {
  const where = [];
  const params = [];

  if (search && search.trim() !== '') {
    const like = `%${search.trim()}%`;
    where.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)');
    params.push(like, like, like);
  }

  if (role && role.trim() !== '') {
    where.push('u.role = ?');
    params.push(role);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { whereSql, params };
}

// Get student details by user ID
async function getStudentDetails(userId) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        student_id as studentId,
        enrollment_date as enrollmentDate,
        major,
        year,
        gpa,
        created_at as createdAt,
        updated_at as updatedAt
       FROM student_details 
       WHERE user_id = ?`,
      [userId]
    );
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error getting student details:', error);
    return null;
  }
}

// Get employee details by user ID
async function getEmployeeDetails(userId) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        employee_id as employeeId,
        department,
        hire_date as hireDate,
        position,
        office_location as officeLocation,
        phone_extension as phoneExtension,
        created_at as createdAt,
        updated_at as updatedAt
       FROM employee_details 
       WHERE user_id = ?`,
      [userId]
    );
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error getting employee details:', error);
    return null;
  }
}

// List users with pagination
async function getUsers({ page = 1, limit = 10, search = '', role = '' }) {
  const offset = (page - 1) * limit;
  const { whereSql, params } = buildUserFilter({ search, role });

  const [rows] = await pool.query(
    `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.role,
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
      u.updated_at
    FROM users u
    ${whereSql}
    ORDER BY u.created_at DESC, u.id DESC
    LIMIT ? OFFSET ?
    `,
    [...params, Number(limit), Number(offset)]
  );

  // Get role-specific details for each user
  const users = await Promise.all(rows.map(async (row) => {
    let studentDetails = null;
    let employeeDetails = null;

    if (row.role === 'student') {
      studentDetails = await getStudentDetails(row.id);
    } else if (['professor', 'staff', 'admin', 'ta'].includes(row.role)) {
      employeeDetails = await getEmployeeDetails(row.id);
    }

    return mapUserWithDetails(row, studentDetails, employeeDetails);
  }));

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM users u ${whereSql}`,
    params
  );
  const totalUsers = countRows[0]?.total || 0;

  return { users, totalUsers };
}

// Get single user by ID with all details
async function getUserById(id) {
  const [rows] = await pool.query(
    `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.role,
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
  
  // Get role-specific details
  let studentDetails = null;
  let employeeDetails = null;

  if (user.role === 'student') {
    studentDetails = await getStudentDetails(id);
  } else if (['professor', 'staff', 'admin', 'ta'].includes(user.role)) {
    employeeDetails = await getEmployeeDetails(id);
  }

  return mapUserWithDetails(user, studentDetails, employeeDetails);
}

// Lookups for unique fields
async function getUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT * FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  
  if (!rows[0]) return null;
  
  const user = rows[0];
  
  // Get role-specific details
  let studentDetails = null;
  let employeeDetails = null;

  if (user.role === 'student') {
    studentDetails = await getStudentDetails(user.id);
  } else if (['professor', 'staff', 'admin', 'ta'].includes(user.role)) {
    employeeDetails = await getEmployeeDetails(user.id);
  }

  return mapUserWithDetails(user, studentDetails, employeeDetails);
}

async function getUserByStudentId(studentId) {
  try {
    // Get student details first
    const [studentRows] = await pool.query(
      `SELECT user_id FROM student_details WHERE student_id = ? LIMIT 1`,
      [studentId]
    );
    
    if (!studentRows[0]) return null;
    
    // Then get user by ID
    return getUserById(studentRows[0].user_id);
  } catch (error) {
    console.error('Error getting user by student ID:', error);
    return null;
  }
}

async function getUserByEmployeeId(employeeId) {
  try {
    // Get employee details first
    const [employeeRows] = await pool.query(
      `SELECT user_id FROM employee_details WHERE employee_id = ? LIMIT 1`,
      [employeeId]
    );
    
    if (!employeeRows[0]) return null;
    
    // Then get user by ID
    return getUserById(employeeRows[0].user_id);
  } catch (error) {
    console.error('Error getting user by employee ID:', error);
    return null;
  }
}

async function createUser(userData) {
  const {
    firstName,
    lastName,
    email,
    password,
    role = 'student',
    phoneNumber,
    firstLogin = true,
    mustChangePassword = true,
    securityQuestion,
    securityAnswer,
    studentId,
    employeeId,
    department,
    major,
    // NEW FORMAT - also support these
    studentDetails,
    employeeDetails
  } = userData;

  // Start transaction
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Insert into users table (without role-specific columns)
    const [userResult] = await connection.query(
      `
      INSERT INTO users (
        first_name,
        last_name,
        email,
        password,
        role,
        phone_number,
        is_active,
        is_email_verified,
        profile_picture,
        last_login,
        first_login,
        must_change_password,
        security_question,
        security_answer,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 1, 0, '', NULL, ?, ?, ?, ?, NOW())
      `,
      [
        firstName,
        lastName,
        email,
        password,
        role,
        phoneNumber || null,
        firstLogin ? 1 : 0,
        mustChangePassword ? 1 : 0,
        securityQuestion || null,
        securityAnswer || null
      ]
    );

    const userId = userResult.insertId;

    // Assign role in user_roles table
    const roleRepo = require('./roleRepo');
    try {
      await roleRepo.assignRoleByNameToUser(userId, role);
    } catch (error) {
      console.error(`Failed to assign role ${role} to user ${userId}:`, error.message);
    }

    // Create role-specific details
    // Support both old format (studentId, employeeId, department, major)
    // and new format (studentDetails, employeeDetails)
    
    if (role === 'student') {
      if (studentId) {
        await connection.query(
          `INSERT INTO student_details 
           (user_id, student_id, enrollment_date, major, year, gpa) 
           VALUES (?, ?, NULL, ?, NULL, NULL)`,
          [userId, studentId, major || null]
        );
      }
    } 
    else if (['professor', 'staff', 'admin', 'ta'].includes(role)) {
      let position = role === 'professor' ? 'Professor' : 
                         role === 'admin' ? 'Administrator' : 
                         role === 'ta' ? 'Teaching Assistant' : 'Staff';
      
      if (employeeId) {
        await connection.query(
          `INSERT INTO employee_details 
           (user_id, employee_id, department, hire_date, position, office_location, phone_extension) 
           VALUES (?, ?, ?, NULL, ?, NULL, NULL)`,
          [userId, employeeId, department, position]
        );
      }
    }

    await connection.commit();
    
    // Return created user
    return getUserById(userId);
  } catch (error) {
    await connection.rollback();
    console.error('Error creating user:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function updateUser(id, updates) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const userFields = [];
    const userParams = [];

    // Basic user fields mapping
    const userFieldMapping = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      role: 'role',
      phoneNumber: 'phone_number',
      isActive: 'is_active'
    };

    // Build user update query
    Object.entries(userFieldMapping).forEach(([key, column]) => {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        userFields.push(`${column} = ?`);
        if (key === 'isActive') {
          userParams.push(updates[key] ? 1 : 0);
        } else {
          userParams.push(updates[key]);
        }
      }
    });

    // Update user if there are changes
    if (userFields.length > 0) {
      userParams.push(id);
      await connection.query(
        `UPDATE users SET ${userFields.join(', ')} WHERE id = ?`,
        userParams
      );
    }

    // Get current user to know their role
    const [currentUserRows] = await connection.query(
      'SELECT role FROM users WHERE id = ? LIMIT 1',
      [id]
    );

    if (currentUserRows.length > 0) {
      const currentRole = currentUserRows[0].role;
      const newRole = updates.role || currentRole;

      // Handle role-specific updates (support both old and new format)
      if (newRole === 'student') {
        // Check if we have student-specific updates
        const hasStudentUpdates = 
          updates.studentId !== undefined || 
          updates.major !== undefined;
        
        if (hasStudentUpdates) {
          let studentId = updates.studentId;
          let major = updates.major;
          
          await upsertStudentDetails(connection, id, {
            studentId,
            major
          });
        }
      } else if (['professor', 'staff', 'admin', 'ta'].includes(newRole)) {
        // Check if we have employee-specific updates
        const hasEmployeeUpdates = 
          updates.employeeId !== undefined || 
          updates.department !== undefined;

        if (hasEmployeeUpdates) {
          let employeeId = updates.employeeId;
          let department = updates.department;
          let position = newRole === 'professor' ? 'Professor' : 
                        newRole === 'admin' ? 'Administrator' : 
                        newRole === 'ta' ? 'Teaching Assistant' : 'Staff';
          
          await upsertEmployeeDetails(connection, id, {
            employeeId,
            department,
            position
          });
        }
      }
    }

    await connection.commit();
    
    // Return updated user
    return getUserById(id);
  } catch (error) {
    await connection.rollback();
    console.error('Error updating user:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Helper function to upsert student details
async function upsertStudentDetails(connection, userId, details) {
  const { studentId, enrollmentDate, major, year, gpa } = details;
  
  // Check if record exists
  const [existing] = await connection.query(
    'SELECT 1 FROM student_details WHERE user_id = ?',
    [userId]
  );

  if (existing.length > 0) {
    // Update existing
    await connection.query(
      `UPDATE student_details 
       SET student_id = COALESCE(?, student_id),
           enrollment_date = COALESCE(?, enrollment_date),
           major = COALESCE(?, major),
           year = COALESCE(?, year),
           gpa = COALESCE(?, gpa),
           updated_at = NOW()
       WHERE user_id = ?`,
      [studentId, enrollmentDate, major, year, gpa, userId]
    );
  } else {
    // Insert new
    await connection.query(
      `INSERT INTO student_details 
       (user_id, student_id, enrollment_date, major, year, gpa) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, studentId, enrollmentDate || null, major || null, year || null, gpa || null]
    );
  }
}

// Helper function to upsert employee details
async function upsertEmployeeDetails(connection, userId, details) {
  const { employeeId, department, hireDate, position, officeLocation, phoneExtension } = details;
  
  // Check if record exists
  const [existing] = await connection.query(
    'SELECT 1 FROM employee_details WHERE user_id = ?',
    [userId]
  );

  if (existing.length > 0) {
    // Update existing
    await connection.query(
      `UPDATE employee_details 
       SET employee_id = COALESCE(?, employee_id),
           department = COALESCE(?, department),
           hire_date = COALESCE(?, hire_date),
           position = COALESCE(?, position),
           office_location = COALESCE(?, office_location),
           phone_extension = COALESCE(?, phone_extension),
           updated_at = NOW()
       WHERE user_id = ?`,
      [employeeId, department, hireDate, position, officeLocation, phoneExtension, userId]
    );
  } else {
    // Insert new
    await connection.query(
      `INSERT INTO employee_details 
       (user_id, employee_id, department, hire_date, position, office_location, phone_extension) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, employeeId, department || null, hireDate || null, position || null, officeLocation || null, phoneExtension || null]
    );
  }
}

// Delete user
async function deleteUser(id) {
  const user = await getUserById(id);
  if (!user) return null;

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Delete from user_roles first (if exists)
    try {
      await connection.query('DELETE FROM user_roles WHERE user_id = ?', [id]);
    } catch (error) {
      // Table might not exist, ignore
    }

    // Delete role-specific details
    if (user.role === 'student') {
      await connection.query('DELETE FROM student_details WHERE user_id = ?', [id]);
    } else if (['professor', 'staff', 'admin', 'ta'].includes(user.role)) {
      await connection.query('DELETE FROM employee_details WHERE user_id = ?', [id]);
    }

    // Finally delete user
    await connection.query('DELETE FROM users WHERE id = ?', [id]);
    
    await connection.commit();
    return user;
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting user:', error);
    throw error;
  } finally {
    connection.release();
  }
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
  return rows[0] || null;
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

  return getUserById(id);
}

// ==================== ROLES SYSTEM ====================

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

async function assignRole(userId, roleCode, assignedById) {
  const [roleRows] = await pool.query(
    `SELECT id FROM roles WHERE role_code = ? LIMIT 1`,
    [roleCode]
  );

  if (!roleRows.length) {
    throw new Error(`Role not found: ${roleCode}`);
  }

  const roleId = roleRows[0].id;

  const [existing] = await pool.query(
    `SELECT id FROM user_roles WHERE user_id = ? AND role_id = ? LIMIT 1`,
    [userId, roleId]
  );

  if (existing.length > 0) {
    throw new Error('User already has this role');
  }

  await pool.query(
    `
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (?, ?, ?)
    `,
    [userId, roleId, assignedById]
  );

  return { success: true, roleCode, roleName: roleRows[0].role_name };
}

async function removeRole(userId, roleCode) {
  const [roleRows] = await pool.query(
    `SELECT id FROM roles WHERE role_code = ? LIMIT 1`,
    [roleCode]
  );

  if (!roleRows.length) {
    throw new Error(`Role not found: ${roleCode}`);
  }

  const roleId = roleRows[0].id;

  const [result] = await pool.query(
    `DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`,
    [userId, roleId]
  );

  if (result.affectedRows === 0) {
    throw new Error('User does not have this role');
  }

  return { success: true, roleCode };
}

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

  // Get role-specific details for each user
  const users = await Promise.all(rows.map(async (row) => {
    let studentDetails = null;
    let employeeDetails = null;

    if (row.role === 'student') {
      studentDetails = await getStudentDetails(row.id);
    } else if (['professor', 'staff', 'admin', 'ta'].includes(row.role)) {
      employeeDetails = await getEmployeeDetails(row.id);
    }

    return mapUserWithDetails(row, studentDetails, employeeDetails);
  }));

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
const getUsersByRoles = async (roles) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.role,
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
      u.updated_at
    FROM users u
    WHERE u.role IN (?)
    ORDER BY u.last_name, u.first_name
    `,
    [roles]
  );

  // Attach employee_details for staff/professors/TAs/admins, like in getUsers
  const users = await Promise.all(
    rows.map(async (row) => {
      let studentDetails = null;
      let employeeDetails = null;

      if (row.role === 'student') {
        studentDetails = await getStudentDetails(row.id);
      } else if (['professor', 'staff', 'admin', 'ta'].includes(row.role)) {
        employeeDetails = await getEmployeeDetails(row.id);
      }

      return mapUserWithDetails(row, studentDetails, employeeDetails);
    })
  );

  return users;
};


// Helper functions for external use
async function createStudentDetails(userId, details) {
  return upsertStudentDetails({ query: pool.query.bind(pool) }, userId, details);
}

async function createEmployeeDetails(userId, details) {
  return upsertEmployeeDetails({ query: pool.query.bind(pool) }, userId, details);
}

async function updateStudentDetails(userId, details) {
  return upsertStudentDetails({ query: pool.query.bind(pool) }, userId, details);
}

async function updateEmployeeDetails(userId, details) {
  return upsertEmployeeDetails({ query: pool.query.bind(pool) }, userId, details);
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
  getUsersByRole,

  // role-specific details helpers
  getStudentDetails,
  getEmployeeDetails,
  createStudentDetails,
  createEmployeeDetails,
  updateStudentDetails,
  updateEmployeeDetails,


  getUsersByRoles,


};