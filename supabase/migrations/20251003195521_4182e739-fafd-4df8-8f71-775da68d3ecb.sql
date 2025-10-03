-- Create goals table for medication adherence targets
CREATE TABLE public.medication_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'adherence_rate', 'streak', 'refill_on_time', 'daily_completion'
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  achieved_at TIMESTAMP WITH TIME ZONE,
  medication_id UUID REFERENCES public.user_medications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vital signs table
CREATE TABLE public.vital_signs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  weight NUMERIC,
  temperature NUMERIC,
  blood_glucose NUMERIC,
  oxygen_saturation INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI insights table for personalized recommendations
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'adherence_pattern', 'medication_timing', 'refill_reminder', 'health_trend'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  actionable BOOLEAN DEFAULT false,
  action_url TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medication_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medication_goals
CREATE POLICY "Users can manage their own goals"
ON public.medication_goals
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for vital_signs
CREATE POLICY "Users can manage their own vital signs"
ON public.vital_signs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family members can view shared vital signs"
ON public.vital_signs
FOR SELECT
USING (
  user_id IN (
    SELECT fm.user_id
    FROM family_members fm
    WHERE fm.family_group_id IN (
      SELECT fm2.family_group_id
      FROM family_members fm2
      WHERE fm2.user_id = auth.uid()
      AND fm2.invitation_status = 'accepted'
      AND (fm2.permissions->>'view_medications')::boolean = true
    )
    AND fm.invitation_status = 'accepted'
  )
);

-- RLS Policies for ai_insights
CREATE POLICY "Users can manage their own AI insights"
ON public.ai_insights
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_medication_goals_user_id ON public.medication_goals(user_id);
CREATE INDEX idx_medication_goals_active ON public.medication_goals(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_vital_signs_user_id ON public.vital_signs(user_id);
CREATE INDEX idx_vital_signs_recorded_at ON public.vital_signs(user_id, recorded_at DESC);
CREATE INDEX idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX idx_ai_insights_active ON public.ai_insights(user_id, dismissed_at) WHERE dismissed_at IS NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_medication_goals_updated_at
BEFORE UPDATE ON public.medication_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vital_signs_updated_at
BEFORE UPDATE ON public.vital_signs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();