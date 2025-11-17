-- ============================================================================
-- COMPLETE EAV MIGRATION SCRIPT
-- This script migrates subjects and courses from shared EAV tables to 
-- entity-specific EAV tables
-- ============================================================================

USE sql7810552;

-- ============================================================================
-- STEP 1: CREATE SUBJECTS EAV TABLES
-- ============================================================================

-- Drop existing subjects EAV tables if they exist
DROP TABLE IF EXISTS subjects_eav_values;
DROP TABLE IF EXISTS subjects_eav_attributes;
DROP TABLE IF EXISTS subjects_eav_entities;

-- Create subjects_eav_entities
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

-- Create subjects_eav_attributes
CREATE TABLE subjects_eav_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    data_type ENUM('string','number','text','boolean','date') NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT NULL,
    
    INDEX idx_attribute_name (attribute_name),
    INDEX idx_data_type (data_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create subjects_eav_values
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
-- STEP 2: CREATE COURSES EAV TABLES
-- ============================================================================

-- Drop existing courses EAV tables if they exist
DROP TABLE IF EXISTS courses_eav_values;
DROP TABLE IF EXISTS courses_eav_attributes;
DROP TABLE IF EXISTS courses_eav_entities;

-- Create courses_eav_entities
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

-- Create courses_eav_attributes
CREATE TABLE courses_eav_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    data_type ENUM('string','number','text','boolean','date') NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT NULL,
    
    INDEX idx_attribute_name (attribute_name),
    INDEX idx_data_type (data_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create courses_eav_values
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
-- STEP 3: MIGRATE SUBJECTS DATA
-- ============================================================================

-- Migrate subject entities
INSERT INTO subjects_eav_entities (entity_id, name, is_active, created_at, updated_at)
SELECT 
    entity_id,
    name,
    is_active,
    created_at,
    updated_at
FROM eav_entities
WHERE entity_type = 'subject';

-- Migrate subject attributes
INSERT INTO subjects_eav_attributes (attribute_id, attribute_name, data_type, description, created_at)
SELECT DISTINCT
    a.attribute_id,
    a.attribute_name,
    a.data_type,
    a.description,
    a.created_at
FROM eav_attributes a
INNER JOIN eav_values v ON a.attribute_id = v.attribute_id
INNER JOIN eav_entities e ON v.entity_id = e.entity_id
WHERE e.entity_type = 'subject'
ON DUPLICATE KEY UPDATE
    data_type = VALUES(data_type),
    description = VALUES(description);

-- Migrate subject values
INSERT INTO subjects_eav_values (entity_id, attribute_id, value_string, value_number, value_text, value_boolean, value_date)
SELECT 
    v.entity_id,
    v.attribute_id,
    v.value_string,
    v.value_number,
    v.value_text,
    v.value_boolean,
    v.value_date
FROM eav_values v
INNER JOIN eav_entities e ON v.entity_id = e.entity_id
WHERE e.entity_type = 'subject';

-- ============================================================================
-- STEP 4: MIGRATE COURSES DATA
-- ============================================================================

-- Migrate course entities
INSERT INTO courses_eav_entities (entity_id, name, is_active, created_at, updated_at)
SELECT 
    entity_id,
    name,
    is_active,
    created_at,
    updated_at
FROM eav_entities
WHERE entity_type = 'course';

-- Migrate course attributes
INSERT INTO courses_eav_attributes (attribute_id, attribute_name, data_type, description, created_at)
SELECT DISTINCT
    a.attribute_id,
    a.attribute_name,
    a.data_type,
    a.description,
    a.created_at
FROM eav_attributes a
INNER JOIN eav_values v ON a.attribute_id = v.attribute_id
INNER JOIN eav_entities e ON v.entity_id = e.entity_id
WHERE e.entity_type = 'course'
ON DUPLICATE KEY UPDATE
    data_type = VALUES(data_type),
    description = VALUES(description);

-- Migrate course values
INSERT INTO courses_eav_values (entity_id, attribute_id, value_string, value_number, value_text, value_boolean, value_date)
SELECT 
    v.entity_id,
    v.attribute_id,
    v.value_string,
    v.value_number,
    v.value_text,
    v.value_boolean,
    v.value_date
FROM eav_values v
INNER JOIN eav_entities e ON v.entity_id = e.entity_id
WHERE e.entity_type = 'course';

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================

SELECT '==================== MIGRATION VERIFICATION ====================' AS '';

-- Verify subjects migration
SELECT 'Subjects Entities:' AS Metric, COUNT(*) AS Count FROM subjects_eav_entities
UNION ALL
SELECT 'Subjects Attributes:', COUNT(*) FROM subjects_eav_attributes
UNION ALL
SELECT 'Subjects Values:', COUNT(*) FROM subjects_eav_values
UNION ALL
SELECT '----' AS '', '' AS ''
UNION ALL
SELECT 'Courses Entities:', COUNT(*) FROM courses_eav_entities
UNION ALL
SELECT 'Courses Attributes:', COUNT(*) FROM courses_eav_attributes
UNION ALL
SELECT 'Courses Values:', COUNT(*) FROM courses_eav_values;

-- Sample data check for subjects
SELECT '==================== SAMPLE SUBJECT DATA ====================' AS '';
SELECT 
    e.entity_id,
    e.name,
    a.attribute_name,
    COALESCE(v.value_string, CAST(v.value_number AS CHAR), v.value_text, 
             CAST(v.value_boolean AS CHAR), CAST(v.value_date AS CHAR)) AS value
FROM subjects_eav_entities e
LEFT JOIN subjects_eav_values v ON e.entity_id = v.entity_id
LEFT JOIN subjects_eav_attributes a ON v.attribute_id = a.attribute_id
LIMIT 10;

-- Sample data check for courses
SELECT '==================== SAMPLE COURSE DATA ====================' AS '';
SELECT 
    e.entity_id,
    e.name,
    a.attribute_name,
    COALESCE(v.value_string, CAST(v.value_number AS CHAR), v.value_text, 
             CAST(v.value_boolean AS CHAR), CAST(v.value_date AS CHAR)) AS value
FROM courses_eav_entities e
LEFT JOIN courses_eav_values v ON e.entity_id = v.entity_id
LEFT JOIN courses_eav_attributes a ON v.attribute_id = a.attribute_id
LIMIT 10;

-- ============================================================================
-- STEP 6: CLEANUP (OPTIONAL - UNCOMMENT AFTER VERIFICATION)
-- Remove migrated data from shared EAV tables after confirming migration success
-- ============================================================================

-- UNCOMMENT THE FOLLOWING LINES ONLY AFTER VERIFYING THE MIGRATION IS SUCCESSFUL

-- -- Delete subject values from shared table
-- DELETE v FROM eav_values v
-- INNER JOIN eav_entities e ON v.entity_id = e.entity_id
-- WHERE e.entity_type = 'subject';

-- -- Delete course values from shared table
-- DELETE v FROM eav_values v
-- INNER JOIN eav_entities e ON v.entity_id = e.entity_id
-- WHERE e.entity_type = 'course';

-- -- Delete subject and course entities from shared table
-- DELETE FROM eav_entities WHERE entity_type IN ('subject', 'course');

-- -- Optionally clean up unused attributes
-- DELETE a FROM eav_attributes a
-- LEFT JOIN eav_values v ON a.attribute_id = v.attribute_id
-- WHERE v.attribute_id IS NULL;

SELECT '==================== MIGRATION COMPLETE ====================' AS '';
SELECT 'Please review the verification results above.' AS Message;
SELECT 'If everything looks correct, uncomment and run the cleanup section.' AS NextStep;
