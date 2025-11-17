USE sql7810552;

-- Create leave_types table
CREATE TABLE IF NOT EXISTS leave_types (
  leave_type_id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  max_days_per_year INT DEFAULT 20,
  requires_documentation BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  leave_request_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  number_of_days INT DEFAULT 0,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  approved_by INT,
  approval_date DATETIME,
  rejection_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(leave_type_id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_status (user_id, status),
  INDEX idx_date_range (start_date, end_date),
  INDEX idx_status (status)
);

-- Create leave_balance table
CREATE TABLE IF NOT EXISTS leave_balance (
  balance_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  fiscal_year INT NOT NULL,
  total_days INT NOT NULL,
  used_days INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(leave_type_id) ON DELETE RESTRICT,
  UNIQUE KEY unique_user_type_year (user_id, leave_type_id, fiscal_year)
);

-- Insert default leave types
INSERT INTO leave_types (type_name, description, max_days_per_year, requires_documentation) VALUES
('Annual Leave', 'Paid vacation days', 20, FALSE),
('Sick Leave', 'Leave due to illness', 10, TRUE),
('Casual Leave', 'Short-term leave for personal reasons', 8, FALSE),
('Maternity Leave', 'Leave for maternity', 90, TRUE),
('Paternity Leave', 'Leave for paternity', 15, TRUE),
('Unpaid Leave', 'Leave without pay', 0, FALSE)
ON DUPLICATE KEY UPDATE type_name = VALUES(type_name);

-- ========================================
-- Verify tables were created
-- ========================================
-- SHOW TABLES LIKE 'leave%';
-- DESC leave_requests;
-- SELECT * FROM leave_types;