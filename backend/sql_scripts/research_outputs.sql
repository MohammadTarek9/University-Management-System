USE sql7810552;

-- Create research_outputs table
CREATE TABLE IF NOT EXISTS research_outputs (
  research_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  research_type VARCHAR(50) NOT NULL DEFAULT 'Paper',
  publication_date DATE,
  journal_name VARCHAR(255),
  conference_name VARCHAR(255),
  doi VARCHAR(100),
  keywords TEXT,
  abstract TEXT,
  url VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status),
  INDEX idx_publication_date (publication_date DESC),
  INDEX idx_created_at (created_at DESC)
);
