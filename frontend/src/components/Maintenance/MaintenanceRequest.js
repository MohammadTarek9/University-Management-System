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
  CardContent,
  Checkbox,
  FormControlLabel
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
    },
    categorySpecific: {}
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
    } else if (field === 'category') {
      // Reset categorySpecific when category changes
      setFormData(prev => ({
        ...prev,
        category: value,
        categorySpecific: {}
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCategorySpecificChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      categorySpecific: {
        ...prev.categorySpecific,
        [field]: value
      }
    }));
  };

  const renderCategorySpecificFields = () => {
    const { category } = formData;

    if (category === 'Electrical') {
      return (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
              Electrical Details
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Voltage"
              value={formData.categorySpecific.voltage || ''}
              onChange={(e) => handleCategorySpecificChange('voltage', e.target.value)}
              placeholder="e.g., 120V, 240V"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Circuit Breaker Location"
              value={formData.categorySpecific.circuitBreakerLocation || ''}
              onChange={(e) => handleCategorySpecificChange('circuitBreakerLocation', e.target.value)}
              placeholder="e.g., Panel A, Circuit 15"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Wire Type"
              value={formData.categorySpecific.wireType || ''}
              onChange={(e) => handleCategorySpecificChange('wireType', e.target.value)}
              placeholder="e.g., 12 AWG Copper"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Electrical Panel ID"
              value={formData.categorySpecific.electricalPanelId || ''}
              onChange={(e) => handleCategorySpecificChange('electricalPanelId', e.target.value)}
            />
          </Grid>
        </>
      );
    }

    if (category === 'Plumbing') {
      return (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
              Plumbing Details
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Pipe Size"
              value={formData.categorySpecific.pipeSize || ''}
              onChange={(e) => handleCategorySpecificChange('pipeSize', e.target.value)}
              placeholder="e.g., 1/2 inch, 3/4 inch"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Water Type</InputLabel>
              <Select
                value={formData.categorySpecific.waterType || ''}
                label="Water Type"
                onChange={(e) => handleCategorySpecificChange('waterType', e.target.value)}
              >
                <MenuItem value="Fresh">Fresh Water</MenuItem>
                <MenuItem value="Waste">Waste Water</MenuItem>
                <MenuItem value="Hot">Hot Water</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Leak Severity</InputLabel>
              <Select
                value={formData.categorySpecific.leakSeverity || ''}
                label="Leak Severity"
                onChange={(e) => handleCategorySpecificChange('leakSeverity', e.target.value)}
              >
                <MenuItem value="Minor">Minor</MenuItem>
                <MenuItem value="Moderate">Moderate</MenuItem>
                <MenuItem value="Severe">Severe</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Shutoff Valve Location"
              value={formData.categorySpecific.shutoffValveLocation || ''}
              onChange={(e) => handleCategorySpecificChange('shutoffValveLocation', e.target.value)}
            />
          </Grid>
        </>
      );
    }

    if (category === 'HVAC') {
      return (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
              HVAC Details
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Temperature Reading (°F)"
              value={formData.categorySpecific.temperatureReading || ''}
              onChange={(e) => handleCategorySpecificChange('temperatureReading', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>System Type</InputLabel>
              <Select
                value={formData.categorySpecific.systemType || ''}
                label="System Type"
                onChange={(e) => handleCategorySpecificChange('systemType', e.target.value)}
              >
                <MenuItem value="Central AC">Central AC</MenuItem>
                <MenuItem value="Heat Pump">Heat Pump</MenuItem>
                <MenuItem value="Boiler">Boiler</MenuItem>
                <MenuItem value="Furnace">Furnace</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Filter Size"
              value={formData.categorySpecific.filterSize || ''}
              onChange={(e) => handleCategorySpecificChange('filterSize', e.target.value)}
              placeholder="e.g., 20x25x1"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Unit Number"
              value={formData.categorySpecific.unitNumber || ''}
              onChange={(e) => handleCategorySpecificChange('unitNumber', e.target.value)}
            />
          </Grid>
        </>
      );
    }

    if (category === 'Equipment') {
      return (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
              Equipment Details
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Model Number"
              value={formData.categorySpecific.modelNumber || ''}
              onChange={(e) => handleCategorySpecificChange('modelNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Serial Number"
              value={formData.categorySpecific.serialNumber || ''}
              onChange={(e) => handleCategorySpecificChange('serialNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Warranty Info"
              value={formData.categorySpecific.warrantyInfo || ''}
              onChange={(e) => handleCategorySpecificChange('warrantyInfo', e.target.value)}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Vendor Name"
              value={formData.categorySpecific.vendorName || ''}
              onChange={(e) => handleCategorySpecificChange('vendorName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Purchase Date"
              value={formData.categorySpecific.purchaseDate || ''}
              onChange={(e) => handleCategorySpecificChange('purchaseDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </>
      );
    }

    if (category === 'Structural') {
      return (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
              Structural Details
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Material Type"
              value={formData.categorySpecific.materialType || ''}
              onChange={(e) => handleCategorySpecificChange('materialType', e.target.value)}
              placeholder="e.g., Concrete, Wood, Steel"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Affected Area Size"
              value={formData.categorySpecific.affectedAreaSize || ''}
              onChange={(e) => handleCategorySpecificChange('affectedAreaSize', e.target.value)}
              placeholder="e.g., 10 sq ft"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Safety Risk Level</InputLabel>
              <Select
                value={formData.categorySpecific.safetyRiskLevel || ''}
                label="Safety Risk Level"
                onChange={(e) => handleCategorySpecificChange('safetyRiskLevel', e.target.value)}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.categorySpecific.structuralEngineerRequired || false}
                  onChange={(e) => handleCategorySpecificChange('structuralEngineerRequired', e.target.checked)}
                />
              }
              label="Structural Engineer Required"
            />
          </Grid>
        </>
      );
    }

    return null;
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
        },
        categorySpecific: {}
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

            {/* Category-Specific Fields */}
            {renderCategorySpecificFields()}

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