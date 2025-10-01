-- Update get_user_entitlements function to set AI chat limits: 3 minutes for free, 10 minutes for Pro
CREATE OR REPLACE FUNCTION public.get_user_entitlements(user_uuid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN p.trial_expires_at IS NOT NULL AND p.trial_expires_at > now() THEN 
        '{"can_create_family_group": true, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 5, "max_family_members": 5, "ai_chat_minutes_per_month": 10}'::jsonb
      WHEN p.plan = 'pro_family' AND (s.status = 'active' OR s.status IS NULL) THEN 
        '{"can_create_family_group": true, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 5, "max_family_members": 5, "ai_chat_minutes_per_month": 10}'::jsonb
      WHEN p.plan = 'pro_individual' AND (s.status = 'active' OR s.status IS NULL) THEN 
        '{"can_create_family_group": false, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 3, "max_family_members": 0, "ai_chat_minutes_per_month": 10}'::jsonb
      ELSE 
        '{"can_create_family_group": false, "can_export_reports": false, "reminders_limit": 1, "hipaa_report_access": false, "max_devices": 1, "max_family_members": 0, "ai_chat_minutes_per_month": 3}'::jsonb
    END as entitlements
  FROM public.profiles p
  LEFT JOIN public.subscriptions s ON p.id = s.user_id AND s.status = 'active'
  WHERE p.id = user_uuid;
$$;