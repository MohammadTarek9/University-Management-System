-- Fix NULL values in eav_attributes table
-- Update created_at for all attributes
-- Add descriptions for attributes
USE sql7810552;

-- Disable safe update mode temporarily
SET SQL_SAFE_UPDATES = 0;

-- Set created_at to current timestamp for all NULL values
UPDATE eav_attributes 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- Add descriptions based on attribute names
-- Room attributes
UPDATE eav_attributes SET description = 'Name of the room' WHERE attribute_name = 'room_name' AND description IS NULL;
UPDATE eav_attributes SET description = 'Building where the room is located' WHERE attribute_name = 'building' AND description IS NULL;
UPDATE eav_attributes SET description = 'Floor level of the room' WHERE attribute_name = 'floor' AND description IS NULL;
UPDATE eav_attributes SET description = 'Room number identifier' WHERE attribute_name = 'room_number' AND description IS NULL;
UPDATE eav_attributes SET description = 'Maximum capacity of the room' WHERE attribute_name = 'capacity' AND description IS NULL;
UPDATE eav_attributes SET description = 'Type of room (classroom, laboratory, lecture hall, etc.)' WHERE attribute_name = 'room_type' AND description IS NULL;
UPDATE eav_attributes SET description = 'Additional notes or description about the room' WHERE attribute_name = 'description' AND description IS NULL;
UPDATE eav_attributes SET description = 'List of equipment available in the room' WHERE attribute_name = 'equipment' AND description IS NULL;
UPDATE eav_attributes SET description = 'List of amenities available in the room' WHERE attribute_name = 'amenities' AND description IS NULL;
UPDATE eav_attributes SET description = 'Type-specific attributes for specialized rooms' WHERE attribute_name = 'type_specific' AND description IS NULL;

-- Room equipment attributes (indexed)
UPDATE eav_attributes SET description = 'Name of equipment item' WHERE attribute_name LIKE 'equipment_%_name' AND description IS NULL;
UPDATE eav_attributes SET description = 'Quantity of equipment item' WHERE attribute_name LIKE 'equipment_%_quantity' AND description IS NULL;
UPDATE eav_attributes SET description = 'Condition of equipment item' WHERE attribute_name LIKE 'equipment_%_condition' AND description IS NULL;
UPDATE eav_attributes SET description = 'Equipment identifier' WHERE attribute_name LIKE 'equipment_%' AND attribute_name NOT LIKE 'equipment_%_%' AND description IS NULL;

-- Room amenity attributes
UPDATE eav_attributes SET description = 'Amenity available in the room' WHERE attribute_name LIKE 'amenity_%' AND description IS NULL;

-- Room type-specific attributes
UPDATE eav_attributes SET description = 'Laboratory: Number of fume hoods' WHERE attribute_name = 'typespec_fumeHoodsCount' AND description IS NULL;
UPDATE eav_attributes SET description = 'Laboratory: Type of laboratory (Chemistry, Biology, Physics, etc.)' WHERE attribute_name = 'typespec_labType' AND description IS NULL;
UPDATE eav_attributes SET description = 'Laboratory: Safety equipment available' WHERE attribute_name = 'typespec_safetyEquipment' AND description IS NULL;
UPDATE eav_attributes SET description = 'Laboratory: Chemical storage available' WHERE attribute_name = 'typespec_chemicalStorage' AND description IS NULL;
UPDATE eav_attributes SET description = 'Laboratory: Emergency shower available' WHERE attribute_name = 'typespec_emergencyShower' AND description IS NULL;
UPDATE eav_attributes SET description = 'Laboratory: Eye wash station available' WHERE attribute_name = 'typespec_eyeWashStation' AND description IS NULL;
UPDATE eav_attributes SET description = 'Laboratory: Hazmat certified facility' WHERE attribute_name = 'typespec_hazmatCertified' AND description IS NULL;

UPDATE eav_attributes SET description = 'Computer Lab: Number of computers' WHERE attribute_name = 'typespec_computersCount' AND description IS NULL;
UPDATE eav_attributes SET description = 'Computer Lab: Hardware specifications' WHERE attribute_name = 'typespec_hardwareSpecs' AND description IS NULL;
UPDATE eav_attributes SET description = 'Computer Lab: Installed software' WHERE attribute_name = 'typespec_softwareInstalled' AND description IS NULL;
UPDATE eav_attributes SET description = 'Computer Lab: Network type (wired, wireless, both)' WHERE attribute_name = 'typespec_networkType' AND description IS NULL;
UPDATE eav_attributes SET description = 'Computer Lab: Printer available' WHERE attribute_name = 'typespec_printerAvailable' AND description IS NULL;
UPDATE eav_attributes SET description = 'Computer Lab: Scanner available' WHERE attribute_name = 'typespec_scannerAvailable' AND description IS NULL;

UPDATE eav_attributes SET description = 'Lecture Hall: Seating arrangement type' WHERE attribute_name = 'typespec_seatingArrangement' AND description IS NULL;
UPDATE eav_attributes SET description = 'Lecture Hall: Projector type and specifications' WHERE attribute_name = 'typespec_projectorType' AND description IS NULL;
UPDATE eav_attributes SET description = 'Lecture Hall: Audio-visual equipment available' WHERE attribute_name = 'typespec_avEquipment' AND description IS NULL;
UPDATE eav_attributes SET description = 'Lecture Hall: Sound system specifications' WHERE attribute_name = 'typespec_soundSystem' AND description IS NULL;
UPDATE eav_attributes SET description = 'Lecture Hall: Number of whiteboards' WHERE attribute_name = 'typespec_whiteboardCount' AND description IS NULL;
UPDATE eav_attributes SET description = 'Lecture Hall: Recording capability available' WHERE attribute_name = 'typespec_recordingCapable' AND description IS NULL;
UPDATE eav_attributes SET description = 'Lecture Hall: Document camera available' WHERE attribute_name = 'typespec_documentCamera' AND description IS NULL;

UPDATE eav_attributes SET description = 'Office: Name of occupant' WHERE attribute_name = 'typespec_occupantName' AND description IS NULL;
UPDATE eav_attributes SET description = 'Office: Phone extension number' WHERE attribute_name = 'typespec_phoneExtension' AND description IS NULL;
UPDATE eav_attributes SET description = 'Office: Access control type (key, card, biometric, code)' WHERE attribute_name = 'typespec_accessControlType' AND description IS NULL;
UPDATE eav_attributes SET description = 'Office: Number of windows' WHERE attribute_name = 'typespec_windowCount' AND description IS NULL;
UPDATE eav_attributes SET description = 'Office: Number of network ports' WHERE attribute_name = 'typespec_networkPorts' AND description IS NULL;
UPDATE eav_attributes SET description = 'Office: List of furniture items' WHERE attribute_name = 'typespec_furnitureList' AND description IS NULL;

UPDATE eav_attributes SET description = 'Studio: Type of studio (Art, Music, Video Production, etc.)' WHERE attribute_name = 'typespec_studioType' AND description IS NULL;
UPDATE eav_attributes SET description = 'Studio: Number of power outlets' WHERE attribute_name = 'typespec_powerOutletsCount' AND description IS NULL;
UPDATE eav_attributes SET description = 'Studio: Specialized equipment list' WHERE attribute_name = 'typespec_equipmentList' AND description IS NULL;
UPDATE eav_attributes SET description = 'Studio: Specialized lighting setup' WHERE attribute_name = 'typespec_specializedLighting' AND description IS NULL;
UPDATE eav_attributes SET description = 'Studio: Available storage space' WHERE attribute_name = 'typespec_storageSpace' AND description IS NULL;

-- Course attributes
UPDATE eav_attributes SET description = 'Course code identifier' WHERE attribute_name = 'course_code' AND description IS NULL;
UPDATE eav_attributes SET description = 'Course title/name' WHERE attribute_name = 'course_name' AND description IS NULL;
UPDATE eav_attributes SET description = 'Subject the course belongs to' WHERE attribute_name = 'subject_id' AND description IS NULL;
UPDATE eav_attributes SET description = 'Number of credit hours' WHERE attribute_name = 'credit_hours' AND description IS NULL;
UPDATE eav_attributes SET description = 'Course description' WHERE attribute_name = 'course_description' AND description IS NULL;
UPDATE eav_attributes SET description = 'Instructor teaching the course' WHERE attribute_name = 'instructor' AND description IS NULL;
UPDATE eav_attributes SET description = 'Semester when course is offered' WHERE attribute_name = 'semester' AND description IS NULL;
UPDATE eav_attributes SET description = 'Year when course is offered' WHERE attribute_name = 'year' AND description IS NULL;
UPDATE eav_attributes SET description = 'Course schedule details' WHERE attribute_name = 'schedule' AND description IS NULL;
UPDATE eav_attributes SET description = 'Room where course is held' WHERE attribute_name = 'room' AND description IS NULL;
UPDATE eav_attributes SET description = 'Maximum enrollment capacity' WHERE attribute_name = 'max_enrollment' AND description IS NULL;
UPDATE eav_attributes SET description = 'Current enrollment count' WHERE attribute_name = 'current_enrollment' AND description IS NULL;
UPDATE eav_attributes SET description = 'Course status (active, inactive, archived)' WHERE attribute_name = 'status' AND description IS NULL;

-- Subject attributes
UPDATE eav_attributes SET description = 'Subject code identifier' WHERE attribute_name = 'subject_code' AND description IS NULL;
UPDATE eav_attributes SET description = 'Subject name' WHERE attribute_name = 'subject_name' AND description IS NULL;
UPDATE eav_attributes SET description = 'Department the subject belongs to' WHERE attribute_name = 'department_id' AND description IS NULL;
UPDATE eav_attributes SET description = 'Subject description' WHERE attribute_name = 'subject_description' AND description IS NULL;
UPDATE eav_attributes SET description = 'Head of department' WHERE attribute_name = 'department_head' AND description IS NULL;

-- Maintenance request attributes
UPDATE eav_attributes SET description = 'Type of maintenance issue' WHERE attribute_name = 'issue_type' AND description IS NULL;
UPDATE eav_attributes SET description = 'Category of maintenance request' WHERE attribute_name = 'category' AND description IS NULL;
UPDATE eav_attributes SET description = 'Priority level of request' WHERE attribute_name = 'priority' AND description IS NULL;
UPDATE eav_attributes SET description = 'Severity level of issue' WHERE attribute_name = 'severity' AND description IS NULL;
UPDATE eav_attributes SET description = 'Location of maintenance issue' WHERE attribute_name = 'location' AND description IS NULL;
UPDATE eav_attributes SET description = 'Current status of request' WHERE attribute_name = 'status' AND description IS NULL;
UPDATE eav_attributes SET description = 'User who reported the issue' WHERE attribute_name = 'reported_by' AND description IS NULL;
UPDATE eav_attributes SET description = 'Staff assigned to handle request' WHERE attribute_name = 'assigned_to' AND description IS NULL;
UPDATE eav_attributes SET description = 'Date when request was submitted' WHERE attribute_name = 'submitted_date' AND description IS NULL;
UPDATE eav_attributes SET description = 'Date when request was completed' WHERE attribute_name = 'completed_date' AND description IS NULL;
UPDATE eav_attributes SET description = 'Estimated completion date' WHERE attribute_name = 'estimated_completion' AND description IS NULL;
UPDATE eav_attributes SET description = 'Notes or additional details' WHERE attribute_name = 'notes' AND description IS NULL;

-- Generic attributes
UPDATE eav_attributes SET description = 'Availability status' WHERE attribute_name = 'is_available' AND description IS NULL;
UPDATE eav_attributes SET description = 'Date of creation' WHERE attribute_name = 'date_created' AND description IS NULL;
UPDATE eav_attributes SET description = 'Last update timestamp' WHERE attribute_name = 'last_updated' AND description IS NULL;

-- Catch-all for any remaining NULL descriptions
UPDATE eav_attributes 
SET description = CONCAT('Attribute: ', attribute_name) 
WHERE description IS NULL;

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;
