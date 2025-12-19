import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  Snackbar,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Error,
  Info,
  Delete,
  School,
  Person,
  Schedule,
  EventSeat
} from '@mui/icons-material';
import enrollmentService from '../services/enrollmentService';
import { departmentService } from '../services/departmentService';


const CourseRegistration = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [dropDialogOpen, setDropDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
    if (currentTab === 0) {
      fetchAvailableCourses();
    } else {
      fetchMyEnrollments();
    }
  }, [currentTab, selectedDepartment, selectedSemester, selectedYear]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAllDepartments({ isActive: true });
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchAvailableCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedDepartment) params.departmentId = selectedDepartment;
      if (selectedSemester) params.semester = selectedSemester;
      if (selectedYear) params.year = selectedYear;

      const response = await enrollmentService.getAvailableCourses(params);
      setAvailableCourses(response.data.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load available courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEnrollments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await enrollmentService.getMyEnrollments();
      setMyEnrollments(response.data.enrollments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (course) => {
    setSelectedCourse(course);
    setConfirmDialogOpen(true);
  };

  const handleRegisterConfirm = async () => {
    setActionLoading(true);
    setError('');
    try {
      await enrollmentService.registerForCourse(selectedCourse.courseId);
      setSuccess(`Registration request submitted for ${selectedCourse.subjectName}! Awaiting admin approval.`);
      setConfirmDialogOpen(false);
      fetchAvailableCourses();
      fetchMyEnrollments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit registration request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDropClick = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setDropDialogOpen(true);
  };

  const handleDropConfirm = async () => {
    setActionLoading(true);
    setError('');
    try {
      await enrollmentService.dropCourse(selectedEnrollment.enrollmentId);
      setSuccess(`Successfully dropped ${selectedEnrollment.subject.name}!`);
      setDropDialogOpen(false);
      fetchAvailableCourses();
      fetchMyEnrollments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to drop course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setError('');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Assignment sx={{ fontSize: 40, mr: 2, color: 'secondary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Course Registration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browse and register for available courses
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Available Courses" icon={<School />} iconPosition="start" />
          <Tab label="My Enrollments" icon={<CheckCircle />} iconPosition="start" />
        </Tabs>

        {currentTab === 0 && (
          <>
            {/* Filters */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    fullWidth
                    label="Department"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    fullWidth
                    label="Semester"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                  >
                    <MenuItem value="">All Semesters</MenuItem>
                    <MenuItem value="Fall">Fall</MenuItem>
                    <MenuItem value="Spring">Spring</MenuItem>
                    <MenuItem value="Summer">Summer</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="number"
                    fullWidth
                    label="Year"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    inputProps={{ min: 2020, max: 2030 }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Available Courses Grid */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : availableCourses.length === 0 ? (
              <Alert severity="info">
                No courses available matching your filters.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {availableCourses.map((course) => (
                  <Grid item xs={12} md={6} lg={4} key={course.courseId}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {course.subjectName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {course.subjectCode}
                        </Typography>
                        
                        <Box sx={{ my: 2 }}>
                          <Chip
                            label={course.classification === 'core' ? 'Core' : 'Elective'}
                            color={course.classification === 'core' ? 'primary' : 'default'}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={`${course.subjectCredits} Credits`}
                            size="small"
                            icon={<School />}
                          />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Schedule fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {course.semester} {course.year}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EventSeat fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {course.availableSeats} / {course.maxEnrollment} seats available
                          </Typography>
                        </Box>

                        {course.instructorName && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Person fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {course.instructorName}
                            </Typography>
                          </Box>
                        )}

                        {course.prerequisites && (
                          <Alert severity="info" sx={{ mt: 2 }} icon={<Info />}>
                            <Typography variant="caption">
                              <strong>Prerequisites:</strong> {course.prerequisites}
                            </Typography>
                          </Alert>
                        )}

                        {course.isEnrolled && (
                          <Chip
                            label="Already Enrolled"
                            color="success"
                            size="small"
                            icon={<CheckCircle />}
                            sx={{ mt: 2 }}
                          />
                        )}

                        {course.isFull && !course.isEnrolled && (
                          <Chip
                            label="Class Full"
                            color="error"
                            size="small"
                            icon={<Error />}
                            sx={{ mt: 2 }}
                          />
                        )}
                      </CardContent>
                      <CardActions>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          disabled={!course.canRegister}
                          onClick={() => handleRegisterClick(course)}
                        >
                          {course.isEnrolled ? 'Enrolled' : course.isFull ? 'Full' : 'Register'}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        {currentTab === 1 && (
          <>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : myEnrollments.length === 0 ? (
              <Alert severity="info">
                You are not enrolled in any courses yet.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Credits</TableCell>
                      <TableCell>Semester</TableCell>
                      <TableCell>Year</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Grade</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.enrollmentId}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {enrollment.subject?.name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>{enrollment.subject?.code || 'N/A'}</TableCell>
                        <TableCell>{enrollment.subject?.credits || 'N/A'}</TableCell>
                        <TableCell>{enrollment.course?.semester || 'N/A'}</TableCell>
                        <TableCell>{enrollment.course?.year || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={(enrollment.status || 'pending').toUpperCase()}
                            color={
                              enrollment.status === 'enrolled' ? 'success' : 
                              enrollment.status === 'pending' ? 'warning' : 
                              enrollment.status === 'rejected' ? 'error' : 
                              enrollment.status === 'dropped' ? 'default' :
                              'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{enrollment.grade || '-'}</TableCell>
                        <TableCell align="center">
                          {enrollment.status === 'enrolled' && (
                            <Tooltip title="Drop Course">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDropClick(enrollment)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          )}
                          {enrollment.status === 'pending' && (
                            <Chip label="Awaiting Approval" size="small" color="info" />
                          )}
                          {enrollment.status === 'rejected' && (
                            <Chip label="Request Denied" size="small" color="error" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>

      {/* Register Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Course Registration</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to register for:
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h6">{selectedCourse?.subjectName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedCourse?.subjectCode} • {selectedCourse?.subjectCredits} Credits
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {selectedCourse?.semester} {selectedCourse?.year}
            </Typography>
          </Box>
          {selectedCourse?.prerequisites && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Prerequisites:</strong> {selectedCourse.prerequisites}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Please ensure you have met all prerequisites before registering.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleRegisterConfirm}
            variant="contained"
            color="primary"
            disabled={actionLoading}
          >
            {actionLoading ? 'Registering...' : 'Confirm Registration'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drop Confirmation Dialog */}
      <Dialog open={dropDialogOpen} onClose={() => setDropDialogOpen(false)}>
        <DialogTitle>Confirm Drop Course</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to drop this course?
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h6">{selectedEnrollment?.subject?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedEnrollment?.subject?.code} • {selectedEnrollment?.subject?.credits} Credits
            </Typography>
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Dropping a course may affect your academic progress. This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDropDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDropConfirm}
            variant="contained"
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? 'Dropping...' : 'Drop Course'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CourseRegistration;
