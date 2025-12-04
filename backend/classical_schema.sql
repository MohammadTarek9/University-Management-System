USE sql7810552;

-- ===================================================================
-- USERS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT(11) NOT NULL AUTO_INCREMENT,

    first_name VARCHAR(50) NOT NULL,
    last_name  VARCHAR(50) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,

    role ENUM('student','professor','admin','staff','parent','ta')
         DEFAULT 'student',

    student_id  VARCHAR(50) NULL UNIQUE,
    employee_id VARCHAR(50) NULL UNIQUE,
    department  VARCHAR(255) NULL,
    major       VARCHAR(255) NULL,
    phone_number VARCHAR(20) NULL,

    is_active         TINYINT(1) NOT NULL DEFAULT 1,
    is_email_verified TINYINT(1) NOT NULL DEFAULT 0,

    profile_picture VARCHAR(500) DEFAULT '',

    last_login              DATETIME NULL,
    first_login             TINYINT(1) NOT NULL DEFAULT 0,
    must_change_password    TINYINT(1) NOT NULL DEFAULT 0,
    security_question       TEXT NULL,
    security_answer         VARCHAR(255) NULL,
    reset_password_token    VARCHAR(255) NULL,
    reset_password_expire   DATETIME NULL,
    email_verification_token VARCHAR(255) NULL,
    email_verification_expire DATETIME NULL,

    created_at DATETIME NULL,
    updated_at TIMESTAMP NOT NULL
               DEFAULT CURRENT_TIMESTAMP
               ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_users_email       (email),
    INDEX idx_users_role        (role),
    INDEX idx_users_student_id  (student_id),
    INDEX idx_users_employee_id (employee_id),
    INDEX idx_users_is_active   (is_active)
) ENGINE=InnoDB;


-- ===================================================================
-- APPLICATIONS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS applications (
    id INT(11) NOT NULL AUTO_INCREMENT,
    application_id VARCHAR(50) NULL UNIQUE,

    -- Personal Information
    first_name   VARCHAR(50)  NOT NULL,
    last_name    VARCHAR(50)  NOT NULL,
    email        VARCHAR(255) NOT NULL,
    phone        VARCHAR(20)  NOT NULL,
    date_of_birth DATE        NOT NULL,
    nationality   VARCHAR(50) NOT NULL,
    department    ENUM('Computer Science','Engineering','Business Administration',
                       'Medicine','Law','Arts','Sciences','Education','Nursing','Economics')
                  NOT NULL,

    -- Address Information
    address_street   VARCHAR(100) NOT NULL,
    address_city     VARCHAR(50)  NOT NULL,
    address_state    VARCHAR(50)  NOT NULL,
    address_zip_code VARCHAR(20)  NOT NULL,
    address_country  VARCHAR(50)  NOT NULL,

    -- Academic Information
    major             VARCHAR(100) NULL,
    degree_level      ENUM('Bachelor','Master','Doctorate','Certificate') NOT NULL,
    intended_start_date DATE NOT NULL,

    -- Previous Education
    previous_institution VARCHAR(100) NOT NULL,
    previous_degree      VARCHAR(100) NOT NULL,
    graduation_date      DATE NOT NULL,
    gpa                  DECIMAL(3,2) NULL,

    -- Application Status and Processing
    status ENUM('Pending Review','Under Review','Approved','Rejected','Waitlisted')
           DEFAULT 'Pending Review',

    reviewed_by   INT(11) NULL,
    reviewed_at   DATETIME NULL,
    rejection_reason VARCHAR(500) NULL,
    notes            TEXT NULL,

    -- Student Credentials
    student_credentials_student_id        VARCHAR(50)  NULL UNIQUE,
    student_credentials_university_email  VARCHAR(255) NULL UNIQUE,
    student_credentials_temporary_password VARCHAR(255) NULL,
    student_credentials_generated_at       DATETIME NULL,
    student_credentials_generated_by       INT(11) NULL,

    submitted_at   DATETIME NULL,
    last_modified  DATETIME NULL,
    created_at     DATETIME NULL,
    updated_at     TIMESTAMP NOT NULL
                   DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    FOREIGN KEY (student_credentials_generated_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_applications_status      (status),
    INDEX idx_applications_email       (email),
    INDEX idx_applications_department  (department),
    INDEX idx_applications_submitted_at(submitted_at),
    UNIQUE INDEX idx_applications_application_id (application_id),
    UNIQUE INDEX idx_applications_student_id
        (student_credentials_student_id),
    UNIQUE INDEX idx_applications_university_email
        (student_credentials_university_email)
) ENGINE=InnoDB;

-- ===================================================================
-- APPLICATION_DOCUMENTS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS application_documents (
    id INT(11) NOT NULL AUTO_INCREMENT,
    application_id INT(11) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('transcript','recommendation_letter','personal_statement',
              'cv_resume','portfolio','other') NOT NULL,
    file_path   VARCHAR(500) NULL,
    uploaded_at DATETIME NULL,

    PRIMARY KEY (id),

    FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE,

    INDEX idx_documents_application_id (application_id),
    INDEX idx_documents_type           (type)
) ENGINE=InnoDB;

-- ===================================================================
-- ROOMS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS rooms (
    id INT(11) NOT NULL AUTO_INCREMENT,

    name VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('classroom','laboratory','lecture_hall',
              'computer_lab','office','conference_room') NOT NULL,
    capacity INT(11) NOT NULL,

    location_building    VARCHAR(50) NOT NULL,
    location_floor       VARCHAR(10) NOT NULL,
    location_room_number VARCHAR(20) NOT NULL,

    is_active            TINYINT(1) NOT NULL DEFAULT 1,
    maintenance_notes    VARCHAR(500) NULL,
    last_maintenance_date DATE NULL,
    next_maintenance_date DATE NULL,

    created_by INT(11) NOT NULL,
    updated_by INT(11) NULL,

    created_at DATETIME NULL,
    updated_at TIMESTAMP NOT NULL
               DEFAULT CURRENT_TIMESTAMP
               ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),

    UNIQUE INDEX idx_rooms_location
        (location_building, location_floor, location_room_number),
    INDEX idx_rooms_type     (type),
    INDEX idx_rooms_is_active(is_active)
) ENGINE=InnoDB;

-- ===================================================================
-- ROOM_EQUIPMENT TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS room_equipment (
    id INT(11) NOT NULL AUTO_INCREMENT,
    room_id INT(11) NOT NULL,
    name    VARCHAR(255) NOT NULL,
    quantity INT(11) DEFAULT 1,
    condition_status ENUM('excellent','good','fair','poor','needs_repair')
                     DEFAULT 'good',

    PRIMARY KEY (id),

    FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

    INDEX idx_equipment_room_id (room_id),
    INDEX idx_equipment_condition (condition_status)
) ENGINE=InnoDB;

-- ===================================================================
-- ROOM_AMENITIES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS room_amenities (
    id INT(11) NOT NULL AUTO_INCREMENT,
    room_id INT(11) NOT NULL,
    amenity VARCHAR(255) NOT NULL,

    PRIMARY KEY (id),

    FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

    INDEX idx_amenities_room_id (room_id)
) ENGINE=InnoDB;


-- ===================================================================
-- BOOKINGS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS bookings (
    id INT(11) NOT NULL AUTO_INCREMENT,

    room_id INT(11) NOT NULL,
    user_id INT(11) NOT NULL,

    title       VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    start_time  DATETIME NOT NULL,
    end_time    DATETIME NOT NULL,

    status ENUM('approved','cancelled') DEFAULT 'approved',
    attendees INT(11) NOT NULL,

    is_recurring        TINYINT(1) NOT NULL DEFAULT 0,
    recurring_frequency ENUM('daily','weekly','monthly') DEFAULT 'weekly',
    recurring_end_date  DATE NULL,
    recurring_occurrences INT(11) NULL,

    created_by INT(11) NOT NULL,

    created_at DATETIME NULL,
    updated_at TIMESTAMP NOT NULL
               DEFAULT CURRENT_TIMESTAMP
               ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    FOREIGN KEY (room_id)    REFERENCES rooms(id),
    FOREIGN KEY (user_id)    REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),

    INDEX idx_bookings_room_time (room_id, start_time, end_time),
    INDEX idx_bookings_user_created (user_id, created_at),
    INDEX idx_bookings_status (status)
) ENGINE=InnoDB;

-- ===================================================================
-- MAINTENANCE_REQUESTS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id INT(11) NOT NULL AUTO_INCREMENT,

    title       VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    category ENUM('Electrical','Plumbing','HVAC','Furniture','Equipment',
                  'Structural','Cleaning','Other') NOT NULL,
    priority ENUM('Low','Medium','High','Urgent') DEFAULT 'Medium',

    location_building    VARCHAR(255) NOT NULL,
    location_room_number VARCHAR(255) NOT NULL,
    location_floor       VARCHAR(255) NULL,

    submitted_by INT(11) NOT NULL,
    status ENUM('Submitted','In Progress','Completed','Cancelled')
           DEFAULT 'Submitted',
    assigned_to INT(11) NULL,
    estimated_completion DATE NULL,
    actual_completion    DATE NULL,
    admin_notes          TEXT NULL,

    feedback_rating  INT(1) NULL,
    feedback_comment VARCHAR(500) NULL,
    feedback_submitted_at DATETIME NULL,

    created_at DATETIME NULL,
    updated_at TIMESTAMP NOT NULL
               DEFAULT CURRENT_TIMESTAMP
               ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    FOREIGN KEY (submitted_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to)  REFERENCES users(id),

    INDEX idx_maintenance_status      (status),
    INDEX idx_maintenance_submitted_by(submitted_by),
    INDEX idx_maintenance_category    (category),
    INDEX idx_maintenance_priority    (priority),
    INDEX idx_maintenance_created_at  (created_at)
) ENGINE=InnoDB;

-- ===================================================================
-- MAINTENANCE_REQUEST_IMAGES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS maintenance_request_images (
    id INT(11) NOT NULL AUTO_INCREMENT,
    maintenance_request_id INT(11) NOT NULL,
    url      VARCHAR(500) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    uploaded_at DATETIME NULL,

    PRIMARY KEY (id),

    FOREIGN KEY (maintenance_request_id)
        REFERENCES maintenance_requests(id)
        ON DELETE CASCADE,

    INDEX idx_images_maintenance_request_id (maintenance_request_id)
) ENGINE=InnoDB;

/* ---------------------------------------------------------
   SAMPLE USERS AND ADMIN
   --------------------------------------------------------- */
   
   USE sql7810552;

-- System Admin user (password = "password")
INSERT INTO users (
    first_name,
    last_name,
    email,
    password,
    role,
    is_active,
    is_email_verified,
    created_at
) VALUES (
    'System',
    'Administrator',
    'admin@university.edu',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt("password")
    'admin',
    1,
    1,
    NOW()
)
ON DUPLICATE KEY UPDATE email = email;  -- safe to re-run

SET @admin_id = (
    SELECT id FROM users WHERE email = 'admin@university.edu'
);


INSERT INTO users (
    first_name,
    last_name,
    email,
    password,
    role,
    is_active,
    is_email_verified,
    created_at
) VALUES (
    'Test',
    'Student',
    'student1@university.edu',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- same "password"
    'student',
    1,
    0,
    NOW()
)
ON DUPLICATE KEY UPDATE email = email;

SET @student_id = (
    SELECT id FROM users WHERE email = 'student1@university.edu'
);


INSERT INTO rooms (
    name,
    type,
    capacity,
    location_building,
    location_floor,
    location_room_number,
    is_active,
    maintenance_notes,
    created_by,
    created_at
) VALUES
(
    'Main Lecture Hall',
    'lecture_hall',
    200,
    'Main Building',
    '1',
    'LH1',
    1,
    NULL,
    @admin_id,
    NOW()
),
(
    'Computer Lab 101',
    'computer_lab',
    40,
    'Tech Building',
    '1',
    'CL101',
    1,
    NULL,
    @admin_id,
    NOW()
)
ON DUPLICATE KEY UPDATE name = name;  -- safe re-run

-- Capture one room id for later tests
SET @room_id = (
    SELECT id FROM rooms WHERE name = 'Computer Lab 101'
);

INSERT INTO applications (
    application_id,
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    nationality,
    department,
    address_street,
    address_city,
    address_state,
    address_zip_code,
    address_country,
    major,
    degree_level,
    intended_start_date,
    previous_institution,
    previous_degree,
    graduation_date,
    status,
    reviewed_by,
    reviewed_at,
    submitted_at,
    created_at,
    last_modified
) VALUES (
    'APP-2025-TEST01',
    'Test',
    'Student',
    'student1@university.edu',
    '+201001234567',
    '2004-05-10',
    'Egyptian',
    'Engineering',
    '123 Test Street',
    'Cairo',
    'Cairo',
    '12345',
    'Egypt',
    'Computer Engineering',
    'Bachelor',
    '2026-09-01',
    'Test High School',
    'Thanaweya Amma',
    '2022-06-30',
    'Under Review',
    @admin_id,
    NOW(),
    NOW(),
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE application_id = application_id;

INSERT INTO bookings (
    room_id,
    user_id,
    title,
    description,
    start_time,
    end_time,
    status,
    attendees,
    is_recurring,
    recurring_frequency,
    created_by,
    created_at
) VALUES (
    @room_id,
    @student_id,
    'Intro to Programming Class',
    'Weekly lab session for CS101',
    '2025-12-10 10:00:00',
    '2025-12-10 12:00:00',
    'approved',
    30,
    0,
    'weekly',
    @admin_id,
    NOW()
);

INSERT INTO maintenance_requests (
    title,
    description,
    category,
    priority,
    location_building,
    location_room_number,
    location_floor,
    submitted_by,
    status,
    estimated_completion,
    created_at
) VALUES (
    'Projector not working',
    'The projector in CL101 does not turn on.',
    'Equipment',
    'High',
    'Tech Building',
    'CL101',
    '1',
    @student_id,
    'Submitted',
    DATE_ADD(CURDATE(), INTERVAL 3 DAY),
    NOW()
);


SELECT id, first_name, last_name, email, role
FROM users;

SELECT id, name, type, location_building, location_room_number
FROM rooms;

SELECT id, application_id, email, status
FROM applications;

SELECT id, room_id, user_id, title, start_time, end_time
FROM bookings;

SELECT id, title, status, location_building, location_room_number
FROM maintenance_requests;



