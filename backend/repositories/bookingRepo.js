const pool = require('../db/mysql');

function mapBookingRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    attendees: row.attendees,
    isRecurring: !!row.is_recurring,
    recurringFrequency: row.recurring_frequency,
    recurringEndDate: row.recurring_end_date,
    recurringOccurrences: row.recurring_occurrences,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function createBooking(data) {
  const {
    roomId,
    userId,
    title,
    description,
    startTime,
    endTime,
    status = 'approved',
    attendees,
    isRecurring = false,
    recurringFrequency = 'weekly',
    recurringEndDate = null,
    recurringOccurrences = null,
    createdBy
  } = data;

  const [result] = await pool.query(
    `INSERT INTO bookings (
      room_id, user_id, title, description, start_time, end_time, status, attendees,
      is_recurring, recurring_frequency, recurring_end_date, recurring_occurrences, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      roomId,
      userId,
      title,
      description,
      startTime,
      endTime,
      status,
      attendees,
      isRecurring ? 1 : 0,
      recurringFrequency,
      recurringEndDate,
      recurringOccurrences,
      createdBy
    ]
  );

  const bookingId = result.insertId;
  const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
  return mapBookingRow(rows[0]);
}

async function getBookingById(id) {
  const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return mapBookingRow(rows[0]);
}

async function getAllBookings(filters = {}, page = 1, limit = 10) {
  let where = [];
  let params = [];

  if (filters.userId) {
    where.push('user_id = ?');
    params.push(filters.userId);
  }
  if (filters.status && filters.status !== 'all') {
    where.push('status = ?');
    params.push(filters.status);
  }
  if (filters.roomId && filters.roomId !== 'all') {
    where.push('room_id = ?');
    params.push(filters.roomId);
  }
  if (filters.startDate && filters.endDate) {
    where.push('start_time >= ? AND end_time <= ?');
    params.push(filters.startDate, filters.endDate);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const [countResult] = await pool.query(
    `SELECT COUNT(*) as count FROM bookings ${whereClause}`,
    params
  );
  const total = countResult[0].count;

  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT * FROM bookings ${whereClause} ORDER BY start_time DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const bookings = rows.map(mapBookingRow);
  return {
    bookings,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

async function updateBooking(id, data) {
  let updateFields = [];
  let updateParams = [];

  if (data.title !== undefined) {
    updateFields.push('title = ?');
    updateParams.push(data.title);
  }
  if (data.description !== undefined) {
    updateFields.push('description = ?');
    updateParams.push(data.description);
  }
  if (data.startTime !== undefined) {
    updateFields.push('start_time = ?');
    updateParams.push(data.startTime);
  }
  if (data.endTime !== undefined) {
    updateFields.push('end_time = ?');
    updateParams.push(data.endTime);
  }
  if (data.attendees !== undefined) {
    updateFields.push('attendees = ?');
    updateParams.push(data.attendees);
  }
  if (data.status !== undefined) {
    updateFields.push('status = ?');
    updateParams.push(data.status);
  }
  if (data.isRecurring !== undefined) {
    updateFields.push('is_recurring = ?');
    updateParams.push(data.isRecurring ? 1 : 0);
  }
  if (data.recurringFrequency !== undefined) {
    updateFields.push('recurring_frequency = ?');
    updateParams.push(data.recurringFrequency);
  }
  if (data.recurringEndDate !== undefined) {
    updateFields.push('recurring_end_date = ?');
    updateParams.push(data.recurringEndDate);
  }
  if (data.recurringOccurrences !== undefined) {
    updateFields.push('recurring_occurrences = ?');
    updateParams.push(data.recurringOccurrences);
  }
  if (data.updatedBy !== undefined) {
    updateFields.push('created_by = ?');
    updateParams.push(data.updatedBy);
  }

  updateFields.push('updated_at = NOW()');

  if (updateFields.length > 1) {
    const updateQuery = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`;
    updateParams.push(id);
    await pool.query(updateQuery, updateParams);
  }

  const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
  if (rows.length === 0) throw new Error('Booking not found after update');
  return mapBookingRow(rows[0]);
}

async function deleteBooking(id) {
  const [result] = await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function cancelBooking(id) {
  await pool.query('UPDATE bookings SET status = "cancelled", updated_at = NOW() WHERE id = ?', [id]);
  const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
  if (rows.length === 0) throw new Error('Booking not found after cancel');
  return mapBookingRow(rows[0]);
}

async function checkAvailability(roomId, startTime, endTime, excludeBookingId = null) {
  let query = `
    SELECT COUNT(*) as count
    FROM bookings
    WHERE room_id = ?
    AND status = 'approved'
    AND (
      (start_time < ? AND end_time > ?)
      OR (start_time < ? AND end_time > ?)
      OR (start_time >= ? AND end_time <= ?)
    )
  `;
  const params = [roomId, endTime, startTime, endTime, startTime, startTime, endTime];
  if (excludeBookingId) {
    query += ' AND id != ?';
    params.push(excludeBookingId);
  }
  const [result] = await pool.query(query, params);
  return result[0].count === 0;
}

module.exports = {
  createBooking,
  getBookingById,
  getAllBookings,
  updateBooking,
  deleteBooking,
  cancelBooking,
  checkAvailability
};
