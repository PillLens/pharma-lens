-- Clean up timing inconsistencies in adherence log
-- Update entries where taken_time doesn't match scheduled_time pattern

-- First, let's fix entries where taken_time is significantly different from scheduled_time
-- This typically happens when someone marks a dose as taken at the wrong time
UPDATE medication_adherence_log 
SET taken_time = scheduled_time
WHERE status = 'taken' 
  AND taken_time IS NOT NULL 
  AND scheduled_time IS NOT NULL
  AND ABS(EXTRACT(EPOCH FROM (taken_time - scheduled_time))) > 7200; -- More than 2 hours difference

-- Add an index to improve query performance on adherence lookups
CREATE INDEX IF NOT EXISTS idx_adherence_log_user_med_scheduled 
ON medication_adherence_log (user_id, medication_id, scheduled_time DESC, status);

-- Add an index for today's queries
CREATE INDEX IF NOT EXISTS idx_adherence_log_scheduled_status 
ON medication_adherence_log (scheduled_time, status, user_id) 
WHERE scheduled_time >= CURRENT_DATE;