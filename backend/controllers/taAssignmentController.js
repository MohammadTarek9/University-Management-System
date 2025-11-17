const pool = require('../db/mysql');
const { createAssignment } = require('../repositories/taAssignmentRepo');

// POST /api/staff/ta-assignments
exports.assignTaResponsibility = async (req, res) => {
  try {
    const { taUserId, courseId, responsibilityType, notes } = req.body;
    const professorId = req.user.id; // dynamic

    if (!taUserId || !courseId || !responsibilityType) {
      return res.status(400).json({
        success: false,
        message: 'taUserId, courseId, and responsibilityType are required',
      });
    }

    const result = await createAssignment({
      taUserId: Number(taUserId),
      courseId: Number(courseId),
      responsibilityType,
      notes,
      assignedByProfId: professorId,
    });

    if (result.affectedRows === 0) {
      return res.status(403).json({
        success: false,
        message:
          'You can only assign TAs who instruct a course with the same subject.',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'TA responsibility assigned',
      id: result.insertId,
    });
  } catch (err) {
    console.error('ASSIGN TA ERROR:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to assign TA responsibility',
    });
  }
};

// GET /api/staff/ta-eligible?courseId=...
exports.getEligibleTAs = async (req, res) => {
  const { courseId } = req.query;

  if (!courseId) {
    return res.status(400).json({ message: 'courseId is required' });
  }

  // 1) subject of selected course
  const getSubjectSql = `
    SELECT value_number AS subjectId
    FROM courses_eav_values
    WHERE entity_id = ?
      AND attribute_id = 31       -- subject
    LIMIT 1
  `;

  // 2) all instructors who are TAs on any course with same subject
  const getTAsSql = `
    SELECT DISTINCT u.id,
           u.first_name,
           u.last_name,
           u.email
    FROM courses_eav_values vInstr      -- instructor rows
    JOIN courses_eav_values vSubj       -- subject rows for same course
      ON vSubj.entity_id = vInstr.entity_id
     AND vSubj.attribute_id = 31        -- subject
    JOIN users u
      ON u.id = vInstr.value_number     -- instructor user id
    WHERE vInstr.attribute_id = 32      -- instructor attribute
      AND vSubj.value_number = ?        -- subjectId of selected course
      AND u.role = 'ta';                -- only TAs
  `;

  try {
    const [subjectRows] = await pool.query(getSubjectSql, [Number(courseId)]);
    if (subjectRows.length === 0) {
      return res.status(404).json({ message: 'Course subject not found' });
    }

    const subjectId = subjectRows[0].subjectId;

    const [rows] = await pool.query(getTAsSql, [subjectId]);

    console.log('TA-ELIGIBLE DEBUG', {
      courseId,
      subjectId,
      count: rows.length,
    });

    return res.json({ data: rows });
  } catch (err) {
    console.error('GET ELIGIBLE TAs ERROR:', err);
    return res
      .status(500)
      .json({ message: err.message || 'Failed to fetch eligible TAs' });
  }
};
// GET /api/staff/my-ta-responsibilities
exports.getMyTaResponsibilities = async (req, res) => {
  try {
    const taId = req.user.id;

   const sql = `
  SELECT
    r.id,
    r.course_id,
    r.responsibility_type,
    r.notes,
    r.assigned_by_prof_id,
    r.created_at,
    s.name AS course_name
  FROM ta_assignments r
  JOIN courses_eav_values c_subj
    ON c_subj.entity_id   = r.course_id
   AND c_subj.attribute_id = 31      -- subject_id on course
  JOIN subjects_eav_entities s
    ON s.entity_id = c_subj.value_number   -- subject_id
  WHERE r.ta_user_id = ?
  ORDER BY r.created_at DESC
`;



    const [rows] = await pool.query(sql, [taId]);
    return res.json({ data: rows });
  } catch (err) {
    console.error('GET MY TA RESPONSIBILITIES ERROR:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to load TA responsibilities',
    });
  }
};
