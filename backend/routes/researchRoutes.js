const express = require('express');
const router = express.Router();
const {
  createResearch,
  getResearchById,
  getUserResearch,
  getPublishedResearchByUser,
  getAllPublishedResearch,
  updateResearch,
  deleteResearch,
  getAllResearch,
  createResearchValidation,
  updateResearchValidation
} = require('../controllers/researchController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../utils/responseHelpers');

// All routes require authentication
router.use(protect);

// ============================================
// SPECIFIC ROUTES FIRST (before generic /:id)
// ============================================

// Get current user's research
router.get('/my-research', getUserResearch);

// GET ALL PUBLISHED RESEARCH (PUBLIC)
router.get('/published', getAllPublishedResearch);

// Get published research by user (public)
router.get('/user/:userId', getPublishedResearchByUser);

// Get all research (admin only)
router.get('/admin/all', authorize('admin', 'staff'), getAllResearch);

// ============================================
// GENERIC ROUTES LAST
// ============================================

// Get specific research details
router.get('/:id', getResearchById);

// Create new research
router.post(
  '/',
  createResearchValidation,
  handleValidationErrors,
  createResearch
);

// Update research
router.put(
  '/:id',
  updateResearchValidation,
  handleValidationErrors,
  updateResearch
);

// Delete research (soft delete)
router.delete('/:id', deleteResearch);

module.exports = router;