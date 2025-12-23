import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  School,
  EmojiEvents,
  Schedule,
  CheckCircle,
  Cancel,
  TrendingUp,
  Event,
  ArrowBack,
  Add
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ProfessionalDevelopmentActivities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activities, setActivities] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    activityType: 'workshop',
    title: '',
    description: '',
    organizer: '',
    location: '',
    startDate: '',
    endDate: '',
    durationHours: '',
    status: 'planned',
    completionDate: '',
    certificateObtained: false,
    certificateUrl: '',
    creditsEarned: '',
    cost: '',
    fundingSource: '',
    skillsAcquired: '',
    notes: ''
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/staff/professional-development',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setActivities(response.data.data.activities);
        setStatistics(response.data.data.statistics);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err.response?.data?.message || 'Failed to load professional development activities');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'ongoing':
        return 'primary';
      case 'planned':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle fontSize="small" />;
      case 'ongoing':
        return <TrendingUp fontSize="small" />;
      case 'planned':
        return <Schedule fontSize="small" />;
      case 'cancelled':
        return <Cancel fontSize="small" />;
      default:
        return null;
    }
  };

  const getActivityTypeIcon = (type) => {
    switch (type) {
      case 'conference':
      case 'seminar':
      case 'presentation':
        return <Event fontSize="small" />;
      case 'certification':
      case 'course':
      case 'training':
        return <School fontSize="small" />;
      default:
        return <EmojiEvents fontSize="small" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      activityType: 'workshop',
      title: '',
      description: '',
      organizer: '',
      location: '',
      startDate: '',
      endDate: '',
      durationHours: '',
      status: 'planned',
      completionDate: '',
      certificateObtained: false,
      certificateUrl: '',
      creditsEarned: '',
      cost: '',
      fundingSource: '',
      skillsAcquired: '',
      notes: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.startDate) {
        setError('Title and start date are required');
        return;
      }

      setError('');
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:5000/api/staff/professional-development',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess('Professional development activity added successfully!');
        handleCloseDialog();
        fetchActivities(); // Refresh the list
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error creating activity:', err);
      setError(err.response?.data?.message || 'Failed to create activity');
    }
  };

  const getFilteredActivities = () => {
    switch (activeTab) {
      case 1:
        return activities.filter(a => a.status === 'completed');
      case 2:
        return activities.filter(a => a.status === 'ongoing');
      case 3:
        return activities.filter(a => a.status === 'planned');
      default:
        return activities;
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
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/staff')}
          sx={{ mb: 2 }}
        >
          Back to Staff Module
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Professional Development Activities
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track your career growth and professional learning journey
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
          >
            Add Activity
          </Button>
        </Box>
      </Box>

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

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmojiEvents color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {statistics.total_activities || 0}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total Activities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {statistics.completed_count || 0}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Schedule color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {Number(statistics.total_hours || 0).toFixed(1)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total Hours
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <School color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {statistics.certificates_count || 0}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Certificates
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs for filtering */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="All Activities" />
          <Tab label="Completed" />
          <Tab label="Ongoing" />
          <Tab label="Planned" />
        </Tabs>
      </Paper>

      {/* Activities List */}
      {getFilteredActivities().length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No activities found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {activeTab === 0
              ? 'You haven\'t added any professional development activities yet.'
              : `No ${['', 'completed', 'ongoing', 'planned'][activeTab]} activities found.`}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {getFilteredActivities().map((activity) => (
            <Paper key={activity.id} sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                      <Box sx={{ mr: 2 }}>
                        {getActivityTypeIcon(activity.activity_type)}
                      </Box>
                      <Box>
                        <Typography variant="h6" component="h3">
                          {activity.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Chip
                            icon={getStatusIcon(activity.status)}
                            label={activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                            color={getStatusColor(activity.status)}
                            size="small"
                          />
                          <Chip
                            label={activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                            size="small"
                            variant="outlined"
                          />
                          {activity.certificate_obtained === 1 && (
                            <Chip
                              icon={<School fontSize="small" />}
                              label="Certificate"
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {activity.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      {activity.description}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Start Date
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(activity.start_date)}
                  </Typography>
                </Grid>

                {activity.end_date && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      End Date
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(activity.end_date)}
                    </Typography>
                  </Grid>
                )}

                {activity.organizer && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Organizer
                    </Typography>
                    <Typography variant="body2">
                      {activity.organizer}
                    </Typography>
                  </Grid>
                )}

                {activity.location && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Location
                    </Typography>
                    <Typography variant="body2">
                      {activity.location}
                    </Typography>
                  </Grid>
                )}

                {activity.duration_hours && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Duration
                    </Typography>
                    <Typography variant="body2">
                      {activity.duration_hours} hours
                    </Typography>
                  </Grid>
                )}

                {activity.credits_earned && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Credits Earned
                    </Typography>
                    <Typography variant="body2">
                      {activity.credits_earned}
                    </Typography>
                  </Grid>
                )}

                {activity.skills_acquired && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Skills Acquired
                    </Typography>
                    <Typography variant="body2">
                      {activity.skills_acquired}
                    </Typography>
                  </Grid>
                )}

                {activity.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Notes
                    </Typography>
                    <Typography variant="body2">
                      {activity.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Add Activity Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add Professional Development Activity</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Activity Type"
                name="activityType"
                value={formData.activityType}
                onChange={handleInputChange}
                required
              >
                <MenuItem value="conference">Conference</MenuItem>
                <MenuItem value="workshop">Workshop</MenuItem>
                <MenuItem value="seminar">Seminar</MenuItem>
                <MenuItem value="certification">Certification</MenuItem>
                <MenuItem value="course">Course</MenuItem>
                <MenuItem value="training">Training</MenuItem>
                <MenuItem value="presentation">Presentation</MenuItem>
                <MenuItem value="publication">Publication</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <MenuItem value="planned">Planned</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Organizer"
                name="organizer"
                value={formData.organizer}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (Hours)"
                name="durationHours"
                value={formData.durationHours}
                onChange={handleInputChange}
                inputProps={{ step: 0.5, min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Completion Date"
                name="completionDate"
                value={formData.completionDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Credits Earned"
                name="creditsEarned"
                value={formData.creditsEarned}
                onChange={handleInputChange}
                inputProps={{ step: 0.5, min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Cost"
                name="cost"
                value={formData.cost}
                onChange={handleInputChange}
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Funding Source"
                name="fundingSource"
                value={formData.fundingSource}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.certificateObtained}
                    onChange={handleInputChange}
                    name="certificateObtained"
                  />
                }
                label="Certificate Obtained"
              />
            </Grid>
            {formData.certificateObtained && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Certificate URL"
                  name="certificateUrl"
                  value={formData.certificateUrl}
                  onChange={handleInputChange}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Skills Acquired"
                name="skillsAcquired"
                value={formData.skillsAcquired}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add Activity
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfessionalDevelopmentActivities;
