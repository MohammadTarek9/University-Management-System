import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch
} from '@mui/material';
import { announcementsService } from '../services/announcementsService';

const AnnouncementForm = ({ editingAnnouncement = null, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
    targetAudience: 'all',
    expiryDate: '',
    isActive: true
  });

  useEffect(() => {
    if (editingAnnouncement) {
      setFormData({
        title: editingAnnouncement.title || '',
        content: editingAnnouncement.content || '',
        category: editingAnnouncement.category || 'general',
        priority: editingAnnouncement.priority || 'normal',
        targetAudience: editingAnnouncement.target_audience || 'all',
        expiryDate: editingAnnouncement.expiry_date ? 
          new Date(editingAnnouncement.expiry_date).toISOString().split('T')[0] : '',
        isActive: editingAnnouncement.is_active !== undefined ? 
          editingAnnouncement.is_active : true
      });
    }
  }, [editingAnnouncement]);

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title.trim() || formData.title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    if (!formData.content.trim() || formData.content.length < 10) {
      setError('Content must be at least 10 characters');
      return;
    }

    if (formData.expiryDate) {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      if (expiryDate < today) {
        setError('Expiry date cannot be in the past');
        return;
      }
    }

    try {
      setLoading(true);

      if (editingAnnouncement) {
        await announcementsService.updateAnnouncement(
          editingAnnouncement.announcement_id,
          formData
        );
      } else {
        await announcementsService.createAnnouncement(formData);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err?.message || 'Failed to save announcement';
      setError(errorMessage);
      console.error('Error saving announcement:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Title */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Announcement title"
            helperText={`${formData.title.length}/255 characters`}
            required
          />
        </Grid>

        {/* Content */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            multiline
            rows={6}
            placeholder="Announcement content"
            helperText="Provide detailed information about the announcement"
            required
          />
        </Grid>

        {/* Category */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              label="Category"
            >
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="academic">Academic</MenuItem>
              <MenuItem value="administrative">Administrative</MenuItem>
              <MenuItem value="facilities">Facilities</MenuItem>
              <MenuItem value="events">Events</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Priority */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Target Audience */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Target Audience</InputLabel>
            <Select
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleInputChange}
              label="Target Audience"
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="student">Students</MenuItem>
              <MenuItem value="parent">Parents</MenuItem>
              <MenuItem value="staff">Staff (Faculty & Admin)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Expiry Date */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Expiry Date (Optional)"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleInputChange}
            InputLabelProps={{
              shrink: true
            }}
            helperText="Leave empty for no expiry"
          />
        </Grid>

        {/* Active Status (only for editing) */}
        {editingAnnouncement && (
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  name="isActive"
                  color="primary"
                />
              }
              label="Active (visible to users)"
            />
          </Grid>
        )}

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : editingAnnouncement ? (
                'Update Announcement'
              ) : (
                'Post Announcement'
              )}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnnouncementForm;