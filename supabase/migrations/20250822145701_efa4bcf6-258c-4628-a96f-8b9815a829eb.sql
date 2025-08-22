-- Extend profiles table for subscription management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS trial_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS trial_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_trial_eligible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS entitlements jsonb DEFAULT '{"can_create_family_group": false, "can_export_reports": false, "reminders_limit": 1, "hipaa_report_access": false}'::jsonb;

-- Create subscriptions table to track Stripe subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_sub_id text UNIQUE,
  plan text NOT NULL,
  status text NOT NULL DEFAULT 'incomplete',
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_settings table for dashboard customizations
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  fab_positions jsonb DEFAULT '{"dashboard": {"x": 20, "y": 20}, "medications": {"x": 20, "y": 20}}'::jsonb,
  dashboard_preferences jsonb DEFAULT '{"cards_order": ["today", "medications", "reminders", "family", "reports", "security", "billing"]}'::jsonb,
  notification_preferences jsonb DEFAULT '{"trial_reminders": true, "billing_alerts": true, "feature_updates": true}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can manage subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS policies for user_settings
CREATE POLICY "Users can manage their own settings" 
ON public.user_settings 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Update trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for user_settings
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get user entitlements
CREATE OR REPLACE FUNCTION public.get_user_entitlements(user_uuid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT 
    CASE 
      WHEN p.plan = 'free' THEN 
        '{"can_create_family_group": false, "can_export_reports": false, "reminders_limit": 1, "hipaa_report_access": false, "max_devices": 1}'::jsonb
      WHEN p.plan = 'pro_individual' THEN 
        '{"can_create_family_group": false, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 3}'::jsonb
      WHEN p.plan = 'pro_family' THEN 
        '{"can_create_family_group": true, "can_export_reports": true, "reminders_limit": -1, "hipaa_report_access": true, "max_devices": 5, "max_family_members": 5}'::jsonb
      ELSE p.entitlements
    END as entitlements
  FROM public.profiles p
  WHERE p.id = user_uuid;
$function$;

-- Function to check if user is in trial
CREATE OR REPLACE FUNCTION public.is_user_in_trial(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
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