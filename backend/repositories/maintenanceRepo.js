const pool = require('../db/mysql');

function mapMaintenanceRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    location: {
      building: row.location_building,
      floor: row.location_floor,
      roomNumber: row.location_room_number
    },
    submittedBy: row.submitted_by,
    status: row.status,
    assignedTo: row.assigned_to,
    estimatedCompletion: row.estimated_completion,
    actualCompletion: row.actual_completion,
    adminNotes: row.admin_notes,
    feedback: {
      rating: row.feedback_rating,
      comment: row.feedback_comment,
      submittedAt: row.feedback_submitted_at
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function createMaintenanceRequest(data) {
  const {
    title,
    description,
    category,
    priority = 'Medium',
    location,
    submittedBy
  } = data;

  const [result] = await pool.query(
    `INSERT INTO maintenance_requests (
      title, description, category, priority,
      location_building, location_floor, location_room_number,
      submitted_by, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', NOW())`,
    [
      title,
      description,
      category,
      priority,
      location.building,
      location.floor,
      location.roomNumber,
      submittedBy
    ]
  );

  const id = result.insertId;
  const [rows] = await pool.query('SELECT * FROM maintenance_requests WHERE id = ?', [id]);
  return mapMaintenanceRow(rows[0]);
}

async function getMaintenanceRequestById(id) {
  const [rows] = await pool.query('SELECT * FROM maintenance_requests WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return mapMaintenanceRow(rows[0]);
}

async function getAllMaintenanceRequests(filters = {}, page = 1, limit = 10) {
  let where = [];
  let params = [];

  if (filters.status && filters.status !== 'all') {
    where.push('status = ?');
    params.push(filters.status);
  }
  if (filters.category && filters.category !== 'all') {
    where.push('category = ?');
    params.push(filters.category);
  }
  if (filters.priority && filters.priority !== 'all') {
    where.push('priority = ?');
    params.push(filters.priority);
  }
  if (filters.submittedBy) {
    where.push('submitted_by = ?');
    params.push(filters.submittedBy);
  }
  if (filters.assignedTo) {
    where.push('assigned_to = ?');
    params.push(filters.assignedTo);
  }
  if (filters.search && filters.search.trim() !== '') {
    where.push('(title LIKE ? OR description LIKE ?)');
    const like = `%${filters.search.trim()}%`;
    params.push(like, like);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const [countResult] = await pool.query(
    `SELECT COUNT(*) as count FROM maintenance_requests ${whereClause}`,
    params
  );
  const total = countResult[0].count;

  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT * FROM maintenance_requests ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const requests = rows.map(mapMaintenanceRow);
  return {
    requests,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

async function updateMaintenanceRequest(id, data) {
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
  if (data.category !== undefined) {
    updateFields.push('category = ?');
    updateParams.push(data.category);
  }
  if (data.priority !== undefined) {
    updateFields.push('priority = ?');
    updateParams.push(data.priority);
  }
  if (data.location !== undefined) {
    updateFields.push('location_building = ?');
    updateParams.push(data.location.building);
    updateFields.push('location_floor = ?');
    updateParams.push(data.location.floor);
    updateFields.push('location_room_number = ?');
    updateParams.push(data.location.roomNumber);
  }
  if (data.status !== undefined) {
    updateFields.push('status = ?');
    updateParams.push(data.status);
  }
  if (data.assignedTo !== undefined) {
    updateFields.push('assigned_to = ?');
    updateParams.push(data.assignedTo);
  }
  if (data.estimatedCompletion !== undefined) {
    updateFields.push('estimated_completion = ?');
    updateParams.push(data.estimatedCompletion);
  }
  if (data.actualCompletion !== undefined) {
    updateFields.push('actual_completion = ?');
    updateParams.push(data.actualCompletion);
  }
  if (data.adminNotes !== undefined) {
    updateFields.push('admin_notes = ?');
    updateParams.push(data.adminNotes);
  }

  updateFields.push('updated_at = NOW()');

  if (updateFields.length > 1) {
    const updateQuery = `UPDATE maintenance_requests SET ${updateFields.join(', ')} WHERE id = ?`;
    updateParams.push(id);
    await pool.query(updateQuery, updateParams);
  }

  const [rows] = await pool.query('SELECT * FROM maintenance_requests WHERE id = ?', [id]);
  if (rows.length === 0) throw new Error('Maintenance request not found after update');
  return mapMaintenanceRow(rows[0]);
}

async function submitFeedback(id, feedback) {
  const { rating, comment } = feedback;

  await pool.query(
    `UPDATE maintenance_requests 
     SET feedback_rating = ?, feedback_comment = ?, feedback_submitted_at = NOW()
     WHERE id = ?`,
    [rating, comment, id]
  );

  const [rows] = await pool.query('SELECT * FROM maintenance_requests WHERE id = ?', [id]);
  if (rows.length === 0) throw new Error('Maintenance request not found after feedback submission');
  return mapMaintenanceRow(rows[0]);
}

async function deleteMaintenanceRequest(id) {
  const [result] = await pool.query('DELETE FROM maintenance_requests WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function getCategories() {
  return ['Electrical', 'Plumbing', 'HVAC', 'Furniture', 'Equipment', 'Structural', 'Cleaning', 'Other'];
}

async function getPriorities() {
  return ['Low', 'Medium', 'High', 'Urgent'];
}

async function getStatuses() {
  return ['Submitted', 'In Progress', 'Completed', 'Cancelled'];
}

module.exports = {
  createMaintenanceRequest,
  getMaintenanceRequestById,
  getAllMaintenanceRequests,
  updateMaintenanceRequest,
  submitFeedback,
  deleteMaintenanceRequest,
  getCategories,
  getPriorities,
  getStatuses
};
