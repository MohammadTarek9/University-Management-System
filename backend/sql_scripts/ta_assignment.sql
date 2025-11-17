USE sql7810552;


CREATE TABLE ta_assignments (
    ta_user_id            INT         NOT NULL,
    course_id             INT         NOT NULL,
    responsibility_type   VARCHAR(50) NOT NULL,
    notes                 TEXT        NULL,
    assigned_by_prof_id   INT         NOT NULL,
    created_at            TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP   NULL,
    PRIMARY KEY (ta_user_id, course_id)
);


INSERT INTO ta_assignments (
    ta_user_id,
    course_id,
    responsibility_type,
    notes,
    assigned_by_prof_id
) VALUES (
    5,                 -- TA user id
    10,                -- course id
    'lab',
    'Leads weekly lab',
    18                 -- professor user id
);

SELECT * FROM ta_assignments;

ALTER TABLE ta_assignments
  DROP PRIMARY KEY,
  ADD COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY;

ALTER TABLE ta_assignments
  DROP COLUMN updated_at;



-- All courses with subject_id = 4
SELECT entity_id, attribute_id, value_number
FROM courses_eav_values
WHERE attribute_id IN (31, 32, 33)
  AND entity_id IN (
    SELECT entity_id
    FROM courses_eav_values
    WHERE attribute_id = 31
      AND value_number = 4
  )
ORDER BY entity_id, attribute_id;

-- Which of those rows belong to TAs
SELECT v_instr.entity_id AS course_id,
       v_subj.value_number AS subject_id,
       u.id AS ta_id,
       u.role
FROM courses_eav_values v_instr
JOIN courses_eav_values v_subj
  ON v_subj.entity_id = v_instr.entity_id
 AND v_subj.attribute_id = 31
JOIN users u
  ON u.id = v_instr.value_number
WHERE v_instr.attribute_id = 33      -- TA instructor attribute
  AND v_subj.value_number = 4;       -- subject_id of course 38
