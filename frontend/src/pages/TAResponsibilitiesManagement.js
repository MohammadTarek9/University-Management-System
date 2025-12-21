// pages/TAResponsibilitiesManagement.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import { staffService } from '../services/staffService';

const TAResponsibilitiesManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tas, setTas] = useState([]);
  const [courses, setCourses] = useState([]);

  const [taUserId, setTaUserId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [responsibilityType, setResponsibilityType] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // load only courses on mount
useEffect(() => {
  const loadCourses = async () => {
    try {
      setLoading(true);
      setError('');

      const courseRes = await courseService.getMyCourses({ isActive: true });
      const coursePayload = courseRes.data || courseRes;
      setCourses(coursePayload.courses || coursePayload.data?.courses || []);
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  loadCourses();
}, []);

// load eligible TAs when courseId changes
useEffect(() => {
  if (!courseId) {
    setTas([]);
    setTaUserId('');
    return;
  }

  const loadTAs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await staffService.getEligibleTAs(Number(courseId));
      const payload = res.data || res;
      const tasList = payload.data || payload.tas || [];
      setTas(Array.isArray(tasList) ? tasList : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load TAs');
      setTas([]);
    } finally {
      setLoading(false);
    }
  };

  loadTAs();
}, [courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!taUserId || !courseId || !responsibilityType) {
      setError('Please select TA, course, and responsibility type.');
      return;
    }

    try {
      setSubmitLoading(true);
      await staffService.assignTAResponsibility({
        taUserId: Number(taUserId),
        courseId: Number(courseId),
        responsibilityType,
        notes,
      });
      setSuccess('TA responsibility assigned successfully.');
      setNotes('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign responsibility.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Optional: block non‑professors
  if (user && user.role !== 'professor') {
    return (
      <Container maxWidth="md">
        <Box mt={4}>
          <Alert severity="error">
            Only professors can assign TA responsibilities.
          </Alert>
          <Box mt={2}>
            <Button variant="contained" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={3}>
        <Typography variant="h4" gutterBottom>
          Assign TA Responsibilities
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Select a teaching assistant, choose a course, and assign their responsibilities.
        </Typography>
      </Box>

      {error && (
        <Box mb={2}>
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Box>
      )}
      {success && (
        <Box mb={2}>
          <Alert severity="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </Box>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Teaching Assistant"
              value={taUserId}
              onChange={(e) => setTaUserId(e.target.value)}
              disabled={loading}
            >
              {tas.map((ta) => (
                <MenuItem key={ta.id} value={ta.id}>
                  {ta.first_name || ta.firstName} {ta.last_name || ta.lastName} ({ta.email})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={loading}
            >
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.subject?.code || course.code} - {course.subject?.name || course.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Responsibility Type"
              value={responsibilityType}
              onChange={(e) => setResponsibilityType(e.target.value)}
            >
              <MenuItem value="lab">Lab</MenuItem>
              <MenuItem value="tutorial">Tutorial</MenuItem>
              <MenuItem value="grading">Grading</MenuItem>
              <MenuItem value="office_hours">Office Hours</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitLoading || loading}
            >
              {submitLoading ? 'Assigning…' : 'Assign Responsibility'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default TAResponsibilitiesManagement;
