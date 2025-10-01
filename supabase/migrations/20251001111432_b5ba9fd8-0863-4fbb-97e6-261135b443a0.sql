-- Create AI chat usage tracking table
CREATE TABLE public.ai_chat_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  minutes_used NUMERIC NOT NULL DEFAULT 0,
  session_count INTEGER NOT NULL DEFAULT 0,
  last_session_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE public.ai_chat_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own AI chat usage"
ON public.ai_chat_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can create their own AI chat usage"
ON public.ai_chat_usage
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update their own AI chat usage"
ON public.ai_chat_usage
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_ai_chat_usage_user_month ON public.ai_chat_usage(user_id, month);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_chat_usage_updated_at
BEFORE UPDATE ON public.ai_chat_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update get_user_entitlements function to include AI chat limits
CREATE OR REPLACE FUNCTION public.get_user_entitlements(user_uuid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN p.trial_expires_at IS NOT NULL AND p.trial_expires_at > now() THEN 
        '{"can_create_family_group": true, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 5, "max_family_members": 5, "ai_chat_minutes_per_month": -1}'::jsonb
      WHEN p.plan = 'pro_family' AND (s.status = 'active' OR s.status IS NULL) THEN 
        '{"can_create_family_group": true, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 5, "max_family_members": 5, "ai_chat_minutes_per_month": -1}'::jsonb
      WHEN p.plan = 'pro_individual' AND (s.status = 'active' OR s.status IS NULL) THEN 
        '{"can_create_family_group": false, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 3, "max_family_members": 0, "ai_chat_minutes_per_month": -1}'::jsonb
      ELSE 
        '{"can_create_family_group": false, "can_export_reports": false, "reminders_limit": 1, "hipaa_report_access": false, "max_devices": 1, "max_family_members": 0, "ai_chat_minutes_per_month": 10}'::jsonb
    END as entitlements
  FROM public.profiles p
  LEFT JOIN public.subscriptions s ON p.id = s.user_id AND s.status = 'active'
  WHERE p.id = user_uuid;
$$;