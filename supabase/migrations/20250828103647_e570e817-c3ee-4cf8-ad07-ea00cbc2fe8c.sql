-- Fix remaining functions with search path issues

-- Fix handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    display_name, 
    is_trial_eligible, 
    trial_expires_at,
    trial_started_at,
    timezone,
    location_permission_asked,
    location_permission_granted
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    true,
    now() + interval '14 days',
    now(),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    false,
    false
  );
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix notify_family_group_event trigger function
CREATE OR REPLACE FUNCTION public.notify_family_group_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

-- Fix is_user_in_trial function
CREATE OR REPLACE FUNCTION public.is_user_in_trial(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT 
    CASE 
      WHEN p.trial_expires_at IS NULL THEN false
      WHEN p.trial_expires_at > now() THEN true
      ELSE false
    END
  FROM public.profiles p
  WHERE p.id = user_uuid;
$function$;