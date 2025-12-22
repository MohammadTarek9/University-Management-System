// pages/teaching-staff/TeachingStaffProfilePage.js - Updated version
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save,
  LocationOn,
  Schedule,
  Phone,
  Email,
  Business,
  Person,
  Edit,
  Check,
  Close
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { teachingStaffProfileService } from '../services/teachingStaffProfileService';

const TeachingStaffProfilePage = () => {
  const { user, updateUser } = useAuth(); // Added updateUser from auth context
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);

  // Validation schema
  const validationSchema = Yup.object({
    officeHours: Yup.string().max(500, 'Office hours cannot exceed 500 characters'),
    officeLocation: Yup.string().max(255, 'Office location cannot exceed 255 characters'),
    phoneNumber: Yup.string()
      .matches(/^[\d\s\-+()]*$/, 'Invalid phone number format')
      .max(20, 'Phone number cannot exceed 20 characters'),
    email: Yup.string()
      .email('Invalid email address')
      .max(255, 'Email cannot exceed 255 characters')
  });

  // Fetch current profile
  useEffect(() => {
    fetchMyProfile();
  }, []);

  const fetchMyProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await teachingStaffProfileService.getMyProfile();
      
      if (response.profile) {
        setProfile(response.profile);
        // Initialize form with profile data
        formik.setValues({
          officeHours: response.profile.officeHours || '',
          officeLocation: response.profile.officeLocation || '',
          phoneNumber: response.profile.user?.phoneNumber || '',
          email: response.profile.user?.email || ''
        });
      } else if (response.user) {
        // No profile exists yet, but we have user info
        setProfile(null);
        formik.setValues({
          officeHours: '',
          officeLocation: '',
          phoneNumber: response.user.phoneNumber || '',
          email: response.user.email || ''
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      officeHours: '',
      officeLocation: '',
      phoneNumber: '',
      email: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSaving(true);
        setError('');
        setSuccess('');
        
        // Prepare data for API - only send changed fields
        const updateData = {};
        
        if (values.officeHours !== formik.initialValues.officeHours) {
          updateData.officeHours = values.officeHours;
        }
        
        if (values.officeLocation !== formik.initialValues.officeLocation) {
          updateData.officeLocation = values.officeLocation;
        }
        
        if (values.phoneNumber !== formik.initialValues.phoneNumber) {
          updateData.phoneNumber = values.phoneNumber || null; // Send null if empty
        }
        
        if (values.email !== formik.initialValues.email) {
          updateData.email = values.email;
        }
        
        // Only call API if something changed
        if (Object.keys(updateData).length > 0) {
          const response = await teachingStaffProfileService.updateMyProfile(updateData);
          
          // Update auth context if email or phone changed
          if (updateData.email || updateData.phoneNumber !== undefined) {
            const updatedUser = {
              ...user,
              email: updateData.email || user.email,
              phoneNumber: updateData.phoneNumber !== undefined ? updateData.phoneNumber : user.phoneNumber
            };
            updateUser(updatedUser);
          }
          
          setSuccess('Profile updated successfully!');
          fetchMyProfile(); // Refresh profile data
          
          // Reset editing states
          setEditingEmail(false);
          setEditingPhone(false);
        } else {
          setSuccess('No changes to save.');
        }
      } catch (err) {
        setError(err.message || 'Failed to update profile');
        console.error('Error updating profile:', err);
      } finally {
        setSaving(false);
      }
    }
  });

  const handleCancelEdit = (field) => {
    if (field === 'email') {
      setEditingEmail(false);
      formik.setFieldValue('email', formik.initialValues.email);
    } else if (field === 'phone') {
      setEditingPhone(false);
      formik.setFieldValue('phoneNumber', formik.initialValues.phoneNumber);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Teaching Staff Profile
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Update your contact information, office hours, and location for students
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - User Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user?.role === 'professor' ? 'Professor' : 'Teaching Assistant'}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Contact Information
                </Typography>
                
                {/* Email Field */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    {!editingEmail ? (
                      <Tooltip title="Edit email">
                        <IconButton size="small" onClick={() => setEditingEmail(true)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Box>
                        <Tooltip title="Save">
                          <IconButton 
                            size="small" 
                            onClick={() => formik.handleSubmit()}
                            disabled={saving}
                          >
                            <Check fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton size="small" onClick={() => handleCancelEdit('email')}>
                            <Close fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                  
                  {editingEmail ? (
                    <TextField
                      fullWidth
                      size="small"
                      name="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.email && Boolean(formik.errors.email)}
                      helperText={formik.touched.email && formik.errors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {formik.values.email || 'Not set'}
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {/* Phone Number Field */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Phone Number
                    </Typography>
                    {!editingPhone ? (
                      <Tooltip title="Edit phone number">
                        <IconButton size="small" onClick={() => setEditingPhone(true)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Box>
                        <Tooltip title="Save">
                          <IconButton 
                            size="small" 
                            onClick={() => formik.handleSubmit()}
                            disabled={saving}
                          >
                            <Check fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton size="small" onClick={() => handleCancelEdit('phone')}>
                            <Close fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                  
                  {editingPhone ? (
                    <TextField
                      fullWidth
                      size="small"
                      name="phoneNumber"
                      value={formik.values.phoneNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.phoneNumber && Boolean(formik.errors.phoneNumber)}
                      helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
                      placeholder="e.g., +1 (123) 456-7890"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {formik.values.phoneNumber || 'Not set'}
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {/* Department (read-only) */}
                {user?.department && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {user.department}
                    </Typography>
                  </Box>
                )}
                
                {/* Employee ID (read-only) */}
                {user?.employeeId && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      ID: {user.employeeId}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tips
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Keep contact information updated for students
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Be specific about office hours and location
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Update your profile when information changes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Office Information Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={3}>
                {/* Office Hours */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="officeHours"
                    label="Office Hours"
                    placeholder="e.g., Monday 2:00 PM - 4:00 PM, Wednesday 10:00 AM - 12:00 PM"
                    value={formik.values.officeHours}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.officeHours && Boolean(formik.errors.officeHours)}
                    helperText={formik.touched.officeHours && formik.errors.officeHours}
                    multiline
                    rows={4}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Schedule color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Office Location */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="officeLocation"
                    label="Office Location"
                    placeholder="e.g., Science Building, Room 305"
                    value={formik.values.officeLocation}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.officeLocation && Boolean(formik.errors.officeLocation)}
                    helperText={formik.touched.officeLocation && formik.errors.officeLocation}
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        formik.resetForm();
                        setEditingEmail(false);
                        setEditingPhone(false);
                      }}
                      disabled={saving}
                    >
                      Reset All
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                      disabled={saving || !formik.dirty}
                    >
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
          
          {/* Current Profile Info */}
          {profile && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Office Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Office Hours
                    </Typography>
                    <Typography variant="body1">
                      {profile.officeHours || 'Not set'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Office Location
                    </Typography>
                    <Typography variant="body1">
                      {profile.officeLocation || 'Not set'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'Never'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default TeachingStaffProfilePage;