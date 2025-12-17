-- Remove foreign key constraint from bookings table that references old rooms table
-- This allows bookings to reference rooms stored in the EAV system
USE sql7810552;
ALTER TABLE bookings DROP FOREIGN KEY bookings_ibfk_1;
