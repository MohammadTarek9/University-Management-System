-- ============================================================================
-- MAINTENANCE REQUESTS EAV TABLES
-- ============================================================================

-- Drop existing EAV tables if they exist
DROP TABLE IF EXISTS maintenance_eav_values;
DROP TABLE IF EXISTS maintenance_eav_attributes;
DROP TABLE IF EXISTS maintenance_eav_entities;

-- ============================================================================
-- Table 1: Maintenance EAV Entities
-- ============================================================================
CREATE TABLE maintenance_eav_entities (
    entity_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- e.g., request title or summary
    created_at DATETIME DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================================================
-- Table 2: Maintenance EAV Attributes
-- ============================================================================
CREATE TABLE maintenance_eav_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    data_type ENUM('string','number','text','boolean','date') NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT NULL,
    INDEX idx_attribute_name (attribute_name),
    INDEX idx_data_type (data_type)
) ENGINE=InnoDB;

-- ============================================================================
-- Table 3: Maintenance EAV Values
-- ============================================================================
CREATE TABLE maintenance_eav_values (
    entity_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string VARCHAR(500),
    value_number DECIMAL(18,4),
    value_text TEXT,
    value_boolean TINYINT(1),
    value_date DATETIME,
    PRIMARY KEY (entity_id, attribute_id),
    FOREIGN KEY (entity_id) REFERENCES maintenance_eav_entities(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES maintenance_eav_attributes(attribute_id) ON DELETE CASCADE,
    INDEX idx_entity_id (entity_id),
    INDEX idx_attribute_id (attribute_id),
    INDEX idx_value_string (value_string(100)),
    INDEX idx_value_number (value_number),
    INDEX idx_value_date (value_date)
) ENGINE=InnoDB;