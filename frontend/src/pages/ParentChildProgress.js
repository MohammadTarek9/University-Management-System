import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import parentProgressService from '../services/parentProgressService';

const ParentChildProgress = () => {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [courses, setCourses] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadChildren = async () => {
      try {
        setLoadingChildren(true);
        setError('');
        const data = await parentProgressService.getChildren();
        setChildren(data.children || []);

        // Use initialChildId if passed from ParentMessaging
        const initialChildId = location.state?.initialChildId;

        if (data.children && data.children.length > 0) {
          if (initialChildId) {
            const match = data.children.find(
              (c) => c.studentId === initialChildId || c.id === initialChildId
            );
            setSelectedChildId(
              match ? match.studentId : data.children[0].studentId
            );
          } else {
            setSelectedChildId(data.children[0].studentId);
          }
        }
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load linked children.'
        );
      } finally {
        setLoadingChildren(false);
      }
    };

    loadChildren();
  }, [location.state]);

  useEffect(() => {
    const loadCourses = async () => {
      if (!selectedChildId) {
        setCourses([]);
        return;
      }
      try {
        setLoadingCourses(true);
        setError('');
        const data = await parentProgressService.getChildCourses(
          selectedChildId,
          {
            academicYear: selectedYear || undefined,
            term: selectedTerm || undefined,
          }
        );
        setCourses(data.courses || []);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load child courses.'
        );
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, [selectedChildId, selectedYear, selectedTerm]);

  const handleCourseClick = (courseId) => {
    navigate(`/parent/children/${selectedChildId}/courses/${courseId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Child Academic Progress
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Linked Children
        </Typography>
        {loadingChildren ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : children.length === 0 ? (
          <Typography>No linked children found.</Typography>
        ) : (
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="child-select-label">Select Child</InputLabel>
            <Select
              labelId="child-select-label"
              value={selectedChildId}
              label="Select Child"
              onChange={(e) => setSelectedChildId(e.target.value)}
            >
              {children.map((child) => (
                <MenuItem key={child.studentId} value={child.studentId}>
                  {child.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Enrolled Courses
        </Typography>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {/* Academic Year input */}
          <TextField
            label="Academic Year"
            type="number"
            size="small"
            sx={{ minWidth: 160 }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            placeholder="e.g. 2025"
            InputProps={{ inputProps: { min: 2000, max: 2100 } }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="term-label">Term</InputLabel>
            <Select
              labelId="term-label"
              label="Term"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value="Fall">Fall</MenuItem>
              <MenuItem value="Spring">Spring</MenuItem>
              <MenuItem value="Summer">Summer</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loadingCourses ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : courses.length === 0 ? (
          <Typography>No courses found for this child.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Term</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.map((course) => (
                <TableRow
                  key={course.courseId}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleCourseClick(course.courseId)}
                >
                  <TableCell>{course.courseCode}</TableCell>
                  <TableCell>{course.courseName}</TableCell>
                  <TableCell>{course.academicYear}</TableCell>
                  <TableCell>{course.term}</TableCell>
                  <TableCell>{course.enrollmentStatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
};

export default ParentChildProgress;
