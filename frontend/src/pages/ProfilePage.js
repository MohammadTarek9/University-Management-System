import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Avatar
} from '@mui/material';
import {
  Save,
  Person,
  Email,
  Phone,
  Business,
  Badge
} from '@mui/icons-material';
import { profileService } from '../services/profileService';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    department: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await profileService.getProfile();
        setProfile(response.data.user);
        setFormData({
          firstName: response.data.user.firstName || '',
          lastName: response.data.user.lastName || '',
          phoneNumber: response.data.user.phoneNumber || '',
          department: response.data.user.department || ''
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    if (formData.phoneNumber && !/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setUpdating(true);
      setError('');
      const response = await profileService.updateProfile(formData);
      
      // Update the auth context with new user data
      updateUser(response.data.user);
      
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  // Get role display properties (matching your existing style)
  const getRoleChipProps = (role) => {
    const roleConfig = {
      student: { color: 'primary', label: 'Student' },
      professor: { color: 'secondary', label: 'Professor' },
      admin: { color: 'error', label: 'Administrator' },
      staff: { color: 'warning', label: 'Staff' },
      parent: { color: 'info', label: 'Parent' },
      ta: { color: 'success', label: 'Teaching Assistant' }
    };
    return roleConfig[role] || { color: 'default', label: role };
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Person sx={{ mr: 2, fontSize: 32 }} color="primary" />
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Profile Information Card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 'fit-content' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem'
                }}
              >
                {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
              </Avatar>
              <Typography variant="h5" component="h2" align="center" gutterBottom>
                {profile?.firstName} {profile?.lastName}
              </Typography>
              <Chip
                label={getRoleChipProps(profile?.role).label}
                color={getRoleChipProps(profile?.role).color}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary" align="center">
                Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Read-only Information */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Email sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {profile?.email}
                </Typography>
              </Box>
            </Box>

            {profile?.studentId && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Badge sx={{ mr: 2, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Student ID
                  </Typography>
                  <Typography variant="body1">
                    {profile.studentId}
                  </Typography>
                </Box>
              </Box>
            )}

            {profile?.employeeId && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Badge sx={{ mr: 2, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Employee ID
                  </Typography>
                  <Typography variant="body1">
                    {profile.employeeId}
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Business sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={profile?.isActive ? 'Active' : 'Inactive'}
                  color={profile?.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Box>

            {profile?.lastLogin && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Login
                </Typography>
                <Typography variant="body2">
                  {new Date(profile.lastLogin).toLocaleString()}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Edit Profile Form */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
              Edit Profile Information
            </Typography>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={!!formErrors.firstName}
                    helperText={formErrors.firstName}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={!!formErrors.lastName}
                    helperText={formErrors.lastName}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    error={!!formErrors.phoneNumber}
                    helperText={formErrors.phoneNumber || 'Optional'}
                    InputProps={{
                      startAdornment: <Phone sx={{ color: 'text.secondary', mr: 1 }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    helperText="Optional"
                    InputProps={{
                      startAdornment: <Business sx={{ color: 'text.secondary', mr: 1 }} />
                    }}
                  />
                </Grid>

                {/* Read-only Fields */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={profile?.email || ''}
                    disabled
                    helperText="Email cannot be changed"
                    InputProps={{
                      startAdornment: <Email sx={{ color: 'text.secondary', mr: 1 }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''}
                    disabled
                  />
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={updating ? <CircularProgress size={20} /> : <Save />}
                      disabled={updating}
                    >
                      {updating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;