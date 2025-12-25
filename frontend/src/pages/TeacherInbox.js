// pages/TeacherInbox.js
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Badge,
  Paper
} from '@mui/material';
import {
  Email,
  Reply as ReplyIcon,
  MarkEmailRead,
  MarkEmailUnread,
  Person,
  School,
  AccessTime,
  Send,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import messageService from '../services/messageService';
import { format } from 'date-fns';

const TeacherInbox = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user && ['professor', 'ta'].includes(user.role)) {
      fetchMessages();
      fetchUnreadCount();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await messageService.getReceivedMessages();
      setMessages(response.data?.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await messageService.getUnreadCount();
      setUnreadCount(response.data?.count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    
    // Mark as read if unread
    if (!message.is_read) {
      try {
        await messageService.markAsRead(message.id);
        // Update local state
        setMessages(messages.map(m => 
          m.id === message.id ? { ...m, is_read: true } : m
        ));
        fetchUnreadCount();
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    }
  };

  const handleReplyClick = (message) => {
    setSelectedMessage(message);
    setReplyContent('');
    setReplyDialogOpen(true);
  };

  // In TeacherInbox.js, update the reply handling to check message type:

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      setError('Reply content cannot be empty');
      return;
    }

    try {
      setSending(true);
      setError('');

      // Determine if replying to student or parent
      const isStudentMessage = selectedMessage.sender_role === 'student' || 
                            (selectedMessage.parent_id !== user.id && selectedMessage.sender_role !== 'parent');

      if (isStudentMessage) {
        // Use student reply endpoint if available, or use existing reply
        await messageService.replyToMessage(selectedMessage.id, {
          content: replyContent
        });
      } else {
        // Standard parent-teacher reply
        await messageService.replyToMessage(selectedMessage.id, {
          content: replyContent
        });
      }

      setSuccessMessage('Reply sent successfully');
      setReplyDialogOpen(false);
      setReplyContent('');
      setSelectedMessage(null);
      
      fetchMessages();
      fetchUnreadCount();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error sending reply:', err);
      setError(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const getMessageType = (message) => {
    if (message.parent_id === user.id) {
      return 'sent'; // Teacher sent this
    }
    
    // Check if sender is a student (inferred from role or context)
    const senderRole = message.sender_role || 'unknown';
    if (senderRole === 'student') {
      return 'student_message';
    }
    
    return 'parent_message'; // Default
  };

  if (!user || !['professor', 'ta'].includes(user.role)) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          This page is only accessible to teachers (Professors and TAs).
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <Email sx={{ mr: 1, verticalAlign: 'middle' }} />
            Teacher Inbox
          </Typography>
          <Box>
            <Badge badgeContent={unreadCount} color="error" sx={{ mr: 2 }}>
              <MarkEmailUnread />
            </Badge>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                fetchMessages();
                fetchUnreadCount();
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary">
          View and respond to messages from parents
        </Typography>
      </Box>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Messages List */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Messages ({messages.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Email sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No messages yet
                  </Typography>
                </Box>
              ) : (
                <List>
                  {messages.map((message) => (
                    <React.Fragment key={message.id}>
                      <ListItem
                        button
                        onClick={() => handleMessageClick(message)}
                        selected={selectedMessage?.id === message.id}
                        sx={{
                          backgroundColor: !message.is_read ? 'action.hover' : 'transparent',
                          borderLeft: !message.is_read ? '4px solid primary.main' : 'none',
                          mb: 1,
                          borderRadius: 1
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: !message.is_read ? 'bold' : 'normal' }}
                              >
                                {message.subject}
                                {getMessageType(message) === 'student_message' && (
                                  <Chip label="Student" size="small" color="secondary" sx={{ ml: 1 }} />
                                )}
                              </Typography>
                              {!message.is_read && (
                                <Chip label="New" size="small" color="primary" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                From: {message.parent_name}
                              </Typography>
                              {message.student_name && (
                                <Typography variant="caption" color="text.secondary">
                                  About: {message.student_name}
                                </Typography>
                              )}
                              <Typography variant="caption" display="block" color="text.secondary">
                                {formatDate(message.created_at)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Message Detail */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, height: '70vh', overflow: 'auto' }}>
              {selectedMessage ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="h5" gutterBottom>
                        {selectedMessage.subject}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<ReplyIcon />}
                        onClick={() => handleReplyClick(selectedMessage)}
                      >
                        Reply
                      </Button>
                    </Box>

                    {/* Message Metadata */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        icon={<Person />}
                        label={`From: ${selectedMessage.parent_name || selectedMessage.sender_name}`}
                        sx={{ mr: 1, mb: 1 }}
                      />
                      {selectedMessage.sender_role === 'student' && (
                        <Chip
                          label="Student"
                          color="secondary"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )}
                      {selectedMessage.student_name && selectedMessage.sender_role !== 'student' && (
                        <Chip
                          icon={<School />}
                          label={`About: ${selectedMessage.student_name}`}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )}
                      {selectedMessage.course_name && (
                        <Chip
                          label={`Course: ${selectedMessage.course_name}`}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )}
                      <Chip
                        icon={<AccessTime />}
                        label={formatDate(selectedMessage.created_at)}
                        sx={{ mb: 1 }}
                      />
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Message Content */}
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {selectedMessage.content}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Email sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a message to view
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Reply Dialog */}
      <Dialog 
        open={replyDialogOpen} 
        onClose={() => !sending && setReplyDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <ReplyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Reply to Message
        </DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Original Message from {selectedMessage.parent_name}:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {selectedMessage.subject}
              </Typography>
            </Box>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Your Reply"
            type="text"
            fullWidth
            multiline
            rows={6}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Type your reply here..."
            disabled={sending}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendReply} 
            variant="contained" 
            startIcon={sending ? <CircularProgress size={20} /> : <Send />}
            disabled={sending || !replyContent.trim()}
          >
            {sending ? 'Sending...' : 'Send Reply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherInbox;
