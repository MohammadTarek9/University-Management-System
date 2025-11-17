import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { leaveRequestService } from '../services/leaveRequestService';
import { useAuth } from '../context/AuthContext';

const LeaveRequestForm = ({ onSubmitSuccess }) => {
  const { user } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    start_date: '',  // ✓ Changed to string (YYYY-MM-DD format)
    end_date: '',    // ✓ Changed to string (YYYY-MM-DD format)
    reason: ''
  });

  const [numberOfDays, setNumberOfDays] = useState(0);

  // Fetch leave types on mount
  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  // Calculate number of days when dates change
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      
      // Reset hours to avoid timezone issues
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      setNumberOfDays(days > 0 ? days : 0);
    } else {
      setNumberOfDays(0);
    }
  }, [formData.start_date, formData.end_date]);

  const fetchLeaveTypes = async () => {
    try {
      setTypesLoading(true);
      setError('');
      
      const response = await leaveRequestService.getLeaveTypes();
      const types = response.types || response.data?.types || [];
      setLeaveTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      const errorMessage = err?.message || 'Failed to load leave types';
      setError(errorMessage);
      console.error('Error fetching leave types:', err);
    } finally {
      setTypesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get today's date in YYYY-MM-DD format for minDate
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.leaveTypeId) {
      setError('Please select a leave type');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setError('Please select both start and end dates');
      return;
    }

    if (numberOfDays <= 0) {
      setError('End date must be after start date');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Please provide a reason for leave');
      return;
    }

    if (formData.reason.length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        leaveTypeId: parseInt(formData.leaveTypeId),
        start_date: formData.start_date,  // Already in YYYY-MM-DD format
        end_date: formData.end_date,      // Already in YYYY-MM-DD format
        reason: formData.reason
      };

      await leaveRequestService.submitLeaveRequest(submitData);

      setSuccess('Leave request submitted successfully!');
      setFormData({
        leaveTypeId: '',
        start_date: '',
        end_date: '',
        reason: ''
      });

      // Call callback if provided
      if (onSubmitSuccess) {
        setTimeout(onSubmitSuccess, 1500);
      }
    } catch (err) {
      const errorMessage = err?.message || 'Failed to submit leave request';
      setError(errorMessage);
      console.error('Error submitting leave request:', err);
    } finally {
      setLoading(false);
    }
  };

  if (typesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Submit a Leave Request
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Leave Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Leave Type</InputLabel>
              <Select
                name="leaveTypeId"
                value={formData.leaveTypeId}
                onChange={handleInputChange}
                label="Leave Type"
              >
                <MenuItem value="">-- Select Leave Type --</MenuItem>
                {leaveTypes.map(type => (
                  <MenuItem key={type.leave_type_id} value={type.leave_type_id}>
                    {type.type_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Number of Days (Display Only) */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Leave Days
                </Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {numberOfDays} {numberOfDays === 1 ? 'day' : 'days'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Start Date - HTML5 Input */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              inputProps={{
                min: getTodayDate()  // Can't select past dates
              }}
              InputLabelProps={{
                shrink: true
              }}
              required
            />
          </Grid>

          {/* End Date - HTML5 Input */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              name="end_date"
              value={formData.end_date}
              onChange={handleInputChange}
              inputProps={{
                min: formData.start_date || getTodayDate()  // Can't select before start date
              }}
              InputLabelProps={{
                shrink: true
              }}
              required
            />
          </Grid>

          {/* Reason */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="reason"
              label="Reason for Leave"
              multiline
              rows={4}
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Please provide a detailed reason for your leave request..."
              helperText={`${formData.reason.length}/500 characters`}
              required
            />
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading || typesLoading}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit Leave Request'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default LeaveRequestForm;