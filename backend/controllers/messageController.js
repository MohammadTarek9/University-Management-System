// controllers/messageController.js
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const messageRepo = require('../repositories/messageRepo');

/**
 * Get parent's children (students)
 * @route GET /api/community/messages/children
 * @access Private (parent)
 */
const getParentChildren = async (req, res) => {
  try {
    const parentId = req.user.id;
    console.log('getParentChildren called for parentId:', parentId);
    console.log('req.user:', req.user);
    console.log('req.user.role:', req.user.role);
    
    // Ensure user is a parent
    if (req.user.role !== 'parent') {
      console.log('User role is not parent:', req.user.role);
      return errorResponse(res, 403, 'Only parents can access this resource');
    }
    
    console.log('Calling messageRepo.getParentChildren with parentId:', parentId);
    const children = await messageRepo.getParentChildren(parentId);
    console.log('Children returned from repo:', children);
    console.log('Children length:', children.length);
    
    return successResponse(res, 200, 'Children retrieved successfully', { children });
  } catch (error) {
    console.error('Error fetching parent children:', error);
    return errorResponse(res, 500, 'Server error while retrieving children');
  }
};

/**
 * Get teachers for parent's child
 * @route GET /api/community/messages/teachers/:studentId
 * @access Private (parent)
 */
const getStudentTeachers = async (req, res) => {
  try {
    const { studentId } = req.params;
    const parentId = req.user.id;
    
    // Ensure user is a parent
    if (req.user.role !== 'parent') {
      return errorResponse(res, 403, 'Only parents can access this resource');
    }
    
    // Verify the student is the parent's child
    const children = await messageRepo.getParentChildren(parentId);
    const isParentOfStudent = children.some(child => child.student_id === parseInt(studentId));
    
    if (!isParentOfStudent) {
      return errorResponse(res, 403, 'You can only view teachers for your own children');
    }
    
    const teachers = await messageRepo.getStudentTeachers(studentId);
    console.log('Teachers from repo:', teachers);
    console.log('Teachers length:', teachers.length);
    
    const responseData = { teachers };
    console.log('Response data being sent:', responseData);
    return successResponse(res, 200, 'Teachers retrieved successfully', responseData);
  } catch (error) {
    console.error('Error fetching student teachers:', error);
    return errorResponse(res, 500, 'Server error while retrieving teachers');
  }
};

/**
 * Send a message from parent to teacher
 * @route POST /api/community/messages
 * @access Private (parent)
 */
const sendMessage = async (req, res) => {
  try {
    const { teacher_id, student_id, course_id, subject, content } = req.body;
    const parent_id = req.user.id;
    
    // Validation
    if (!teacher_id) {
      return errorResponse(res, 400, 'Teacher is required');
    }
    if (!subject || !subject.trim()) {
      return errorResponse(res, 400, 'Subject is required');
    }
    if (!content || !content.trim()) {
      return errorResponse(res, 400, 'Message content is required');
    }
    
    const messageData = {
      parent_id,
      teacher_id,
      student_id,
      course_id,
      subject: subject.trim(),
      content: content.trim()
    };
    
    const message = await messageRepo.createMessage(messageData);
    
    return successResponse(res, 201, 'Message sent successfully', { message });
  } catch (error) {
    console.error('Error sending message:', error);
    return errorResponse(res, 500, 'Server error while sending message');
  }
};

/**
 * Get sent messages for current user (parent)
 * @route GET /api/community/messages/sent
 * @access Private (parent)
 */
const getSentMessages = async (req, res) => {
  try {
    const parentId = req.user.id;
    
    const messages = await messageRepo.getSentMessages(parentId);
    
    return successResponse(res, 200, 'Sent messages retrieved successfully', { messages });
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    return errorResponse(res, 500, 'Server error while retrieving sent messages');
  }
};

/**
 * Get received messages for current user (teacher)
 * @route GET /api/community/messages/received
 * @access Private (teacher)
 */
const getReceivedMessages = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const messages = await messageRepo.getReceivedMessages(teacherId);
    
    return successResponse(res, 200, 'Received messages retrieved successfully', { messages });
  } catch (error) {
    console.error('Error fetching received messages:', error);
    return errorResponse(res, 500, 'Server error while retrieving received messages');
  }
};

/**
* Get a specific message
* @route GET /api/community/messages/:id
* @access Private (parent or teacher or student)
*/
const getMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const message = await messageRepo.getMessageById(id);
    
    if (!message) {
      return errorResponse(res, 404, 'Message not found');
    }
    
    // UPDATED AUTHORIZATION: Student can view if they're sender or recipient
    // For student messages: parent_id = student (sender), teacher_id = staff (recipient)
    // For replies: parent_id = staff (sender), teacher_id = student (recipient)
    let canView = false;
    
    if (userRole === 'student') {
      // Student can view if they're sender (parent_id) or recipient (teacher_id) 
      // or if the message is about them (student_id)
      canView = message.parent_id === userId || 
                message.teacher_id === userId || 
                message.student_id === userId;
    } else if (userRole === 'parent') {
      // Parent logic remains the same
      canView = message.parent_id === userId || message.student_id === userId;
    } else if (['professor', 'ta'].includes(userRole)) {
      // Teacher logic remains the same
      canView = message.teacher_id === userId || message.parent_id === userId;
    }
    
    if (!canView) {
      return errorResponse(res, 403, 'You are not authorized to view this message');
    }
    
    // Mark as read if user is the recipient (teacher_id) and message is unread
    if (message.teacher_id === userId && !message.is_read) {
      await messageRepo.markAsRead(id);
      message.is_read = true;
      message.read_at = new Date();
    }
    
    return successResponse(res, 200, 'Message retrieved successfully', { message });
  } catch (error) {
    console.error('Error fetching message:', error);
    return errorResponse(res, 500, 'Server error while retrieving message');
  }
};

/**
 * Mark message as read
 * @route PUT /api/community/messages/:id/read
 * @access Private (teacher)
 */
const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const message = await messageRepo.getMessageById(id);
    
    if (!message) {
      return errorResponse(res, 404, 'Message not found');
    }
    
    // Only the teacher (recipient) can mark as read
    if (message.teacher_id !== userId) {
      return errorResponse(res, 403, 'You are not authorized to mark this message as read');
    }
    
    const updatedMessage = await messageRepo.markAsRead(id);
    
    return successResponse(res, 200, 'Message marked as read', { message: updatedMessage });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return errorResponse(res, 500, 'Server error while marking message as read');
  }
};

/**
 * Get unread message count for teacher
 * @route GET /api/community/messages/unread/count
 * @access Private (teacher)
 */
const getUnreadCount = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const count = await messageRepo.getUnreadCount(teacherId);
    
    return successResponse(res, 200, 'Unread count retrieved successfully', { count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return errorResponse(res, 500, 'Server error while retrieving unread count');
  }
};

/**
 * Delete a message
 * @route DELETE /api/community/messages/:id
 * @access Private (parent - sender only)
 */
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const message = await messageRepo.getMessageById(id);
    
    if (!message) {
      return errorResponse(res, 404, 'Message not found');
    }
    
    // Only the sender (parent) can delete
    if (message.parent_id !== userId) {
      return errorResponse(res, 403, 'You are not authorized to delete this message');
    }
    
    await messageRepo.deleteMessage(id);
    
    return successResponse(res, 200, 'Message deleted successfully');
  } catch (error) {
    console.error('Error deleting message:', error);
    return errorResponse(res, 500, 'Server error while deleting message');
  }
};

/**
* Reply to a message (teacher to parent OR staff to student)
* @route POST /api/community/messages/:id/reply
* @access Private (teacher)
*/
const replyToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    // Ensure user is a teacher
    if (!['professor', 'ta'].includes(req.user.role)) {
      return errorResponse(res, 403, 'Only teachers can reply to messages');
    }
    
    // Validate content
    if (!content || !content.trim()) {
      return errorResponse(res, 400, 'Reply content is required');
    }
    
    // Get the original message
    const originalMessage = await messageRepo.getMessageById(id);
    
    if (!originalMessage) {
      return errorResponse(res, 404, 'Original message not found');
    }
    
    // Verify the teacher is the recipient of the original message
    if (originalMessage.teacher_id !== userId) {
      return errorResponse(res, 403, 'You can only reply to messages sent to you');
    }
    
    // Create the reply - same logic works for both parent and student messages
    const replyData = {
      parent_id: userId, // Teacher becomes the sender
      teacher_id: originalMessage.parent_id, // Original sender becomes recipient
      student_id: originalMessage.student_id, // Keep the same student reference
      course_id: originalMessage.course_id,
      subject: `Re: ${originalMessage.subject}`,
      content: content.trim(),
      parent_message_id: id // Link to original message
    };
    
    console.log('Creating reply:', replyData);
    
    const reply = await messageRepo.createMessage(replyData);
    
    // Mark original message as read
    await messageRepo.markAsRead(id);
    
    return successResponse(res, 201, 'Reply sent successfully', { message: reply });
  } catch (error) {
    console.error('Error replying to message:', error);
    return errorResponse(res, 500, 'Server error while sending reply');
  }
};

/**
 * Get available staff for student's courses
 * @route GET /api/community/messages/staff
 * @access Private (student)
 */
const getAvailableStaff = async (req, res) => {
  try {
    const studentId = req.user.id; 
    
    if (req.user.role !== 'student') {
      return errorResponse(res, 403, 'Only students can access this resource');
    }
    
    console.log('Fetching staff for student ID:', studentId);
    
    // Get student details to verify
    const userRepo = require('../repositories/userRepo');
    const student = await userRepo.getUserById(studentId);
    console.log('Student details:', student);
    
    // Use getStudentTeachers - but we need to fix the repo function
    const teachers = await messageRepo.getStudentTeachers(studentId);
    
    console.log('Staff retrieved:', teachers);
    
    // Return as staff for consistency
    return successResponse(res, 200, 'Staff retrieved successfully', { 
      teachers,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return errorResponse(res, 500, 'Server error while retrieving staff');
  }
};

/**
 * Send message from student to staff
 * @route POST /api/community/messages/student
 * @access Private (student)
 */
const sendStudentMessage = async (req, res) => {
  try {
    const { staff_id, subject, content } = req.body;
    const studentId = req.user.id;
    
    console.log('Sending student message:', { 
      studentId, 
      staff_id, 
      subject, 
      content,
      user: req.user 
    });
    
    // Validation
    if (!staff_id) {
      return errorResponse(res, 400, 'Staff member is required');
    }
    if (!subject || !subject.trim()) {
      return errorResponse(res, 400, 'Subject is required');
    }
    if (!content || !content.trim()) {
      return errorResponse(res, 400, 'Message content is required');
    }
    
    // Verify staff exists and is valid
    const userRepo = require('../repositories/userRepo');
    const staffUser = await userRepo.getUserById(staff_id);
    
    if (!staffUser) {
      return errorResponse(res, 400, 'Staff member not found');
    }
    
    if (!['professor', 'ta', 'staff'].includes(staffUser.role)) {
      return errorResponse(res, 400, 'Selected user is not a staff member');
    }
    
    // For student messages: parent_id = studentId, teacher_id = staff_id, student_id = studentId
    const messageData = {
      parent_id: studentId,        // Student as sender
      teacher_id: staff_id,        // Staff as recipient
      student_id: studentId,       // Student is also the subject
      course_id: null,             // Optional - could get from enrollment
      subject: subject.trim(),
      content: content.trim()
    };
    
    console.log('Creating message with data:', messageData);
    
    const message = await messageRepo.createMessage(messageData);
    
    return successResponse(res, 201, 'Message sent successfully', { 
      message,
      success: true 
    });
  } catch (error) {
    console.error('Error sending student message:', error);
    return errorResponse(res, 500, 'Server error while sending message');
  }
};

/**
 * Get student's conversations
 * @route GET /api/community/messages/student/conversations
 * @access Private (student)
 */
const getStudentConversations = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    if (req.user.role !== 'student') {
      return errorResponse(res, 403, 'Only students can access this resource');
    }
    
    // Use existing getSentMessages - student messages are stored with parent_id = studentId
    // This will get both messages sent by student AND replies from staff
    const conversations = await messageRepo.getSentMessages(studentId);
    
    console.log('Student conversations:', conversations);
    console.log('Conversations length:', conversations.length);
    
    return successResponse(res, 200, 'Conversations retrieved successfully', { conversations });
  } catch (error) {
    console.error('Error fetching student conversations:', error);
    return errorResponse(res, 500, 'Server error while retrieving conversations');
  }
};

module.exports = {
  getParentChildren,
  getStudentTeachers,
  sendMessage,
  getSentMessages,
  getReceivedMessages,
  getMessage,
  markMessageAsRead,
  getUnreadCount,
  deleteMessage,
  replyToMessage,
  getAvailableStaff,
  sendStudentMessage,
  getStudentConversations
};
