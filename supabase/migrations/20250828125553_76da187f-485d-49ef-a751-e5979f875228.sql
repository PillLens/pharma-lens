-- Clean up duplicate adherence logs and add constraints to prevent future duplicates

-- First, let's identify and remove duplicates, keeping the most recent entry for each unique combination
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, medication_id, scheduled_time, status 
      ORDER BY created_at DESC
    ) as row_num
  FROM medication_adherence_log
)
DELETE FROM medication_adherence_log 
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Add a unique constraint to prevent future duplicates for scheduled doses
-- This ensures one entry per user_id + medication_id + scheduled_time + status combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_adherence_log 
ON medication_adherence_log (user_id, medication_id, scheduled_time, status);

-- Also add an index for faster queries by user and medication
CREATE INDEX IF NOT EXISTS idx_adherence_log_user_medication 
ON medication_adherence_log (user_id, medication_id, scheduled_time DESC);

-- Update any existing 'scheduled' entries that have a taken_time to 'taken' status
-- This fixes any inconsistent data where status is 'scheduled' but taken_time exists
UPDATE medication_adherence_log 
SET 
  status = 'taken',
  notes = COALESCE(notes, 'Auto-corrected from scheduled with taken_time')
WHERE status = 'scheduled' 
  AND taken_time IS NOT NULL;