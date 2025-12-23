const pool = require('../db/mysql');

// Get all professional development activities for a user
const getActivitiesByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT * FROM professional_development_activities
     WHERE user_id = ?
     ORDER BY start_date DESC, created_at DESC`,
    [userId]
  );
  return rows;
};

// Get activities by status for a user
const getActivitiesByStatus = async (userId, status) => {
  const [rows] = await pool.query(
    `SELECT * FROM professional_development_activities
     WHERE user_id = ? AND status = ?
     ORDER BY start_date DESC`,
    [userId, status]
  );
  return rows;
};

// Get a single activity by ID
const getActivityById = async (activityId) => {
  const [rows] = await pool.query(
    `SELECT * FROM professional_development_activities
     WHERE id = ?`,
    [activityId]
  );
  return rows[0];
};

// Create a new professional development activity
const createActivity = async (activityData) => {
  const {
    userId,
    activityType,
    title,
    description,
    organizer,
    location,
    startDate,
    endDate,
    durationHours,
    status,
    completionDate,
    certificateObtained,
    certificateUrl,
    creditsEarned,
    cost,
    fundingSource,
    skillsAcquired,
    notes
  } = activityData;

  const [result] = await pool.query(
    `INSERT INTO professional_development_activities (
      user_id, activity_type, title, description, organizer, location,
      start_date, end_date, duration_hours, status, completion_date,
      certificate_obtained, certificate_url, credits_earned, cost,
      funding_source, skills_acquired, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      activityType,
      title,
      description || null,
      organizer || null,
      location || null,
      startDate,
      endDate || null,
      durationHours || null,
      status || 'planned',
      completionDate || null,
      certificateObtained ? 1 : 0,
      certificateUrl || null,
      creditsEarned || null,
      cost || null,
      fundingSource || null,
      skillsAcquired || null,
      notes || null
    ]
  );

  return getActivityById(result.insertId);
};

// Update an existing activity
const updateActivity = async (activityId, activityData) => {
  const fields = [];
  const values = [];

  const fieldMap = {
    activityType: 'activity_type',
    title: 'title',
    description: 'description',
    organizer: 'organizer',
    location: 'location',
    startDate: 'start_date',
    endDate: 'end_date',
    durationHours: 'duration_hours',
    status: 'status',
    completionDate: 'completion_date',
    certificateObtained: 'certificate_obtained',
    certificateUrl: 'certificate_url',
    creditsEarned: 'credits_earned',
    cost: 'cost',
    fundingSource: 'funding_source',
    skillsAcquired: 'skills_acquired',
    notes: 'notes'
  };

  Object.entries(fieldMap).forEach(([key, column]) => {
    if (activityData[key] !== undefined) {
      fields.push(`${column} = ?`);
      if (key === 'certificateObtained') {
        values.push(activityData[key] ? 1 : 0);
      } else {
        values.push(activityData[key]);
      }
    }
  });

  if (fields.length === 0) {
    return getActivityById(activityId);
  }

  values.push(activityId);

  await pool.query(
    `UPDATE professional_development_activities 
     SET ${fields.join(', ')}
     WHERE id = ?`,
    values
  );

  return getActivityById(activityId);
};

// Delete an activity
const deleteActivity = async (activityId) => {
  await pool.query(
    'DELETE FROM professional_development_activities WHERE id = ?',
    [activityId]
  );
};

// Get activity statistics for a user
const getActivityStatistics = async (userId) => {
  const [stats] = await pool.query(
    `SELECT 
      COUNT(*) as total_activities,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
      SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) as ongoing_count,
      SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) as planned_count,
      SUM(CASE WHEN certificate_obtained = 1 THEN 1 ELSE 0 END) as certificates_count,
      SUM(COALESCE(duration_hours, 0)) as total_hours,
      SUM(COALESCE(credits_earned, 0)) as total_credits
     FROM professional_development_activities
     WHERE user_id = ?`,
    [userId]
  );
  return stats[0];
};

module.exports = {
  getActivitiesByUserId,
  getActivitiesByStatus,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityStatistics
};
