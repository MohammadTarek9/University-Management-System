USE sql7810552;

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  announcement_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  target_audience VARCHAR(50) NOT NULL DEFAULT 'all',
  author_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  published_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category (category),
  INDEX idx_target_audience (target_audience),
  INDEX idx_published_date (published_date DESC),
  INDEX idx_is_active (is_active)
);

