// repositories/taAssignmentRepo.js
const pool = require('../db/mysql');

async function createAssignment({
  taUserId,
  courseId,
  responsibilityType,
  notes,
  assignedByProfId,
}) {
  const sql = `
    INSERT INTO ta_assignments
      (ta_user_id, course_id, responsibility_type, notes, assigned_by_prof_id)
    SELECT ?, ?, ?, ?, ?
    FROM courses_eav_values v_course_subj
    -- subject row for selected course
    JOIN courses_eav_values v_prof_subj
      ON v_prof_subj.attribute_id = 31
     AND v_prof_subj.value_number = v_course_subj.value_number
    -- professor instructor row on same subject
    JOIN courses_eav_values v_prof_instr
      ON v_prof_instr.entity_id = v_prof_subj.entity_id
     AND v_prof_instr.attribute_id = 32
     AND v_prof_instr.value_number = ?
    -- TA instructor row on same subject
    JOIN courses_eav_values v_ta_subj
      ON v_ta_subj.attribute_id = 31
     AND v_ta_subj.value_number = v_course_subj.value_number
    JOIN courses_eav_values v_ta_instr
      ON v_ta_instr.entity_id = v_ta_subj.entity_id
     AND v_ta_instr.attribute_id = 32
     AND v_ta_instr.value_number = ?
    WHERE v_course_subj.entity_id = ?
      AND v_course_subj.attribute_id = 31;
  `;

  const params = [
    taUserId,
    courseId,
    responsibilityType,
    notes || null,
    assignedByProfId,
    assignedByProfId, // professorId for v_prof_instr
    taUserId,         // TA user id for v_ta_instr
    courseId,
  ];

  const [result] = await pool.query(sql, params);
  return result;
}

module.exports = { createAssignment };
