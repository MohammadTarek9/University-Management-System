-- Remove entity-specific columns from eav_entities table
-- This makes the table truly generic for all entity types

USE sql7810552;

-- Drop the indexes first
ALTER TABLE eav_entities DROP INDEX idx_department_id;
ALTER TABLE eav_entities DROP INDEX idx_subject_id;

-- Drop the columns
ALTER TABLE eav_entities DROP COLUMN department_id;
ALTER TABLE eav_entities DROP COLUMN subject_id;

-- Verify the changes
DESCRIBE eav_entities;
