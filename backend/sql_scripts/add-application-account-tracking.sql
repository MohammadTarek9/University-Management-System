-- =========================================================
-- Add student credentials tracking columns to applications
-- Compatible with OLD MySQL versions (no IF NOT EXISTS)
-- =========================================================

USE sql7810552;

SET SQL_SAFE_UPDATES = 0;

-- ---------------------------------------------------------
-- 1. Ensure applications table uses InnoDB (required for FK)
-- ---------------------------------------------------------
ALTER TABLE applications ENGINE = InnoDB;

-- ---------------------------------------------------------
-- 2. Add student_credentials_account_created
-- ---------------------------------------------------------
ALTER TABLE applications
ADD COLUMN student_credentials_account_created TINYINT(1) DEFAULT 0;

-- ---------------------------------------------------------
-- 3. Add student_credentials_account_created_at
-- ---------------------------------------------------------
ALTER TABLE applications
ADD COLUMN student_credentials_account_created_at DATETIME NULL;

-- ---------------------------------------------------------
-- 4. Add student_credentials_account_created_by
-- ---------------------------------------------------------
ALTER TABLE applications
ADD COLUMN student_credentials_account_created_by INT(11) NULL;

-- ---------------------------------------------------------
-- 5. Add FOREIGN KEY constraint
-- ---------------------------------------------------------
ALTER TABLE applications
ADD CONSTRAINT fk_account_created_by
FOREIGN KEY (student_credentials_account_created_by)
REFERENCES users(id)
ON DELETE SET NULL;

SET SQL_SAFE_UPDATES = 1;
