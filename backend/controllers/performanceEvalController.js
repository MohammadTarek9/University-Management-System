const { successResponse, errorResponse } = require('../utils/responseHelpers');
const perfRepo = require('../repositories/performanceEvalRepo');

// Create performance record
const createPerformance = async (req, res) => {
  try {
    const payload = req.body || {};
    // createdBy defaults to authenticated user
    payload.createdBy = payload.createdBy || req.user?.id || null;

    const record = await perfRepo.createPerformanceRecord(payload);
    return successResponse(res, 201, 'Performance record created', { record });
  } catch (error) {
    console.error('Error creating performance record:', error);
    return errorResponse(res, 500, error.message || 'Server error while creating performance record');
  }
};

// Get performance record by id
const getPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await perfRepo.getPerformanceById(id);
    if (!record) return errorResponse(res, 404, 'Performance record not found');

    // Allow only owner or staff/admin to view non-owned records
    if (req.user && req.user.role === 'student' && req.user.id !== record.userId) {
      return errorResponse(res, 403, 'Not authorized to view this record');
    }

    return successResponse(res, 200, 'Performance record retrieved', { record });
  } catch (error) {
    console.error('Error fetching performance record:', error);
    return errorResponse(res, 500, 'Server error while retrieving performance record');
  }
};

// List performance records with filters + pagination
const listPerformances = async (req, res) => {
  try {
    const filters = {};
    const { userId, evaluatorId, startDate, endDate, minScore, rating, reviewed, page, limit } = req.query;
    if (userId) filters.userId = userId;
    if (evaluatorId) filters.evaluatorId = evaluatorId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (minScore) filters.minScore = Number(minScore);
    if (rating) filters.rating = rating;
    if (reviewed !== undefined) filters.reviewed = reviewed === 'true' || reviewed === '1';

    // Students may only list their own records unless elevated role
    if (req.user && req.user.role === 'student') {
      filters.userId = req.user.id;
    }

    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;

    const result = await perfRepo.getPerformanceRecords(filters, p, l);
    return successResponse(res, 200, 'Performance records retrieved', result);
  } catch (error) {
    console.error('Error listing performance records:', error);
    return errorResponse(res, 500, 'Server error while listing performance records');
  }
};

// Update performance record
const updatePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body || {};

    // fetch existing to enforce permissions
    const existing = await perfRepo.getPerformanceById(id);
    if (!existing) return errorResponse(res, 404, 'Performance record not found');

    if (req.user && req.user.role === 'student' && req.user.id !== existing.userId) {
      return errorResponse(res, 403, 'Not authorized to update this record');
    }

    const updated = await perfRepo.updatePerformanceRecord(id, data);
    return successResponse(res, 200, 'Performance record updated', { record: updated });
  } catch (error) {
    console.error('Error updating performance record:', error);
    return errorResponse(res, 500, 'Server error while updating performance record');
  }
};

// Delete performance record
const deletePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await perfRepo.getPerformanceById(id);
    if (!existing) return errorResponse(res, 404, 'Performance record not found');

    if (req.user && req.user.role === 'student' && req.user.id !== existing.userId) {
      return errorResponse(res, 403, 'Not authorized to delete this record');
    }

    const ok = await perfRepo.deletePerformanceRecord(id);
    if (!ok) return errorResponse(res, 500, 'Failed to delete performance record');
    return successResponse(res, 200, 'Performance record deleted');
  } catch (error) {
    console.error('Error deleting performance record:', error);
    return errorResponse(res, 500, 'Server error while deleting performance record');
  }
};

module.exports = {
  createPerformance,
  getPerformance,
  listPerformances,
  updatePerformance,
  deletePerformance
};
