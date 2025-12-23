-- Round existing decimal values
UPDATE courses_eav_values
SET value_number = ROUND(value_number)
WHERE value_number IS NOT NULL;

-- Alter column to INT
ALTER TABLE courses_eav_values
MODIFY value_number INT;

ALTER TABLE maintenance_eav_values
MODIFY value_number INT;

SELECT 
  TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, 
  REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'sql7810552'
  AND REFERENCED_TABLE_NAME = 'eav_entities';

SELECT 
  cm.*, 
  e.entity_id AS referenced_entity_id
FROM course_materials cm
JOIN eav_entities e
  ON e.entity_id = cm.course_id
ORDER BY cm.course_id;

SELECT
  kcu.TABLE_NAME,
  kcu.CONSTRAINT_NAME,
  kcu.COLUMN_NAME,
  kcu.REFERENCED_TABLE_NAME,
  kcu.REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE kcu
WHERE kcu.TABLE_SCHEMA = 'sql7810552'
  AND kcu.REFERENCED_TABLE_NAME = 'eav_entities'
ORDER BY kcu.TABLE_NAME, kcu.CONSTRAINT_NAME;

SELECT
  kcu.TABLE_NAME,
  kcu.CONSTRAINT_NAME,
  kcu.COLUMN_NAME,
  kcu.REFERENCED_TABLE_NAME,
  kcu.REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE kcu
WHERE kcu.TABLE_SCHEMA = 'sql7810552'
  AND kcu.REFERENCED_TABLE_NAME = 'rooms'
ORDER BY kcu.TABLE_NAME, kcu.CONSTRAINT_NAME;




SELECT
  kcu.TABLE_NAME,
  kcu.CONSTRAINT_NAME,
  kcu.COLUMN_NAME,
  kcu.REFERENCED_TABLE_NAME,
  kcu.REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE kcu
WHERE kcu.TABLE_SCHEMA = 'sql7810552'
  AND kcu.REFERENCED_TABLE_NAME = 'courses'
ORDER BY kcu.TABLE_NAME, kcu.CONSTRAINT_NAME;

SELECT
  kcu.TABLE_NAME,
  kcu.CONSTRAINT_NAME,
  kcu.COLUMN_NAME,
  kcu.REFERENCED_TABLE_NAME,
  kcu.REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE kcu
WHERE kcu.TABLE_SCHEMA = 'sql7810552'
  AND kcu.REFERENCED_TABLE_NAME = 'subjects'
ORDER BY kcu.TABLE_NAME, kcu.CONSTRAINT_NAME;


