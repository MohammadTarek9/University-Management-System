import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  CheckCircle,
  Pending,
  Cancel,
  LocationOn,
  Refresh
} from '@mui/icons-material';
import {
  getMyMeetings,
  updateMeetingStatus,
  cancelMeeting
} from '../services/meetingService';

const ProfessorMeetingPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const response = await getMyMeetings();
      setMeetings(response.data.meetings);
      setUpcomingMeetings(response.data.upcomingMeetings || []);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleActionClick = (meeting, type) => {
    setSelectedMeeting(meeting);
    setActionType(type);
    setNotes('');
    setActionDialogOpen(true);
  };

  const handleActionConfirm = async () => {
    try {
      if (actionType === 'approved' || actionType === 'rejected') {
        await updateMeetingStatus(selectedMeeting.id, actionType, notes);
      } else if (actionType === 'cancel') {
        await cancelMeeting(selectedMeeting.id, notes);
      }
      
      alert(`Meeting ${actionType}d successfully!`);
      setActionDialogOpen(false);
      fetchMeetings();
    } catch (error) {
      alert(error.response?.data?.message || `Failed to ${actionType} meeting`);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <Pending />, label: 'Pending' },
      approved: { color: 'success', icon: <CheckCircle />, label: 'Approved' },
      rejected: { color: 'error', icon: <Cancel />, label: 'Rejected' },
      cancelled: { color: 'default', icon: <Cancel />, label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (tabValue === 0) return meeting.status === 'pending';
    if (tabValue === 1) return meeting.status === 'approved';
    if (tabValue === 2) return meeting.status === 'rejected';
    return true;
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Stats Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">Meeting Dashboard</Typography>
              <Button startIcon={<Refresh />} onClick={fetchMeetings} variant="outlined">
                Refresh
              </Button>
            </Box>
            
            {stats && (
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {stats.total}
                      </Typography>
                      <Typography color="text.secondary">Total Requests</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {stats.pending}
                      </Typography>
                      <Typography color="text.secondary">Pending</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {stats.approved}
                      </Typography>
                      <Typography color="text.secondary">Approved</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main">
                        {stats.rejected + stats.cancelled}
                      </Typography>
                      <Typography color="text.secondary">Rejected/Cancelled</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab 
                  label={
                    <Badge badgeContent={stats?.pending || 0} color="warning">
                      <Box sx={{ px: 1 }}>Pending</Box>
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge badgeContent={stats?.approved || 0} color="success">
                      <Box sx={{ px: 1 }}>Approved</Box>
                    </Badge>
                  } 
                />
                <Tab label="Rejected" />
                <Tab label="All" />
              </Tabs>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : filteredMeetings.length === 0 ? (
              <Alert severity="info">
                No meetings found in this category.
              </Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>Purpose</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMeetings.map((meeting) => (
                      <TableRow key={meeting.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {meeting.studentName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {meeting.studentEmail}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {formatDate(meeting.meetingDate)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {meeting.purpose || 'No purpose specified'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(meeting.status)}
                        </TableCell>
                        <TableCell>
                          {meeting.status === 'pending' && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                color="success"
                                variant="outlined"
                                onClick={() => handleActionClick(meeting, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                onClick={() => handleActionClick(meeting, 'rejected')}
                              >
                                Reject
                              </Button>
                            </Box>
                          )}
                          {(meeting.status === 'approved' || meeting.status === 'pending') && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleActionClick(meeting, 'cancel')}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Upcoming Meetings Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Meetings
            </Typography>
            
            {upcomingMeetings.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No upcoming meetings
              </Alert>
            ) : (
              <Box sx={{ mt: 2 }}>
                {upcomingMeetings.map((meeting) => (
                  <Card key={meeting.id} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {meeting.studentName}
                        </Typography>
                        <Chip
                          label={formatDate(meeting.meetingDate)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {meeting.purpose || 'No purpose specified'}
                      </Typography>
                      {meeting.officeLocation && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {meeting.officeLocation}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)}>
        <DialogTitle>
          {actionType === 'approved' && 'Approve Meeting Request'}
          {actionType === 'rejected' && 'Reject Meeting Request'}
          {actionType === 'cancel' && 'Cancel Meeting'}
        </DialogTitle>
        <DialogContent>
          {selectedMeeting && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Student:</strong> {selectedMeeting.studentName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Date:</strong> {formatDate(selectedMeeting.meetingDate)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Time:</strong> {formatTime(selectedMeeting.startTime)} - {formatTime(selectedMeeting.endTime)}
              </Typography>
              {selectedMeeting.purpose && (
                <Typography variant="body1" gutterBottom>
                  <strong>Purpose:</strong> {selectedMeeting.purpose}
                </Typography>
              )}
              
              <TextField
                autoFocus
                margin="dense"
                label="Notes (Optional)"
                fullWidth
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  actionType === 'approved' 
                    ? 'Add any notes or instructions for the student...' 
                    : 'Provide a reason for this action...'
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleActionConfirm} 
            variant="contained"
            color={
              actionType === 'approved' ? 'success' : 
              actionType === 'rejected' ? 'error' : 
              'warning'
            }
          >
            Confirm {actionType}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfessorMeetingPage;