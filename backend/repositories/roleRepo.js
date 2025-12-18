const pool = require('../db/mysql');

/**
 * Get all roles
 */
async function getAllRoles() {
  const [roles] = await pool.query('SELECT * FROM roles ORDER BY role_name');
  return roles;
}

/**
 * Get role by ID
 */
async function getRoleById(roleId) {
  const [roles] = await pool.query('SELECT * FROM roles WHERE role_id = ?', [roleId]);
  return roles[0] || null;
}

/**
 * Get role by name
 */
async function getRoleByName(roleName) {
  const [roles] = await pool.query('SELECT * FROM roles WHERE role_name = ?', [roleName]);
  return roles[0] || null;
}

/**
 * Get user's roles
 */
async function getUserRoles(userId) {
  const [roles] = await pool.query(
    `SELECT r.* FROM roles r
     INNER JOIN user_roles ur ON r.role_id = ur.role_id
     WHERE ur.user_id = ?`,
    [userId]
  );
  return roles;
}

/**
 * Assign role to user
 */
async function assignRoleToUser(userId, roleId) {
  await pool.query(
    'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP',
    [userId, roleId]
  );
}

/**
 * Assign role by name to user
 */
async function assignRoleByNameToUser(userId, roleName) {
  const role = await getRoleByName(roleName);
  if (!role) {
    throw new Error(`Role '${roleName}' not found`);
  }
  await assignRoleToUser(userId, role.role_id);
}

/**
 * Remove role from user
 */
async function removeRoleFromUser(userId, roleId) {
  await pool.query('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?', [userId, roleId]);
}

/**
 * Remove all roles from user
 */
async function removeAllUserRoles(userId) {
  await pool.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
}

/**
 * Check if user has role
 */
async function userHasRole(userId, roleName) {
  const [result] = await pool.query(
    `SELECT COUNT(*) as count FROM user_roles ur
     INNER JOIN roles r ON ur.role_id = r.role_id
     WHERE ur.user_id = ? AND r.role_name = ?`,
    [userId, roleName]
  );
  return result[0].count > 0;
}

/**
 * Check if user has any of the specified roles
 */
async function userHasAnyRole(userId, roleNames) {
  if (!Array.isArray(roleNames) || roleNames.length === 0) {
    return false;
  }
  
  const placeholders = roleNames.map(() => '?').join(',');
  const [result] = await pool.query(
    `SELECT COUNT(*) as count FROM user_roles ur
     INNER JOIN roles r ON ur.role_id = r.role_id
     WHERE ur.user_id = ? AND r.role_name IN (${placeholders})`,
    [userId, ...roleNames]
  );
  return result[0].count > 0;
}

module.exports = {
  getAllRoles,
  getRoleById,
  getRoleByName,
  getUserRoles,
  assignRoleToUser,
  assignRoleByNameToUser,
  removeRoleFromUser,
  removeAllUserRoles,
  userHasRole,
  userHasAnyRole
};
