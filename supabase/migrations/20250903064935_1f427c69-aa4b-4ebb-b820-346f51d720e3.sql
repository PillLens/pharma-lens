-- Fix the family invitation system by adding support for email-based invitations

-- First, let's add an email column to family_members for pending invitations
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS invited_email text;

-- Modify the user_id column to allow null for pending invitations
ALTER TABLE family_members ALTER COLUMN user_id DROP NOT NULL;

-- Create a constraint to ensure either user_id or invited_email is provided
ALTER TABLE family_members ADD CONSTRAINT check_user_or_email 
CHECK (
  (user_id IS NOT NULL AND invited_email IS NULL) OR 
  (user_id IS NULL AND invited_email IS NOT NULL)
);

-- Update the notify_family_group_event function to not use the net schema
CREATE OR REPLACE FUNCTION public.notify_family_group_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
      event_type := 'member_invited';
      user_id_val := NEW.user_id;
      group_id_val := NEW.family_group_id;
      metadata_val := jsonb_build_object(
        'role', NEW.role, 
        'invited_by', NEW.invited_by,
        'invited_email', NEW.invited_email
      );
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

  -- Log the event instead of making HTTP calls (no net schema dependency)
  INSERT INTO family_activity_log (
    family_group_id,
    user_id,
    activity_type,
    activity_data
  ) VALUES (
    group_id_val,
    COALESCE(user_id_val, NEW.invited_by),
    event_type,
    metadata_val
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;