USE sql7810552;
-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assessment_type ENUM('quiz', 'assignment', 'exam', 'project') NOT NULL,
  total_points INT NOT NULL DEFAULT 100,
  due_date DATETIME NOT NULL,
  available_from DATETIME,
  available_until DATETIME,
  duration_minutes INT, -- for timed assessments
  allow_late_submission BOOLEAN DEFAULT FALSE,
  late_penalty_percent DECIMAL(5,2),
  max_attempts INT DEFAULT 1,
  show_correct_answers BOOLEAN DEFAULT FALSE,
  shuffle_questions BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  instructions TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_course_id (course_id),
  INDEX idx_due_date (due_date),
  INDEX idx_is_published (is_published)
);

-- Assessment questions table (for quizzes/exams)
CREATE TABLE IF NOT EXISTS assessment_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_id INT NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('multiple_choice', 'true_false', 'short_answer', 'essay') NOT NULL,
  points INT NOT NULL DEFAULT 1,
  correct_answer TEXT, -- JSON array for multiple choice, text for others
  options TEXT, -- JSON array for multiple choice options
  order_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  INDEX idx_assessment_id (assessment_id)
);

-- Student submissions table
CREATE TABLE IF NOT EXISTS assessment_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_id INT NOT NULL,
  student_id INT NOT NULL,
  attempt_number INT NOT NULL DEFAULT 1,
  submission_date DATETIME NOT NULL,
  is_late BOOLEAN DEFAULT FALSE,
  status ENUM('draft', 'submitted', 'graded', 'returned') DEFAULT 'draft',
  score DECIMAL(5,2),
  feedback TEXT,
  graded_by INT,
  graded_at DATETIME,
  time_spent_minutes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users(id),
  UNIQUE KEY unique_submission (assessment_id, student_id, attempt_number),
  INDEX idx_assessment_id (assessment_id),
  INDEX idx_student_id (student_id),
  INDEX idx_status (status)
);

-- Student answers table
CREATE TABLE IF NOT EXISTS assessment_answers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  submission_id INT NOT NULL,
  question_id INT,
  answer_text TEXT,
  is_correct BOOLEAN,
  points_earned DECIMAL(5,2),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (submission_id) REFERENCES assessment_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE SET NULL,
  INDEX idx_submission_id (submission_id)
);

