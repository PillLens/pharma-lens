-- Add refill tracking columns to user_medications table
ALTER TABLE user_medications 
ADD COLUMN IF NOT EXISTS quantity_remaining INTEGER,
ADD COLUMN IF NOT EXISTS refill_reminder_date DATE,
ADD COLUMN IF NOT EXISTS last_refill_date DATE,
ADD COLUMN IF NOT EXISTS daily_dose_count INTEGER DEFAULT 1;