// repositories/messageRepo.js
const pool = require('../db/mysql');

const messageRepo = {
  /**
   * Get all messages sent by a parent
   * @param {number} parentId - Parent user ID
   * @returns {Promise<Array>} Array of sent messages
   */
  getSentMessages: async (parentId) => {
    const query = `
      SELECT
        m.*,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
        t.email as teacher_email,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        se.name as course_name,
        subj_code.value_string as course_code
      FROM parent_teacher_messages m
      LEFT JOIN users t ON m.teacher_id = t.id
      LEFT JOIN users s ON m.student_id = s.id
      LEFT JOIN courses_eav_entities ce ON m.course_id = ce.entity_id
      LEFT JOIN courses_eav_values subj_id_val ON ce.entity_id = subj_id_val.entity_id 
        AND subj_id_val.attribute_id = (SELECT attribute_id FROM courses_eav_attributes WHERE attribute_name = 'subject_id')
      LEFT JOIN subjects_eav_entities se ON subj_id_val.value_number = se.entity_id
      LEFT JOIN subjects_eav_values subj_code ON se.entity_id = subj_code.entity_id 
        AND subj_code.attribute_id = (SELECT attribute_id FROM subjects_eav_attributes WHERE attribute_name = 'code')
      WHERE m.parent_id = ?
      ORDER BY m.created_at DESC
    `;
    const [rows] = await pool.query(query, [parentId]);
    return rows;
  },

  /**
   * Get all messages received by a teacher
   * @param {number} teacherId - Teacher user ID
   * @returns {Promise<Array>} Array of received messages
   */
  getReceivedMessages: async (teacherId) => {
    const query = `
      SELECT
        m.*,
        CONCAT(p.first_name, ' ', p.last_name) as parent_name,
        p.email as parent_email,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        se.name as course_name,
        subj_code.value_string as course_code
      FROM parent_teacher_messages m
      LEFT JOIN users p ON m.parent_id = p.id
      LEFT JOIN users s ON m.student_id = s.id
      LEFT JOIN courses_eav_entities ce ON m.course_id = ce.entity_id
      LEFT JOIN courses_eav_values subj_id_val ON ce.entity_id = subj_id_val.entity_id 
        AND subj_id_val.attribute_id = (SELECT attribute_id FROM courses_eav_attributes WHERE attribute_name = 'subject_id')
      LEFT JOIN subjects_eav_entities se ON subj_id_val.value_number = se.entity_id
      LEFT JOIN subjects_eav_values subj_code ON se.entity_id = subj_code.entity_id 
        AND subj_code.attribute_id = (SELECT attribute_id FROM subjects_eav_attributes WHERE attribute_name = 'code')
      WHERE m.teacher_id = ?
      ORDER BY m.created_at DESC
    `;
    const [rows] = await pool.query(query, [teacherId]);
    return rows;
  },

  /**
   * Get a specific message by ID
   * @param {number} id - Message ID
   * @returns {Promise<Object|null>} Message or null
   */
  getMessageById: async (id) => {
    const query = `
      SELECT
        m.*,
        CONCAT(p.first_name, ' ', p.last_name) as parent_name,
        p.email as parent_email,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
        t.email as teacher_email,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        se.name as course_name,
        subj_code.value_string as course_code
      FROM parent_teacher_messages m
      LEFT JOIN users p ON m.parent_id = p.id
      LEFT JOIN users t ON m.teacher_id = t.id
      LEFT JOIN users s ON m.student_id = s.id
      LEFT JOIN courses_eav_entities ce ON m.course_id = ce.entity_id
      LEFT JOIN courses_eav_values subj_id_val ON ce.entity_id = subj_id_val.entity_id 
        AND subj_id_val.attribute_id = (SELECT attribute_id FROM courses_eav_attributes WHERE attribute_name = 'subject_id')
      LEFT JOIN subjects_eav_entities se ON subj_id_val.value_number = se.entity_id
      LEFT JOIN subjects_eav_values subj_code ON se.entity_id = subj_code.entity_id 
        AND subj_code.attribute_id = (SELECT attribute_id FROM subjects_eav_attributes WHERE attribute_name = 'code')
      WHERE m.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Create a new message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created message
   */
  createMessage: async (messageData) => {
    const query = `
      INSERT INTO parent_teacher_messages (
        parent_id, teacher_id, student_id, course_id,
        subject, content,
        parent_message_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const values = [
      messageData.parent_id,
      messageData.teacher_id,
      messageData.student_id || null,
      messageData.course_id || null,
      messageData.subject,
      messageData.content,
      messageData.parent_message_id || null
    ];
    
    const [result] = await pool.query(query, values);
    return messageRepo.getMessageById(result.insertId);
  },

  /**
   * Mark a message as read
   * @param {number} id - Message ID
   * @returns {Promise<Object>} Updated message
   */
  markAsRead: async (id) => {
    const query = `
      UPDATE parent_teacher_messages 
      SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `;
    await pool.query(query, [id]);
    return messageRepo.getMessageById(id);
  },

  /**
   * Get count of unread messages for a teacher
   * @param {number} teacherId - Teacher user ID
   * @returns {Promise<number>} Count of unread messages
   */
  getUnreadCount: async (teacherId) => {
    const query = `
      SELECT COUNT(*) as count
      FROM parent_teacher_messages
      WHERE teacher_id = ? AND is_read = FALSE
    `;
    const [rows] = await pool.query(query, [teacherId]);
    return rows[0].count || 0;
  },

  /**
   * Get children (students) for a parent
   * @param {number} parentId - Parent user ID
   * @returns {Promise<Array>} Array of children
   */
  getParentChildren: async (parentId) => {
    console.log('getParentChildren repo called with parentId:', parentId);
    const query = `
      SELECT 
        psr.id as relationship_id,
        psr.student_id,
        psr.relationship_type,
        psr.is_primary,
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as student_name,
        u.email as student_email,
        u.first_name,
        u.last_name
      FROM parent_student_relationships psr
      INNER JOIN users u ON psr.student_id = u.id
      WHERE psr.parent_id = ?
      ORDER BY psr.is_primary DESC, u.first_name
    `;
    console.log('Executing query:', query);
    console.log('With parameter:', parentId);
    const [rows] = await pool.query(query, [parentId]);
    console.log('Query result rows:', rows);
    console.log('Rows length:', rows.length);
    return rows;
  },

  /**
   * Get teachers for a student's enrolled courses
   * @param {number} studentId - Student user ID
   * @returns {Promise<Array>} Array of teachers with course info
   */
  getStudentTeachers: async (studentId) => {
    console.log('getStudentTeachers called with studentId:', studentId);
    
    // First, check what enrollments exist for this student
    const enrollmentCheckQuery = `
      SELECT e.*, ce.name as course_name, inst.value_number as instructor_id, u.first_name, u.last_name, u.role
      FROM enrollments e
      LEFT JOIN courses_eav_entities ce ON e.course_id = ce.entity_id
      LEFT JOIN courses_eav_values inst ON ce.entity_id = inst.entity_id 
        AND inst.attribute_id = (SELECT attribute_id FROM courses_eav_attributes WHERE attribute_name = 'instructor_id')
      LEFT JOIN users u ON inst.value_number = u.id
      WHERE e.student_id = ?
    `;
    console.log('Checking enrollments for student:', studentId);
    const [enrollmentRows] = await pool.query(enrollmentCheckQuery, [studentId]);
    console.log('All enrollments for student:', enrollmentRows);
    
    const query = `
      SELECT DISTINCT
        u.id as teacher_id,
        CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
        u.email as teacher_email,
        ce.entity_id as course_id,
        se.name as course_name,
        subj_code.value_string as course_code,
        inst.value_number as instructor_id,
        sem.value_string as semester,
        yr.value_number as year
      FROM enrollments e
      INNER JOIN courses_eav_entities ce ON e.course_id = ce.entity_id
      LEFT JOIN courses_eav_values inst ON ce.entity_id = inst.entity_id 
        AND inst.attribute_id = (SELECT attribute_id FROM courses_eav_attributes WHERE attribute_name = 'instructor_id')
      LEFT JOIN courses_eav_values subj_id_val ON ce.entity_id = subj_id_val.entity_id 
        AND subj_id_val.attribute_id = (SELECT attribute_id FROM courses_eav_attributes WHERE attribute_name = 'subject_id')
      LEFT JOIN subjects_eav_entities se ON subj_id_val.value_number = se.entity_id
      LEFT JOIN subjects_eav_values subj_code ON se.entity_id = subj_code.entity_id 
        AND subj_code.attribute_id = (SELECT attribute_id FROM subjects_eav_attributes WHERE attribute_name = 'code')
      LEFT JOIN courses_eav_values sem ON ce.entity_id = sem.entity_id 
        AND sem.attribute_id = (SELECT attribute_id FROM courses_eav_attributes WHERE attribute_name = 'semester')
      LEFT JOIN courses_eav_values yr ON ce.entity_id = yr.entity_id 
        AND yr.attribute_id = (SELECT attribute_id FROM courses_eav_attributes WHERE attribute_name = 'year')
      INNER JOIN users u ON inst.value_number = u.id
      WHERE e.student_id = ?
        AND e.status IN ('enrolled', 'approved', 'active')
        AND u.role IN ('professor', 'ta')
        AND ce.is_active = 1
      ORDER BY se.name
    `;
    console.log('Executing getStudentTeachers query:', query);
    console.log('With studentId parameter:', studentId);
    const [rows] = await pool.query(query, [studentId]);
    console.log('getStudentTeachers query result rows:', rows);
    console.log('getStudentTeachers rows length:', rows.length);
    return rows;
  },

  /**
   * Delete a message
   * @param {number} id - Message ID
   * @returns {Promise<boolean>} True if deleted
   */
  deleteMessage: async (id) => {
    const query = 'DELETE FROM parent_teacher_messages WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
  }
};

module.exports = messageRepo;
