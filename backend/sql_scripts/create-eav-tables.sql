-- EAV Tables for Flexible Attributes (3-Table Model)
-- Run this to create the proper EAV tables

USE sql7810552;

-- Drop existing tables if they exist (to recreate with proper structure)
DROP TABLE IF EXISTS eav_values;
DROP TABLE IF EXISTS eav_attributes;
DROP TABLE IF EXISTS eav_entities;

-- Table 1: Entities (Courses, Subjects, Rooms, Maintenance Requests)
-- TRULY GENERIC - no entity-specific columns
CREATE TABLE eav_entities (
    entity_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_entity_type (entity_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 2: Attributes (Defines what attributes exist)
CREATE TABLE eav_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    data_type ENUM('string','number','text','boolean','date') NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT NULL,
    
    INDEX idx_attribute_name (attribute_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 3: Values (Stores actual attribute values for entities)
CREATE TABLE eav_values (
    entity_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string VARCHAR(500),
    value_number DECIMAL(18,4),
    value_text TEXT,
    value_boolean TINYINT(1),
    value_date DATETIME,
    
    PRIMARY KEY (entity_id, attribute_id),
    FOREIGN KEY (entity_id) REFERENCES eav_entities(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES eav_attributes(attribute_id) ON DELETE CASCADE,
    
    INDEX idx_entity_id (entity_id),
    INDEX idx_attribute_id (attribute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pre-populate common attributes
INSERT INTO eav_attributes (attribute_name, data_type, description) VALUES
-- Course/Subject attributes
('code', 'string', 'Course or subject code'),
('credits', 'number', 'Number of credits'),
('description', 'text', 'Description'),
('level', 'string', 'Course level'),
('department', 'string', 'Department name'),
('semester', 'string', 'Semester'),
('year', 'number', 'Year'),
('prerequisites', 'text', 'Prerequisites'),
('corequisites', 'text', 'Corequisites'),
('learningOutcomes', 'text', 'Learning outcomes'),
('textbooks', 'text', 'Required textbooks'),
('labRequired', 'boolean', 'Lab required'),
('labHours', 'number', 'Lab hours per week'),
('studioRequired', 'boolean', 'Studio required'),
('studioHours', 'number', 'Studio hours per week'),
('certifications', 'text', 'Related certifications'),
('repeatability', 'string', 'Repeatability policy'),
('syllabusTemplate', 'text', 'Syllabus template'),
('typicalOffering', 'string', 'Typical offering schedule'),
('gradingRubric', 'text', 'Grading rubric'),
('assessmentTypes', 'text', 'Assessment types'),
('attendancePolicy', 'text', 'Attendance policy'),
('onlineMeetingLink', 'string', 'Online meeting link'),
('syllabusUrl', 'string', 'Syllabus URL'),
('officeHours', 'string', 'Office hours'),
('textbookTitle', 'string', 'Textbook title'),
('textbookAuthor', 'string', 'Textbook author'),
('textbookIsbn', 'string', 'Textbook ISBN'),
('textbookRequired', 'boolean', 'Textbook required')
ON DUPLICATE KEY UPDATE attribute_name=attribute_name;

-- Verify tables created
SELECT 'EAV tables created successfully!' AS Status;
SELECT COUNT(*) AS 'Predefined Attributes' FROM eav_attributes;
SHOW TABLES LIKE 'eav_%';
