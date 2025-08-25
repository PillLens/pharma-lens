-- Update the get_user_entitlements function to properly handle plan-based entitlements
CREATE OR REPLACE FUNCTION public.get_user_entitlements(user_uuid uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT 
    CASE 
      -- Trial users get Pro Family features during trial
      WHEN p.trial_expires_at IS NOT NULL AND p.trial_expires_at > now() THEN 
        '{"can_create_family_group": true, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 5, "max_family_members": 5}'::jsonb
      -- Pro Family subscribers get full family features
      WHEN p.plan = 'pro_family' AND (s.status = 'active' OR s.status IS NULL) THEN 
        '{"can_create_family_group": true, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 5, "max_family_members": 5}'::jsonb
      -- Pro Individual subscribers get personal features but NO family creation
      WHEN p.plan = 'pro_individual' AND (s.status = 'active' OR s.status IS NULL) THEN 
        '{"can_create_family_group": false, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 3, "max_family_members": 0}'::jsonb
      -- Free users get basic features only
      ELSE 
        '{"can_create_family_group": false, "can_export_reports": false, "reminders_limit": 1, "hipaa_report_access": false, "max_devices": 1, "max_family_members": 0}'::jsonb
    END as entitlements
  FROM public.profiles p
  LEFT JOIN public.subscriptions s ON p.id = s.user_id AND s.status = 'active'
  WHERE p.id = user_uuid;
$function$;