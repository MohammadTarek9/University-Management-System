-- ============================================================================
-- ROOMS-SPECIFIC EAV TABLES
-- Create separate EAV tables dedicated to rooms only
-- ============================================================================

USE sql7810552;

-- Drop existing rooms EAV tables if they exist
DROP TABLE IF EXISTS rooms_eav_values;
DROP TABLE IF EXISTS rooms_eav_attributes;
DROP TABLE IF EXISTS rooms_eav_entities;

-- ============================================================================
-- Table 1: Rooms EAV Entities
-- Stores the core room entity information
-- ============================================================================
CREATE TABLE rooms_eav_entities (
    entity_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================================================
-- Table 2: Rooms EAV Attributes
-- Defines what attributes rooms can have
-- ============================================================================
CREATE TABLE rooms_eav_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    data_type ENUM('string','number','text','boolean','date') NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT NULL,
    
    INDEX idx_attribute_name (attribute_name),
    INDEX idx_data_type (data_type)
) ENGINE=InnoDB;

-- ============================================================================
-- Table 3: Rooms EAV Values
-- Stores actual attribute values for each room
-- ============================================================================
CREATE TABLE rooms_eav_values (
    entity_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string VARCHAR(500),
    value_number DECIMAL(18,4),
    value_text TEXT,
    value_boolean TINYINT(1),
    value_date DATETIME,
    
    PRIMARY KEY (entity_id, attribute_id),
    
    FOREIGN KEY (entity_id) 
        REFERENCES rooms_eav_entities(entity_id) 
        ON DELETE CASCADE,
    
    FOREIGN KEY (attribute_id) 
        REFERENCES rooms_eav_attributes(attribute_id) 
        ON DELETE CASCADE,
    
    INDEX idx_entity_id (entity_id),
    INDEX idx_attribute_id (attribute_id),
    INDEX idx_value_string (value_string(100)),
    INDEX idx_value_number (value_number),
    INDEX idx_value_date (value_date)
) ENGINE=InnoDB;

INSERT INTO rooms_eav_entities (name, is_active, created_at, updated_at)
VALUES
  ('Computer Lab 101', 1, NOW(), NOW()),
  ('Main Lecture Hall', 1, NOW(), NOW()),
  ('921A', 1, NOW(), NOW()),
  ('911', 1, NOW(), NOW());
  
  INSERT INTO rooms_eav_attributes (attribute_name, data_type, description) VALUES
  ('room_name', 'string', 'Name of the room'),
  ('room_type', 'string', 'Type: classroom, laboratory, lecture_hall, computer_lab, office, conference_room'),
  ('capacity', 'number', 'Maximum seating capacity'),
  ('building', 'string', 'Building name where room is located'),
  ('floor', 'string', 'Floor level (e.g., 1, 2, Ground, Basement)'),
  ('room_number', 'string', 'Room number identifier'),
  ('description', 'text', 'Room description and notes'),
  ('maintenance_notes', 'text', 'Maintenance notes and history'),
  ('last_maintenance_date', 'date', 'Date of last maintenance'),
  ('next_maintenance_date', 'date', 'Scheduled next maintenance date'),
  ('is_active', 'boolean', 'Is the room active/available'),
  ('created_by', 'number', 'User ID who created the room'),
  ('updated_by', 'number', 'User ID who last updated the room'),
  ('created_at', 'date', 'Creation timestamp'),
  ('updated_at', 'date', 'Last update timestamp'),
  ('equipment', 'text', 'Equipment list as JSON array'),
  ('amenities', 'text', 'Amenities list as JSON array');
  
  -- Computer Lab 101
INSERT INTO rooms_eav_values (entity_id, attribute_id, value_string, value_number, value_text)
VALUES
  (1, 1, 'Computer Lab 101', NULL, NULL),         -- room_name
  (1, 2, 'computer_lab', NULL, NULL),             -- room_type
  (1, 3, NULL, 40, NULL),                         -- capacity
  (1, 4, 'Tech Building', NULL, NULL),            -- building
  (1, 5, '1', NULL, NULL),                        -- floor
  (1, 6, 'CL101', NULL, NULL),                    -- room_number
  (1, 15, NULL, NULL, '[{"name":"Projector","quantity":1,"condition":"good"},{"name":"Whiteboard","quantity":1,"condition":"good"}]'), -- equipment
  (1, 16, NULL, NULL, '["Restroom Nearby"]');     -- amenities

-- Main Lecture Hall
INSERT INTO rooms_eav_values (entity_id, attribute_id, value_string, value_number)
VALUES
  (2, 1, 'Main Lecture Hall', NULL),              -- room_name
  (2, 2, 'lecture_hall', NULL),                   -- room_type
  (2, 3, NULL, 200),                              -- capacity
  (2, 4, 'Main Building', NULL),                  -- building
  (2, 5, '1', NULL),                              -- floor
  (2, 6, 'LH1', NULL);                            -- room_number

-- 921A
INSERT INTO rooms_eav_values (entity_id, attribute_id, value_string, value_number)
VALUES
  (3, 1, '921A', NULL),
  (3, 2, 'lecture_hall', NULL),
  (3, 3, NULL, 100),
  (3, 4, 'Credit', NULL),
  (3, 5, '2nd', NULL),
  (3, 6, '921A', NULL);

-- 911
INSERT INTO rooms_eav_values (entity_id, attribute_id, value_string, value_number)
VALUES
  (4, 1, '911', NULL),
  (4, 2, 'classroom', NULL),
  (4, 3, NULL, 50),
  (4, 4, 'Credit', NULL),
  (4, 5, '1st', NULL),
  (4, 6, '911', NULL);
