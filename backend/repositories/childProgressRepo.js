const pool = require('../db/mysql');

// Ensure this parent is linked to the student
async function verifyParentChild(parentUserId, studentId) {
  const [rows] = await pool.query(
    `
    SELECT psr.id
    FROM parent_student_relationships psr
    JOIN users parent ON psr.parent_id = parent.id
    WHERE parent.id = ?
      AND psr.student_id = ?
    `,
    [parentUserId, studentId]
  );
  return rows.length > 0;
}

// List children linked to this parent
async function getLinkedChildren(parentUserId) {
  const [rows] = await pool.query(
    `
    SELECT
      psr.student_id             AS studentId,
      u.id                       AS studentUserId,
      u.first_name               AS firstName,
      u.last_name                AS lastName,
      CONCAT(u.first_name, ' ', u.last_name) AS fullName,
      sd.major,
      sd.year,
      psr.relationship_type      AS relationshipType,
      psr.is_primary             AS isPrimary
    FROM parent_student_relationships psr
    JOIN users u
      ON psr.student_id = u.id
    LEFT JOIN student_details sd
      ON sd.user_id = u.id
    WHERE psr.parent_id = ?
    ORDER BY psr.is_primary DESC, fullName ASC
    `,
    [parentUserId]
  );

  return rows;
}

// List a child's courses (optionally by term/academic year)
async function getChildCourses(parentUserId, studentId, { academicYear, term }) {
  const allowed = await verifyParentChild(parentUserId, studentId);
  if (!allowed) {
    const error = new Error('You are not linked to this student');
    error.statusCode = 403;
    throw error;
  }

  const params = [studentId];
  const whereParts = [];

  if (academicYear) {
    whereParts.push('yr.value_number = ?');
    params.push(Number(academicYear.split('-')[0]));
  }
  if (term) {
    whereParts.push('sem.value_string = ?');
    params.push(term);
  }

  const whereSql = whereParts.length ? `AND ${whereParts.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
    SELECT DISTINCT
      e.enrollment_id           AS enrollmentId,
      ce.entity_id              AS courseId,
      subj_code.value_string    AS courseCode,
      se.name                   AS courseName,
      yr.value_number           AS academicYear,
      sem.value_string          AS term,
      e.status                  AS enrollmentStatus
    FROM enrollments e
    INNER JOIN courses_eav_entities ce
      ON e.course_id = ce.entity_id
    LEFT JOIN courses_eav_values subj_id_val
      ON ce.entity_id = subj_id_val.entity_id
      AND subj_id_val.attribute_id = (
        SELECT attribute_id
        FROM courses_eav_attributes
        WHERE attribute_name = 'subject_id'
      )
    LEFT JOIN subjects_eav_entities se
      ON subj_id_val.value_number = se.entity_id
    LEFT JOIN subjects_eav_values subj_code
      ON se.entity_id = subj_code.entity_id
      AND subj_code.attribute_id = (
        SELECT attribute_id
        FROM subjects_eav_attributes
        WHERE attribute_name = 'code'
      )
    LEFT JOIN courses_eav_values sem
      ON ce.entity_id = sem.entity_id
      AND sem.attribute_id = (
        SELECT attribute_id
        FROM courses_eav_attributes
        WHERE attribute_name = 'semester'
      )
    LEFT JOIN courses_eav_values yr
      ON ce.entity_id = yr.entity_id
      AND yr.attribute_id = (
        SELECT attribute_id
        FROM courses_eav_attributes
        WHERE attribute_name = 'year'
      )
    WHERE e.student_id = ?
      AND e.status IN ('enrolled', 'approved', 'active')
      ${whereSql}
    ORDER BY yr.value_number DESC, sem.value_string DESC, se.name ASC
    `,
    params
  );

  return rows;
}

// Get full details for one course: assessments, grades, average, feedback
async function getChildCourseDetails(parentUserId, studentId, courseId) {
  const allowed = await verifyParentChild(parentUserId, studentId);
  if (!allowed) {
    const error = new Error('You are not linked to this student');
    error.statusCode = 403;
    throw error;
  }

  // Course info using EAV, courseId = ce.entity_id
  const [courseRows] = await pool.query(
    `
    SELECT DISTINCT
      ce.entity_id              AS courseId,
      subj_code.value_string    AS courseCode,
      se.name                   AS courseName,
      yr.value_number           AS academicYear,
      sem.value_string          AS term
    FROM courses_eav_entities ce
    LEFT JOIN courses_eav_values subj_id_val
      ON ce.entity_id = subj_id_val.entity_id
      AND subj_id_val.attribute_id = (
        SELECT attribute_id
        FROM courses_eav_attributes
        WHERE attribute_name = 'subject_id'
      )
    LEFT JOIN subjects_eav_entities se
      ON subj_id_val.value_number = se.entity_id
    LEFT JOIN subjects_eav_values subj_code
      ON se.entity_id = subj_code.entity_id
      AND subj_code.attribute_id = (
        SELECT attribute_id
        FROM subjects_eav_attributes
        WHERE attribute_name = 'code'
      )
    LEFT JOIN courses_eav_values sem
      ON ce.entity_id = sem.entity_id
      AND sem.attribute_id = (
        SELECT attribute_id
        FROM courses_eav_attributes
        WHERE attribute_name = 'semester'
      )
    LEFT JOIN courses_eav_values yr
      ON ce.entity_id = yr.entity_id
      AND yr.attribute_id = (
        SELECT attribute_id
        FROM courses_eav_attributes
        WHERE attribute_name = 'year'
      )
    WHERE ce.entity_id = ?
    `,
    [courseId]
  );

  if (courseRows.length === 0) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  const course = courseRows[0];

  // Assessments + grades for this student
 const [assessmentRows] = await pool.query(
  `
  SELECT
    a.id               AS assessmentId,
    a.title            AS title,
    a.assessment_type  AS type,
    a.total_points     AS maxScore,
    a.due_date         AS dueDate,
    s.score            AS score,
    s.submission_date  AS submittedAt,
    (s.status = 'graded') AS isPublished,
    s.feedback         AS teacherComment
  FROM assessments a
  LEFT JOIN assessment_submissions s
    ON s.assessment_id = a.id
   AND s.student_id = ?
  WHERE a.course_id = ?
  ORDER BY a.due_date ASC, a.id ASC
  `,
  [studentId, courseId]
);


 // Compute overall average (simple unweighted %) and flags
let sumPercentages = 0;
let gradedCount = 0;

const assessments = assessmentRows.map((row) => {
  const hasScore =
    row.score !== null && row.score !== undefined && row.maxScore;
  let percentage = null;

  if (hasScore && row.isPublished) {
    percentage = (row.score / row.maxScore) * 100;
    sumPercentages += percentage;
    gradedCount += 1;
  }

  return {
    assessmentId: row.assessmentId,
    title: row.title,
    type: row.type,
    maxScore: row.maxScore,
    weight: null,               // no weight in schema
    dueDate: row.dueDate,
    score: row.score,
    submittedAt: row.submittedAt,
    isPublished: !!row.isPublished,
    teacherComment: row.teacherComment,
    percentage,
  };
});

let currentAverage = null;
let passFail = null;

if (gradedCount > 0) {
  currentAverage = sumPercentages / gradedCount;
  passFail = currentAverage >= 60 ? 'pass' : 'fail';
}

const hasGradesPublished = gradedCount > 0;
const hasFeedbackPublished = assessments.some(
  (a) => a.teacherComment && a.teacherComment.trim() !== ''
);

return {
  course,
  assessments,
  currentAverage,
  passFail,
  hasGradesPublished,
  hasFeedbackPublished,
};

}






module.exports = {
  getLinkedChildren,
  getChildCourses,
  getChildCourseDetails,
};
