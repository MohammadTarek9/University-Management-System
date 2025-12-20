-- ============================================================================
-- COURSES-SPECIFIC EAV TABLES
-- Create separate EAV tables dedicated to courses only
-- ============================================================================

USE sql7810552;

-- Drop existing courses EAV tables if they exist
DROP TABLE IF EXISTS courses_eav_values;
DROP TABLE IF EXISTS courses_eav_attributes;
DROP TABLE IF EXISTS courses_eav_entities;

-- ============================================================================
-- Table 1: Courses EAV Entities
-- Stores the core course entity information
-- ============================================================================
CREATE TABLE courses_eav_entities (
    entity_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- Table 2: Courses EAV Attributes
-- Defines what attributes courses can have
-- ============================================================================
CREATE TABLE courses_eav_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    data_type ENUM('string','number','text','boolean','date') NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT NULL,
    
    INDEX idx_attribute_name (attribute_name),
    INDEX idx_data_type (data_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- Table 3: Courses EAV Values
-- Stores actual attribute values for each course
-- ============================================================================
CREATE TABLE courses_eav_values (
    entity_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string VARCHAR(500),
    value_number DECIMAL(18,4),
    value_text TEXT,
    value_boolean TINYINT(1),
    value_date DATETIME,
    
    PRIMARY KEY (entity_id, attribute_id),
    
    FOREIGN KEY (entity_id) 
        REFERENCES courses_eav_entities(entity_id) 
        ON DELETE CASCADE,
    
    FOREIGN KEY (attribute_id) 
        REFERENCES courses_eav_attributes(attribute_id) 
        ON DELETE CASCADE,
    
    INDEX idx_entity_id (entity_id),
    INDEX idx_attribute_id (attribute_id),
    INDEX idx_value_string (value_string(100)),
    INDEX idx_value_number (value_number),
    INDEX idx_value_date (value_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- Pre-populate common course attributes
-- ============================================================================
INSERT INTO courses_eav_attributes (attribute_name, data_type, description) VALUES
('subject_id', 'number', 'Subject ID that this course is based on'),
('semester', 'string', 'Semester (Fall, Spring, Summer)'),
('year', 'number', 'Academic year'),
('instructor_id', 'number', 'Instructor user ID'),
('max_enrollment', 'number', 'Maximum enrollment capacity'),
('current_enrollment', 'number', 'Current number of enrolled students'),
('schedule', 'text', 'Course schedule details'),
('prerequisites', 'text', 'Course-specific prerequisites'),
('corequisites', 'text', 'Course-specific corequisites'),
('lab_required', 'boolean', 'Whether lab is required for this course'),
('lab_hours', 'number', 'Lab hours per week for this course'),
('grading_rubric', 'text', 'Grading rubric for the course'),
('assessment_types', 'text', 'Types of assessments used'),
('attendance_policy', 'text', 'Attendance policy for this course'),
('online_meeting_link', 'string', 'Online meeting URL (Zoom, Teams, etc)'),
('syllabus_url', 'string', 'URL to course syllabus'),
('office_hours', 'text', 'Instructor office hours'),
('textbook_title', 'string', 'Required textbook title'),
('textbook_author', 'string', 'Textbook author'),
('textbook_isbn', 'string', 'Textbook ISBN'),
('textbook_required', 'boolean', 'Whether textbook is required');
