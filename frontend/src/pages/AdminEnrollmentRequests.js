import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
  Grid
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getPendingEnrollments, approveEnrollment, rejectEnrollment } from '../services/enrollmentService';
import { departmentService } from '../services/departmentService';

const AdminEnrollmentRequests = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    departmentId: '',
    semester: '',
    year: ''
  });

  // Dialog states
  const [approveDialog, setApproveDialog] = useState({ open: false, enrollment: null });
  const [rejectDialog, setRejectDialog] = useState({ open: false, enrollment: null });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchDepartments();
    fetchEnrollments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAllDepartments();
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filters.departmentId) params.departmentId = filters.departmentId;
      if (filters.semester) params.semester = filters.semester;
      if (filters.year) params.year = filters.year;

      const response = await getPendingEnrollments(params);
      setEnrollments(response.data.enrollments || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError(err.response?.data?.message || 'Failed to load enrollment requests');
    } finally {
      setLoading(false);
    }
  };

  const getStudentDisplay = (enrollment) => {
    const student = enrollment?.student || {};
    const first = student.firstName || student.first_name || '';
    const last = student.lastName || student.last_name || '';
    const fullName = `${first} ${last}`.trim() || student.name || 'Unknown Student';
    return { fullName };
  };

  const handleApprove = async () => {
    try {
      setError('');
      setSuccess('');
      const courseName = approveDialog.enrollment?.subject?.name || 'the course';
      const { fullName } = getStudentDisplay(approveDialog.enrollment || {});
      await approveEnrollment(approveDialog.enrollment.enrollmentId);
      setSuccess(`Successfully approved enrollment for ${fullName} in ${courseName}`);
      setApproveDialog({ open: false, enrollment: null });
      fetchEnrollments(); // Refresh the list
    } catch (err) {
      console.error('Error approving enrollment:', err);
      setError(err.response?.data?.message || 'Failed to approve enrollment');
    }
  };

  const handleReject = async () => {
    try {
      setError('');
      setSuccess('');
      const courseName = rejectDialog.enrollment?.subject?.name || 'the course';
      const { fullName } = getStudentDisplay(rejectDialog.enrollment || {});
      await rejectEnrollment(rejectDialog.enrollment.enrollmentId, rejectReason);
      setSuccess(`Successfully rejected enrollment for ${fullName} in ${courseName}`);
      setRejectDialog({ open: false, enrollment: null });
      setRejectReason('');
      fetchEnrollments(); // Refresh the list
    } catch (err) {
      console.error('Error rejecting enrollment:', err);
      setError(err.response?.data?.message || 'Failed to reject enrollment');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    fetchEnrollments();
  };

  const clearFilters = () => {
    setFilters({ departmentId: '', semester: '', year: '' });
    setTimeout(() => fetchEnrollments(), 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Enrollment Requests
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchEnrollments} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Filters */}
        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Department"
                value={filters.departmentId}
                onChange={(e) => handleFilterChange('departmentId', e.target.value)}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Semester"
                value={filters.semester}
                onChange={(e) => handleFilterChange('semester', e.target.value)}
              >
                <MenuItem value="">All Semesters</MenuItem>
                <MenuItem value="Fall">Fall</MenuItem>
                <MenuItem value="Spring">Spring</MenuItem>
                <MenuItem value="Summer">Summer</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Year"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <MenuItem value="">All Years</MenuItem>
                <MenuItem value="2024">2024</MenuItem>
                <MenuItem value="2025">2025</MenuItem>
                <MenuItem value="2026">2026</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={5}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={applyFilters}>
                  Apply Filters
                </Button>
                <Button variant="outlined" onClick={clearFilters}>
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : enrollments.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" color="textSecondary">
              No pending enrollment requests
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Student</strong></TableCell>
                  <TableCell><strong>Student ID</strong></TableCell>
                  <TableCell><strong>Course</strong></TableCell>
                  <TableCell><strong>Subject Code</strong></TableCell>
                  <TableCell><strong>Credits</strong></TableCell>
                  <TableCell><strong>Semester</strong></TableCell>
                  <TableCell><strong>Year</strong></TableCell>
                  <TableCell><strong>Request Date</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.enrollmentId} hover>
                    <TableCell>
                      {enrollment.student.firstName} {enrollment.student.lastName}
                      <Typography variant="caption" display="block" color="textSecondary">
                        {enrollment.student.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{enrollment.student.studentId}</TableCell>
                    <TableCell>{enrollment.subject.name}</TableCell>
                    <TableCell>{enrollment.subject.code}</TableCell>
                    <TableCell>{enrollment.subject.credits}</TableCell>
                    <TableCell>{enrollment.course.semester}</TableCell>
                    <TableCell>{enrollment.course.year}</TableCell>
                    <TableCell>{formatDate(enrollment.enrollmentDate)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={enrollment.status.toUpperCase()} 
                        color="warning" 
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Approve">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => setApproveDialog({ open: true, enrollment })}
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => setRejectDialog({ open: true, enrollment })}
                          >
                            <RejectIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onClose={() => setApproveDialog({ open: false, enrollment: null })}>
        <DialogTitle>Approve Enrollment Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve the enrollment request for{' '}
            <strong>
              {approveDialog.enrollment?.student.firstName} {approveDialog.enrollment?.student.lastName}
            </strong>{' '}
            in <strong>{approveDialog.enrollment?.subject.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog({ open: false, enrollment: null })}>
            Cancel
          </Button>
          <Button onClick={handleApprove} variant="contained" color="success" autoFocus>
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, enrollment: null })}>
        <DialogTitle>Reject Enrollment Request</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to reject the enrollment request for{' '}
            <strong>
              {rejectDialog.enrollment?.student.firstName} {rejectDialog.enrollment?.student.lastName}
            </strong>{' '}
            in <strong>{rejectDialog.enrollment?.subject.name}</strong>?
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Rejection (Optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRejectDialog({ open: false, enrollment: null });
            setRejectReason('');
          }}>
            Cancel
          </Button>
          <Button onClick={handleReject} variant="contained" color="error" autoFocus>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminEnrollmentRequests;
