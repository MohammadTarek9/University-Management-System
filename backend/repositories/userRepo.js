const pool = require("../db/mysql");
const { create } = require("../models/Application");

// Helper: map DB row -> JS object in the shape your app expects

function mapUserRow(row){

    if(!row) return null;

    return {

        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        full_name: '${row.first_name} ${row.last_name}',
        email: row.email,
        role: row.role,
        studentId: row.student_id,
        employeeId: row.employee_id,
        department: row.department,
        major: row.major,
        phoneNumber: row.phone_number,
        isActive: row.is_active,
        isEmailVerified: row.is_email_verified,
        profilePicture: row.profile_picture,
        lastLogin: row.last_login,
        firstLogin: row.first_login,
        mustChangePassword: row.must_change_password,
        securityQuestion: row.security_question,
        securityAnswer: row.security_answer,
        resetPasswordToken: row.reset_password_token,
        resetPasswordExpire: row.reset_password_expire,
        emailVerificationToken: row.email_verification_token,
        emailVerificationExpire: row.email_verification_expire,
        createdAt: row.created_at,
        updatedAt: row.updated_at

    };


}

// Helper to build WHERE clause for list/filter
function buildUserFilter({ search, role }) {
  const where = [];
  const params = [];

  if (search && search.trim() !== '') {
    const like = `%${search.trim()}%`;
    where.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
    params.push(like, like, like);
  }

  if (role && role !== '') {
    where.push('role = ?');
    params.push(role);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { whereSql, params };
}
