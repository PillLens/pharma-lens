-- First, clean up all duplicate entries for today
DELETE FROM medication_adherence_log a
WHERE a.ctid NOT IN (
    SELECT MIN(b.ctid)
    FROM medication_adherence_log b
    WHERE b.user_id = a.user_id
    AND b.medication_id = a.medication_id
    AND b.scheduled_time = a.scheduled_time
    AND b.status = a.status
    AND DATE(b.scheduled_time) = CURRENT_DATE
    GROUP BY b.user_id, b.medication_id, b.scheduled_time, b.status
)
AND DATE(a.scheduled_time) = CURRENT_DATE;

-- Add a unique constraint to prevent future duplicates
ALTER TABLE medication_adherence_log 
ADD CONSTRAINT unique_scheduled_dose 
UNIQUE (user_id, medication_id, scheduled_time);