
-- 1. Insert rooms as entities
INSERT INTO rooms_eav_entities (name, is_active, created_at, updated_at)
SELECT name, is_active, created_at, updated_at FROM rooms;

INSERT INTO rooms_eav_values (entity_id, attribute_id, value_string, value_number, value_text, value_boolean, value_date)
SELECT
  e.entity_id,
  a.attribute_id,
      CASE WHEN a.attribute_name = 'room_name' THEN r.name
        WHEN a.attribute_name = 'room_type' THEN r.type
        WHEN a.attribute_name = 'building' THEN r.location_building
        WHEN a.attribute_name = 'floor' THEN r.location_floor
        WHEN a.attribute_name = 'room_number' THEN r.location_room_number
        WHEN a.attribute_name = 'description' THEN r.maintenance_notes
        ELSE NULL END,
  CASE WHEN a.attribute_name = 'capacity' THEN r.capacity
       WHEN a.attribute_name = 'created_by' THEN r.created_by
       WHEN a.attribute_name = 'updated_by' THEN r.updated_by
       ELSE NULL END,
  NULL,
  CASE WHEN a.attribute_name = 'is_active' THEN r.is_active ELSE NULL END,
  CASE WHEN a.attribute_name = 'created_at' THEN r.created_at
       WHEN a.attribute_name = 'updated_at' THEN r.updated_at
       ELSE NULL END
FROM rooms r
JOIN rooms_eav_entities e ON e.name = r.name
JOIN rooms_eav_attributes a ON a.attribute_name IN (
  'room_name', 'room_type', 'capacity', 'building', 'floor', 'room_number', 'description',
  'is_active', 'created_by', 'updated_by', 'created_at', 'updated_at'
)
ON DUPLICATE KEY UPDATE
  value_string = VALUES(value_string),
  value_number = VALUES(value_number),
  value_text = VALUES(value_text),
  value_boolean = VALUES(value_boolean),
  value_date = VALUES(value_date);

INSERT INTO rooms_eav_values (entity_id, attribute_id, value_text)
SELECT
  e.entity_id,
  a.attribute_id,
  CONCAT('[', GROUP_CONCAT(CONCAT('{"name":"', eq.name, '","quantity":', eq.quantity, ',"condition":"', eq.condition_status, '"}')), ']')
FROM rooms r
JOIN rooms_eav_entities e ON e.name = r.name
JOIN room_equipment eq ON eq.room_id = r.id
JOIN rooms_eav_attributes a ON a.attribute_name = 'equipment'
GROUP BY r.id, e.entity_id, a.attribute_id
ON DUPLICATE KEY UPDATE value_text = VALUES(value_text);

INSERT INTO rooms_eav_values (entity_id, attribute_id, value_text)
SELECT
  e.entity_id,
  a.attribute_id,
  CONCAT('[', GROUP_CONCAT(CONCAT('"', am.amenity, '"')), ']')
FROM rooms r
JOIN rooms_eav_entities e ON e.name = r.name
JOIN room_amenities am ON am.room_id = r.id
JOIN rooms_eav_attributes a ON a.attribute_name = 'amenities'
GROUP BY r.id, e.entity_id, a.attribute_id
ON DUPLICATE KEY UPDATE value_text = VALUES(value_text);