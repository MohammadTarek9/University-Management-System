// repositories/meetingRepo.js (SIMPLIFIED)
const pool = require('../db/mysql');

// Map meeting row to object
function mapMeetingRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    studentId: row.student_id,
    professorId: row.professor_id,
    meetingDate: row.meeting_date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    purpose: row.purpose,
    status: row.status,
    professorNotes: row.professor_notes,
    studentNotes: row.student_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Joined fields
    studentName: row.student_name,
    professorName: row.professor_name,
    studentEmail: row.student_email,
    professorEmail: row.professor_email,
    officeLocation: row.office_location
  };
}

// Create a meeting request (SIMPLIFIED - no availability check)
async function createMeetingRequest(meetingData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if the same student has already requested a meeting at this time
    const [existing] = await connection.query(
      `SELECT id FROM meeting_requests 
       WHERE student_id = ? 
         AND professor_id = ?
         AND meeting_date = ? 
         AND start_time = ? 
         AND status IN ('pending', 'approved')`,
      [
        meetingData.studentId,
        meetingData.professorId,
        meetingData.meetingDate,
        meetingData.startTime
      ]
    );
    
    if (existing.length > 0) {
      throw new Error('You have already requested a meeting at this time');
    }
    
    // Insert meeting request
    const [result] = await connection.query(
      `INSERT INTO meeting_requests 
       (student_id, professor_id, meeting_date, start_time, end_time, 
        duration_minutes, purpose, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [
        meetingData.studentId,
        meetingData.professorId,
        meetingData.meetingDate,
        meetingData.startTime,
        meetingData.endTime,
        meetingData.durationMinutes || 30,
        meetingData.purpose || 'Academic guidance',
      ]
    );
    
    await connection.commit();
    
    return getMeetingById(result.insertId);
  } catch (error) {
    await connection.rollback();
    console.error('Error creating meeting request:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Get meeting by ID with details
async function getMeetingById(meetingId) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        mr.*,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        CONCAT(p.first_name, ' ', p.last_name) as professor_name,
        s.email as student_email,
        p.email as professor_email,
        tsp.office_location
       FROM meeting_requests mr
       LEFT JOIN users s ON mr.student_id = s.id
       LEFT JOIN users p ON mr.professor_id = p.id
       LEFT JOIN teaching_staff_profiles tsp ON mr.professor_id = tsp.user_id
       WHERE mr.id = ?
       LIMIT 1`,
      [meetingId]
    );
    
    return rows.length > 0 ? mapMeetingRow(rows[0]) : null;
  } catch (error) {
    console.error('Error getting meeting by ID:', error);
    throw error;
  }
}

// Get meetings by professor ID
async function getMeetingsByProfessor(professorId, status = null) {
  try {
    let query = `SELECT 
        mr.*,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        CONCAT(p.first_name, ' ', p.last_name) as professor_name,
        s.email as student_email,
        p.email as professor_email,
        tsp.office_location
       FROM meeting_requests mr
       LEFT JOIN users s ON mr.student_id = s.id
       LEFT JOIN users p ON mr.professor_id = p.id
       LEFT JOIN teaching_staff_profiles tsp ON mr.professor_id = tsp.user_id
       WHERE mr.professor_id = ?`;
    
    const params = [professorId];
    
    if (status) {
      query += ' AND mr.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY mr.meeting_date DESC, mr.start_time DESC';
    
    const [rows] = await pool.query(query, params);
    
    return rows.map(mapMeetingRow);
  } catch (error) {
    console.error('Error getting meetings by professor:', error);
    throw error;
  }
}

// Get meetings by student ID
async function getMeetingsByStudent(studentId, status = null) {
  try {
    let query = `SELECT 
        mr.*,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        CONCAT(p.first_name, ' ', p.last_name) as professor_name,
        s.email as student_email,
        p.email as professor_email,
        tsp.office_location
       FROM meeting_requests mr
       LEFT JOIN users s ON mr.student_id = s.id
       LEFT JOIN users p ON mr.professor_id = p.id
       LEFT JOIN teaching_staff_profiles tsp ON mr.professor_id = tsp.user_id
       WHERE mr.student_id = ?`;
    
    const params = [studentId];
    
    if (status) {
      query += ' AND mr.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY mr.meeting_date DESC, mr.start_time DESC';
    
    const [rows] = await pool.query(query, params);
    
    return rows.map(mapMeetingRow);
  } catch (error) {
    console.error('Error getting meetings by student:', error);
    throw error;
  }
}

// Get meetings by professor and date (for checking availability)
async function getMeetingsByProfessorAndDate(professorId, date) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM meeting_requests 
       WHERE professor_id = ? 
         AND meeting_date = ? 
         AND status IN ('pending', 'approved')
       ORDER BY start_time`,
      [professorId, date]
    );
    
    return rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      professorId: row.professor_id,
      meetingDate: row.meeting_date,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status
    }));
  } catch (error) {
    console.error('Error getting meetings by professor and date:', error);
    throw error;
  }
}

// Update meeting status
async function updateMeetingStatus(meetingId, status, notes = null, updatedBy = null) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const updates = ['status = ?', 'updated_at = NOW()'];
    const params = [status];
    
    if (notes !== null) {
      if (updatedBy === 'professor') {
        updates.push('professor_notes = ?');
        params.push(notes);
      } else if (updatedBy === 'student') {
        updates.push('student_notes = ?');
        params.push(notes);
      }
    }
    
    params.push(meetingId);
    
    const [result] = await connection.query(
      `UPDATE meeting_requests SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Meeting not found');
    }
    
    await connection.commit();
    
    return getMeetingById(meetingId);
  } catch (error) {
    await connection.rollback();
    console.error('Error updating meeting status:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Cancel meeting
async function cancelMeeting(meetingId, cancelledById, notes = null) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get meeting to check permissions
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }
    
    // Check if user can cancel
    const canCancel = cancelledById === meeting.studentId || cancelledById === meeting.professorId;
    if (!canCancel) {
      throw new Error('Not authorized to cancel this meeting');
    }
    
    const updates = ['status = "cancelled"', 'updated_at = NOW()'];
    const params = [];
    
    if (notes) {
      if (cancelledById === meeting.professorId) {
        updates.push('professor_notes = ?');
      } else {
        updates.push('student_notes = ?');
      }
      params.push(notes);
    }
    
    params.push(meetingId);
    
    const [result] = await connection.query(
      `UPDATE meeting_requests SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Meeting not found');
    }
    
    await connection.commit();
    
    return getMeetingById(meetingId);
  } catch (error) {
    await connection.rollback();
    console.error('Error cancelling meeting:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Get meeting statistics for professor
async function getProfessorMeetingStats(professorId) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM meeting_requests 
       WHERE professor_id = ?
       GROUP BY status`,
      [professorId]
    );
    
    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      total: 0
    };
    
    rows.forEach(row => {
      stats[row.status] = row.count;
      stats.total += row.count;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting professor meeting stats:', error);
    throw error;
  }
}

// Get upcoming meetings
async function getUpcomingMeetings(userId, userRole, limit = 10) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];
    
    let query = '';
    const params = [];
    
    if (userRole === 'student') {
      query = `SELECT 
          mr.*,
          CONCAT(p.first_name, ' ', p.last_name) as professor_name,
          p.email as professor_email,
          tsp.office_location
         FROM meeting_requests mr
         LEFT JOIN users p ON mr.professor_id = p.id
         LEFT JOIN teaching_staff_profiles tsp ON mr.professor_id = tsp.user_id
         WHERE mr.student_id = ? 
           AND (
             (mr.meeting_date > ?) 
             OR (mr.meeting_date = ? AND mr.start_time > ?)
           )
           AND mr.status = 'approved'
         ORDER BY mr.meeting_date ASC, mr.start_time ASC
         LIMIT ?`;
      params.push(userId, today, today, now, limit);
    } else if (['professor', 'ta'].includes(userRole)) {
      query = `SELECT 
          mr.*,
          CONCAT(s.first_name, ' ', s.last_name) as student_name,
          s.email as student_email,
          tsp.office_location
         FROM meeting_requests mr
         LEFT JOIN users s ON mr.student_id = s.id
         LEFT JOIN teaching_staff_profiles tsp ON mr.professor_id = tsp.user_id
         WHERE mr.professor_id = ? 
           AND (
             (mr.meeting_date > ?) 
             OR (mr.meeting_date = ? AND mr.start_time > ?)
           )
           AND mr.status = 'approved'
         ORDER BY mr.meeting_date ASC, mr.start_time ASC
         LIMIT ?`;
      params.push(userId, today, today, now, limit);
    } else {
      return [];
    }
    
    const [rows] = await pool.query(query, params);
    
    return rows.map(mapMeetingRow);
  } catch (error) {
    console.error('Error getting upcoming meetings:', error);
    throw error;
  }
}

module.exports = {
  createMeetingRequest,
  getMeetingById,
  getMeetingsByProfessor,
  getMeetingsByStudent,
  getMeetingsByProfessorAndDate,
  updateMeetingStatus,
  cancelMeeting,
  getProfessorMeetingStats,
  getUpcomingMeetings
};