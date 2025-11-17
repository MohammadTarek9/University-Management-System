-- Parent-Teacher Messages Table
-- Stores messages between parents and teachers

DROP TABLE IF EXISTS parent_teacher_messages;

CREATE TABLE parent_teacher_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parent_id INT NOT NULL COMMENT 'User ID of the parent sending the message',
  teacher_id INT NOT NULL COMMENT 'User ID of the teacher receiving the message',
  student_id INT COMMENT 'User ID of the student (child) the message is about',
  course_id INT COMMENT 'Course ID if message is related to a specific course',
  
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- Status tracking
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME DEFAULT NULL,
  
  -- Thread tracking (for replies)
  parent_message_id INT DEFAULT NULL COMMENT 'If this is a reply, ID of the original message',
  
  -- Timestamps
  created_at DATETIME DEFAULT NULL,
  updated_at DATETIME DEFAULT NULL,
  
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_message_id) REFERENCES parent_teacher_messages(id) ON DELETE CASCADE,
  
  INDEX idx_parent_messages (parent_id, created_at DESC),
  INDEX idx_teacher_messages (teacher_id, created_at DESC),
  INDEX idx_student_messages (student_id),
  INDEX idx_thread (parent_message_id),
  INDEX idx_unread (teacher_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data (assuming user ID 1 is parent, ID 2 is teacher, ID 3 is student)
INSERT INTO parent_teacher_messages (
  parent_id, teacher_id, student_id, course_id,
  subject, content,
  is_read, created_at, updated_at
) VALUES
(3, 1, 3, NULL,
 'Question about homework assignment',
 'Dear Professor, I wanted to ask about the homework assignment due next week. Could you please clarify the requirements for problem 3?',
 TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),

(3, 1, 3, NULL,
 'Request for meeting',
 'Hello, I would like to schedule a meeting to discuss my child''s progress in your class. Are you available next week?',
 FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));
