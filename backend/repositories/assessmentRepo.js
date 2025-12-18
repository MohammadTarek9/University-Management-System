const pool = require('../db/mysql');

// Map assessment row to JS object
function mapAssessmentRow(row) {
  if (!row) return null;
  
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description,
    assessmentType: row.assessment_type,
    totalPoints: row.total_points,
    dueDate: row.due_date,
    availableFrom: row.available_from,
    availableUntil: row.available_until,
    durationMinutes: row.duration_minutes,
    allowLateSubmission: !!row.allow_late_submission,
    latePenaltyPercent: row.late_penalty_percent,
    maxAttempts: row.max_attempts,
    showCorrectAnswers: !!row.show_correct_answers,
    shuffleQuestions: !!row.shuffle_questions,
    isPublished: !!row.is_published,
    instructions: row.instructions,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Additional fields from joins
    courseName: row.course_name,
    subjectName: row.subject_name,
    subjectCode: row.subject_code,
    creatorName: row.creator_name,
    questionCount: row.question_count || 0,
    submissionCount: row.submission_count || 0
  };
}

// Map submission row to JS object
function mapSubmissionRow(row) {
  if (!row) return null;
  
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    studentId: row.student_id,
    attemptNumber: row.attempt_number,
    submissionDate: row.submission_date,
    isLate: !!row.is_late,
    status: row.status,
    score: row.score,
    feedback: row.feedback,
    gradedBy: row.graded_by,
    gradedAt: row.graded_at,
    timeSpentMinutes: row.time_spent_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Additional fields
    studentName: row.student_name,
    studentEmail: row.student_email,
    assessmentTitle: row.assessment_title,
    totalPoints: row.total_points
  };
}

// Get all assessments for a course
async function getAssessmentsByCourse(courseId, options = {}) {
  const { isPublished, userId, userRole } = options;
  
  let whereClauses = ['a.course_id = ?'];
  let params = [courseId];
  
  // Students only see published assessments
  if (userRole === 'student') {
    whereClauses.push('a.is_published = 1');
  } else if (isPublished !== undefined) {
    whereClauses.push('a.is_published = ?');
    params.push(isPublished ? 1 : 0);
  }
  
  const whereSql = whereClauses.join(' AND ');
  
  const [rows] = await pool.query(
    `
    SELECT 
      a.*,
      s.name AS subject_name,
      s.code AS subject_code,
      CONCAT(u.first_name, ' ', u.last_name) AS creator_name,
      (SELECT COUNT(*) FROM assessment_questions WHERE assessment_id = a.id) AS question_count,
      (SELECT COUNT(DISTINCT student_id) FROM assessment_submissions WHERE assessment_id = a.id) AS submission_count
    FROM assessments a
    LEFT JOIN courses c ON a.course_id = c.id
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN users u ON a.created_by = u.id
    WHERE ${whereSql}
    ORDER BY a.due_date ASC, a.created_at DESC
    `,
    params
  );
  
  return rows.map(mapAssessmentRow);
}

// Get single assessment by ID
async function getAssessmentById(id) {
  const [rows] = await pool.query(
    `
    SELECT 
      a.*,
      s.name AS subject_name,
      s.code AS subject_code,
      CONCAT(u.first_name, ' ', u.last_name) AS creator_name,
      (SELECT COUNT(*) FROM assessment_questions WHERE assessment_id = a.id) AS question_count,
      (SELECT COUNT(DISTINCT student_id) FROM assessment_submissions WHERE assessment_id = a.id) AS submission_count
    FROM assessments a
    LEFT JOIN courses c ON a.course_id = c.id
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.id = ?
    `,
    [id]
  );
  
  return mapAssessmentRow(rows[0]);
}

// Create new assessment
async function createAssessment(data) {
  const [result] = await pool.query(
    `
    INSERT INTO assessments (
      course_id, title, description, assessment_type, total_points,
      due_date, available_from, available_until, duration_minutes,
      allow_late_submission, late_penalty_percent, max_attempts,
      show_correct_answers, shuffle_questions, is_published,
      instructions, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.courseId,
      data.title,
      data.description || null,
      data.assessmentType,
      data.totalPoints || 100,
      data.dueDate,
      data.availableFrom || null,
      data.availableUntil || null,
      data.durationMinutes || null,
      data.allowLateSubmission ? 1 : 0,
      data.latePenaltyPercent || null,
      data.maxAttempts || 1,
      data.showCorrectAnswers ? 1 : 0,
      data.shuffleQuestions ? 1 : 0,
      data.isPublished ? 1 : 0,
      data.instructions || null,
      data.createdBy
    ]
  );
  
  return getAssessmentById(result.insertId);
}

// Update assessment
async function updateAssessment(id, data) {
  const fields = [];
  const params = [];
  
  const fieldMap = {
    title: 'title',
    description: 'description',
    assessmentType: 'assessment_type',
    totalPoints: 'total_points',
    dueDate: 'due_date',
    availableFrom: 'available_from',
    availableUntil: 'available_until',
    durationMinutes: 'duration_minutes',
    allowLateSubmission: 'allow_late_submission',
    latePenaltyPercent: 'late_penalty_percent',
    maxAttempts: 'max_attempts',
    showCorrectAnswers: 'show_correct_answers',
    shuffleQuestions: 'shuffle_questions',
    isPublished: 'is_published',
    instructions: 'instructions'
  };
  
  Object.entries(fieldMap).forEach(([key, column]) => {
    if (data[key] !== undefined) {
      fields.push(`${column} = ?`);
      if (typeof data[key] === 'boolean') {
        params.push(data[key] ? 1 : 0);
      } else {
        params.push(data[key]);
      }
    }
  });
  
  if (fields.length === 0) {
    return getAssessmentById(id);
  }
  
  params.push(id);
  
  await pool.query(
    `UPDATE assessments SET ${fields.join(', ')} WHERE id = ?`,
    params
  );
  
  return getAssessmentById(id);
}

// Delete assessment
async function deleteAssessment(id) {
  const [result] = await pool.query(
    'DELETE FROM assessments WHERE id = ?',
    [id]
  );
  
  return result.affectedRows > 0;
}

// Get questions for an assessment
async function getAssessmentQuestions(assessmentId) {
  const [rows] = await pool.query(
    `
    SELECT * FROM assessment_questions
    WHERE assessment_id = ?
    ORDER BY order_number ASC
    `,
    [assessmentId]
  );
  
  return rows.map(row => ({
    id: row.id,
    assessmentId: row.assessment_id,
    questionText: row.question_text,
    questionType: row.question_type,
    points: row.points,
    correctAnswer: row.correct_answer ? JSON.parse(row.correct_answer) : null,
    options: row.options ? JSON.parse(row.options) : null,
    orderNumber: row.order_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

// Add question to assessment
async function addQuestion(assessmentId, questionData) {
  const [result] = await pool.query(
    `
    INSERT INTO assessment_questions (
      assessment_id, question_text, question_type, points,
      correct_answer, options, order_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      assessmentId,
      questionData.questionText,
      questionData.questionType,
      questionData.points || 1,
      questionData.correctAnswer ? JSON.stringify(questionData.correctAnswer) : null,
      questionData.options ? JSON.stringify(questionData.options) : null,
      questionData.orderNumber
    ]
  );
  
  return result.insertId;
}

// Get student submissions for an assessment
async function getSubmissionsByAssessment(assessmentId) {
  const [rows] = await pool.query(
    `
    SELECT 
      s.*,
      CONCAT(u.first_name, ' ', u.last_name) AS student_name,
      u.email AS student_email,
      a.title AS assessment_title,
      a.total_points
    FROM assessment_submissions s
    JOIN users u ON s.student_id = u.id
    JOIN assessments a ON s.assessment_id = a.id
    WHERE s.assessment_id = ?
    ORDER BY s.submission_date DESC
    `,
    [assessmentId]
  );
  
  return rows.map(mapSubmissionRow);
}

// Get student's submission for an assessment
async function getStudentSubmission(assessmentId, studentId, attemptNumber = null) {
  let query = `
    SELECT 
      s.*,
      a.title AS assessment_title,
      a.total_points
    FROM assessment_submissions s
    JOIN assessments a ON s.assessment_id = a.id
    WHERE s.assessment_id = ? AND s.student_id = ?
  `;
  
  const params = [assessmentId, studentId];
  
  if (attemptNumber) {
    query += ' AND s.attempt_number = ?';
    params.push(attemptNumber);
  } else {
    query += ' ORDER BY s.attempt_number DESC LIMIT 1';
  }
  
  const [rows] = await pool.query(query, params);
  
  return mapSubmissionRow(rows[0]);
}

// Create submission
async function createSubmission(data) {
  const [result] = await pool.query(
    `
    INSERT INTO assessment_submissions (
      assessment_id, student_id, attempt_number, submission_date,
      is_late, status, time_spent_minutes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.assessmentId,
      data.studentId,
      data.attemptNumber || 1,
      data.submissionDate || new Date(),
      data.isLate ? 1 : 0,
      data.status || 'submitted',
      data.timeSpentMinutes || null
    ]
  );
  
  return result.insertId;
}

// Update submission
async function updateSubmission(id, data) {
  const fields = [];
  const params = [];
  
  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }
  if (data.score !== undefined) {
    fields.push('score = ?');
    params.push(data.score);
  }
  if (data.feedback !== undefined) {
    fields.push('feedback = ?');
    params.push(data.feedback);
  }
  if (data.gradedBy !== undefined) {
    fields.push('graded_by = ?');
    params.push(data.gradedBy);
  }
  if (data.gradedAt !== undefined) {
    fields.push('graded_at = ?');
    params.push(data.gradedAt);
  }
  
  if (fields.length === 0) {
    return null;
  }
  
  params.push(id);
  
  await pool.query(
    `UPDATE assessment_submissions SET ${fields.join(', ')} WHERE id = ?`,
    params
  );
  
  const [rows] = await pool.query(
    'SELECT * FROM assessment_submissions WHERE id = ?',
    [id]
  );
  
  return mapSubmissionRow(rows[0]);
}

// Save student answer
async function saveAnswer(submissionId, questionId, answerText) {
  const [result] = await pool.query(
    `
    INSERT INTO assessment_answers (submission_id, question_id, answer_text)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE answer_text = VALUES(answer_text)
    `,
    [submissionId, questionId, answerText]
  );
  
  return result.insertId || result.affectedRows;
}

// Get answers for a submission
async function getSubmissionAnswers(submissionId) {
  const [rows] = await pool.query(
    `
    SELECT * FROM assessment_answers
    WHERE submission_id = ?
    `,
    [submissionId]
  );
  
  return rows.map(row => ({
    id: row.id,
    submissionId: row.submission_id,
    questionId: row.question_id,
    answerText: row.answer_text,
    isCorrect: row.is_correct,
    pointsEarned: row.points_earned,
    feedback: row.feedback,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

module.exports = {
  getAssessmentsByCourse,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getAssessmentQuestions,
  addQuestion,
  getSubmissionsByAssessment,
  getStudentSubmission,
  createSubmission,
  updateSubmission,
  saveAnswer,
  getSubmissionAnswers
};