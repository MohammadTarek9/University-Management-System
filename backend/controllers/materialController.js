const materialRepo = require('../repositories/materialRepo');
const path = require('path');
const fs = require('fs');

// Helper functions for response formatting
const successResponse = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({ success: false, message });
};

const materialController = {
  // Upload a new material
  async uploadMaterial(req, res) {
    try {
      if (!req.file) {
        return errorResponse(res, 400, 'No file uploaded');
      }

      const { courseId, title, description } = req.body;
      const userId = req.user.id; // Use req.user.id
      const userRole = req.user.role;

      // Validate required fields
      if (!courseId || !title) {
        // Delete uploaded file if validation fails
        fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Course ID and title are required');
      }

      // For professors and TAs, verify they are assigned to this course
      if (userRole === 'professor' || userRole === 'ta') {
        const courseRepo = require('../repositories/courseEavRepoNew');
        const course = await courseRepo.getCourseById(courseId);
        
        if (!course) {
          fs.unlinkSync(req.file.path);
          return errorResponse(res, 404, 'Course not found');
        }
        
        if (course.instructorId !== userId) {
          fs.unlinkSync(req.file.path);
          return errorResponse(res, 403, 'You are not assigned to this course');
        }
      }

      // Create material record in database
      const materialId = await materialRepo.createMaterial({
        courseId,
        uploadedBy: userId,
        title,
        description: description || '',
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      });

      return successResponse(res, 201, 'Material uploaded successfully', { materialId });
    } catch (error) {
      console.error('Upload material error:', error);
      // Delete uploaded file if database insert fails
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
      return errorResponse(res, 500, 'Failed to upload material');
    }
  },

  // Get all materials for a course
  async getMaterialsByCourse(req, res) {
    try {
      const { courseId } = req.params;

      const materials = await materialRepo.getMaterialsByCourse(courseId);

      // Format response (hide file paths for security)
      const formattedMaterials = materials.map(material => ({
        materialId: material.material_id,
        courseId: material.course_id,
        title: material.title,
        description: material.description,
        fileName: material.file_name,
        fileType: material.file_type,
        fileSize: material.file_size,
        downloadCount: material.download_count,
        uploaderName: material.uploader_name,
        uploaderRole: material.uploader_role,
        uploadedBy: material.uploaded_by,
        createdAt: material.created_at,
        updatedAt: material.updated_at
      }));

      return successResponse(res, 200, 'Materials retrieved successfully', formattedMaterials);
    } catch (error) {
      console.error('Get materials error:', error);
      return errorResponse(res, 500, 'Failed to retrieve materials');
    }
  },

  // Download a material
  async downloadMaterial(req, res) {
    try {
      const { id } = req.params;

      const material = await materialRepo.getMaterialById(id);

      if (!material) {
        return errorResponse(res, 404, 'Material not found');
      }

      // Check if file exists
      if (!fs.existsSync(material.file_path)) {
        return errorResponse(res, 404, 'File not found on server');
      }

      // Increment download count
      await materialRepo.incrementDownloadCount(id);

      // Send file
      res.download(material.file_path, material.file_name);
    } catch (error) {
      console.error('Download material error:', error);
      return errorResponse(res, 500, 'Failed to download material');
    }
  },

  // Update material metadata
  async updateMaterial(req, res) {
    try {
      const { id } = req.params;
      const { title, description } = req.body;
      const userId = req.user.id; // Use req.user.id
      const userRole = req.user.role;

      if (!title) {
        return errorResponse(res, 400, 'Title is required');
      }

      const material = await materialRepo.getMaterialById(id);

      if (!material) {
        return errorResponse(res, 404, 'Material not found');
      }

      // Check permissions: owner or admin
      if (material.uploaded_by !== userId && userRole !== 'admin') {
        return errorResponse(res, 403, 'You do not have permission to edit this material');
      }

      const updated = await materialRepo.updateMaterial(id, { title, description });

      if (updated) {
        return successResponse(res, 200, 'Material updated successfully');
      } else {
        return errorResponse(res, 500, 'Failed to update material');
      }
    } catch (error) {
      console.error('Update material error:', error);
      return errorResponse(res, 500, 'Failed to update material');
    }
  },

  // Delete a material
  async deleteMaterial(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id; // Use req.user.id
      const userRole = req.user.role;

      const material = await materialRepo.getMaterialById(id);

      if (!material) {
        return errorResponse(res, 404, 'Material not found');
      }

      // Check permissions: owner or admin
      if (material.uploaded_by !== userId && userRole !== 'admin') {
        return errorResponse(res, 403, 'You do not have permission to delete this material');
      }

      // Soft delete in database
      const deleted = await materialRepo.deleteMaterial(id);

      if (deleted) {
        // Optionally delete physical file
        try {
          if (fs.existsSync(material.file_path)) {
            fs.unlinkSync(material.file_path);
          }
        } catch (fileError) {
          console.error('Error deleting physical file:', fileError);
          // Continue even if file deletion fails
        }

        return successResponse(res, 200, 'Material deleted successfully');
      } else {
        return errorResponse(res, 500, 'Failed to delete material');
      }
    } catch (error) {
      console.error('Delete material error:', error);
      return errorResponse(res, 500, 'Failed to delete material');
    }
  }
};

module.exports = materialController;
