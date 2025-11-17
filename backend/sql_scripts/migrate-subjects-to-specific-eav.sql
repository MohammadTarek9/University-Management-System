-- ============================================================================
-- MIGRATE SUBJECTS DATA FROM SHARED EAV TABLES TO SUBJECTS-SPECIFIC TABLES
-- ============================================================================

USE sql7810552;

-- ============================================================================
-- Step 1: Migrate subject entities from eav_entities to subjects_eav_entities
-- ============================================================================
INSERT INTO subjects_eav_entities (entity_id, name, is_active, created_at, updated_at)
SELECT 
    entity_id,
    name,
    is_active,
    created_at,
    updated_at
FROM eav_entities
WHERE entity_type = 'subject';

-- ============================================================================
-- Step 2: Migrate subject attributes from eav_attributes to subjects_eav_attributes
-- Only migrate attributes that are used by subjects
-- ============================================================================
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

-- ============================================================================
-- Step 3: Migrate subject values from eav_values to subjects_eav_values
-- ============================================================================
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
-- Verification Queries
-- ============================================================================

-- Count subjects migrated
SELECT 'Subjects Entities Migrated:' AS Status, COUNT(*) AS Count FROM subjects_eav_entities;

-- Count subject attributes migrated
SELECT 'Subject Attributes Migrated:' AS Status, COUNT(*) AS Count FROM subjects_eav_attributes;

-- Count subject values migrated
SELECT 'Subject Values Migrated:' AS Status, COUNT(*) AS Count FROM subjects_eav_values;

-- Show sample migrated data
SELECT 'Sample Subject Data:' AS Status;
SELECT 
    e.entity_id,
    e.name,
    a.attribute_name,
    COALESCE(v.value_string, CAST(v.value_number AS CHAR), v.value_text, 
             CAST(v.value_boolean AS CHAR), CAST(v.value_date AS CHAR)) AS value
FROM subjects_eav_entities e
LEFT JOIN subjects_eav_values v ON e.entity_id = v.entity_id
LEFT JOIN subjects_eav_attributes a ON v.attribute_id = a.attribute_id
LIMIT 20;

-- ============================================================================
-- Optional: Clean up old subject data from shared tables
-- UNCOMMENT THE FOLLOWING LINES ONLY AFTER VERIFYING THE MIGRATION
-- ============================================================================

-- DELETE v FROM eav_values v
-- INNER JOIN eav_entities e ON v.entity_id = e.entity_id
-- WHERE e.entity_type = 'subject';

-- DELETE FROM eav_entities WHERE entity_type = 'subject';

-- DELETE a FROM eav_attributes a
-- LEFT JOIN eav_values v ON a.attribute_id = v.attribute_id
-- WHERE v.attribute_id IS NULL;
