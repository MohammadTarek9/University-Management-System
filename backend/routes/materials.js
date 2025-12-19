const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Upload material (professors and TAs only)
router.post(
  '/upload',
  protect,
  (req, res, next) => {
    const userRole = req.user.role;
    if (userRole !== 'professor' && userRole !== 'ta' && userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only professors and TAs can upload materials' 
      });
    }
    next();
  },
  upload.single('file'),
  materialController.uploadMaterial
);

// Get all materials for a course (authenticated users)
router.get(
  '/course/:courseId',
  protect,
  materialController.getMaterialsByCourse
);

// Download material (authenticated users)
router.get(
  '/download/:id',
  protect,
  materialController.downloadMaterial
);

// Update material metadata (owner or admin)
router.put(
  '/:id',
  protect,
  materialController.updateMaterial
);

// Delete material (owner or admin)
router.delete(
  '/:id',
  protect,
  materialController.deleteMaterial
);

// All materials from course_materials (EAV‑mapped course names)
router.get('/all', protect, materialController.getAllMaterials);

// View material in browser
router.get('/view/:id', protect, materialController.viewMaterial);



module.exports = router;
