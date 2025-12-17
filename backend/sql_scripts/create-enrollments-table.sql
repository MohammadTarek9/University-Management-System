-- Enrollments Table for Course Registration
-- This table tracks student course enrollments

USE sql7810552;

-- Drop table if exists
DROP TABLE IF EXISTS enrollments;

-- Create enrollments table
CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date DATETIME,
    status ENUM('pending', 'enrolled', 'rejected', 'dropped', 'completed', 'withdrawn') DEFAULT 'pending',
    grade VARCHAR(5) NULL,
    grade_points DECIMAL(3,2) NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME,
    updated_at DATETIME,
    
    -- Foreign Keys
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES eav_entities(entity_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_status (status),
    INDEX idx_is_active (is_active),
    
    -- Prevent duplicate enrollments
    UNIQUE KEY unique_student_course (student_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add comments
ALTER TABLE enrollments 
COMMENT = 'Tracks student course enrollments and grades';
