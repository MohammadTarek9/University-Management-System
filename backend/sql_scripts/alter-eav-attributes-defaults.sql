-- Modify eav_attributes table to set default values for created_at
-- This ensures new attributes always get a timestamp
USE sql7810552;
ALTER TABLE eav_attributes 
MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
