-- ============================================================================
-- MIGRATE COURSES DATA FROM SHARED EAV TABLES TO COURSES-SPECIFIC TABLES
-- ============================================================================

USE sql7810552;

-- ============================================================================
-- Step 1: Migrate course entities from eav_entities to courses_eav_entities
-- ============================================================================
INSERT INTO courses_eav_entities (entity_id, name, is_active, created_at, updated_at)
SELECT 
    entity_id,
    name,
    is_active,
    created_at,
    updated_at
FROM eav_entities
WHERE entity_type = 'course';

-- ============================================================================
-- Step 2: Migrate course attributes from eav_attributes to courses_eav_attributes
-- Only migrate attributes that are used by courses
-- ============================================================================
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

-- ============================================================================
-- Step 3: Migrate course values from eav_values to courses_eav_values
-- ============================================================================
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
-- Verification Queries
-- ============================================================================

-- Count courses migrated
SELECT 'Courses Entities Migrated:' AS Status, COUNT(*) AS Count FROM courses_eav_entities;

-- Count course attributes migrated
SELECT 'Course Attributes Migrated:' AS Status, COUNT(*) AS Count FROM courses_eav_attributes;

-- Count course values migrated
SELECT 'Course Values Migrated:' AS Status, COUNT(*) AS Count FROM courses_eav_values;

-- Show sample migrated data
SELECT 'Sample Course Data:' AS Status;
SELECT 
    e.entity_id,
    e.name,
    a.attribute_name,
    COALESCE(v.value_string, CAST(v.value_number AS CHAR), v.value_text, 
             CAST(v.value_boolean AS CHAR), CAST(v.value_date AS CHAR)) AS value
FROM courses_eav_entities e
LEFT JOIN courses_eav_values v ON e.entity_id = v.entity_id
LEFT JOIN courses_eav_attributes a ON v.attribute_id = a.attribute_id
LIMIT 20;

-- ============================================================================
-- Optional: Clean up old course data from shared tables
-- UNCOMMENT THE FOLLOWING LINES ONLY AFTER VERIFYING THE MIGRATION
-- ============================================================================

-- DELETE v FROM eav_values v
-- INNER JOIN eav_entities e ON v.entity_id = e.entity_id
-- WHERE e.entity_type = 'course';

-- DELETE FROM eav_entities WHERE entity_type = 'course';

-- DELETE a FROM eav_attributes a
-- LEFT JOIN eav_values v ON a.attribute_id = v.attribute_id
-- WHERE v.attribute_id IS NULL;
