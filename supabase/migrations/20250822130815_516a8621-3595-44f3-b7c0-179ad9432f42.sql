-- Phase 1: Enhanced Profiles and Real User Integration
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS medical_conditions text[],
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"email": true, "sms": true, "push": true, "emergency_only": false}'::jsonb;

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL,
  phone text NOT NULL,
  email text,
  priority integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Real-time channels for family communication
CREATE TABLE IF NOT EXISTS public.real_time_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  channel_name text NOT NULL,
  channel_type text NOT NULL DEFAULT 'family_updates',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Family activity log for real-time monitoring
CREATE TABLE IF NOT EXISTS public.family_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Communication logs
CREATE TABLE IF NOT EXISTS public.communication_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  message_type text NOT NULL,
  message_content text,
  message_data jsonb DEFAULT '{}'::jsonb,
  is_emergency boolean NOT NULL DEFAULT false,
  delivered_at timestamp with time zone,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Location sharing for emergencies
CREATE TABLE IF NOT EXISTS public.location_sharing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  latitude decimal(10,8),
  longitude decimal(11,8),
  accuracy decimal(8,2),
  address text,
  is_emergency boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enhanced medication adherence tracking
CREATE TABLE IF NOT EXISTS public.medication_adherence_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  medication_id uuid NOT NULL REFERENCES public.user_medications(id) ON DELETE CASCADE,
  scheduled_time timestamp with time zone NOT NULL,
  taken_time timestamp with time zone,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  reported_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Care coordination tasks
CREATE TABLE IF NOT EXISTS public.care_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  assigned_to uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Health insights and analytics
CREATE TABLE IF NOT EXISTS public.family_health_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  insight_type text NOT NULL,
  insight_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority text NOT NULL DEFAULT 'normal',
  is_actionable boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_time_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_adherence_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_health_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for emergency_contacts
CREATE POLICY "Users can manage their own emergency contacts" ON public.emergency_contacts
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for real_time_channels
CREATE POLICY "Family members can view their group channels" ON public.real_time_channels
FOR SELECT USING (is_family_member(auth.uid(), family_group_id));

CREATE POLICY "Group creators can manage channels" ON public.real_time_channels
FOR ALL USING (
  family_group_id IN (
    SELECT id FROM public.family_groups WHERE creator_id = auth.uid()
  )
) WITH CHECK (
  family_group_id IN (
    SELECT id FROM public.family_groups WHERE creator_id = auth.uid()
  )
);

-- RLS Policies for family_activity_log
CREATE POLICY "Family members can view activity in their groups" ON public.family_activity_log
FOR SELECT USING (is_family_member(auth.uid(), family_group_id));

CREATE POLICY "Family members can create activity logs" ON public.family_activity_log
FOR INSERT WITH CHECK (
  is_family_member(auth.uid(), family_group_id) AND auth.uid() = user_id
);

-- RLS Policies for communication_logs
CREATE POLICY "Family members can view communications in their groups" ON public.communication_logs
FOR SELECT USING (is_family_member(auth.uid(), family_group_id));

CREATE POLICY "Family members can send messages" ON public.communication_logs
FOR INSERT WITH CHECK (
  is_family_member(auth.uid(), family_group_id) AND auth.uid() = sender_id
);

CREATE POLICY "Recipients can update message status" ON public.communication_logs
FOR UPDATE USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- RLS Policies for location_sharing
CREATE POLICY "Family members can view locations in their groups" ON public.location_sharing
FOR SELECT USING (is_family_member(auth.uid(), family_group_id));

CREATE POLICY "Users can manage their own location sharing" ON public.location_sharing
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for medication_adherence_log
CREATE POLICY "Users can manage their own adherence log" ON public.medication_adherence_log
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family members can view adherence for shared medications" ON public.medication_adherence_log
FOR SELECT USING (
  medication_id IN (
    SELECT sm.medication_id FROM public.shared_medications sm
    WHERE is_family_member(auth.uid(), sm.family_group_id)
  )
);

-- RLS Policies for care_tasks
CREATE POLICY "Family members can view tasks in their groups" ON public.care_tasks
FOR SELECT USING (is_family_member(auth.uid(), family_group_id));

CREATE POLICY "Family members can create tasks" ON public.care_tasks
FOR INSERT WITH CHECK (
  is_family_member(auth.uid(), family_group_id) AND auth.uid() = assigned_by
);

CREATE POLICY "Assigned users can update their tasks" ON public.care_tasks
FOR UPDATE USING (auth.uid() = assigned_to OR auth.uid() = assigned_by);

-- RLS Policies for family_health_insights
CREATE POLICY "Family members can view insights for their groups" ON public.family_health_insights
FOR SELECT USING (is_family_member(auth.uid(), family_group_id));

-- Add updated_at triggers
CREATE TRIGGER update_emergency_contacts_updated_at
BEFORE UPDATE ON public.emergency_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_real_time_channels_updated_at
BEFORE UPDATE ON public.real_time_channels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_care_tasks_updated_at
BEFORE UPDATE ON public.care_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enhanced family group functions
CREATE OR REPLACE FUNCTION public.get_family_member_status(group_uuid uuid, member_uuid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
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
$$;

-- Family health scoring function
CREATE OR REPLACE FUNCTION public.calculate_family_health_score(group_uuid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  WITH member_scores AS (
    SELECT 
      fm.user_id,
      COALESCE(
        (SELECT (count(*) FILTER (WHERE status = 'taken')::float / count(*)::float) * 100 
         FROM public.medication_adherence_log mal
         WHERE mal.user_id = fm.user_id 
         AND mal.created_at > (now() - interval '30 days')), 
        85.0
      ) as adherence_score,
      COALESCE(
        (SELECT count(*) FROM public.user_medications 
         WHERE user_id = fm.user_id AND is_active = true), 
        0
      ) as active_medications
    FROM public.family_members fm
    WHERE fm.family_group_id = group_uuid 
    AND fm.invitation_status = 'accepted'
  )
  SELECT jsonb_build_object(
    'overall_score', AVG(adherence_score),
    'total_members', COUNT(*),
    'total_medications', SUM(active_medications),
    'high_adherence_members', COUNT(*) FILTER (WHERE adherence_score >= 80),
    'needs_attention_members', COUNT(*) FILTER (WHERE adherence_score < 60)
  )
  FROM member_scores;
$$;