-- Course Materials Table
-- Stores uploaded teaching materials (PDFs, videos, documents, etc.)

USE sql7810552;

-- Drop table if exists
DROP TABLE IF EXISTS course_materials;

-- Create course_materials table
CREATE TABLE course_materials (
    material_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    uploaded_by INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL COMMENT 'File size in bytes',
    download_count INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    
    -- Foreign Keys
    FOREIGN KEY (course_id) REFERENCES eav_entities(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_course_id (course_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_file_type (file_type),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add comments
ALTER TABLE course_materials 
COMMENT = 'Stores teaching materials uploaded by professors and TAs';
