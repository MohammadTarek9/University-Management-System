-- 1. Insert maintenance requests as entities
INSERT INTO maintenance_eav_entities (name, created_at, updated_at)
SELECT title, created_at, updated_at FROM maintenance_requests;

-- 2. Insert attribute values for each maintenance request
INSERT INTO maintenance_eav_values (entity_id, attribute_id, value_string, value_text, value_number, value_date)
SELECT
  e.entity_id,
  a.attribute_id,
  -- value_string
  CASE 
    WHEN a.attribute_name = 'title' THEN m.title
    WHEN a.attribute_name = 'category' THEN m.category
    WHEN a.attribute_name = 'priority' THEN m.priority
    WHEN a.attribute_name = 'status' THEN m.status
    WHEN a.attribute_name = 'location_building' THEN m.location_building
    WHEN a.attribute_name = 'location_room_number' THEN m.location_room_number
    WHEN a.attribute_name = 'location_floor' THEN m.location_floor
    ELSE NULL END,
  -- value_text
  CASE 
    WHEN a.attribute_name = 'description' THEN m.description
    WHEN a.attribute_name = 'admin_notes' THEN m.admin_notes
    WHEN a.attribute_name = 'feedback_comment' THEN m.feedback_comment
    ELSE NULL END,
  -- value_number
  CASE 
    WHEN a.attribute_name = 'submitted_by' THEN m.submitted_by
    WHEN a.attribute_name = 'assigned_to' THEN m.assigned_to
    WHEN a.attribute_name = 'feedback_rating' THEN m.feedback_rating
    ELSE NULL END,
  -- value_date
  CASE 
    WHEN a.attribute_name = 'estimated_completion' THEN m.estimated_completion
    WHEN a.attribute_name = 'actual_completion' THEN m.actual_completion
    WHEN a.attribute_name = 'feedback_submitted_at' THEN m.feedback_submitted_at
    ELSE NULL END
FROM maintenance_requests m
JOIN maintenance_eav_entities e ON e.name = m.title
JOIN maintenance_eav_attributes a ON a.attribute_name IN (
  'title', 'description', 'category', 'priority', 'status', 
  'location_building', 'location_room_number', 'location_floor',
  'submitted_by', 'assigned_to', 'estimated_completion', 'actual_completion',
  'admin_notes', 'feedback_rating', 'feedback_comment', 'feedback_submitted_at'
)
ON DUPLICATE KEY UPDATE
  value_string = VALUES(value_string),
  value_text = VALUES(value_text),
  value_number = VALUES(value_number),
  value_date = VALUES(value_date);