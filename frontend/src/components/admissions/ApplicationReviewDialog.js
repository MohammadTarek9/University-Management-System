import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardContent,
  IconButton,
  Paper
} from '@mui/material';
import {
  Close,
  CheckCircle,
  Cancel,
  AccessTime,
  School,
  Person,
  Assignment
} from '@mui/icons-material';
import { applicationService } from '../../services/applicationService';

const ApplicationReviewDialog = ({ open, onClose, application, onSuccess }) => {
  const [status, setStatus] = useState(application?.status || 'Pending Review');
  const [reviewComments, setReviewComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Status options based on current workflow
  const statusOptions = [
    { value: 'Pending Review', label: 'Pending Review', color: 'warning', icon: <AccessTime /> },
    { value: 'Under Review', label: 'Under Review', color: 'info', icon: <Assignment /> },
    { value: 'Approved', label: 'Approved', color: 'success', icon: <CheckCircle /> },
    { value: 'Rejected', label: 'Rejected', color: 'error', icon: <Cancel /> },
    { value: 'Waitlisted', label: 'Waitlisted', color: 'secondary', icon: <AccessTime /> }
  ];

  // Get status info
  const getStatusInfo = (statusValue) => {
    return statusOptions.find(opt => opt.value === statusValue) || statusOptions[0];
  };

  // Reset form when dialog opens or application changes
  React.useEffect(() => {
    if (application) {
      setStatus(application.status || 'Pending Review');
      setReviewComments(application.processingInfo?.notes || '');
      setError('');
    }
  }, [application]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!reviewComments.trim()) {
      setError('Review comments are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await applicationService.updateApplicationStatus(application._id, {
        status,
        reviewComments: reviewComments.trim(),
        notes: reviewComments.trim()
      });

      if (response.success) {
        onSuccess && onSuccess(response.data);
        onClose();
      } else {
        setError(response.message || 'Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update application status');
    } finally {
      setLoading(false);
    }
  };

  // Quick action handlers
  const handleQuickAction = (newStatus, defaultComment) => {
    setStatus(newStatus);
    if (!reviewComments.trim()) {
      setReviewComments(defaultComment);
    }
  };

  if (!application) {
    return null;
  }

  const currentStatusInfo = getStatusInfo(status);
  const originalStatusInfo = getStatusInfo(application.status);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6">Review Application</Typography>
            <Typography variant="body2" color="text.secondary">
              {application.applicationId} - {application.personalInfo.firstName} {application.personalInfo.lastName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Current Status */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    label={application.status}
                    color={originalStatusInfo.color}
                    icon={originalStatusInfo.icon}
                    size="large"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                  </Typography>
                </Box>
                {application.processingInfo?.reviewedAt && (
                  <Typography variant="body2" color="text.secondary">
                    Last reviewed: {new Date(application.processingInfo.reviewedAt).toLocaleDateString()}
                  </Typography>
                )}
                {application.processingInfo?.notes && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Previous Comments:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                      <Typography variant="body2">
                        {application.processingInfo.notes}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant={status === 'Approved' ? 'contained' : 'outlined'}
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => handleQuickAction('Approved', 'Application approved - meets all requirements')}
              >
                Approve
              </Button>
              <Button
                variant={status === 'Rejected' ? 'contained' : 'outlined'}
                color="error"
                startIcon={<Cancel />}
                onClick={() => handleQuickAction('Rejected', 'Application rejected - does not meet requirements')}
              >
                Reject
              </Button>
              <Button
                variant={status === 'Waitlisted' ? 'contained' : 'outlined'}
                color="secondary"
                startIcon={<AccessTime />}
                onClick={() => handleQuickAction('Waitlisted', 'Application waitlisted - under consideration')}
              >
                Waitlist
              </Button>
              <Button
                variant={status === 'Under Review' ? 'contained' : 'outlined'}
                color="info"
                startIcon={<Assignment />}
                onClick={() => handleQuickAction('Under Review', 'Application under detailed review')}
              >
                Under Review
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Status Change Form */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={status}
                label="New Status"
                onChange={(e) => setStatus(e.target.value)}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option.icon}
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                New Status:
              </Typography>
              <Chip
                label={status}
                color={currentStatusInfo.color}
                icon={currentStatusInfo.icon}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Review Comments *"
              multiline
              rows={4}
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              error={!reviewComments.trim() && !!error}
              helperText={
                !reviewComments.trim() && error 
                  ? 'Review comments are required' 
                  : 'Provide detailed feedback about this application'
              }
              required
            />
          </Grid>

          {/* Application Summary */}
          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Application Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="subtitle2">Applicant</Typography>
                </Box>
                <Typography variant="body1">
                  {application.personalInfo.firstName} {application.personalInfo.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {application.personalInfo.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {application.personalInfo.nationality}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <School sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="subtitle2">Program</Typography>
                </Box>
                <Typography variant="body1">
                  {application.academicInfo.program}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {application.academicInfo.degreeLevel}
                </Typography>
                {application.academicInfo.intendedStartDate && (
                  <Typography variant="body2" color="text.secondary">
                    Start: {new Date(application.academicInfo.intendedStartDate).toLocaleDateString()}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Previous Education:
                </Typography>
                <Typography variant="body2">
                  {application.academicInfo.previousEducation.degree} from {application.academicInfo.previousEducation.institution}
                </Typography>
                {application.academicInfo.previousEducation.graduationDate && (
                  <Typography variant="body2" color="text.secondary">
                    Graduated: {new Date(application.academicInfo.previousEducation.graduationDate).toLocaleDateString()}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !reviewComments.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : currentStatusInfo.icon}
          color={currentStatusInfo.color}
        >
          {loading ? 'Updating...' : `Update to ${status}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationReviewDialog;