-- Create normalized roles structure to reduce NULLs in users table
-- This creates: roles, user_roles tables and migrates existing role data

USE sql7810552;

-- Disable safe update mode
SET SQL_SAFE_UPDATES = 0;

-- Step 1: Create roles table
CREATE TABLE IF NOT EXISTS roles (
  role_id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- Step 2: Insert default roles
INSERT INTO roles (role_name, description) VALUES
  ('student', 'Student user with basic access'),
  ('professor', 'Professor with course management access'),
  ('staff', 'Staff member with administrative access'),
  ('admin', 'Administrator with full system access')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Step 3: Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 4: Migrate existing role data from users table
-- Map each user's current role to the roles table
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.role_id
FROM users u
INNER JOIN roles r ON u.role = r.role_name
WHERE u.role IS NOT NULL
ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP;

-- Step 5: (OPTIONAL) After verifying the migration, you can remove the role column from users
-- Uncomment the following line only after testing:
-- ALTER TABLE users DROP COLUMN role;

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Verification queries (run these separately to check):
-- SELECT * FROM roles;
-- SELECT u.id, u.name, u.email, r.role_name 
-- FROM users u 
-- LEFT JOIN user_roles ur ON u.id = ur.user_id
-- LEFT JOIN roles r ON ur.role_id = r.role_id;
