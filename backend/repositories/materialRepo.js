const pool = require('../db/mysql');

const materialRepo = {
  // Create a new material record
  async createMaterial(data) {
    const {
      courseId,
      uploadedBy,
      title,
      description,
      fileName,
      filePath,
      fileType,
      fileSize
    } = data;

    const query = `
      INSERT INTO course_materials 
      (course_id, uploaded_by, title, description, file_name, file_path, file_type, file_size, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.query(query, [
      courseId,
      uploadedBy,
      title,
      description,
      fileName,
      filePath,
      fileType,
      fileSize
    ]);

    return result.insertId;
  },

  // Get all materials for a course
  async getMaterialsByCourse(courseId) {
    const query = `
      SELECT 
        cm.*,
        CONCAT(u.first_name, ' ', u.last_name) as uploader_name,
        u.role as uploader_role
      FROM course_materials cm
      LEFT JOIN users u ON cm.uploaded_by = u.id
      WHERE cm.course_id = ? AND cm.is_active = 1
      ORDER BY cm.created_at DESC
    `;

    const [rows] = await pool.query(query, [courseId]);
    return rows;
  },

  // Get a single material by ID
  async getMaterialById(id) {
    const query = `
      SELECT 
        cm.*,
        CONCAT(u.first_name, ' ', u.last_name) as uploader_name,
        u.role as uploader_role
      FROM course_materials cm
      LEFT JOIN users u ON cm.uploaded_by = u.id
      WHERE cm.material_id = ? AND cm.is_active = 1
    `;

    const [rows] = await pool.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  // Update material metadata
  async updateMaterial(id, data) {
    const { title, description } = data;
    
    const query = `
      UPDATE course_materials 
      SET title = ?, description = ?, updated_at = NOW()
      WHERE material_id = ?
    `;

    const [result] = await pool.query(query, [title, description, id]);
    return result.affectedRows > 0;
  },

  // Soft delete material
  async deleteMaterial(id) {
    const query = `
      UPDATE course_materials 
      SET is_active = 0, updated_at = NOW()
      WHERE material_id = ?
    `;

    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
  },

  // Increment download count
  async incrementDownloadCount(id) {
    const query = `
      UPDATE course_materials 
      SET download_count = download_count + 1
      WHERE material_id = ?
    `;

    await pool.query(query, [id]);
  },

  // Check if user is the owner of the material
  async isOwner(materialId, userId) {
    const query = `
      SELECT uploaded_by 
      FROM course_materials 
      WHERE material_id = ?
    `;

    const [rows] = await pool.query(query, [materialId]);
    return rows.length > 0 && rows[0].uploaded_by === userId;
  }
};

module.exports = materialRepo;
