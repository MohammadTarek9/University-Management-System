import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  LinearProgress,
  Grid,
  Divider,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Switch
} from '@mui/material';
import {
  Assessment,
  Add,
  Edit,
  Delete,
  Visibility,
  CloudUpload,
  Schedule,
  CheckCircle,
  Cancel,
  Timer,
  QuestionAnswer,
  Send,
  Grade,
  Person
} from '@mui/icons-material';
import axios from 'axios';

const AssessmentsManagement = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submission, setSubmission] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isProfessor = ['professor', 'ta', 'admin'].includes(user?.role);
  const isStudent = user?.role === 'student';

  // New assessment form state
  const [newAssessment, setNewAssessment] = useState({
    courseId: '',
    title: '',
    description: '',
    assessmentType: 'quiz',
    totalPoints: 100,
    dueDate: '',
    availableFrom: '',
    availableUntil: '',
    durationMinutes: 60,
    allowLateSubmission: false,
    latePenaltyPercent: 10,
    maxAttempts: 1,
    showCorrectAnswers: false,
    shuffleQuestions: false,
    isPublished: false,
    instructions: ''
  });

  // Questions state
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    questionType: 'multiple_choice',
    points: 1,
    correctAnswer: '',
    options: ['', '', '', '']
  });

  // Student submission state
  const [answers, setAnswers] = useState({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // Edit assessment state
  const [isEditing, setIsEditing] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);

  // Grading state
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({ score: '', feedback: '' });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAssessments();
    }
  }, [selectedCourse]);

  // Timer for timed assessments
  useEffect(() => {
    let interval;
    if (submitDialogOpen && startTime) {
      interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000 / 60));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [submitDialogOpen, startTime]);

  const fetchCourses = async () => {
  try {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = userData.role;
    const userId = userData.id;
    
    let coursesData = [];
  
    if (userRole === 'professor' || userRole === 'ta') {
      // Faculty: Get courses they're teaching
      const response = await axios.get('http://localhost:5000/api/curriculum/courses', {
        headers: { Authorization: `Bearer ${token}` },
        params: { instructorId: userId }
      });
      coursesData = response.data?.data?.courses || [];
    } else if (userRole === 'student') {
      // Students: Get their enrolled courses
      const response = await axios.get('http://localhost:5000/api/enrollments/my-enrollments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Extract courses from enrollments and merge with subject info
      const enrollments = response.data?.data?.enrollments || [];
      coursesData = enrollments
        .filter(e => e.status === 'enrolled') // Only show enrolled courses
        .map(e => {
          // Merge course and subject data for consistent structure
          if (!e.course) return null;
          return {
            ...e.course,
            subject: e.subject, // Add subject details
            // Also add top-level properties for compatibility
            code: e.subject?.code,
            name: e.subject?.name
          };
        })
        .filter(c => c); // Remove nulls
    } else {
      // Admin/Staff: Get all courses
      const response = await axios.get('http://localhost:5000/api/curriculum/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      coursesData = response.data?.data?.courses || [];
    }

    setCourses(Array.isArray(coursesData) ? coursesData : []);
    
    // Set first course as selected
    if (coursesData.length > 0) {
      setSelectedCourse(coursesData[0].id);
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    setError('Failed to load courses');
    setCourses([]);
  }
};

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/curriculum/assessments/course/${selectedCourse}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssessments(response.data.data?.assessments || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setError('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!newAssessment.title || !newAssessment.dueDate) {
      setError('Title and due date are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const assessmentData = {
        ...newAssessment,
        courseId: selectedCourse,
        questions: assessmentQuestions,
        // Convert datetime-local to ISO8601
        dueDate: newAssessment.dueDate ? new Date(newAssessment.dueDate).toISOString() : '',
        availableFrom: newAssessment.availableFrom ? new Date(newAssessment.availableFrom).toISOString() : null,
        availableUntil: newAssessment.availableUntil ? new Date(newAssessment.availableUntil).toISOString() : null
      };

      console.log('Sending assessment data:', assessmentData);

      await axios.post(
        'http://localhost:5000/api/curriculum/assessments',
        assessmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Assessment created successfully!');
      setCreateDialogOpen(false);
      resetAssessmentForm();
      fetchAssessments();
    } catch (error) {
      console.error('Create error:', error);
      console.error('Error details:', error.response?.data);
      console.error('Validation errors:', error.response?.data?.errors);
      setError(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to create assessment');
    }
  };

  const handleEditAssessment = async (assessment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/curriculum/assessments/${assessment.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const assessmentData = response.data.data.assessment;
      const questions = response.data.data.questions || [];

      // Populate form with existing data
      setNewAssessment({
        courseId: assessmentData.courseId,
        title: assessmentData.title,
        description: assessmentData.description || '',
        assessmentType: assessmentData.assessmentType,
        totalPoints: assessmentData.totalPoints || 100,
        dueDate: assessmentData.dueDate ? new Date(assessmentData.dueDate).toISOString().slice(0, 16) : '',
        availableFrom: assessmentData.availableFrom ? new Date(assessmentData.availableFrom).toISOString().slice(0, 16) : '',
        availableUntil: assessmentData.availableUntil ? new Date(assessmentData.availableUntil).toISOString().slice(0, 16) : '',
        durationMinutes: assessmentData.durationMinutes || 60,
        allowLateSubmission: assessmentData.allowLateSubmission || false,
        latePenaltyPercent: assessmentData.latePenaltyPercent || 10,
        maxAttempts: assessmentData.maxAttempts || 1,
        showCorrectAnswers: assessmentData.showCorrectAnswers || false,
        shuffleQuestions: assessmentData.shuffleQuestions || false,
        isPublished: assessmentData.isPublished || false,
        instructions: assessmentData.instructions || ''
      });

      setAssessmentQuestions(questions);
      setSelectedCourse(assessmentData.courseId);
      setIsEditing(true);
      setEditingAssessment(assessmentData);
      setCreateDialogOpen(true);
    } catch (error) {
      console.error('Edit error:', error);
      setError('Failed to load assessment for editing');
    }
  };

  const handleUpdateAssessment = async () => {
    if (!newAssessment.title || !newAssessment.dueDate) {
      setError('Title and due date are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const assessmentData = {
        ...newAssessment,
        courseId: selectedCourse,
        questions: assessmentQuestions,
        // Convert datetime-local to ISO8601
        dueDate: newAssessment.dueDate ? new Date(newAssessment.dueDate).toISOString() : '',
        availableFrom: newAssessment.availableFrom ? new Date(newAssessment.availableFrom).toISOString() : null,
        availableUntil: newAssessment.availableUntil ? new Date(newAssessment.availableUntil).toISOString() : null
      };

      console.log('Updating assessment data:', assessmentData);

      await axios.put(
        `http://localhost:5000/api/curriculum/assessments/${editingAssessment.id}`,
        assessmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Assessment updated successfully!');
      setCreateDialogOpen(false);
      resetAssessmentForm();
      fetchAssessments();
    } catch (error) {
      console.error('Update error:', error);
      console.error('Error details:', error.response?.data);
      console.error('Validation errors:', error.response?.data?.errors);
      setError(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to update assessment');
    }
  };

  const handleViewAssessment = async (assessment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/curriculum/assessments/${assessment.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedAssessment(response.data.data.assessment);
      setQuestions(response.data.data.questions || []);

      if (isStudent) {
        // Check if student has already submitted
        const submissionResponse = await axios.get(
          `http://localhost:5000/api/curriculum/assessments/${assessment.id}/my-submission`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubmission(submissionResponse.data.data?.submission || null);
      }

      setViewDialogOpen(true);
    } catch (error) {
      console.error('View error:', error);
      setError('Failed to load assessment details');
    }
  };

  const handleStartAssessment = () => {
    setStartTime(Date.now());
    setAnswers({});
    setViewDialogOpen(false);
    setSubmitDialogOpen(true);
  };

  const handleSubmitAssessment = async () => {
    try {
      const token = localStorage.getItem('token');
      const submissionData = {
        answers: Object.entries(answers).map(([questionId, answerText]) => ({
          questionId: parseInt(questionId),
          answerText
        })),
        timeSpentMinutes: timeSpent
      };

      await axios.post(
        `http://localhost:5000/api/curriculum/assessments/${selectedAssessment.id}/submit`,
        submissionData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Assessment submitted successfully!');
      setSubmitDialogOpen(false);
      fetchAssessments();
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.response?.data?.message || 'Failed to submit assessment');
    }
  };

  const handleDeleteAssessment = async (assessmentId) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/curriculum/assessments/${assessmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Assessment deleted successfully');
      fetchAssessments();
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.response?.data?.message || 'Failed to delete assessment');
    }
  };

  const handleViewSubmissions = async (assessment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/curriculum/assessments/${assessment.id}/submissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubmissions(response.data.data?.submissions || []);
      setSelectedAssessment(assessment);
      setGradingDialogOpen(true);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to load submissions');
    }
  };

  const handleViewSubmissionDetails = async (submission) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/curriculum/assessments/${selectedAssessment.id}/submissions/${submission.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedSubmission(response.data.data.submission);
      setGradeData({ 
        score: response.data.data.submission.score || '', 
        feedback: response.data.data.submission.feedback || '' 
      });
    } catch (error) {
      console.error('Error fetching submission details:', error);
      setError('Failed to load submission details');
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    const score = parseFloat(gradeData.score);
    
    // Validation
    if (gradeData.score !== '' && (isNaN(score) || score < 0)) {
      setError('Score must be a positive number');
      return;
    }
    
    if (gradeData.score !== '' && score > selectedAssessment.totalPoints) {
      setError(`Score cannot exceed ${selectedAssessment.totalPoints} points`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/curriculum/assessments/${selectedAssessment.id}/submissions/${selectedSubmission.id}/grade`,
        {
          score: gradeData.score !== '' ? score : undefined,
          feedback: gradeData.feedback || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Grade saved successfully!');
      setSelectedSubmission(null);
      setGradeData({ score: '', feedback: '' });
      
      // Refresh submissions
      handleViewSubmissions(selectedAssessment);
    } catch (error) {
      console.error('Grading error:', error);
      setError(error.response?.data?.message || 'Failed to save grade');
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.questionText) {
      setError('Question text is required');
      return;
    }

    setAssessmentQuestions([...assessmentQuestions, { ...currentQuestion }]);
    setCurrentQuestion({
      questionText: '',
      questionType: 'multiple_choice',
      points: 1,
      correctAnswer: '',
      options: ['', '', '', '']
    });
  };

  const removeQuestion = (index) => {
    setAssessmentQuestions(assessmentQuestions.filter((_, i) => i !== index));
  };

  const resetAssessmentForm = () => {
    setNewAssessment({
      courseId: '',
      title: '',
      description: '',
      assessmentType: 'quiz',
      totalPoints: 100,
      dueDate: '',
      availableFrom: '',
      availableUntil: '',
      durationMinutes: 60,
      allowLateSubmission: false,
      latePenaltyPercent: 10,
      maxAttempts: 1,
      showCorrectAnswers: false,
      shuffleQuestions: false,
      isPublished: false,
      instructions: ''
    });
    setAssessmentQuestions([]);
    setIsEditing(false);
    setEditingAssessment(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusChip = (assessment) => {
    const now = new Date();
    const dueDate = new Date(assessment.dueDate);
    const availableFrom = assessment.availableFrom ? new Date(assessment.availableFrom) : null;

    if (!assessment.isPublished) {
      return <Chip label="Draft" color="default" size="small" />;
    }
    if (availableFrom && now < availableFrom) {
      return <Chip label="Scheduled" color="info" size="small" />;
    }
    if (now > dueDate) {
      return <Chip label="Closed" color="error" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Assessment sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Assessments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isProfessor ? 'Create and manage course assessments' : 'View and complete your assessments'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Course Selection */}
                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Select Course</InputLabel>
                    <Select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      label="Select Course"
                    >
                      <MenuItem value="">
                        <em>Select a course</em>
                      </MenuItem>
                      {courses.map((course) => (
                        <MenuItem key={course.id} value={course.id}>
                          {/* Handle different data structures: code/name (subjects), subject.code/subject.name (courses), subjectCode/subjectName */}
                          {course.code || course.subjectCode || course.subject?.code || 'N/A'} - {course.name || course.subjectName || course.subject?.name || 'N/A'}
                          {course.semester && course.year && ` (${course.semester} ${course.year})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

        {selectedCourse && (
          <>
            {isProfessor && (
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Assessment
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Assessments List */}
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2 }}>Loading assessments...</Typography>
              </Box>
            ) : assessments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.100', borderRadius: 2 }}>
                <Typography variant="h6" color="text.secondary">
                  No assessments available
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {assessments.map((assessment) => (
                  <Grid item xs={12} md={6} key={assessment.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6">{assessment.title}</Typography>
                          {getStatusChip(assessment)}
                        </Box>

                        {assessment.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {assessment.description}
                          </Typography>
                        )}

                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Chip
                              icon={<QuestionAnswer />}
                              label={assessment.assessmentType}
                              size="small"
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <Chip
                              label={`${assessment.totalPoints} pts`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" display="block">
                              <Timer fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              Due: {formatDate(assessment.dueDate)}
                            </Typography>
                          </Grid>
                          {assessment.durationMinutes && (
                            <Grid item xs={12}>
                              <Typography variant="caption" display="block">
                                Duration: {assessment.durationMinutes} minutes
                              </Typography>
                            </Grid>
                          )}
                          <Grid item xs={12}>
                            <Typography variant="caption" display="block">
                              Max Attempts: {assessment.maxAttempts}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>

                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleViewAssessment(assessment)}
                        >
                          View
                        </Button>
                        {isProfessor && (
                          <>
                            <Button
                              size="small"
                              startIcon={<Edit />}
                              color="primary"
                              onClick={() => handleEditAssessment(assessment)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              startIcon={<Assessment />}
                              color="secondary"
                              onClick={() => handleViewSubmissions(assessment)}
                            >
                              Submissions
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteAssessment(assessment.id)}
                            >
                              <Delete />
                            </IconButton>
                          </>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Paper>

      {/* Create Assessment Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEditing ? 'Edit Assessment' : 'Create New Assessment'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={newAssessment.title}
                onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newAssessment.description}
                onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Assessment Type</InputLabel>
                <Select
                  value={newAssessment.assessmentType}
                  label="Assessment Type"
                  onChange={(e) => setNewAssessment({ ...newAssessment, assessmentType: e.target.value })}
                >
                  <MenuItem value="quiz">Quiz</MenuItem>
                  <MenuItem value="assignment">Assignment</MenuItem>
                  <MenuItem value="exam">Exam</MenuItem>
                  <MenuItem value="project">Project</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Total Points"
                type="number"
                value={newAssessment.totalPoints}
                onChange={(e) => setNewAssessment({ ...newAssessment, totalPoints: parseInt(e.target.value) })}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="datetime-local"
                value={newAssessment.dueDate}
                onChange={(e) => setNewAssessment({ ...newAssessment, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={newAssessment.durationMinutes}
                onChange={(e) => setNewAssessment({ ...newAssessment, durationMinutes: parseInt(e.target.value) })}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Available From"
                type="datetime-local"
                value={newAssessment.availableFrom}
                onChange={(e) => setNewAssessment({ ...newAssessment, availableFrom: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Available Until"
                type="datetime-local"
                value={newAssessment.availableUntil}
                onChange={(e) => setNewAssessment({ ...newAssessment, availableUntil: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Attempts"
                type="number"
                value={newAssessment.maxAttempts}
                onChange={(e) => setNewAssessment({ ...newAssessment, maxAttempts: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Late Penalty %"
                type="number"
                value={newAssessment.latePenaltyPercent}
                onChange={(e) => setNewAssessment({ ...newAssessment, latePenaltyPercent: parseInt(e.target.value) })}
                inputProps={{ min: 0, max: 100 }}
                disabled={!newAssessment.allowLateSubmission}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newAssessment.allowLateSubmission}
                    onChange={(e) => setNewAssessment({ ...newAssessment, allowLateSubmission: e.target.checked })}
                  />
                }
                label="Allow Late Submission"
              />
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newAssessment.showCorrectAnswers}
                    onChange={(e) => setNewAssessment({ ...newAssessment, showCorrectAnswers: e.target.checked })}
                  />
                }
                label="Show Correct Answers"
              />
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newAssessment.shuffleQuestions}
                    onChange={(e) => setNewAssessment({ ...newAssessment, shuffleQuestions: e.target.checked })}
                  />
                }
                label="Shuffle Questions"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newAssessment.isPublished}
                    onChange={(e) => setNewAssessment({ ...newAssessment, isPublished: e.target.checked })}
                  />
                }
                label="Publish Assessment"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                value={newAssessment.instructions}
                onChange={(e) => setNewAssessment({ ...newAssessment, instructions: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="h6">Questions</Typography>
              </Divider>
            </Grid>

            {/* Add Question Form */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question Text"
                value={currentQuestion.questionText}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={currentQuestion.questionType}
                  label="Question Type"
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionType: e.target.value })}
                >
                  <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                  <MenuItem value="true_false">True/False</MenuItem>
                  <MenuItem value="short_answer">Short Answer</MenuItem>
                  <MenuItem value="essay">Essay</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Points"
                type="number"
                value={currentQuestion.points}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) })}
                inputProps={{ min: 1 }}
              />
            </Grid>

            {currentQuestion.questionType === 'multiple_choice' && (
              <>
                {currentQuestion.options.map((option, index) => (
                  <Grid item xs={12} key={index}>
                    <TextField
                      fullWidth
                      label={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...currentQuestion.options];
                        newOptions[index] = e.target.value;
                        setCurrentQuestion({ ...currentQuestion, options: newOptions });
                      }}
                    />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Correct Answer (option number)"
                    type="number"
                    value={currentQuestion.correctAnswer}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                    inputProps={{ min: 1, max: 4 }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={addQuestion}
                fullWidth
              >
                Add Question
              </Button>
            </Grid>

            {/* Questions List */}
            {assessmentQuestions.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Added Questions ({assessmentQuestions.length})
                </Typography>
                {assessmentQuestions.map((q, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">
                        {index + 1}. {q.questionText} ({q.points} pts)
                      </Typography>
                      <IconButton size="small" onClick={() => removeQuestion(index)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={isEditing ? handleUpdateAssessment : handleCreateAssessment} variant="contained">
            {isEditing ? 'Update Assessment' : 'Create Assessment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Assessment Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedAssessment?.title}
          {selectedAssessment && getStatusChip(selectedAssessment)}
        </DialogTitle>
        <DialogContent>
          {selectedAssessment && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedAssessment.description}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Type: {selectedAssessment.assessmentType}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Points: {selectedAssessment.totalPoints}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Due: {formatDate(selectedAssessment.dueDate)}
                  </Typography>
                </Grid>
                {selectedAssessment.durationMinutes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Duration: {selectedAssessment.durationMinutes} minutes
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {selectedAssessment.instructions && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Instructions:
                  </Typography>
                  <Typography variant="body2">
                    {selectedAssessment.instructions}
                  </Typography>
                </Box>
              )}

              {questions.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Questions ({questions.length})
                  </Typography>
                  {questions.map((q, index) => {
                    const opts = (() => {
                      try {
                        if (!q.options) return [];
                        if (typeof q.options === 'string') return JSON.parse(q.options);
                        if (Array.isArray(q.options)) return q.options;
                        return [];
                      } catch (e) {
                        console.warn('Failed to parse question options', e, q.options);
                        return [];
                      }
                    })();

                    return (
                      <Paper key={q.id ?? index} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {index + 1}. {q.questionText} ({q.points} pts)
                        </Typography>
                        {opts.length > 0 && (
                          <Box sx={{ mt: 1, ml: 2 }}>
                            {opts.map((option, i) => (
                              <Typography key={i} variant="body2">
                                {String.fromCharCode(65 + i)}. {option}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              )}

              {isStudent && submission && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="info">
                    You have already submitted this assessment.
                    {submission.score !== null && submission.score !== undefined && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Score:</strong> {submission.score} / {selectedAssessment.totalPoints}
                      </Typography>
                    )}
                  </Alert>
                  
                  {submission.feedback && (
                    <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        <strong>Instructor Feedback:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {submission.feedback}
                      </Typography>
                      {submission.gradedAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Graded on: {formatDate(submission.gradedAt)}
                        </Typography>
                      )}
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {isStudent && !submission && selectedAssessment?.isPublished && (
            <Button
              onClick={handleStartAssessment}
              variant="contained"
              startIcon={<Send />}
            >
              Start Assessment
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Submit Assessment Dialog */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => {}}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{selectedAssessment?.title}</Typography>
            {selectedAssessment?.durationMinutes && (
              <Chip
                icon={<Timer />}
                label={`${timeSpent}/${selectedAssessment.durationMinutes} min`}
                color={timeSpent > selectedAssessment.durationMinutes ? 'error' : 'primary'}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {questions.map((q, index) => {
            const opts = (() => {
              try {
                if (!q.options) return [];
                if (typeof q.options === 'string') return JSON.parse(q.options);
                if (Array.isArray(q.options)) return q.options;
                return [];
              } catch (e) {
                console.warn('Failed to parse question options', e, q.options);
                return [];
              }
            })();

            return (
              <Paper key={q.id ?? index} sx={{ p: 2, mb: 2 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  {index + 1}. {q.questionText} ({q.points} pts)
                </Typography>

                {q.questionType === 'multiple_choice' && opts.length > 0 && (
                  <RadioGroup
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  >
                    {opts.map((option, i) => (
                      <FormControlLabel
                        key={i}
                        value={option}
                        control={<Radio />}
                        label={`${String.fromCharCode(65 + i)}. ${option}`}
                      />
                    ))}
                  </RadioGroup>
                )}

                {q.questionType === 'true_false' && (
                  <RadioGroup
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  >
                    <FormControlLabel value="true" control={<Radio />} label="True" />
                    <FormControlLabel value="false" control={<Radio />} label="False" />
                  </RadioGroup>
                )}

                {(q.questionType === 'short_answer' || q.questionType === 'essay') && (
                  <TextField
                    fullWidth
                    multiline
                    rows={q.questionType === 'essay' ? 6 : 2}
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Type your answer here..."
                    sx={{ mt: 1 }}
                  />
                )}
              </Paper>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel? Your progress will be lost.')) {
                setSubmitDialogOpen(false);
                setAnswers({});
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitAssessment}
            variant="contained"
            startIcon={<Send />}
            disabled={Object.keys(answers).length === 0}
          >
            Submit Assessment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Grading Dialog */}
      <Dialog
        open={gradingDialogOpen}
        onClose={() => {
          setGradingDialogOpen(false);
          setSelectedSubmission(null);
          setGradeData({ score: '', feedback: '' });
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Student Submissions - {selectedAssessment?.title}
          <Typography variant="caption" display="block" color="text.secondary">
            Total Points: {selectedAssessment?.totalPoints}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {submissions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No submissions yet
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ mr: 1, color: 'text.secondary' }} />
                          {sub.studentName}
                        </Box>
                      </TableCell>
                      <TableCell>{sub.studentEmail}</TableCell>
                      <TableCell>
                        {formatDate(sub.submissionDate)}
                        {sub.isLate && (
                          <Chip label="Late" size="small" color="warning" sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sub.status}
                          size="small"
                          color={sub.status === 'graded' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {sub.score !== null && sub.score !== undefined
                          ? `${sub.score} / ${selectedAssessment?.totalPoints}`
                          : 'Not graded'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<Grade />}
                          onClick={() => handleViewSubmissionDetails(sub)}
                        >
                          Grade
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Grade Form */}
          {selectedSubmission && (
            <Paper sx={{ mt: 3, p: 3, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                Grade Submission - {selectedSubmission.studentName}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {/* Display Student Answers */}
              {selectedSubmission.questions && selectedSubmission.questions.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Student Answers
                  </Typography>
                  {selectedSubmission.questions.map((question, index) => {
                    const options = (() => {
                      try {
                        if (!question.options) return [];
                        if (typeof question.options === 'string') return JSON.parse(question.options);
                        if (Array.isArray(question.options)) return question.options;
                        return [];
                      } catch (e) {
                        console.warn('Failed to parse question options', e, question.options);
                        return [];
                      }
                    })();

                    return (
                      <Paper key={question.id || index} sx={{ p: 2, mb: 2, bgcolor: 'white', border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="body1" fontWeight="bold" gutterBottom>
                          Q{index + 1}. {question.questionText} ({question.points} pts)
                        </Typography>
                        
                        {question.questionType === 'multiple_choice' && options.length > 0 && (
                          <Box sx={{ mb: 1, ml: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Options:
                            </Typography>
                            {options.map((option, i) => (
                              <Typography key={i} variant="body2" sx={{ ml: 1 }}>
                                {String.fromCharCode(65 + i)}. {option}
                              </Typography>
                            ))}
                          </Box>
                        )}

                        <Typography variant="body2" color="success.main" sx={{ mb: 1, ml: 2 }}>
                          <strong>Correct Answer:</strong> {question.correctAnswer}
                        </Typography>

                        <Divider sx={{ my: 1 }} />

                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          Student's Answer:
                        </Typography>
                        
                        {question.studentAnswer ? (
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="body1" sx={{ 
                              bgcolor: question.studentAnswer.isCorrect ? 'success.light' : 'error.light',
                              p: 1.5, 
                              borderRadius: 1,
                              color: 'white',
                              fontWeight: 'medium'
                            }}>
                              {question.studentAnswer.answerText || 'No answer provided'}
                            </Typography>
                            {question.studentAnswer.pointsEarned !== null && question.studentAnswer.pointsEarned !== undefined && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                Points earned: {question.studentAnswer.pointsEarned} / {question.points}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', ml: 2 }}>
                            No answer submitted
                          </Typography>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              )}
              
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Grade & Feedback
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Score"
                    type="number"
                    value={gradeData.score}
                    onChange={(e) => setGradeData({ ...gradeData, score: e.target.value })}
                    inputProps={{ 
                      min: 0, 
                      max: selectedAssessment?.totalPoints,
                      step: 0.5 
                    }}
                    helperText={`Out of ${selectedAssessment?.totalPoints} points`}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Feedback"
                    value={gradeData.feedback}
                    onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                    placeholder="Provide feedback to the student..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleGradeSubmission}
                      disabled={gradeData.score === '' && gradeData.feedback === ''}
                    >
                      Save Grade
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedSubmission(null);
                        setGradeData({ score: '', feedback: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setGradingDialogOpen(false);
            setSelectedSubmission(null);
            setGradeData({ score: '', feedback: '' });
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AssessmentsManagement;