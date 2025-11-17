const pool = require('../db/mysql');

/**
 * Create a new announcement
 */
async function createAnnouncement(authorId, announcementData) {
  const {
    title,
    content,
    category,
    priority,
    targetAudience,
    expiryDate
  } = announcementData;

  const [result] = await pool.query(
    `INSERT INTO announcements 
     (author_id, title, content, category, priority, target_audience, expiry_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      authorId,
      title,
      content,
      category || 'general',
      priority || 'normal',
      targetAudience || 'all',
      expiryDate || null
    ]
  );

  return getAnnouncementById(result.insertId);
}

/**
 * Get announcement by ID
 */
async function getAnnouncementById(announcementId) {
  const [announcements] = await pool.query(
    `SELECT a.*, u.first_name, u.last_name, u.email, u.role
     FROM announcements a
     LEFT JOIN users u ON a.author_id = u.id
     WHERE a.announcement_id = ?`,
    [announcementId]
  );
  return announcements[0] || null;
}

/**
 * Get all announcements with filters (for users)
 */
async function getAnnouncements(filters = {}) {
  const { 
    page = 1, 
    limit = 10, 
    category = '', 
    targetAudience = 'all',
    searchQuery = '',
    activeOnly = true 
  } = filters;

  let query = `
    SELECT a.*, u.first_name, u.last_name, u.email, u.role
    FROM announcements a
    LEFT JOIN users u ON a.author_id = u.id
    WHERE 1=1
  `;
  const params = [];

  // Filter by active status
  if (activeOnly) {
    query += ` AND a.is_active = TRUE`;
    query += ` AND (a.expiry_date IS NULL OR a.expiry_date > NOW())`;
  }

  // Filter by category
  if (category) {
    query += ' AND a.category = ?';
    params.push(category);
  }

  // Filter by target audience
  if (targetAudience && targetAudience !== 'all') {
    query += ' AND (a.target_audience = ? OR a.target_audience = "all")';
    params.push(targetAudience);
  }

  // Search filter
  if (searchQuery) {
    query += ' AND (a.title LIKE ? OR a.content LIKE ?)';
    const searchParam = `%${searchQuery}%`;
    params.push(searchParam, searchParam);
  }

  query += ' ORDER BY a.priority DESC, a.published_date DESC';

  const offset = (page - 1) * limit;
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [announcements] = await pool.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM announcements WHERE 1=1';
  const countParams = [];

  if (activeOnly) {
    countQuery += ` AND is_active = TRUE AND (expiry_date IS NULL OR expiry_date > NOW())`;
  }

  if (category) {
    countQuery += ' AND category = ?';
    countParams.push(category);
  }

  if (targetAudience && targetAudience !== 'all') {
    countQuery += ' AND (target_audience = ? OR target_audience = "all")';
    countParams.push(targetAudience);
  }

  if (searchQuery) {
    countQuery += ' AND (title LIKE ? OR content LIKE ?)';
    const searchParam = `%${searchQuery}%`;
    countParams.push(searchParam, searchParam);
  }

  const [countResult] = await pool.query(countQuery, countParams);

  return {
    announcements,
    total: countResult[0].total,
    page,
    limit,
    pages: Math.ceil(countResult[0].total / limit)
  };
}

/**
 * Get all announcements (admin view - includes inactive)
 */
async function getAllAnnouncementsAdmin(filters = {}) {
  const { page = 1, limit = 10, category = '', status = '' } = filters;

  let query = `
    SELECT a.*, u.first_name, u.last_name, u.email, u.role
    FROM announcements a
    LEFT JOIN users u ON a.author_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    query += ' AND a.category = ?';
    params.push(category);
  }

  if (status === 'active') {
    query += ' AND a.is_active = TRUE AND (a.expiry_date IS NULL OR a.expiry_date > NOW())';
  } else if (status === 'inactive') {
    query += ' AND (a.is_active = FALSE OR a.expiry_date <= NOW())';
  }

  query += ' ORDER BY a.published_date DESC';

  const offset = (page - 1) * limit;
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [announcements] = await pool.query(query, params);

  // Count query
  let countQuery = 'SELECT COUNT(*) as total FROM announcements WHERE 1=1';
  const countParams = [];

  if (category) {
    countQuery += ' AND category = ?';
    countParams.push(category);
  }

  if (status === 'active') {
    countQuery += ' AND is_active = TRUE AND (expiry_date IS NULL OR expiry_date > NOW())';
  } else if (status === 'inactive') {
    countQuery += ' AND (is_active = FALSE OR expiry_date <= NOW())';
  }

  const [countResult] = await pool.query(countQuery, countParams);

  return {
    announcements,
    total: countResult[0].total,
    page,
    limit,
    pages: Math.ceil(countResult[0].total / limit)
  };
}

/**
 * Update announcement
 */
async function updateAnnouncement(announcementId, announcementData) {
  const {
    title,
    content,
    category,
    priority,
    targetAudience,
    isActive,
    expiryDate
  } = announcementData;

  await pool.query(
    `UPDATE announcements 
     SET title = ?, content = ?, category = ?, priority = ?, 
         target_audience = ?, is_active = ?, expiry_date = ?, updated_at = NOW()
     WHERE announcement_id = ?`,
    [
      title,
      content,
      category,
      priority,
      targetAudience,
      isActive !== undefined ? isActive : true,
      expiryDate || null,
      announcementId
    ]
  );

  return getAnnouncementById(announcementId);
}

/**
 * Delete announcement (hard delete)
 */
async function deleteAnnouncement(announcementId) {
  await pool.query(
    `DELETE FROM announcements WHERE announcement_id = ?`,
    [announcementId]
  );
  return true;
}

/**
 * Toggle announcement active status
 */
async function toggleAnnouncementStatus(announcementId) {
  await pool.query(
    `UPDATE announcements 
     SET is_active = NOT is_active, updated_at = NOW()
     WHERE announcement_id = ?`,
    [announcementId]
  );

  return getAnnouncementById(announcementId);
}

module.exports = {
  createAnnouncement,
  getAnnouncementById,
  getAnnouncements,
  getAllAnnouncementsAdmin,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus
};