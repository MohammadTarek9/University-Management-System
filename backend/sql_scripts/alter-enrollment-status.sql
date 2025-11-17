-- Add 'pending' and 'rejected' to the status ENUM for enrollments table
USE sql7810552;
ALTER TABLE enrollments 
MODIFY COLUMN status ENUM('pending', 'enrolled', 'rejected', 'dropped', 'completed', 'withdrawn') 
DEFAULT 'pending';

-- Update any existing empty status to pending
UPDATE enrollments SET status = 'pending' WHERE status = '' OR status IS NULL;
