import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Close,
  Person,
  School,
  Email,
  Phone,
  LocationOn,
  AttachFile,
  CalendarToday
} from '@mui/icons-material';
import { applicationService } from '../../services/applicationService';

const ApplicationViewDialog = ({ open, onClose, application }) => {
  if (!application) {
    return null;
  }

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    return applicationService.getStatusColor(status);
  };

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
            <Typography variant="h6">Application Details</Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {application.applicationId}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Application Status and Basic Info */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Application Status</Typography>
                <Chip
                  label={application.status}
                  color={getStatusColor(application.status)}
                  size="large"
                />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2" color="text.secondary">
                      Submitted: {formatDate(application.submittedAt)}
                    </Typography>
                  </Box>
                </Grid>
                {application.processedAt && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
                      <Typography variant="body2" color="text.secondary">
                        Processed: {formatDate(application.processedAt)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {application.reviewedBy && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Reviewed by: {application.reviewedBy.firstName} {application.reviewedBy.lastName}
                    </Typography>
                  </Grid>
                )}
                {application.reviewComments && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Review Comments: {application.reviewComments}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Personal Information */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1 }} />
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                  <Typography variant="body1">
                    {application.personalInfo.firstName} {application.personalInfo.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Email sx={{ mr: 1, fontSize: 16 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{application.personalInfo.email}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Phone sx={{ mr: 1, fontSize: 16 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">{application.personalInfo.phone}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                  <Typography variant="body1">
                    {formatDate(application.personalInfo.dateOfBirth)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Nationality</Typography>
                  <Typography variant="body1">{application.personalInfo.nationality}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <LocationOn sx={{ mr: 1, fontSize: 16, mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                      <Typography variant="body1">
                        {application.personalInfo.address.street && `${application.personalInfo.address.street}, `}
                        {application.personalInfo.address.city}
                        {application.personalInfo.address.state && `, ${application.personalInfo.address.state}`}
                        {application.personalInfo.address.zipCode && ` ${application.personalInfo.address.zipCode}`}
                        <br />
                        {application.personalInfo.address.country}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Academic Information */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <School sx={{ mr: 1 }} />
                Academic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Program</Typography>
                  <Chip label={application.academicInfo.program} color="primary" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Degree Level</Typography>
                  <Typography variant="body1">{application.academicInfo.degreeLevel}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Chip label="Previous Education" size="small" />
                  </Divider>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Institution</Typography>
                  <Typography variant="body1">{application.academicInfo.previousEducation.institution}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Degree</Typography>
                  <Typography variant="body1">{application.academicInfo.previousEducation.degree}</Typography>
                </Grid>
                {application.academicInfo.previousEducation.graduationDate && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Graduation Date</Typography>
                    <Typography variant="body1">{formatDate(application.academicInfo.previousEducation.graduationDate)}</Typography>
                  </Grid>
                )}
                {application.academicInfo.intendedStartDate && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Intended Start Date</Typography>
                    <Typography variant="body1">{formatDate(application.academicInfo.intendedStartDate)}</Typography>
                  </Grid>
                )}




              </Grid>
            </Paper>
          </Grid>

          {/* Documents */}
          {application.documents && application.documents.length > 0 && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachFile sx={{ mr: 1 }} />
                  Documents ({application.documents.length})
                </Typography>
                <List dense>
                  {application.documents.map((doc, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <AttachFile />
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.name}
                        secondary={`${doc.type}${doc.size ? ` • ${(doc.size / 1024).toFixed(1)} KB` : ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationViewDialog;