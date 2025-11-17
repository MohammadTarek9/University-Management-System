-- Parent-Student Relationship Table
-- Links parents to their children (students)

DROP TABLE IF EXISTS parent_student_relationships;

CREATE TABLE parent_student_relationships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parent_id INT NOT NULL COMMENT 'User ID of the parent',
  student_id INT NOT NULL COMMENT 'User ID of the student (child)',
  relationship_type ENUM('mother', 'father', 'guardian', 'other') DEFAULT 'guardian',
  is_primary BOOLEAN DEFAULT TRUE COMMENT 'Primary parent/guardian',
  created_at DATETIME DEFAULT NULL,
  updated_at DATETIME DEFAULT NULL,
  
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_parent_student (parent_id, student_id),
  INDEX idx_parent (parent_id),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data
-- Assuming we have parents and students in the system
-- You'll need to adjust these IDs based on your actual user IDs

-- Example: If user ID 10 is a parent and user ID 20 is a student
INSERT INTO parent_student_relationships (
  parent_id, student_id, relationship_type, is_primary,
  created_at, updated_at
) VALUES
(3, 4, 'father', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();
