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
        CONCAT(t.firstName, ' ', t.lastName) as teacher_name,
        t.email as teacher_email,
        CONCAT(s.firstName, ' ', s.lastName) as student_name,
        c.name as course_name,
        c.code as course_code
      FROM parent_teacher_messages m
      LEFT JOIN users t ON m.teacher_id = t.id
      LEFT JOIN users s ON m.student_id = s.id
      LEFT JOIN courses c ON m.course_id = c.id
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
        CONCAT(p.firstName, ' ', p.lastName) as parent_name,
        p.email as parent_email,
        CONCAT(s.firstName, ' ', s.lastName) as student_name,
        c.name as course_name,
        c.code as course_code
      FROM parent_teacher_messages m
      LEFT JOIN users p ON m.parent_id = p.id
      LEFT JOIN users s ON m.student_id = s.id
      LEFT JOIN courses c ON m.course_id = c.id
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
        CONCAT(p.firstName, ' ', p.lastName) as parent_name,
        p.email as parent_email,
        CONCAT(t.firstName, ' ', t.lastName) as teacher_name,
        t.email as teacher_email,
        CONCAT(s.firstName, ' ', s.lastName) as student_name,
        c.name as course_name,
        c.code as course_code
      FROM parent_teacher_messages m
      LEFT JOIN users p ON m.parent_id = p.id
      LEFT JOIN users t ON m.teacher_id = t.id
      LEFT JOIN users s ON m.student_id = s.id
      LEFT JOIN courses c ON m.course_id = c.id
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
   * Get teachers for a student's enrolled courses
   * @param {number} studentId - Student user ID
   * @returns {Promise<Array>} Array of teachers with course info
   */
  getStudentTeachers: async (studentId) => {
    const query = `
      SELECT DISTINCT
        u.id as teacher_id,
        CONCAT(u.firstName, ' ', u.lastName) as teacher_name,
        u.email as teacher_email,
        c.id as course_id,
        c.name as course_name,
        c.code as course_code,
        c.instructor_id
      FROM enrollments e
      INNER JOIN courses c ON e.course_id = c.id
      INNER JOIN users u ON c.instructor_id = u.id
      WHERE e.student_id = ?
        AND e.status = 'approved'
        AND u.role IN ('professor', 'ta')
      ORDER BY c.name
    `;
    const [rows] = await pool.query(query, [studentId]);
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
