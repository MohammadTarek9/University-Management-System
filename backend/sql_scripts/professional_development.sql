USE sql7810552;

-- Create professional_development_activities table
CREATE TABLE IF NOT EXISTS professional_development_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  activity_type ENUM(
    'conference',
    'workshop',
    'seminar',
    'certification',
    'course',
    'training',
    'presentation',
    'publication',
    'other'
  ) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  organizer VARCHAR(255),
  location VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  duration_hours DECIMAL(5,2),
  status ENUM('planned', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'planned',
  completion_date DATE,
  certificate_obtained TINYINT(1) DEFAULT 0,
  certificate_url VARCHAR(500),
  credits_earned DECIMAL(5,2),
  cost DECIMAL(10,2),
  funding_source VARCHAR(255),
  skills_acquired TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_activity_type (activity_type),
  INDEX idx_start_date (start_date DESC),
  INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert some sample data for testing (optional)
-- INSERT INTO professional_development_activities 
-- (user_id, activity_type, title, description, start_date, end_date, status, completion_date, certificate_obtained)
-- VALUES 
-- (1, 'workshop', 'Advanced Teaching Methods', 'Workshop on innovative teaching techniques', '2024-01-15', '2024-01-16', 'completed', '2024-01-16', 1),
-- (1, 'conference', 'International Education Conference 2024', 'Attended and presented research', '2024-03-10', '2024-03-12', 'completed', '2024-03-12', 1),
-- (1, 'certification', 'Online Teaching Certification', 'Professional certification for online education', '2024-06-01', NULL, 'ongoing', NULL, 0);

SELECT 'Professional development activities table created successfully!' AS Status;
