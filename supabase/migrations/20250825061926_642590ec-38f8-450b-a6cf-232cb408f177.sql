-- Set up CRON job for missed dose digest
-- Schedule to run at 20:00 UTC daily
SELECT cron.schedule(
  'missed-dose-digest-daily',
  '0 20 * * *', -- Run at 20:00 UTC daily
  $$
  SELECT
    net.http_post(
        url:='https://bquxkkaipevuakmqqilk.supabase.co/functions/v1/missed-dose-digest',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdXhra2FpcGV2dWFrbXFxaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODQ4MjgsImV4cCI6MjA3MTM2MDgyOH0.fSTAjjv0D7CENU30e3XGl0GJZRF4asQ4BY5-iMRS3oI"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Create function to send family group event notifications
CREATE OR REPLACE FUNCTION public.notify_family_group_event()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_type TEXT;
  user_id_val UUID;
  group_id_val UUID;
  metadata_val JSONB;
BEGIN
  -- Determine event type based on table and operation
  IF TG_TABLE_NAME = 'family_members' THEN
    IF TG_OP = 'INSERT' THEN
      event_type := 'member_joined';
      user_id_val := NEW.user_id;
      group_id_val := NEW.family_group_id;
      metadata_val := jsonb_build_object('role', NEW.role, 'invited_by', NEW.invited_by);
    ELSIF TG_OP = 'UPDATE' AND OLD.invitation_status != NEW.invitation_status AND NEW.invitation_status = 'accepted' THEN
      event_type := 'member_accepted';
      user_id_val := NEW.user_id;
      group_id_val := NEW.family_group_id;
      metadata_val := jsonb_build_object('role', NEW.role);
    ELSE
      RETURN COALESCE(NEW, OLD);
    END IF;
  ELSIF TG_TABLE_NAME = 'shared_medications' THEN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      event_type := 'sharing_updated';
      user_id_val := NEW.shared_by;
      group_id_val := NEW.family_group_id;
      metadata_val := jsonb_build_object('medication_id', NEW.medication_id, 'permissions', NEW.sharing_permissions);
    ELSE
      RETURN COALESCE(NEW, OLD);
    END IF;
  ELSIF TG_TABLE_NAME = 'family_appointments' THEN
    IF TG_OP = 'INSERT' THEN
      event_type := 'appointment_scheduled';
      user_id_val := NEW.created_by;
      group_id_val := NEW.family_group_id;
      metadata_val := jsonb_build_object('appointment_id', NEW.id, 'appointment_type', NEW.appointment_type, 'patient_id', NEW.patient_id);
    ELSE
      RETURN COALESCE(NEW, OLD);
    END IF;
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Send notification via HTTP request to edge function
  PERFORM
    net.http_post(
      url := 'https://bquxkkaipevuakmqqilk.supabase.co/functions/v1/family-group-events',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdXhra2FpcGV2dWFrbXFxaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODQ4MjgsImV4cCI6MjA3MTM2MDgyOH0.fSTAjjv0D7CENU30e3XGl0GJZRF4asQ4BY5-iMRS3oI"}'::jsonb,
      body := jsonb_build_object(
        'event_type', event_type,
        'group_id', group_id_val,
        'user_id', user_id_val,
        'metadata', metadata_val
      )
    );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for family group events
CREATE TRIGGER family_members_notify_trigger
  AFTER INSERT OR UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_family_group_event();

CREATE TRIGGER shared_medications_notify_trigger
  AFTER INSERT OR UPDATE ON shared_medications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_family_group_event();

CREATE TRIGGER family_appointments_notify_trigger
  AFTER INSERT ON family_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_family_group_event();