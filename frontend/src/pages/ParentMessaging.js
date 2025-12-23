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
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    teacher_id: '',
    student_id: '',
    course_id: '',
    subject: '',
    content: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild]);

  const fetchChildren = async () => {
    console.log("fetchChildren called");
    console.log("Current user:", user);
    console.log("User ID:", user?.id);
    console.log("User role:", user?.role);
    try {
      setLoading(true);
      setError('');
      console.log("Making API call to getParentChildren");

      const response = await messageService.getParentChildren();
      console.log('Full API Response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('Response data success:', response.data?.success);
      console.log('Response data message:', response.data?.message);
      const childrenData = response.data?.children || [];
      console.log('Parsed childrenData:', childrenData);
      console.log('ChildrenData length:', childrenData.length);
      setChildren(childrenData);

      // Auto-select first child if available
      if (childrenData.length > 0) {
        console.log("Setting selectedChild to first child:", childrenData[0]);
        setSelectedChild(childrenData[0]);
      } else {
        console.log("No children found, setting error");
        setError('No children found in your account. Please contact the administrator.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching children:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      setError(err.message || 'Failed to load children information');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      if (!selectedChild) return;

      // Fetch teachers for the selected child
      const teachersResponse = await messageService.getStudentTeachers(selectedChild.student_id);
      console.log('Teachers API Response:', teachersResponse);
      console.log('Teachers response data:', teachersResponse.data);
      console.log('Teachers response data.data:', teachersResponse.data?.data);
      console.log('Teachers response data.teachers:', teachersResponse.data?.teachers);
      console.log('Teachers response data.data?.teachers:', teachersResponse.data?.data?.teachers);
      setTeachers(teachersResponse.data?.data?.teachers || teachersResponse.data?.teachers || []);

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
      student_id: selectedChild?.student_id || '',
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

      // Ensure student_id is set to the selected child
      const messageData = {
        ...formData,
        student_id: selectedChild?.student_id
      };

      await messageService.sendMessage(messageData);
      
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

      {/* Child Selector */}
      {children.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Select Child:
          </Typography>
          <Grid container spacing={2}>
            {children.map((child) => (
              <Grid item xs={12} sm={6} md={4} key={child.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedChild?.id === child.id ? '2px solid' : '1px solid',
                    borderColor: selectedChild?.id === child.id ? 'primary.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 3
                    }
                  }}
                  onClick={() => setSelectedChild(child)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Person sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        {child.student_name || `${child.first_name} ${child.last_name}`}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {child.student_email || child.email}
                    </Typography>
                    {child.is_primary && (
                      <Chip label="Primary" size="small" color="primary" sx={{ mt: 1 }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {!selectedChild && children.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No children found in your account. Please contact the administrator to link your child's account.
        </Alert>
      )}

      {selectedChild && (
        <>
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
                  <ListItem 
                    alignItems="flex-start"
                    sx={{
                      bgcolor: message.message_type === 'received' ? 'action.hover' : 'transparent',
                      ml: message.parent_message_id ? 4 : 0,
                      borderLeft: message.parent_message_id ? '4px solid' : 'none',
                      borderColor: message.message_type === 'received' ? 'primary.main' : 'grey.400'
                    }}
                  >
                    <ListItemIcon>
                      <Email color={message.message_type === 'received' ? 'secondary' : 'primary'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {message.message_type === 'received' && (
                            <Chip
                              label="Reply from Teacher"
                              size="small"
                              color="secondary"
                              sx={{ mr: 1 }}
                            />
                          )}
                          <Typography variant="subtitle1" component="span">
                            {message.subject}
                          </Typography>
                          {message.message_type === 'sent' && (
                            <Chip
                              label={message.is_read ? 'Read' : 'Unread'}
                              size="small"
                              color={message.is_read ? 'success' : 'default'}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                            {message.message_type === 'sent' ? 'To:' : 'From:'} {message.teacher_name} ({message.course_name})
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
        </>
      )}
    </Container>
  );
};

export default ParentMessaging;
