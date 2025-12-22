DROP TABLE IF EXISTS performance_records;

CREATE TABLE performance_records (
  id INT NOT NULL AUTO_INCREMENT,
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
  created_at DATETIME NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- indexes (built during table creation)
  KEY idx_performance_user (user_id),
  KEY idx_performance_evaluation_date (evaluation_date),
  KEY idx_performance_evaluator (evaluator_id),

  CONSTRAINT fk_performance_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_performance_evaluator
    FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_performance_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
