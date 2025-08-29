-- Clean up duplicate medication adherence log entries
-- This removes entries that don't correspond to actual reminder times

-- First, let's identify and remove duplicate entries for the same user/medication/scheduled_time
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, medication_id, scheduled_time 
      ORDER BY created_at DESC
    ) as rn
  FROM medication_adherence_log
)
DELETE FROM medication_adherence_log 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add a unique constraint to prevent future duplicates
ALTER TABLE medication_adherence_log 
ADD CONSTRAINT unique_user_medication_scheduled_time 
UNIQUE (user_id, medication_id, scheduled_time);