-- Create user sessions tracking table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info JSONB DEFAULT '{}',
  ip_address TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  session_token TEXT UNIQUE
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.user_sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions"
ON public.user_sessions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create activity log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_log
CREATE POLICY "Users can view their own activity log"
ON public.activity_log FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs"
ON public.activity_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add new columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medication_preferences JSONB DEFAULT '{"default_time_slots": ["09:00", "13:00", "18:00", "21:00"], "refill_advance_days": 7, "adherence_reminder_frequency": "daily", "privacy_mode": false}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"share_adherence_data": true, "allow_family_access": true, "data_retention_days": 365}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_preferences JSONB DEFAULT '{"sound_enabled": true, "vibration_enabled": true, "badge_count_enabled": true}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON public.user_sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at);

-- Create function to log user activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.activity_log (
    user_id,
    activity_type,
    activity_data,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_activity_type,
    p_activity_data,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Create function to cleanup old sessions
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_sessions
  WHERE last_active < NOW() - INTERVAL '30 days';
END;
$$;