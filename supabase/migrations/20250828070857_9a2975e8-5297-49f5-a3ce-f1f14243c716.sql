-- Fix database function security vulnerabilities by adding SET search_path = ''

-- 1. Fix get_user_family_groups function
CREATE OR REPLACE FUNCTION public.get_user_family_groups(user_uuid uuid)
 RETURNS TABLE(family_group_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT fm.family_group_id
  FROM public.family_members fm
  WHERE fm.user_id = user_uuid 
  AND fm.invitation_status = 'accepted';
$function$;

-- 2. Fix is_family_member function
CREATE OR REPLACE FUNCTION public.is_family_member(user_uuid uuid, group_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = user_uuid 
    AND fm.family_group_id = group_uuid
    AND fm.invitation_status = 'accepted'
  );
$function$;

-- 3. Fix can_invite_to_group function
CREATE OR REPLACE FUNCTION public.can_invite_to_group(user_uuid uuid, group_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.family_groups fg
    WHERE fg.id = group_uuid
    AND fg.creator_id = user_uuid
  );
$function$;

-- 4. Fix find_user_by_email function
CREATE OR REPLACE FUNCTION public.find_user_by_email(user_email text)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT id FROM public.profiles WHERE email = user_email LIMIT 1;
$function$;

-- 5. Fix get_profile function
CREATE OR REPLACE FUNCTION public.get_profile(user_uuid uuid)
 RETURNS TABLE(id uuid, email text, display_name text, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT p.id, p.email, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = user_uuid;
$function$;

-- 6. Fix get_family_member_profile function
CREATE OR REPLACE FUNCTION public.get_family_member_profile(member_user_id uuid)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, last_seen timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
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

-- 7. Fix get_family_member_status function
CREATE OR REPLACE FUNCTION public.get_family_member_status(group_uuid uuid, member_uuid uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
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

-- 8. Fix get_user_entitlements function
CREATE OR REPLACE FUNCTION public.get_user_entitlements(user_uuid uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
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