-- Simplified data cleanup migration

-- Remove duplicate adherence entries (keep the most recent)
WITH ranked_entries AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY user_id, medication_id, scheduled_time 
           ORDER BY created_at DESC
         ) as rn
  FROM medication_adherence_log
)
DELETE FROM medication_adherence_log 
WHERE id IN (
  SELECT id FROM ranked_entries WHERE rn > 1
);

-- Fix timing inconsistencies where taken_time differs significantly from scheduled_time
UPDATE medication_adherence_log 
SET taken_time = scheduled_time
WHERE status = 'taken' 
  AND taken_time IS NOT NULL 
  AND scheduled_time IS NOT NULL
  AND ABS(EXTRACT(EPOCH FROM (taken_time - scheduled_time))) > 3600; -- More than 1 hour difference

-- Clean up any entries with future scheduled times (data errors)
DELETE FROM medication_adherence_log 
WHERE scheduled_time > NOW() + INTERVAL '1 day';

-- Add simple optimized indexes for better performance
CREATE INDEX IF NOT EXISTS idx_adherence_user_medication_date 
ON medication_adherence_log (user_id, medication_id, scheduled_time DESC);

CREATE INDEX IF NOT EXISTS idx_adherence_status_date 
ON medication_adherence_log (status, scheduled_time DESC) 
WHERE status = 'taken';