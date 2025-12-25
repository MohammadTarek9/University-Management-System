import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  MenuItem,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Person,
  CheckCircle,
  Pending,
  Cancel,
  Refresh
} from '@mui/icons-material';
import {
  getAvailableProfessors,
  requestMeeting,
  getMyMeetings,
  cancelMeeting
} from '../services/meetingService';

const StudentMeetingPage = () => {
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState(null);

  // Load professors and meetings on component mount
  useEffect(() => {
    fetchProfessors();
    fetchMyMeetings();
  }, []);

  const fetchProfessors = async () => {
    try {
      const response = await getAvailableProfessors(departmentFilter);
      setProfessors(response.data.professors);
    } catch (error) {
      console.error('Error fetching professors:', error);
    }
  };

  const fetchMyMeetings = async () => {
    setLoading(true);
    try {
      const response = await getMyMeetings();
      setMeetings(response.data.meetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfessorSelect = (professor) => {
    setSelectedProfessor(professor);
  };

  const handleRequestMeeting = async () => {
    try {
      await requestMeeting({
        professorId: selectedProfessor.id,
        date,
        startTime,
        purpose
      });
      
      alert('Meeting request submitted successfully!');
      setRequestDialogOpen(false);
      setPurpose('');
      setDate('');
      setStartTime('');
      setSelectedProfessor(null);
      fetchMyMeetings();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to request meeting');
    }
  };

  const handleCancelMeeting = async () => {
    try {
      await cancelMeeting(meetingToCancel.id);
      alert('Meeting cancelled successfully!');
      setCancelDialogOpen(false);
      setMeetingToCancel(null);
      fetchMyMeetings();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel meeting');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Check if form is valid
  const isFormValid = () => {
    return selectedProfessor && date && startTime && purpose.trim();
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Left Column: Professor Selection and Meeting Request Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2">
                Request Meeting with Professor
              </Typography>
              <Button
                startIcon={<Refresh />}
                onClick={fetchProfessors}
                variant="outlined"
                size="small"
              >
                Refresh
              </Button>
            </Box>

            {/* Department Filter */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Filter by Department</InputLabel>
              <Select
                value={departmentFilter}
                label="Filter by Department"
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setSelectedProfessor(null);
                }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {Array.from(new Set(professors.map(p => p.department).filter(Boolean))).map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Professor Selection */}
            <Typography variant="subtitle1" gutterBottom>
              Select a Professor
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {professors.map((professor) => (
                <Grid item xs={12} sm={6} key={professor.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      borderColor: selectedProfessor?.id === professor.id ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'primary.light' }
                    }}
                    onClick={() => handleProfessorSelect(professor)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Person sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="h6">
                          {professor.name}
                        </Typography>
                      </Box>
                      <Typography color="text.secondary" variant="body2">
                        {professor.role} • {professor.department}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {professor.email}
                      </Typography>
                      {professor.officeHours && (
                        <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                          <strong>Office Hours:</strong> {professor.officeHours}
                        </Typography>
                      )}
                      {professor.officeLocation && (
                        <Typography color="text.secondary" variant="body2">
                          <strong>Location:</strong> {professor.officeLocation}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Date and Time Selection */}
            {selectedProfessor && (
              <>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Meeting Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      type="date"
                      label="Meeting Date"
                      fullWidth
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: getTodayDate() }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      type="time"
                      label="Start Time"
                      fullWidth
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }} // 5 minute increments
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Meeting Purpose"
                      fullWidth
                      multiline
                      rows={3}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Please describe the purpose of this meeting..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      onClick={() => setRequestDialogOpen(true)}
                      disabled={!isFormValid()}
                    >
                      Request Meeting
                    </Button>
                  </Grid>
                </Grid>
              </>
            )}
          </Paper>
        </Grid>

        {/* Right Column: My Meetings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" component="h2" gutterBottom>
              My Meeting Requests
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : meetings.length === 0 ? (
              <Alert severity="info">
                You haven't requested any meetings yet. Select a professor to get started.
              </Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Professor</TableCell>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {meetings.map((meeting) => (
                      <TableRow key={meeting.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {meeting.professorName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {meeting.professorEmail}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {formatDate(meeting.meetingDate)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {meeting.startTime.substring(0, 5)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(meeting.status)}
                        </TableCell>
                        <TableCell>
                          {(meeting.status === 'pending' || meeting.status === 'approved') && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => {
                                setMeetingToCancel(meeting);
                                setCancelDialogOpen(true);
                              }}
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
      </Grid>

      {/* Request Meeting Dialog */}
      <Dialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)}>
        <DialogTitle>Confirm Meeting Request</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Professor:</strong> {selectedProfessor?.name}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Date:</strong> {date}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Time:</strong> {startTime}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Purpose:</strong> {purpose}
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              The professor will review your request and approve or reject it based on their availability.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRequestMeeting} 
            variant="contained"
          >
            Confirm Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Meeting Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Meeting</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to cancel this meeting?
          </Typography>
          {meetingToCancel && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                With: {meetingToCancel.professorName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date: {formatDate(meetingToCancel.meetingDate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Time: {meetingToCancel.startTime.substring(0, 5)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>No, Keep</Button>
          <Button 
            onClick={handleCancelMeeting} 
            color="error"
            variant="contained"
          >
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentMeetingPage;