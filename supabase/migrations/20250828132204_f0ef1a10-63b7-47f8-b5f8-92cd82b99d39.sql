-- Create the missing calculate_adherence_streak function
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
      
      -- Safety check to prevent infinite loops
      IF check_date < CURRENT_DATE - INTERVAL '365 days' THEN
        EXIT;
      END IF;
      
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