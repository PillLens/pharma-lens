-- Phase 1: Comprehensive data cleanup and timing fixes

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

-- Update legacy entries that might have wrong day streaks
-- Clean up any entries with future scheduled times (data errors)
DELETE FROM medication_adherence_log 
WHERE scheduled_time > NOW() + INTERVAL '1 day';

-- Add optimized indexes for better performance
CREATE INDEX IF NOT EXISTS idx_adherence_user_date_status 
ON medication_adherence_log (user_id, DATE(scheduled_time), status);

CREATE INDEX IF NOT EXISTS idx_adherence_medication_timing 
ON medication_adherence_log (medication_id, scheduled_time DESC) 
WHERE status = 'taken';

-- Create a function to calculate real adherence streaks
CREATE OR REPLACE FUNCTION calculate_adherence_streak(p_user_id UUID, p_medication_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  check_date DATE;
  daily_doses INTEGER;
  daily_taken INTEGER;
BEGIN
  -- Start from today and work backwards
  check_date := CURRENT_DATE;
  
  LOOP
    -- Count scheduled doses for this date
    SELECT COUNT(*) INTO daily_doses
    FROM medication_adherence_log 
    WHERE user_id = p_user_id 
      AND medication_id = p_medication_id
      AND DATE(scheduled_time) = check_date;
    
    -- Count taken doses for this date  
    SELECT COUNT(*) INTO daily_taken
    FROM medication_adherence_log 
    WHERE user_id = p_user_id 
      AND medication_id = p_medication_id
      AND DATE(scheduled_time) = check_date
      AND status = 'taken';
    
    -- If no doses scheduled for this date, skip to previous day
    IF daily_doses = 0 THEN
      check_date := check_date - INTERVAL '1 day';
      CONTINUE;
    END IF;
    
    -- If all scheduled doses were taken, increment streak
    IF daily_taken >= daily_doses AND daily_doses > 0 THEN
      streak_count := streak_count + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      -- Streak broken
      EXIT;
    END IF;
    
    -- Safety check to prevent infinite loops
    IF check_date < CURRENT_DATE - INTERVAL '365 days' THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;