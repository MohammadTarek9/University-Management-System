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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
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
    startDate: null,
    endDate: null,
    reason: ''
  });

  const [numberOfDays, setNumberOfDays] = useState(0);

  // Fetch leave types on mount
  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  // Calculate number of days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      setNumberOfDays(days > 0 ? days : 0);
    } else {
      setNumberOfDays(0);
    }
  }, [formData.startDate, formData.endDate]);

  const fetchLeaveTypes = async () => {
    try {
      setTypesLoading(true);
      const response = await leaveRequestService.getLeaveTypes();
      setLeaveTypes(response.data?.types || []);
    } catch (err) {
      setError(err.message || 'Failed to load leave types');
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

  const handleDateChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

    if (!formData.startDate || !formData.endDate) {
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
        startDate: formData.startDate.toISOString().split('T')[0],
        endDate: formData.endDate.toISOString().split('T')[0],
        reason: formData.reason
      };

      await leaveRequestService.submitLeaveRequest(submitData);

      setSuccess('Leave request submitted successfully!');
      setFormData({
        leaveTypeId: '',
        startDate: null,
        endDate: null,
        reason: ''
      });

      // Call callback if provided
      if (onSubmitSuccess) {
        setTimeout(onSubmitSuccess, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit leave request');
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

          {/* Date Pickers wrapped in LocalizationProvider */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(newValue) => handleDateChange('startDate', newValue)}
                minDate={new Date()}
                slotProps={{
                  textField: { fullWidth: true, required: true }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={(newValue) => handleDateChange('endDate', newValue)}
                minDate={formData.startDate || new Date()}
                slotProps={{
                  textField: { fullWidth: true, required: true }
                }}
              />
            </LocalizationProvider>
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