-- Add hall_location to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS hall_location text;
