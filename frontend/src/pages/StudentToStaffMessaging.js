// pages/StudentStaffMessaging.js
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

const StudentStaffMessaging = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    staff_id: '',
    subject: '',
    content: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // In StudentToStaffMessaging.js - Update fetchData function
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const staffResponse = await messageService.getAvailableStaff();
      
      // Handle different response structures
      let staffData = [];
      if (staffResponse.data?.data?.teachers) {
        staffData = staffResponse.data.data.teachers;
      } else if (staffResponse.data?.teachers) {
        staffData = staffResponse.data.teachers;
      } else if (staffResponse.teachers) {
        staffData = staffResponse.teachers;
      }
      
      //console.log('Parsed staff data:', staffData);
      setStaff(staffData);

      // Fetch conversations
      //console.log('Fetching conversations...');
      const conversationsResponse = await messageService.getStudentConversations();
      //console.log('Conversations response:', conversationsResponse);
      
      let conversationsData = [];
      if (conversationsResponse.data?.data?.conversations) {
        conversationsData = conversationsResponse.data.data.conversations;
      } else if (conversationsResponse.data?.conversations) {
        conversationsData = conversationsResponse.data.conversations;
      } else if (conversationsResponse.conversations) {
        conversationsData = conversationsResponse.conversations;
      }
      
      //console.log('Parsed conversations data:', conversationsData);
      setConversations(conversationsData);

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
      staff_id: '',
      subject: '',
      content: ''
    });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.staff_id) {
      errors.staff_id = 'Please select a staff member';
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

      await messageService.sendStudentMessage(formData);
      
      setSuccess('Message sent successfully!');
      handleCloseDialog();
      
      // Refresh conversations
      await fetchData();
      
      // Switch to conversations tab
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

  // Group conversations by staff member
  const groupedConversations = conversations.reduce((groups, message) => {
    const staffId = message.message_type === 'sent' ? message.teacher_id : message.parent_id;
    const staffName = message.message_type === 'sent' ? message.teacher_name : message.parent_name;
    
    if (!groups[staffId]) {
      groups[staffId] = {
        staffId,
        staffName,
        staffEmail: message.message_type === 'sent' ? message.teacher_email : message.parent_email,
        messages: []
      };
    }
    
    groups[staffId].messages.push(message);
    
    return groups;
  }, {});

  const conversationList = Object.values(groupedConversations);

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
          Student-Staff Communication
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ask questions, schedule meetings, and communicate with your professors and staff.
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
          disabled={staff.length === 0}
        >
          Send New Message
        </Button>
        {staff.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            No staff available. You must be enrolled in courses first.
          </Typography>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label={`Available Staff (${staff.length})`} />
          <Tab label={`Conversations (${conversationList.length})`} />
        </Tabs>
      </Paper>

      {/* Staff List Tab */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {staff.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No Staff Found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  You must be enrolled in courses to see available staff members.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            staff.map((staffMember) => (
              <Grid item xs={12} md={6} key={staffMember.teacher_id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Person sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        {staffMember.teacher_name}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <School sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {staffMember.course_name} ({staffMember.course_code})
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Email sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {staffMember.teacher_email}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Send />}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          staff_id: staffMember.teacher_id
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

      {/* Conversations Tab */}
      {selectedTab === 1 && (
        <Paper>
          {conversations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Email sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Conversations Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Send your first message to a staff member using the button above.
              </Typography>
            </Box>
          ) : (
            <List>
              {conversations.map((message, index) => (
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
                              label="Reply from Staff"
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
                            {message.message_type === 'sent' ? 'To:' : 'From:'} {message.teacher_name} 
                            {message.course_name && ` (${message.course_name})`}
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
                  {index < conversations.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Send Message Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Send Message to Staff</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Select Staff Member"
              name="staff_id"
              value={formData.staff_id}
              onChange={handleInputChange}
              error={!!formErrors.staff_id}
              helperText={formErrors.staff_id}
              required
              fullWidth
            >
              {staff.map((staffMember) => (
                <MenuItem key={staffMember.teacher_id} value={staffMember.teacher_id}>
                  {staffMember.teacher_name} - {staffMember.course_name}
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
              helperText={formErrors.content || 'Enter your message to the staff member'}
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

export default StudentStaffMessaging;