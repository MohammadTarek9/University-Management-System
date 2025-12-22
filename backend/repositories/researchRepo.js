const pool = require('../db/mysql');

/**
 * Create a new research output
 */
async function createResearch(userId, researchData) {
  const {
    title,
    description,
    researchType,
    publicationDate,
    journalName,
    conferenceName,
    doi,
    keywords,
    abstract,
    url,
    status
  } = researchData;

  const [result] = await pool.query(
    `INSERT INTO research_outputs 
     (user_id, title, description, research_type, publication_date, 
      journal_name, conference_name, doi, keywords, abstract, url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      title,
      description,
      researchType,
      publicationDate || null,
      journalName || null,
      conferenceName || null,
      doi || null,
      keywords || null,
      abstract || null,
      url || null,
      status
    ]
  );

  return getResearchById(result.insertId);
}

/**
 * Get research by ID
 */
async function getResearchById(researchId) {
  const [research] = await pool.query(
    `SELECT ro.*, u.first_name, u.last_name
     FROM research_outputs ro
     LEFT JOIN users u ON ro.user_id = u.id
     WHERE ro.research_id = ?`,
    [researchId]
  );
  return research[0] || null;
}

/**
 * Get all research by user (their own)
 */
async function getUserResearch(userId, filters = {}) {
  const { status, page = 1, limit = 10 } = filters;

  let query = `SELECT * FROM research_outputs WHERE user_id = ?`;
  const params = [userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const offset = (page - 1) * limit;
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [research] = await pool.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM research_outputs WHERE user_id = ?';
  const countParams = [userId];
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }

  const [countResult] = await pool.query(countQuery, countParams);

  return {
    research,
    total: countResult[0].total,
    page,
    limit,
    pages: Math.ceil(countResult[0].total / limit)
  };
}

/**
 * Get all published research by a user (for public profile)
 */
async function getPublishedResearchByUser(userId, filters = {}) {
  const { page = 1, limit = 10 } = filters;

  let query = `SELECT * FROM research_outputs 
               WHERE user_id = ? AND status = 'published'
               ORDER BY publication_date DESC, created_at DESC`;
  const params = [userId];

  const offset = (page - 1) * limit;
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [research] = await pool.query(query, params);

  // Get total count
  const [countResult] = await pool.query(
    `SELECT COUNT(*) as total FROM research_outputs 
     WHERE user_id = ? AND status = 'published'`,
    [userId]
  );

  return {
    research,
    total: countResult[0].total,
    page,
    limit,
    pages: Math.ceil(countResult[0].total / limit)
  };
}

/**
 * Get all published research (public access)
 * NEW FUNCTION for public research listing
 */
async function getAllPublishedResearch(filters = {}) {
  const { page = 1, limit = 10, researchType = '', keyword = '' } = filters;

  let query = `SELECT ro.*, u.first_name, u.last_name, u.email
               FROM research_outputs ro
               LEFT JOIN users u ON ro.user_id = u.id
               WHERE ro.status = 'published'`;
  const params = [];

  if (researchType) {
    query += ' AND ro.research_type = ?';
    params.push(researchType);
  }

  if (keyword) {
    query += ' AND (ro.title LIKE ? OR ro.keywords LIKE ? OR ro.abstract LIKE ?)';
    const keywordParam = `%${keyword}%`;
    params.push(keywordParam, keywordParam, keywordParam);
  }

  query += ' ORDER BY ro.publication_date DESC, ro.created_at DESC';

  const offset = (page - 1) * limit;
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [research] = await pool.query(query, params);

  // Count query
  let countQuery = 'SELECT COUNT(*) as total FROM research_outputs WHERE status = \'published\'';
  const countParams = [];

  if (researchType) {
    countQuery += ' AND research_type = ?';
    countParams.push(researchType);
  }

  if (keyword) {
    countQuery += ' AND (title LIKE ? OR keywords LIKE ? OR abstract LIKE ?)';
    const keywordParam = `%${keyword}%`;
    countParams.push(keywordParam, keywordParam, keywordParam);
  }

  const [countResult] = await pool.query(countQuery, countParams);

  return {
    research,
    total: countResult[0].total,
    page,
    limit,
    pages: Math.ceil(countResult[0].total / limit)
  };
}

/**
 * Update research
 */
async function updateResearch(researchId, userId, researchData) {
  // Check ownership
  const existing = await getResearchById(researchId);
  if (!existing || existing.user_id !== userId) {
    throw new Error('Unauthorized to update this research');
  }

  const {
    title,
    description,
    researchType,
    publicationDate,
    journalName,
    conferenceName,
    doi,
    keywords,
    abstract,
    url,
    status
  } = researchData;

  await pool.query(
    `UPDATE research_outputs 
     SET title = ?, description = ?, research_type = ?, publication_date = ?,
         journal_name = ?, conference_name = ?, doi = ?, keywords = ?,
         abstract = ?, url = ?, status = ?, updated_at = NOW()
     WHERE research_id = ?`,
    [
      title,
      description,
      researchType,
      publicationDate || null,
      journalName || null,
      conferenceName || null,
      doi || null,
      keywords || null,
      abstract || null,
      url || null,
      status,
      researchId
    ]
  );

  return getResearchById(researchId);
}

/**
 * Delete research (soft delete - archive)
 */
async function deleteResearch(researchId, userId) {
  // Check ownership
  const research = await getResearchById(researchId);
  if (!research || research.user_id !== userId) {
    throw new Error('Unauthorized to delete this research');
  }

  await pool.query(
    `UPDATE research_outputs SET status = 'archived' WHERE research_id = ?`,
    [researchId]
  );

  return getResearchById(researchId);
}

/**
 * Hard delete research (admin only)
 */
async function hardDeleteResearch(researchId) {
  await pool.query(
    `DELETE FROM research_outputs WHERE research_id = ?`,
    [researchId]
  );
  return true;
}

/**
 * Get all research for admin (with user info)
 */
async function getAllResearch(filters = {}) {
  const { page = 1, limit = 10, status = '', userId = '' } = filters;

  let query = `SELECT ro.*, u.first_name, u.last_name, u.email
               FROM research_outputs ro
               LEFT JOIN users u ON ro.user_id = u.id
               WHERE 1=1`;
  const params = [];

  if (status) {
    query += ' AND ro.status = ?';
    params.push(status);
  }

  if (userId) {
    query += ' AND ro.user_id = ?';
    params.push(userId);
  }

  query += ' ORDER BY ro.created_at DESC';

  const offset = (page - 1) * limit;
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [research] = await pool.query(query, params);

  // Count query
  let countQuery = 'SELECT COUNT(*) as total FROM research_outputs WHERE 1=1';
  const countParams = [];

  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }

  if (userId) {
    countQuery += ' AND user_id = ?';
    countParams.push(userId);
  }

  const [countResult] = await pool.query(countQuery, countParams);

  return {
    research,
    total: countResult[0].total,
    page,
    limit,
    pages: Math.ceil(countResult[0].total / limit)
  };
}

module.exports = {
  createResearch,
  getResearchById,
  getUserResearch,
  getPublishedResearchByUser,
  getAllPublishedResearch,
  updateResearch,
  deleteResearch,
  hardDeleteResearch,
  getAllResearch
};