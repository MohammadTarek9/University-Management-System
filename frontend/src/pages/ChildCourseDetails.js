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
  Button,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import parentProgressService from '../services/parentProgressService';

const ChildCourseDetails = () => {
  const { childId, courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [currentAverage, setCurrentAverage] = useState(null);
  const [passFail, setPassFail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await parentProgressService.getChildCourseDetails(
          childId,
          courseId
        );
        setCourse(data.course);
        setAssessments(data.assessments || []);
        setCurrentAverage(data.currentAverage);
        setPassFail(data.passFail);
      } catch (err) {
        
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load course details.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [childId, courseId]);

  const handleBack = () => {
    navigate('/parent/child-progress');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Child Course Details</Typography>
        <Button variant="outlined" onClick={handleBack}>
          Back to Progress
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : course ? (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6">
              {course.courseCode} – {course.courseName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Year {course.academicYear}, {course.term} – Credits:{' '}
              {course.credits ?? '-'}
            </Typography>
            {currentAverage !== null && (
              <Typography sx={{ mt: 1 }}>
                Current average: {currentAverage.toFixed(1)}% ({passFail})
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Assessments
            </Typography>
            {assessments.length === 0 ? (
              <Typography>
                No assessments or grades published yet for this course.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell align="right">Max</TableCell>
                    <TableCell align="right">Published</TableCell>
                    <TableCell>Feedback</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assessments.map((a) => (
                    <TableRow key={a.assessmentId}>
                      <TableCell>{a.title}</TableCell>
                      <TableCell>{a.type}</TableCell>
                      <TableCell>
                        {a.dueDate
                          ? new Date(a.dueDate).toLocaleString()
                          : '—'}
                      </TableCell>
                      <TableCell align="right">
                        {a.score !== null && a.score !== undefined
                          ? a.score
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {a.maxScore !== null && a.maxScore !== undefined
                          ? a.maxScore
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {a.isPublished ? 'Yes' : 'No'}
                      </TableCell>
                      <TableCell>
                        {a.teacherComment && a.teacherComment.trim()
                          ? a.teacherComment
                          : 'No feedback yet'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </>
      ) : (
        <Typography>No course information available.</Typography>
      )}
    </Container>
  );
};

export default ChildCourseDetails;
