import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import { Add, Warning } from '@mui/icons-material';
import maintenanceService from '../services/maintenanceService';

const MaintenanceRequest = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    location: {
      building: '',
      roomNumber: '',
      floor: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    'Electrical',
    'Plumbing', 
    'HVAC',
    'Furniture',
    'Equipment',
    'Structural',
    'Cleaning',
    'Other'
  ];

  const priorities = [
    { value: 'Low', label: 'Low', color: 'success' },
    { value: 'Medium', label: 'Medium', color: 'warning' },
    { value: 'High', label: 'High', color: 'error' },
    { value: 'Urgent', label: 'Urgent', color: 'error' }
  ];

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await maintenanceService.createMaintenanceRequest(formData);
      setSuccess('Maintenance request submitted successfully!');
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
        location: {
          building: '',
          roomNumber: '',
          floor: ''
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit maintenance request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Warning sx={{ mr: 2, fontSize: 32 }} color="warning" />
          <Typography variant="h4" component="h1">
            Report Maintenance Issue
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Before You Submit
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Please provide clear and detailed information about the issue<br/>
              • Include the exact location where the issue occurs<br/>
              • For urgent issues, select "Urgent" priority<br/>
              • You will receive updates on your request via email
            </Typography>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Issue Title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                placeholder="Brief description of the issue"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Detailed Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
                multiline
                rows={4}
                placeholder="Please describe the issue in detail. Include any specific symptoms, when it started, and any other relevant information."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  {priorities.map(priority => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Building"
                value={formData.location.building}
                onChange={(e) => handleChange('location.building', e.target.value)}
                required
                placeholder="e.g., Science Building"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Room Number"
                value={formData.location.roomNumber}
                onChange={(e) => handleChange('location.roomNumber', e.target.value)}
                required
                placeholder="e.g., 205"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Floor (Optional)"
                value={formData.location.floor}
                onChange={(e) => handleChange('location.floor', e.target.value)}
                placeholder="e.g., 2nd Floor"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <Add />}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Submitting...' : 'Submit Maintenance Request'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default MaintenanceRequest;