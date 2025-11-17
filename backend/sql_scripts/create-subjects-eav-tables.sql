-- ============================================================================
-- SUBJECTS-SPECIFIC EAV TABLES
-- Create separate EAV tables dedicated to subjects only
-- ============================================================================

USE sql7810552;

-- Drop existing subjects EAV tables if they exist
DROP TABLE IF EXISTS subjects_eav_values;
DROP TABLE IF EXISTS subjects_eav_attributes;
DROP TABLE IF EXISTS subjects_eav_entities;

-- ============================================================================
-- Table 1: Subjects EAV Entities
-- Stores the core subject entity information
-- ============================================================================
CREATE TABLE subjects_eav_entities (
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
-- Table 2: Subjects EAV Attributes
-- Defines what attributes subjects can have
-- ============================================================================
CREATE TABLE subjects_eav_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    data_type ENUM('string','number','text','boolean','date') NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT NULL,
    
    INDEX idx_attribute_name (attribute_name),
    INDEX idx_data_type (data_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- Table 3: Subjects EAV Values
-- Stores actual attribute values for each subject
-- ============================================================================
CREATE TABLE subjects_eav_values (
    entity_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string VARCHAR(500),
    value_number DECIMAL(18,4),
    value_text TEXT,
    value_boolean TINYINT(1),
    value_date DATETIME,
    
    PRIMARY KEY (entity_id, attribute_id),
    
    FOREIGN KEY (entity_id) 
        REFERENCES subjects_eav_entities(entity_id) 
        ON DELETE CASCADE,
    
    FOREIGN KEY (attribute_id) 
        REFERENCES subjects_eav_attributes(attribute_id) 
        ON DELETE CASCADE,
    
    INDEX idx_entity_id (entity_id),
    INDEX idx_attribute_id (attribute_id),
    INDEX idx_value_string (value_string(100)),
    INDEX idx_value_number (value_number),
    INDEX idx_value_date (value_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- Pre-populate common subject attributes
-- ============================================================================
INSERT INTO subjects_eav_attributes (attribute_name, data_type, description) VALUES
('code', 'string', 'Subject code identifier'),
('credits', 'number', 'Number of credit hours'),
('description', 'text', 'Subject description'),
('classification', 'string', 'Subject classification (core/elective)'),
('semester', 'string', 'Typical semester offering'),
('academic_year', 'string', 'Academic year'),
('department_id', 'number', 'Department ID'),
('prerequisites', 'text', 'Prerequisites for the subject'),
('corequisites', 'text', 'Corequisites for the subject'),
('learning_outcomes', 'text', 'Expected learning outcomes'),
('textbooks', 'text', 'Required or recommended textbooks'),
('lab_required', 'boolean', 'Whether lab component is required'),
('lab_hours', 'number', 'Number of lab hours per week'),
('studio_required', 'boolean', 'Whether studio component is required'),
('studio_hours', 'number', 'Number of studio hours per week'),
('certifications', 'text', 'Related professional certifications'),
('repeatability', 'string', 'Repeatability policy'),
('syllabus_template', 'text', 'Default syllabus template'),
('typical_offering', 'string', 'Typical offering pattern (Fall, Spring, Summer)');
