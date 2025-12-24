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


USE `sql7810552`;

START TRANSACTION;

-- 1) Fix course_materials FK: eav_entities -> courses_eav_entities
ALTER TABLE course_materials
  DROP FOREIGN KEY course_materials_ibfk_1;

ALTER TABLE course_materials
  ADD CONSTRAINT fk_course_materials_course
  FOREIGN KEY (course_id) REFERENCES courses_eav_entities(entity_id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 2) Fix enrollments FK: eav_entities -> courses_eav_entities
ALTER TABLE enrollments
  DROP FOREIGN KEY enrollments_ibfk_2;

ALTER TABLE enrollments
  ADD CONSTRAINT fk_enrollments_course
  FOREIGN KEY (course_id) REFERENCES courses_eav_entities(entity_id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

COMMIT;

SELECT *
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'sql7810552'
  AND REFERENCED_TABLE_NAME = 'eav_entities';

