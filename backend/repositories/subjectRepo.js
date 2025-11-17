const pool = require('../db/mysql');

// Map DB row to JS object with department info
function mapSubjectRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    credits: parseFloat(row.credits),
    classification: row.classification,
    departmentId: row.department_id,
    departmentName: row.department_name || null,
    departmentCode: row.department_code || null,
    isActive: !!row.is_active,
    semester: row.semester || null,
    academicYear: row.academic_year || null,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
    
  };
}

// Build WHERE clause for filtering
function buildSubjectFilter({ search, departmentId, classification, isActive }) {
  const where = [];
  const params = [];

  if (search && search.trim() !== '') {
    const like = `%${search.trim()}%`;
    where.push('(s.name LIKE ? OR s.code LIKE ? OR s.description LIKE ?)');
    params.push(like, like, like);
  }

  if (departmentId) {
    where.push('s.department_id = ?');
    params.push(departmentId);
  }

  if (classification && (classification === 'core' || classification === 'elective')) {
    where.push('s.classification = ?');
    params.push(classification);
  }

  if (isActive !== undefined && isActive !== null && isActive !== '') {
    where.push('s.is_active = ?');
    params.push(isActive ? 1 : 0);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { whereSql, params };
}

// Get all subjects with optional filtering and pagination
async function getAllSubjects({ 
  page = 1, 
  limit = 50, 
  search = '', 
  departmentId = null,
  classification = null,
  isActive = null 
} = {}) {
  const offset = (page - 1) * limit;
  const { whereSql, params } = buildSubjectFilter({ search, departmentId, classification, isActive });

 const [rows] = await pool.query(
  `
    SELECT
      s.id,
      s.name,
      s.code,
      s.description,
      s.credits,
      s.classification,
      s.department_id,
      s.is_active,
      s.semester,
      s.academic_year,
      s.created_by,
      s.updated_by,
      s.created_at,
      s.updated_at,
      d.name AS department_name,
      d.code AS department_code
    FROM subjects s
    LEFT JOIN departments d ON s.department_id = d.id
    ${whereSql}
    ORDER BY s.code ASC
    LIMIT ? OFFSET ?
  `,
  [...params, Number(limit), Number(offset)]
);



  const subjects = rows.map(mapSubjectRow);

  const [countRows] = await pool.query(
    `
    SELECT COUNT(*) AS total 
    FROM subjects s
    LEFT JOIN departments d ON s.department_id = d.id
    ${whereSql}
    `,
    params
  );
  const totalSubjects = countRows[0]?.total || 0;

  return { subjects, totalSubjects };
}

// Get single subject by ID
async function getSubjectById(id) {
  const [rows] = await pool.query(
    `
    SELECT
      s.id,
      s.name,
      s.code,
      s.description,
      s.credits,
      s.classification,
      s.department_id,
      s.is_active,
      s.created_by,
      s.updated_by,
      s.created_at,
      s.updated_at,
      d.name AS department_name,
      d.code AS department_code
    FROM subjects s
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE s.id = ?
    LIMIT 1
    `,
    [id]
  );

  return mapSubjectRow(rows[0]);
}


// Get subject by code (for uniqueness check)
async function getSubjectByCode(code) {
  const [rows] = await pool.query(
    `
    SELECT
      s.id,
      s.name,
      s.code,
      s.description,
      s.credits,
      s.classification,
      s.department_id,
      s.is_active,
      s.created_by,
      s.updated_by,
      s.created_at,
      s.updated_at,
      d.name AS department_name,
      d.code AS department_code
    FROM subjects s
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE s.code = ?
    LIMIT 1
    `,
    [code]
  );

  return mapSubjectRow(rows[0]);
}

// Get subjects by department
async function getSubjectsByDepartment(departmentId) {
  const [rows] = await pool.query(
    `
    SELECT
      s.id,
      s.name,
      s.code,
      s.description,
      s.credits,
      s.classification,
      s.department_id,
      s.is_active,
      s.created_by,
      s.updated_by,
      s.created_at,
      s.updated_at,
      d.name AS department_name,
      d.code AS department_code
    FROM subjects s
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE s.department_id = ?
    ORDER BY s.code ASC
    `,
    [departmentId]
  );

  return rows.map(mapSubjectRow);
}



// Create new subject
async function createSubject(data, createdByUserId) {
  const query = `
    INSERT INTO subjects (
      name,
      code,
      description,
      credits,
      classification,
      department_id,
      is_active,
      semester,
      academic_year,
      created_by,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const values = [
    data.name,
    data.code,
    data.description || null,
    data.credits,
    data.classification,
    data.departmentId,
    data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
    data.semester || null,
    data.academicYear || null,
    createdByUserId
  ];

  console.log('Creating subject with values:', values); // Debug log

  const [result] = await pool.query(query, values);
  return getSubjectById(result.insertId);
}

// Update subject
async function updateSubject(id, data, updatedByUserId) {
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
  if (data.credits !== undefined) {
    updates.push('credits = ?');
    params.push(data.credits);
  }
  if (data.classification !== undefined) {
    updates.push('classification = ?');
    params.push(data.classification);
  }
  if (data.departmentId !== undefined) {
    updates.push('department_id = ?');
    params.push(data.departmentId);
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(data.isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return getSubjectById(id);
  }

  updates.push('updated_by = ?');
  params.push(updatedByUserId);

  params.push(id);

  await pool.query(
    `UPDATE subjects SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  return getSubjectById(id);
}

// Delete subject
async function deleteSubject(id) {
  const [result] = await pool.query(
    'DELETE FROM subjects WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
}



// Update subject semester availability
const updateSubjectSemester = async (subjectId, semesterData, updatedBy) => {
  const { semester, academicYear } = semesterData;

  const query = `
    UPDATE subjects
    SET semester = ?, academic_year = ?, semester_updated_by = ?, semester_updated_at = NOW()
    WHERE id = ?
  `;

  const [result] = await pool.query(query, [
    semester,
    academicYear || null,
    updatedBy,
    subjectId,
  ]);

  if (result.affectedRows === 0) return null;
  return await getSubjectById(subjectId);
};

// Get subjects by semester
const getSubjectsBySemester = async (semester, academicYear = null) => {
  let query = `
    SELECT s.*, d.name AS department_name, d.code AS department_code
    FROM subjects s
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE s.semester = ?
  `;
  const params = [semester];

  if (academicYear) {
    query += " AND s.academic_year = ?";
    params.push(academicYear);
  }

  query += " ORDER BY s.code ASC";

  const [rows] = await pool.query(query, params);
  return rows.map(mapSubjectRow);
};





module.exports = {
  getAllSubjects,
  getSubjectById,
  getSubjectByCode,
  getSubjectsByDepartment,
  createSubject,
  updateSubject,
  deleteSubject,
  updateSubjectSemester,
  getSubjectsBySemester,

};

