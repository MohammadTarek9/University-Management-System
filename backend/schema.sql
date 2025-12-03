-- CREATE DATABASE university_mgmt
  -- CHARACTER SET utf8mb4
  -- COLLATE utf8mb4_unicode_ci;
  
  -- SHOW databases;
  
-- USE university_mgmt;
  
-- CREATE USER 'uni_user'@'%' IDENTIFIED BY 'user_root';
  
-- GRANT ALL PRIVILEGES ON university_mgmt.* TO 'uni_user'@'%';
-- FLUSH PRIVILEGES;
    
-- SHOW GRANTS FOR 'uni_user'@'%';

-- USE university_mgmt;

USE sql7810552;


CREATE TABLE entity_types (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    code  VARCHAR(50)  NOT NULL UNIQUE,  -- e.g. 'user', 'room'
    label VARCHAR(100) NOT NULL          -- human readable: 'User', 'Room'
) ENGINE=InnoDB;

CREATE TABLE entities (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    entity_type_id INT NOT NULL,
    natural_key    VARCHAR(150),

    created_at     TIMESTAMP NULL DEFAULT NULL,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_entities_entitytype
      FOREIGN KEY (entity_type_id) REFERENCES entity_types(id),

    UNIQUE KEY uq_entitytype_naturalkey (entity_type_id, natural_key)
) ENGINE=InnoDB;



CREATE TABLE attributes (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    entity_type_id INT NOT NULL,
    name           VARCHAR(150) NOT NULL,   -- e.g. 'firstName', 'roomType'
    label          VARCHAR(150) NOT NULL,   -- human readable label
    data_type      ENUM('string','number','date','boolean') NOT NULL,
    is_required    TINYINT(1) NOT NULL DEFAULT 0,
    is_unique      TINYINT(1) NOT NULL DEFAULT 0,

    CONSTRAINT fk_attributes_entitytype
      FOREIGN KEY (entity_type_id) REFERENCES entity_types(id),

    UNIQUE KEY uq_entitytype_attrname (entity_type_id, name)
) ENGINE=InnoDB;

CREATE TABLE entity_values (
    entity_id    INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string TEXT,
    value_number DECIMAL(18,4),
    value_date   DATETIME,
    value_bool   TINYINT(1),

    PRIMARY KEY (entity_id, attribute_id),

    CONSTRAINT fk_ev_entity
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    CONSTRAINT fk_ev_attribute
      FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SHOW TABLES;

INSERT INTO entity_types (code, label) VALUES
('user', 'User'),
('room', 'Room'),
('booking', 'Booking'),
('maintenance_request', 'Maintenance Request'),
('application', 'Application');

SELECT * FROM entity_types;


-- USE university_mgmt;

SELECT id, code, label
FROM entity_types;

-- User Attributes

-- USE university_mgmt;

-- Get the ID of the 'user' entity type
SET @user_type_id = (
  SELECT id FROM entity_types
  WHERE code = 'user'
  LIMIT 1
);

-- Insert attributes that mirror the User mongoose schema
INSERT INTO attributes
(entity_type_id, name, label, data_type, is_required, is_unique)
VALUES
-- Basic identity
(@user_type_id, 'firstName',           'First Name',                'string', 1, 0),
(@user_type_id, 'lastName',            'Last Name',                 'string', 1, 0),
(@user_type_id, 'email',               'Email',                     'string', 1, 1),

-- Auth
(@user_type_id, 'password',            'Password (hashed)',         'string', 1, 0),
(@user_type_id, 'role',                'Role',                      'string', 1, 0),

-- IDs
(@user_type_id, 'studentId',           'Student ID',                'string', 0, 1),
(@user_type_id, 'employeeId',          'Employee ID',               'string', 0, 1),

-- Academic / department info
(@user_type_id, 'department',          'Department',                'string', 0, 0),
(@user_type_id, 'major',               'Major',                     'string', 0, 0),

-- Contact
(@user_type_id, 'phoneNumber',         'Phone Number',              'string', 0, 0),

-- Status flags
(@user_type_id, 'isActive',            'Is Active',                 'boolean',1, 0),
(@user_type_id, 'isEmailVerified',     'Is Email Verified',         'boolean',0, 0),

-- Profile & login info
(@user_type_id, 'profilePicture',      'Profile Picture URL',       'string', 0, 0),
(@user_type_id, 'lastLogin',           'Last Login',                'date',   0, 0),
(@user_type_id, 'firstLogin',          'First Login',               'boolean',0, 0),
(@user_type_id, 'mustChangePassword',  'Must Change Password',      'boolean',0, 0),

-- Security question / answer
(@user_type_id, 'securityQuestion',    'Security Question',         'string', 0, 0),
(@user_type_id, 'securityAnswer',      'Security Answer (hashed)',  'string', 0, 0),

-- Password reset flow
(@user_type_id, 'resetPasswordToken',  'Reset Password Token',      'string', 0, 0),
(@user_type_id, 'resetPasswordExpire', 'Reset Password Expire',     'date',   0, 0),

-- Email verification flow
(@user_type_id, 'emailVerificationToken',  'Email Verification Token',  'string', 0, 0),
(@user_type_id, 'emailVerificationExpire', 'Email Verification Expire', 'date',   0, 0),

-- Timestamps
(@user_type_id, 'createdAt',           'Created At',                'date',   0, 0),
(@user_type_id, 'updatedAt',           'Updated At',                'date',   0, 0);


SELECT id, name, data_type, is_required, is_unique
FROM attributes
WHERE entity_type_id = @user_type_id;

-- Room Attributes
-- USE university_mgmt;

-- Get the ID of the 'room' entity type
SET @room_type_id = (
  SELECT id FROM entity_types
  WHERE code = 'room'
  LIMIT 1
);

-- Insert attributes that mirror the Room mongoose schema
INSERT INTO attributes
(entity_type_id, name, label, data_type, is_required, is_unique)
VALUES
-- Basic fields
(@room_type_id, 'name',                 'Name',                        'string', 1, 1),
(@room_type_id, 'type',                 'Type',                        'string', 1, 0),
(@room_type_id, 'capacity',             'Capacity',                    'number', 1, 0),

-- Location (nested object -> dot notation)
(@room_type_id, 'location.building',    'Location Building',           'string', 1, 0),
(@room_type_id, 'location.floor',       'Location Floor',              'string', 1, 0),
(@room_type_id, 'location.roomNumber',  'Location Room Number',        'string', 1, 0),

-- Arrays (stored as JSON strings to keep the same shape in backend)
(@room_type_id, 'equipment',            'Equipment List (JSON)',       'string', 0, 0),
(@room_type_id, 'amenities',            'Amenities List (JSON)',       'string', 0, 0),

-- Status & maintenance
(@room_type_id, 'isActive',             'Is Active',                   'boolean',0, 0),
(@room_type_id, 'maintenanceNotes',     'Maintenance Notes',           'string', 0, 0),
(@room_type_id, 'lastMaintenanceDate',  'Last Maintenance Date',       'date',   0, 0),
(@room_type_id, 'nextMaintenanceDate',  'Next Maintenance Date',       'date',   0, 0),

-- References to User (store ObjectId as string)
(@room_type_id, 'createdBy',            'Created By (User ID)',        'string', 1, 0),
(@room_type_id, 'updatedBy',            'Updated By (User ID)',        'string', 0, 0),

-- timestamps
(@room_type_id, 'createdAt',            'Created At',                  'date',   0, 0),
(@room_type_id, 'updatedAt',            'Updated At',                  'date',   0, 0);

SELECT id, name, data_type
FROM attributes
WHERE entity_type_id = @room_type_id;

-- Booking Attributes
-- USE university_mgmt;

-- Get the ID of the 'booking' entity type
SET @booking_type_id = (
  SELECT id FROM entity_types
  WHERE code = 'booking'
  LIMIT 1
);

-- Insert attributes that mirror the Booking mongoose schema
INSERT INTO attributes
(entity_type_id, name, label, data_type, is_required, is_unique)
VALUES
-- References
(@booking_type_id, 'room',                 'Room ID',                        'string', 1, 0),
(@booking_type_id, 'user',                 'User ID',                        'string', 1, 0),

-- Core booking info
(@booking_type_id, 'title',                'Title',                          'string', 1, 0),
(@booking_type_id, 'description',          'Description',                    'string', 0, 0),

-- Time range
(@booking_type_id, 'startTime',            'Start Time',                     'date',   1, 0),
(@booking_type_id, 'endTime',              'End Time',                       'date',   1, 0),

-- Status
(@booking_type_id, 'status',               'Status',                         'string', 0, 0),

-- Attendees
(@booking_type_id, 'attendees',            'Attendees',                      'number', 1, 0),

-- Recurring (nested object -> dot notation)
(@booking_type_id, 'recurring.isRecurring','Recurring: Is Recurring',        'boolean',0, 0),
(@booking_type_id, 'recurring.frequency',  'Recurring: Frequency',           'string', 0, 0),
(@booking_type_id, 'recurring.endDate',    'Recurring: End Date',            'date',   0, 0),
(@booking_type_id, 'recurring.occurrences','Recurring: Occurrences',         'number', 0, 0),

-- Created by (user)
(@booking_type_id, 'createdBy',            'Created By (User ID)',           'string', 1, 0),

-- timestamps 
(@booking_type_id, 'createdAt',            'Created At',                     'date',   0, 0),
(@booking_type_id, 'updatedAt',            'Updated At',                     'date',   0, 0);

SELECT id, name, data_type, is_required
FROM attributes
WHERE entity_type_id = @booking_type_id;


-- Maintenence Request Attributes
-- USE university_mgmt;

-- Get the ID of the 'maintenance_request' entity type
SET @maint_type_id = (
  SELECT id FROM entity_types
  WHERE code = 'maintenance_request'
  LIMIT 1
);

-- Insert attributes that mirror the MaintenanceRequest mongoose schema

INSERT INTO attributes
(entity_type_id, name, label, data_type, is_required, is_unique)
VALUES

-- Core fields
(@maint_type_id, 'title',                'Title',                         'string', 1, 0),
(@maint_type_id, 'description',          'Description',                   'string', 1, 0),
(@maint_type_id, 'category',             'Category',                      'string', 1, 0),
(@maint_type_id, 'priority',             'Priority',                      'string', 0, 0),

-- Location (nested object)
(@maint_type_id, 'location.building',    'Location Building',             'string', 1, 0),
(@maint_type_id, 'location.roomNumber',  'Location Room Number',          'string', 1, 0),
(@maint_type_id, 'location.floor',       'Location Floor',                'string', 0, 0),

-- Relations to users
(@maint_type_id, 'submittedBy',          'Submitted By (User ID)',        'string', 1, 0),
(@maint_type_id, 'assignedTo',           'Assigned To (User ID)',         'string', 0, 0),

-- Status
(@maint_type_id, 'status',               'Status',                        'string', 0, 0),

-- Images array -> store as JSON string
(@maint_type_id, 'images',               'Images JSON',                  'string', 0, 0),

-- Completion tracking
(@maint_type_id, 'estimatedCompletion', 'Estimated Completion',          'date',   0, 0),
(@maint_type_id, 'actualCompletion',    'Actual Completion',             'date',   0, 0),

-- Admin notes
(@maint_type_id, 'adminNotes',           'Admin Notes',                  'string', 0, 0),

-- User feedback (nested object)
(@maint_type_id, 'userFeedback.rating',     'User Feedback Rating',       'number', 0, 0),
(@maint_type_id, 'userFeedback.comment',    'User Feedback Comment',      'string', 0, 0),
(@maint_type_id, 'userFeedback.submittedAt','User Feedback Submitted At', 'date',   0, 0),

-- Mongoose timestamps
(@maint_type_id, 'createdAt',           'Created At',                    'date',   0, 0),
(@maint_type_id, 'updatedAt',           'Updated At',                    'date',   0, 0);

SELECT id, name, data_type, is_required
FROM attributes
WHERE entity_type_id = @maint_type_id;

-- Application Attributes
-- USE university_mgmt;

-- Get the ID of the 'application' entity type
SET @application_type_id = (
  SELECT id FROM entity_types
  WHERE code = 'application'
  LIMIT 1
);

-- Insert attributes that mirror the Application mongoose schema
INSERT INTO attributes
(entity_type_id, name, label, data_type, is_required, is_unique)
VALUES
-- =========================
-- Personal Info
-- =========================
(@application_type_id, 'personalInfo.firstName',       'First Name',                     'string', 1, 0),
(@application_type_id, 'personalInfo.lastName',        'Last Name',                      'string', 1, 0),
(@application_type_id, 'personalInfo.email',           'Email',                          'string', 1, 1),
(@application_type_id, 'personalInfo.phone',           'Phone Number',                   'string', 1, 0),
(@application_type_id, 'personalInfo.dateOfBirth',     'Date of Birth',                  'date',   1, 0),
(@application_type_id, 'personalInfo.nationality',     'Nationality',                    'string', 1, 0),
(@application_type_id, 'personalInfo.department',      'Department',                     'string', 1, 0),

-- Address (nested)
(@application_type_id, 'personalInfo.address.street',  'Street Address',                 'string', 1, 0),
(@application_type_id, 'personalInfo.address.city',    'City',                           'string', 1, 0),
(@application_type_id, 'personalInfo.address.state',   'State/Province',                 'string', 1, 0),
(@application_type_id, 'personalInfo.address.zipCode', 'ZIP / Postal Code',              'string', 1, 0),
(@application_type_id, 'personalInfo.address.country', 'Country',                        'string', 1, 0),

-- =========================
-- Academic Info
-- =========================
(@application_type_id, 'academicInfo.major',                          'Major',                         'string', 0, 0),
(@application_type_id, 'academicInfo.degreeLevel',                    'Degree Level',                  'string', 1, 0),
(@application_type_id, 'academicInfo.intendedStartDate',             'Intended Start Date',           'date',   1, 0),

-- Previous education (nested)
(@application_type_id, 'academicInfo.previousEducation.institution',  'Previous Institution',          'string', 1, 0),
(@application_type_id, 'academicInfo.previousEducation.degree',      'Previous Degree',               'string', 1, 0),
(@application_type_id, 'academicInfo.previousEducation.graduationDate','Graduation Date',             'date',   1, 0),
(@application_type_id, 'academicInfo.previousEducation.gpa',         'GPA',                           'number', 0, 0),

-- =========================
-- Status
-- =========================
(@application_type_id, 'status',                                      'Status',                       'string', 0, 0),

-- =========================
-- Documents (array stored as JSON string)
-- =========================
(@application_type_id, 'documents',                                   'Documents (JSON)',             'string', 0, 0),

-- =========================
-- Processing Info
-- =========================
(@application_type_id, 'processingInfo.reviewedBy',                   'Reviewed By (User ID)',        'string', 0, 0),
(@application_type_id, 'processingInfo.reviewedAt',                   'Reviewed At',                  'date',   0, 0),
(@application_type_id, 'processingInfo.rejectionReason',              'Rejection Reason',             'string', 0, 0),
(@application_type_id, 'processingInfo.notes',                        'Processing Notes',             'string', 0, 0),

-- =========================
-- Student Credentials
-- =========================
(@application_type_id, 'studentCredentials.studentId',                'Student ID',                   'string', 0, 1),
(@application_type_id, 'studentCredentials.universityEmail',          'University Email',             'string', 0, 1),
(@application_type_id, 'studentCredentials.temporaryPassword',        'Temporary Password',           'string', 0, 0),
(@application_type_id, 'studentCredentials.credentialsGeneratedAt',   'Credentials Generated At',     'date',   0, 0),
(@application_type_id, 'studentCredentials.credentialsGeneratedBy',   'Credentials Generated By (User ID)','string', 0, 0),

-- =========================
-- Application Metadata
-- =========================
(@application_type_id, 'applicationId',                               'Application ID',               'string', 0, 1),
(@application_type_id, 'submittedAt',                                 'Submitted At',                 'date',   0, 0),
(@application_type_id, 'lastModified',                                'Last Modified',                'date',   0, 0),

-- timestamps
(@application_type_id, 'createdAt',                                   'Created At',                   'date',   0, 0),
(@application_type_id, 'updatedAt',                                   'Updated At',                   'date',   0, 0);


-- TESTING USER MODEL --
SELECT id
FROM entity_types
WHERE code = 'user';

-- USE university_mgmt;

-- 1) Get the user entity_type_id
SET @user_type_id = (
  SELECT id FROM entity_types
  WHERE code = 'user'
  LIMIT 1
);

-- 2) Insert one dummy user entity (natural_key = email)
INSERT INTO entities (entity_type_id, natural_key)
VALUES (@user_type_id, 'test.user@example.com');

-- 3) Capture the new entity ID
SET @user_entity_id = LAST_INSERT_ID();

SELECT * FROM entities WHERE id = @user_entity_id;

-- INSERTING ATTRIBUTES FOR TEST USER

-- firstName
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @user_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @user_type_id AND name = 'firstName'),
  'Test', NULL, NULL, NULL
);

-- lastName
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @user_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @user_type_id AND name = 'lastName'),
  'User', NULL, NULL, NULL
);

-- email
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @user_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @user_type_id AND name = 'email'),
  'test.user@example.com', NULL, NULL, NULL
);

-- password (store a fake hash for now)
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @user_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @user_type_id AND name = 'password'),
  '$2b$10$DummyHashForTestingOnly', NULL, NULL, NULL
);

-- role
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @user_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @user_type_id AND name = 'role'),
  'student', NULL, NULL, NULL
);

-- department
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @user_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @user_type_id AND name = 'department'),
  'Engineering', NULL, NULL, NULL
);


-- phoneNumber
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @user_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @user_type_id AND name = 'phoneNumber'),
  '01000000000', NULL, NULL, NULL
);

-- isActive (bool = 1)
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @user_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @user_type_id AND name = 'isActive'),
  NULL, NULL, NULL, 1
);

-- isEmailVerified (bool = 1)
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @user_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @user_type_id AND name = 'isEmailVerified'),
  NULL, NULL, NULL, 1
);

SELECT 
  a.name,
  ev.value_string,
  ev.value_number,
  ev.value_date,
  ev.value_bool
FROM entity_values ev
JOIN attributes a ON ev.attribute_id = a.id
WHERE ev.entity_id = @user_entity_id
ORDER BY a.name;

-- TEST ROOM MODEL --

-- USE university_mgmt;

-- 1) Get the room entity_type_id
SET @room_type_id = (
  SELECT id FROM entity_types
  WHERE code = 'room'
  LIMIT 1
);

-- 2) Insert one dummy room entity (natural_key = room name)
INSERT INTO entities (entity_type_id, natural_key)
VALUES (@room_type_id, 'Room A-101');

-- 3) Capture the new room entity ID
SET @room_entity_id = LAST_INSERT_ID();

SELECT * FROM entities WHERE id = @room_entity_id;

-- name
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'name'),
  'Room A-101', NULL, NULL, NULL
);

-- type
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'type'),
  'Lecture Hall', NULL, NULL, NULL
);

-- capacity (number)
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'capacity'),
  NULL, 80, NULL, NULL
);

-- location.building
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'location.building'),
  'Main Building', NULL, NULL, NULL
);

-- location.floor
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'location.floor'),
  '1', NULL, NULL, NULL
);

-- location.roomNumber
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'location.roomNumber'),
  'A-101', NULL, NULL, NULL
);

-- equipment (JSON string)
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'equipment'),
  '[\"Projector\", \"Whiteboard\", \"Sound System\"]', NULL, NULL, NULL
);

-- amenities (JSON string)
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'amenities'),
  '[\"AC\", \"WiFi\"]', NULL, NULL, NULL
);

-- isActive (bool = 1)
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'isActive'),
  NULL, NULL, NULL, 1
);

-- maintenanceNotes
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'maintenanceNotes'),
  'Projector lamp due for replacement next semester.', NULL, NULL, NULL
);

-- lastMaintenanceDate
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'lastMaintenanceDate'),
  NULL, NULL, NOW() - INTERVAL 30 DAY, NULL
);

-- nextMaintenanceDate
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'nextMaintenanceDate'),
  NULL, NULL, NOW() + INTERVAL 60 DAY, NULL
);

-- createdBy (dummy user id string)
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'createdBy'),
  'dummyUserId123', NULL, NULL, NULL
);

-- updatedBy (same dummy for now)
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'updatedBy'),
  'dummyUserId123', NULL, NULL, NULL
);

-- createdAt
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'createdAt'),
  NULL, NULL, NOW(), NULL
);

-- updatedAt
INSERT INTO entity_values (entity_id, attribute_id, value_string, value_number, value_date, value_bool)
VALUES (
  @room_entity_id,
  (SELECT id FROM attributes WHERE entity_type_id = @room_type_id AND name = 'updatedAt'),
  NULL, NULL, NOW(), NULL
);

SELECT 
  a.name,
  ev.value_string,
  ev.value_number,
  ev.value_date,
  ev.value_bool
FROM entity_values ev
JOIN attributes a ON ev.attribute_id = a.id
WHERE ev.entity_id = @room_entity_id
ORDER BY a.name;

















