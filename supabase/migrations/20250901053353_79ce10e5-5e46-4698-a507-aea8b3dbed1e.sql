-- Fix security issues and add performance optimizations

-- 1. Update all functions to use proper search_path (Security Fix)
CREATE OR REPLACE FUNCTION public.get_user_family_groups(user_uuid uuid)
 RETURNS TABLE(family_group_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT fm.family_group_id
  FROM public.family_members fm
  WHERE fm.user_id = user_uuid 
  AND fm.invitation_status = 'accepted';
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_family_member(user_uuid uuid, group_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = user_uuid 
    AND fm.family_group_id = group_uuid
    AND fm.invitation_status = 'accepted'
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_invite_to_group(user_uuid uuid, group_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.family_groups fg
    WHERE fg.id = group_uuid
    AND fg.creator_id = user_uuid
  );
$function$;

CREATE OR REPLACE FUNCTION public.find_user_by_email(user_email text)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id FROM public.profiles WHERE email = user_email LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_profile(user_uuid uuid)
 RETURNS TABLE(id uuid, email text, display_name text, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.email, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = user_uuid;
$function$;

CREATE OR REPLACE FUNCTION public.get_family_member_profile(member_user_id uuid)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, last_seen timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.display_name, p.avatar_url, p.last_seen
  FROM public.profiles p
  WHERE p.id = member_user_id
  AND EXISTS (
    SELECT 1 
    FROM public.family_members fm1
    JOIN public.family_members fm2 ON fm1.family_group_id = fm2.family_group_id
    WHERE fm1.user_id = auth.uid() 
    AND fm2.user_id = member_user_id
    AND fm1.invitation_status = 'accepted'
    AND fm2.invitation_status = 'accepted'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_user_in_trial(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.get_family_member_status(group_uuid uuid, member_uuid uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'is_online', CASE WHEN last_seen > (now() - interval '5 minutes') THEN true ELSE false END,
    'last_seen', last_seen,
    'current_medications', (
      SELECT count(*) FROM public.user_medications 
      WHERE user_id = member_uuid AND is_active = true
    ),
    'adherence_rate', (
      SELECT CASE WHEN count(*) = 0 THEN 0 ELSE 
        (count(*) FILTER (WHERE status = 'taken')::float / count(*)::float) * 100 
      END
      FROM public.medication_adherence_log 
      WHERE user_id = member_uuid 
      AND created_at > (now() - interval '7 days')
    )
  )
  FROM public.profiles 
  WHERE id = member_uuid;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_entitlements(user_uuid uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      WHEN p.trial_expires_at IS NOT NULL AND p.trial_expires_at > now() THEN 
        '{"can_create_family_group": true, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 5, "max_family_members": 5}'::jsonb
      WHEN p.plan = 'pro_family' AND (s.status = 'active' OR s.status IS NULL) THEN 
        '{"can_create_family_group": true, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 5, "max_family_members": 5}'::jsonb
      WHEN p.plan = 'pro_individual' AND (s.status = 'active' OR s.status IS NULL) THEN 
        '{"can_create_family_group": false, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 3, "max_family_members": 0}'::jsonb
      ELSE 
        '{"can_create_family_group": false, "can_export_reports": false, "reminders_limit": 1, "hipaa_report_access": false, "max_devices": 1, "max_family_members": 0}'::jsonb
    END as entitlements
  FROM public.profiles p
  LEFT JOIN public.subscriptions s ON p.id = s.user_id AND s.status = 'active'
  WHERE p.id = user_uuid;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_adherence_streak(p_user_id uuid, p_medication_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  streak_count INTEGER := 0;
  check_date DATE;
  daily_doses INTEGER;
  daily_taken INTEGER;
BEGIN
  check_date := CURRENT_DATE;
  
  LOOP
    SELECT COUNT(*) INTO daily_doses
    FROM medication_adherence_log 
    WHERE user_id = p_user_id 
      AND medication_id = p_medication_id
      AND DATE(scheduled_time) = check_date;
    
    SELECT COUNT(*) INTO daily_taken
    FROM medication_adherence_log 
    WHERE user_id = p_user_id 
      AND medication_id = p_medication_id
      AND DATE(scheduled_time) = check_date
      AND status = 'taken';
    
    IF daily_doses = 0 THEN
      check_date := check_date - INTERVAL '1 day';
      
      IF check_date < CURRENT_DATE - INTERVAL '365 days' THEN
        EXIT;
      END IF;
      
      CONTINUE;  
    END IF;
    
    IF daily_taken >= daily_doses AND daily_doses > 0 THEN
      streak_count := streak_count + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
    
    IF check_date < CURRENT_DATE - INTERVAL '365 days' THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak_count;
END;
$function$;

-- 2. Performance Indexes (Based on common query patterns)

-- Index for medication reminders by user and active status
CREATE INDEX IF NOT EXISTS idx_medication_reminders_user_active 
ON medication_reminders(user_id, is_active) 
WHERE is_active = true;

-- Index for medication reminders by medication_id
CREATE INDEX IF NOT EXISTS idx_medication_reminders_medication_id 
ON medication_reminders(medication_id);

-- Index for products search by brand and generic names
CREATE INDEX IF NOT EXISTS idx_products_brand_name_gin 
ON products USING gin(to_tsvector('english', brand_name));

CREATE INDEX IF NOT EXISTS idx_products_generic_name_gin 
ON products USING gin(to_tsvector('english', generic_name));

-- Index for products by barcode (frequently used for scanning)
CREATE INDEX IF NOT EXISTS idx_products_barcode 
ON products(barcode) 
WHERE barcode IS NOT NULL;

-- Index for medication adherence log by user, medication, and status
CREATE INDEX IF NOT EXISTS idx_medication_adherence_user_medication_status 
ON medication_adherence_log(user_id, medication_id, status);

-- Index for medication adherence log by scheduled_time (for date range queries)
CREATE INDEX IF NOT EXISTS idx_medication_adherence_scheduled_time 
ON medication_adherence_log(scheduled_time);

-- Index for profiles by email (if used for lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- Index for family_members by family_group_id and status
CREATE INDEX IF NOT EXISTS idx_family_members_group_status 
ON family_members(family_group_id, invitation_status);

-- Index for sessions by user_id and created_at (for recent sessions)
CREATE INDEX IF NOT EXISTS idx_sessions_user_created 
ON sessions(user_id, created_at);

-- Index for performance_metrics by timestamp (for analytics)
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp 
ON performance_metrics(timestamp);

-- Index for error_reports by user_id and timestamp
CREATE INDEX IF NOT EXISTS idx_error_reports_user_timestamp 
ON error_reports(user_id, timestamp);

-- 3. Add database maintenance function
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Clean up old performance metrics (older than 90 days)
  DELETE FROM performance_metrics 
  WHERE timestamp < (now() - interval '90 days');
  
  -- Clean up old error reports (older than 30 days)
  DELETE FROM error_reports 
  WHERE timestamp < (now() - interval '30 days');
  
  -- Clean up old sessions (older than 7 days)
  DELETE FROM sessions 
  WHERE created_at < (now() - interval '7 days');
  
  -- Clean up expired rate limits
  PERFORM cleanup_expired_rate_limits();
  PERFORM cleanup_interaction_rate_limits();
END;
$function$;