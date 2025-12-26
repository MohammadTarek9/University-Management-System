// Facilities.js
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  MeetingRoom,
  School,
  Assignment,
  Business,
  Warning,
  ArrowForward,
  Add,
  Close
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import maintenanceService from '../services/maintenanceService';

const Facilities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Maintenance dialog state
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState('');
  const [maintenanceSuccess, setMaintenanceSuccess] = useState('');

  const [maintenanceForm, setMaintenanceForm] = useState({
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

  const facilityModules = [
    {
      id: 'rooms',
      title: 'Room Management',
      description: 'Manage classrooms, laboratories, and other facility spaces. View room details, track capacity, and monitor availability.',
      icon: <MeetingRoom sx={{ fontSize: 40 }} />,
      path: '/facilities/rooms',
      color: 'primary',
      permissions: ['admin', 'staff', 'professor'],
      features: ['Add/Edit Rooms', 'Track Capacity', 'Monitor Status', 'Equipment Management']
    },
    {
      id: 'bookings',
      title: 'Room Booking',
      description: 'Schedule and manage room reservations. Book spaces for classes, events, and meetings with conflict detection.',
      icon: <Assignment sx={{ fontSize: 40 }} />,
      path: '/facilities/bookings',
      color: 'secondary',
      permissions: ['admin', 'staff', 'professor'],
      features: ['Schedule Rooms', 'Manage Reservations', 'Conflict Detection', 'Calendar View'],
    },
    {
      id: 'admissions',
      title: 'Admissions Management',
      description: 'Review and process student admission applications. Track application status, approve/reject applicants, and manage enrollment workflow.',
      icon: <School sx={{ fontSize: 40 }} />,
      path: '/facilities/admissions',
      color: 'success',
      permissions: ['admin', 'staff'],
      features: ['Review Applications', 'Status Management', 'Approval Workflow', 'Application Analytics']
    },
    {
      id: 'maintenance',
      title: 'Maintenance Requests',
      description: 'Report and track maintenance issues. Submit requests for facility repairs and get updates on resolution progress.',
      icon: <Warning sx={{ fontSize: 40 }} />,
      path: '#',
      color: 'warning',
      permissions: ['admin', 'staff', 'professor', 'student', 'ta', 'parent'],
      features: ['Issue Reporting', 'Status Tracking', 'Quick Submission', 'Progress Updates']
    },
    {
      id: 'maintenance-dashboard',
      title: 'Maintenance Dashboard',
      description: 'View and manage all maintenance requests. Track status, assign technicians, and monitor resolution progress.',
      icon: <Assignment sx={{ fontSize: 40 }} />,
      path: '/facilities/maintenance-dashboard',
      color: 'error',
      permissions: ['admin'], // Only admin can access
      features: ['View All Requests', 'Status Management', 'Assignment Tracking', 'Analytics']
    },
    {
      id: 'resources',
      title: 'Resource Allocation',
      description: 'Track and allocate equipment, software licenses, and other resources across departments and faculty.',
      icon: <Business sx={{ fontSize: 40 }} />,
      path: '/facilities/resources',
      color: 'info',
      permissions: ['admin', 'staff'],
      features: ['Equipment Tracking', 'License Management', 'Department Allocation', 'Usage Reports'],
      comingSoon: true
    }
  ];

  // Filter modules to show only what user has permission to see and that are not coming soon
  const visibleModules = facilityModules.filter(module =>
    module.permissions.includes(user?.role) && !module.comingSoon
  );

  // Maintenance request functions
  const handleMaintenanceChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setMaintenanceForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (field === 'category') {
      // Reset categorySpecific when category changes
      setMaintenanceForm(prev => ({
        ...prev,
        category: value,
        categorySpecific: {}
      }));
    } else {
      setMaintenanceForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCategorySpecificChange = (field, value) => {
    setMaintenanceForm(prev => ({
      ...prev,
      categorySpecific: {
        ...prev.categorySpecific,
        [field]: value
      }
    }));
  };

  const renderCategorySpecificFields = () => {
    const { category } = maintenanceForm;

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
              value={maintenanceForm.categorySpecific.voltage || ''}
              onChange={(e) => handleCategorySpecificChange('voltage', e.target.value)}
              placeholder="e.g., 120V, 240V"
              disabled={maintenanceLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Circuit Breaker Location"
              value={maintenanceForm.categorySpecific.circuitBreakerLocation || ''}
              onChange={(e) => handleCategorySpecificChange('circuitBreakerLocation', e.target.value)}
              placeholder="e.g., Panel A, Circuit 15"
              disabled={maintenanceLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Wire Type"
              value={maintenanceForm.categorySpecific.wireType || ''}
              onChange={(e) => handleCategorySpecificChange('wireType', e.target.value)}
              placeholder="e.g., 12 AWG Copper"
              disabled={maintenanceLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Electrical Panel ID"
              value={maintenanceForm.categorySpecific.electricalPanelId || ''}
              onChange={(e) => handleCategorySpecificChange('electricalPanelId', e.target.value)}
              disabled={maintenanceLoading}
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
              value={maintenanceForm.categorySpecific.pipeSize || ''}
              onChange={(e) => handleCategorySpecificChange('pipeSize', e.target.value)}
              placeholder="e.g., 1/2 inch, 3/4 inch"
              disabled={maintenanceLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={maintenanceLoading}>
              <InputLabel>Water Type</InputLabel>
              <Select
                value={maintenanceForm.categorySpecific.waterType || ''}
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
            <FormControl fullWidth disabled={maintenanceLoading}>
              <InputLabel>Leak Severity</InputLabel>
              <Select
                value={maintenanceForm.categorySpecific.leakSeverity || ''}
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
              value={maintenanceForm.categorySpecific.shutoffValveLocation || ''}
              onChange={(e) => handleCategorySpecificChange('shutoffValveLocation', e.target.value)}
              disabled={maintenanceLoading}
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
              value={maintenanceForm.categorySpecific.temperatureReading || ''}
              onChange={(e) => handleCategorySpecificChange('temperatureReading', e.target.value)}
              disabled={maintenanceLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={maintenanceLoading}>
              <InputLabel>System Type</InputLabel>
              <Select
                value={maintenanceForm.categorySpecific.systemType || ''}
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
              value={maintenanceForm.categorySpecific.filterSize || ''}
              onChange={(e) => handleCategorySpecificChange('filterSize', e.target.value)}
              placeholder="e.g., 20x25x1"
              disabled={maintenanceLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Unit Number"
              value={maintenanceForm.categorySpecific.unitNumber || ''}
              onChange={(e) => handleCategorySpecificChange('unitNumber', e.target.value)}
              disabled={maintenanceLoading}
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
              value={maintenanceForm.categorySpecific.modelNumber || ''}
              onChange={(e) => handleCategorySpecificChange('modelNumber', e.target.value)}
              disabled={maintenanceLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Serial Number"
              value={maintenanceForm.categorySpecific.serialNumber || ''}
              onChange={(e) => handleCategorySpecificChange('serialNumber', e.target.value)}
              disabled={maintenanceLoading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Warranty Info"
              value={maintenanceForm.categorySpecific.warrantyInfo || ''}
              onChange={(e) => handleCategorySpecificChange('warrantyInfo', e.target.value)}
              multiline
              rows={2}
              disabled={maintenanceLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Vendor Name"
              value={maintenanceForm.categorySpecific.vendorName || ''}
              onChange={(e) => handleCategorySpecificChange('vendorName', e.target.value)}
              disabled={maintenanceLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Purchase Date"
              value={maintenanceForm.categorySpecific.purchaseDate || ''}
              onChange={(e) => handleCategorySpecificChange('purchaseDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={maintenanceLoading}
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
              value={maintenanceForm.categorySpecific.materialType || ''}
              onChange={(e) => handleCategorySpecificChange('materialType', e.target.value)}
              placeholder="e.g., Concrete, Wood, Steel"
              disabled={maintenanceLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Affected Area Size"
              value={maintenanceForm.categorySpecific.affectedAreaSize || ''}
              onChange={(e) => handleCategorySpecificChange('affectedAreaSize', e.target.value)}
              placeholder="e.g., 10 sq ft"
              disabled={maintenanceLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={maintenanceLoading}>
              <InputLabel>Safety Risk Level</InputLabel>
              <Select
                value={maintenanceForm.categorySpecific.safetyRiskLevel || ''}
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
                  checked={maintenanceForm.categorySpecific.structuralEngineerRequired || false}
                  onChange={(e) => handleCategorySpecificChange('structuralEngineerRequired', e.target.checked)}
                  disabled={maintenanceLoading}
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

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    setMaintenanceLoading(true);
    setMaintenanceError('');
    setMaintenanceSuccess('');

    try {
      await maintenanceService.createMaintenanceRequest(maintenanceForm);
      setMaintenanceSuccess('Maintenance request submitted successfully!');
      
      // Reset form
      setMaintenanceForm({
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

      // Close dialog after success
      setTimeout(() => {
        setMaintenanceDialogOpen(false);
        setMaintenanceSuccess('');
      }, 2000);

    } catch (err) {
      setMaintenanceError(err.response?.data?.message || 'Failed to submit maintenance request');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const openMaintenanceDialog = () => {
    setMaintenanceForm({
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
    setMaintenanceError('');
    setMaintenanceSuccess('');
    setMaintenanceDialogOpen(true);
  };

  // Check user permissions for each module
  const canAccessModule = (modulePermissions) => {
    return modulePermissions.includes(user?.role);
  };

  // Handle module navigation
  const handleModuleClick = (module) => {
    if (module.id === 'maintenance') {
      openMaintenanceDialog();
    } else if (canAccessModule(module.permissions)) {
      navigate(module.path);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Facilities Management
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          {user?.role === 'student' 
            ? 'Report maintenance issues and access facility information' 
            : 'Comprehensive management of university infrastructure and resources'
          }
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {user?.role === 'student'
            ? ''
            : 'Access tools for room management, booking systems, resource allocation, and maintenance tracking'
          }
        </Typography>
      </Box>

      {/* Module Cards - Use filtered modules */}
      <Grid container spacing={3}>
        {visibleModules.map((module) => (
          <Grid item xs={12} md={6} key={module.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: canAccessModule(module.permissions) ? 'pointer' : 'default',
                '&:hover': canAccessModule(module.permissions) ? {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                } : {}
              }}
              onClick={() => handleModuleClick(module)}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: `${module.color}.main`, mr: 2 }}>
                    {module.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {module.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {canAccessModule(module.permissions) && (
                        <Chip label="Available" color="success" size="small" />
                      )}
                    </Box>
                  </Box>
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {module.description}
                </Typography>

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Features:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {module.features.map((feature, index) => (
                    <Chip
                      key={index}
                      label={feature}
                      size="small"
                      variant="outlined"
                      color={module.color}
                    />
                  ))}
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant={canAccessModule(module.permissions) ? "contained" : "outlined"}
                  color={module.color}
                  disabled={!canAccessModule(module.permissions)}
                  endIcon={<ArrowForward />}
                  onClick={() => handleModuleClick(module)}
                >
                  {module.id === 'maintenance' ? 'Report Issue' : 'Access Module'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Access Information */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Access Information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your current role: <strong>{user?.role}</strong>
        </Typography>
        {user?.role === 'student' ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              • <strong>Students:</strong> Can report maintenance issues for any facility problems
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Contact facility staff for urgent maintenance needs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • You will receive email updates about your maintenance requests
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              • <strong>Administrators:</strong> Full access to all facility management features
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Staff:</strong> Access to room management, bookings, and resource allocation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Professors:</strong> View rooms and create bookings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Students:</strong> Report maintenance issues
            </Typography>
          </>
        )}
      </Box>

      {/* Maintenance Request Dialog */}
      <Dialog 
        open={maintenanceDialogOpen} 
        onClose={() => setMaintenanceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Warning sx={{ mr: 1 }} />
            Report Maintenance Issue
            <IconButton
              aria-label="close"
              onClick={() => setMaintenanceDialogOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {maintenanceError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {maintenanceError}
            </Alert>
          )}
          {maintenanceSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {maintenanceSuccess}
            </Alert>
          )}
          
          <form onSubmit={handleMaintenanceSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Issue Title"
                  value={maintenanceForm.title}
                  onChange={(e) => handleMaintenanceChange('title', e.target.value)}
                  required
                  placeholder="Brief description of the issue"
                  disabled={maintenanceLoading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Detailed Description"
                  value={maintenanceForm.description}
                  onChange={(e) => handleMaintenanceChange('description', e.target.value)}
                  required
                  multiline
                  rows={4}
                  placeholder="Please describe the issue in detail. Include any specific symptoms, when it started, and any other relevant information."
                  disabled={maintenanceLoading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={maintenanceLoading}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={maintenanceForm.category}
                    label="Category"
                    onChange={(e) => handleMaintenanceChange('category', e.target.value)}
                  >
                    <MenuItem value="Electrical">Electrical</MenuItem>
                    <MenuItem value="Plumbing">Plumbing</MenuItem>
                    <MenuItem value="HVAC">HVAC</MenuItem>
                    <MenuItem value="Furniture">Furniture</MenuItem>
                    <MenuItem value="Equipment">Equipment</MenuItem>
                    <MenuItem value="Structural">Structural</MenuItem>
                    <MenuItem value="Cleaning">Cleaning</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={maintenanceLoading}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={maintenanceForm.priority}
                    label="Priority"
                    onChange={(e) => handleMaintenanceChange('priority', e.target.value)}
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Building"
                  value={maintenanceForm.location.building}
                  onChange={(e) => handleMaintenanceChange('location.building', e.target.value)}
                  required
                  placeholder="e.g., Science Building"
                  disabled={maintenanceLoading}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Room Number"
                  value={maintenanceForm.location.roomNumber}
                  onChange={(e) => handleMaintenanceChange('location.roomNumber', e.target.value)}
                  required
                  placeholder="e.g., 205"
                  disabled={maintenanceLoading}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Floor (Optional)"
                  value={maintenanceForm.location.floor}
                  onChange={(e) => handleMaintenanceChange('location.floor', e.target.value)}
                  placeholder="e.g., 2nd Floor"
                  disabled={maintenanceLoading}
                />
              </Grid>

              {/* Category-Specific Fields */}
              {renderCategorySpecificFields()}
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setMaintenanceDialogOpen(false)}
            disabled={maintenanceLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleMaintenanceSubmit}
            variant="contained"
            disabled={maintenanceLoading}
            startIcon={maintenanceLoading ? <CircularProgress size={20} /> : <Add />}
          >
            {maintenanceLoading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Facilities;