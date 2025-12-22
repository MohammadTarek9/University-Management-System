-- Create table to store staff performance evaluations
-- Story: As an administrator, record and view staff performance evaluations
-- Acceptance: saved records are linked to staff member and can be queried

CREATE TABLE IF NOT EXISTS performance_records (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  evaluation_date DATE NOT NULL,
  evaluator_id INT DEFAULT NULL,
  score DECIMAL(5,2) DEFAULT NULL,
  rating ENUM('Outstanding','Exceeds Expectations','Meets Expectations','Needs Improvement','Unsatisfactory') DEFAULT NULL,
  comments TEXT,
  action_plan TEXT,
  reviewed TINYINT(1) NOT NULL DEFAULT 0,
  review_date DATE DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_performance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_performance_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_performance_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Useful indexes for lookups
CREATE INDEX idx_performance_user ON performance_records(user_id);
CREATE INDEX idx_performance_evaluation_date ON performance_records(evaluation_date);
CREATE INDEX idx_performance_evaluator ON performance_records(evaluator_id);

-- Example query notes:
-- Get latest records for a staff member:
-- SELECT * FROM performance_records WHERE user_id = ? ORDER BY evaluation_date DESC;
