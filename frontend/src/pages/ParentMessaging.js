// pages/ParentMessaging.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Tab,
  Tabs,
  Paper
} from '@mui/material';
import {
  Send,
  Email,
  Person,
  School,
  AccessTime,
  Message as MessageIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import messageService from '../services/messageService';
import { format } from 'date-fns';

const ParentMessaging = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    teacher_id: '',
    student_id: user?.id || '', // Assuming parent user ID is same as student for now
    course_id: '',
    subject: '',
    content: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch teachers for the student
      // TODO: Replace with actual child/student ID when parent-child relationship is implemented
      const studentId = user?.id;
      
      const teachersResponse = await messageService.getStudentTeachers(studentId);
      setTeachers(teachersResponse.data?.teachers || []);

      // Fetch sent messages
      const messagesResponse = await messageService.getSentMessages();
      setSentMessages(messagesResponse.data?.messages || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setFormErrors({});
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      teacher_id: '',
      student_id: user?.id || '',
      course_id: '',
      subject: '',
      content: ''
    });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTeacherSelect = (e) => {
    const teacherId = e.target.value;
    const teacher = teachers.find(t => t.teacher_id === teacherId);
    
    setFormData(prev => ({
      ...prev,
      teacher_id: teacherId,
      course_id: teacher?.course_id || ''
    }));
    
    if (formErrors.teacher_id) {
      setFormErrors(prev => ({ ...prev, teacher_id: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.teacher_id) {
      errors.teacher_id = 'Please select a teacher';
    }
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    if (!formData.content.trim()) {
      errors.content = 'Message content is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendMessage = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSending(true);
      setError('');

      await messageService.sendMessage(formData);
      
      setSuccess('Message sent successfully!');
      handleCloseDialog();
      
      // Refresh sent messages
      const messagesResponse = await messageService.getSentMessages();
      setSentMessages(messagesResponse.data?.messages || []);
      
      // Switch to sent messages tab
      setSelectedTab(1);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <MessageIcon sx={{ mr: 1, fontSize: 36 }} />
          Parent-Teacher Communication
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Communicate with your child's teachers about academic progress and concerns.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* New Message Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={handleOpenDialog}
          disabled={teachers.length === 0}
        >
          Send New Message
        </Button>
        {teachers.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            No teachers available. Your child must be enrolled in courses first.
          </Typography>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label={`Teachers (${teachers.length})`} />
          <Tab label={`Sent Messages (${sentMessages.length})`} />
        </Tabs>
      </Paper>

      {/* Teachers List Tab */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {teachers.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No Teachers Found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Your child must be enrolled in courses to see their teachers.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            teachers.map((teacher) => (
              <Grid item xs={12} md={6} key={`${teacher.teacher_id}-${teacher.course_id}`}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Person sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        {teacher.teacher_name}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <School sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {teacher.course_name} ({teacher.course_code})
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Email sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {teacher.teacher_email}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Send />}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          teacher_id: teacher.teacher_id,
                          course_id: teacher.course_id
                        }));
                        handleOpenDialog();
                      }}
                    >
                      Send Message
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Sent Messages Tab */}
      {selectedTab === 1 && (
        <Paper>
          {sentMessages.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Email sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Messages Sent Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Send your first message to a teacher using the button above.
              </Typography>
            </Box>
          ) : (
            <List>
              {sentMessages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      <Email color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" component="span">
                            {message.subject}
                          </Typography>
                          <Chip
                            label={message.is_read ? 'Read' : 'Unread'}
                            size="small"
                            color={message.is_read ? 'success' : 'default'}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                            To: {message.teacher_name} ({message.course_name})
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {message.content.substring(0, 100)}
                            {message.content.length > 100 && '...'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(message.created_at)}
                            </Typography>
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                  {index < sentMessages.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Send Message Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Send Message to Teacher</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Select Teacher"
              name="teacher_id"
              value={formData.teacher_id}
              onChange={handleTeacherSelect}
              error={!!formErrors.teacher_id}
              helperText={formErrors.teacher_id}
              required
              fullWidth
            >
              {teachers.map((teacher) => (
                <MenuItem key={`${teacher.teacher_id}-${teacher.course_id}`} value={teacher.teacher_id}>
                  {teacher.teacher_name} - {teacher.course_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              error={!!formErrors.subject}
              helperText={formErrors.subject}
              required
              fullWidth
            />

            <TextField
              label="Message"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              error={!!formErrors.content}
              helperText={formErrors.content || 'Enter your message to the teacher'}
              required
              fullWidth
              multiline
              rows={6}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSendMessage}
            variant="contained"
            startIcon={sending ? <CircularProgress size={20} /> : <Send />}
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ParentMessaging;
