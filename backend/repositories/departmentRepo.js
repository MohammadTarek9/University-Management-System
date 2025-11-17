const pool = require('../db/mysql');


// Map DB row to JS object
function mapDepartmentRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}


// Build WHERE clause for filtering
function buildDepartmentFilter({ search, isActive }) {
  const where = [];
  const params = [];

  if (search && search.trim() !== '') {
    const like = `%${search.trim()}%`;
    where.push('(name LIKE ? OR code LIKE ? OR description LIKE ?)');
    params.push(like, like, like);
  }

  if (isActive !== undefined && isActive !== null && isActive !== '') {
    where.push('is_active = ?');
    params.push(isActive ? 1 : 0);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { whereSql, params };
}

// Get all departments with optional filtering and pagination
async function getAllDepartments({ page = 1, limit = 50, search = '', isActive = null } = {}) {
  const offset = (page - 1) * limit;
  const { whereSql, params } = buildDepartmentFilter({ search, isActive });

  const [rows] = await pool.query(
    `
    SELECT
      id,
      name,
      code,
      description,
      is_active,
      created_at,
      updated_at
    FROM departments
    ${whereSql}
    ORDER BY name ASC
    LIMIT ? OFFSET ?
    `,
    [...params, Number(limit), Number(offset)]
  );

  const departments = rows.map(mapDepartmentRow);

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM departments ${whereSql}`,
    params
  );
  const totalDepartments = countRows[0]?.total || 0;

  return { departments, totalDepartments };
}

// Get single department by ID
async function getDepartmentById(id) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      name,
      code,
      description,
      is_active,
      created_at,
      updated_at
    FROM departments
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );

  return mapDepartmentRow(rows[0]);
}

// Get department by code (for uniqueness check)
async function getDepartmentByCode(code) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      name,
      code,
      description,
      is_active,
      created_at,
      updated_at
    FROM departments
    WHERE code = ?
    LIMIT 1
    `,
    [code]
  );

  return mapDepartmentRow(rows[0]);
}


// Create new department
async function createDepartment(data) {
  const [result] = await pool.query(
    `
    INSERT INTO departments (
      name,
      code,
      description,
      is_active,
      created_at
    ) VALUES (?, ?, ?, ?, NOW())
    `,
    [
      data.name,
      data.code,
      data.description || null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1
    ]
  );

  return getDepartmentById(result.insertId);
}


// Update department
async function updateDepartment(id, data) {
  const updates = [];
  const params = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.code !== undefined) {
    updates.push('code = ?');
    params.push(data.code);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(data.isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return getDepartmentById(id);
  }

  params.push(id);

  await pool.query(
    `UPDATE departments SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  return getDepartmentById(id);
}


// Delete department
async function deleteDepartment(id) {
  const [result] = await pool.query(
    'DELETE FROM departments WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
}

// Check if department has subjects
async function departmentHasSubjects(id) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS count FROM subjects WHERE department_id = ?',
    [id]
  );

  return rows[0].count > 0;
}

module.exports = {
  getAllDepartments,
  getDepartmentById,
  getDepartmentByCode,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  departmentHasSubjects
};
