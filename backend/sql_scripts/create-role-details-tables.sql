-- Create role-specific tables for storing student_id, employee_id, etc.
-- This normalizes role-specific attributes that are required and fixed

USE sql7810552;

-- Disable safe update mode
SET SQL_SAFE_UPDATES = 0;

-- Step 1: Create student_details table
CREATE TABLE IF NOT EXISTS student_details (
  user_id INT PRIMARY KEY,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  enrollment_date DATE,
  major VARCHAR(100),
  year INT,
  gpa DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 2: Create employee_details table (for staff, professors, admin)
CREATE TABLE IF NOT EXISTS employee_details (
  user_id INT PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100),
  hire_date DATE,
  position VARCHAR(100),
  office_location VARCHAR(100),
  phone_extension VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 3: Create indexes for better query performance
CREATE INDEX idx_student_id ON student_details(student_id);
CREATE INDEX idx_employee_id ON employee_details(employee_id);
CREATE INDEX idx_student_major ON student_details(major);
CREATE INDEX idx_employee_dept ON employee_details(department);

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Verification queries (run these separately to check):
-- SELECT * FROM student_details;
-- SELECT * FROM employee_details;
-- 
-- Get all students with their user info:
-- SELECT u.id, u.name, u.email, sd.student_id, sd.major, sd.year
-- FROM users u
-- INNER JOIN user_roles ur ON u.id = ur.user_id
-- INNER JOIN roles r ON ur.role_id = r.role_id
-- LEFT JOIN student_details sd ON u.id = sd.user_id
-- WHERE r.role_name = 'student';
--
-- Get all employees with their user info:
-- SELECT u.id, u.name, u.email, ed.employee_id, ed.department, ed.position
-- FROM users u
-- INNER JOIN user_roles ur ON u.id = ur.user_id
-- INNER JOIN roles r ON ur.role_id = r.role_id
-- LEFT JOIN employee_details ed ON u.id = ed.user_id
-- WHERE r.role_name IN ('professor', 'staff', 'admin');
