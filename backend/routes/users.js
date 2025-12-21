const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  promoteToAdmin,
  createUserValidation,
  updateUserValidation
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../utils/responseHelpers');

// All routes require admin authorization
router.use(protect);
router.use(authorize('admin','professor'));

// User management routes
router.route('/')
  .get(getAllUsers)
  .post(createUserValidation, handleValidationErrors, createUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUserValidation, handleValidationErrors, updateUser)
  .delete(deleteUser);

// Admin promotion route
router.put('/:id/promote-admin', promoteToAdmin);

module.exports = router;