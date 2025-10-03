-- Create reminder_history table for tracking reminder actions
CREATE TABLE IF NOT EXISTS public.reminder_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reminder_id UUID NOT NULL,
  medication_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'paused', 'activated', 'snoozed', 'taken', 'missed'
  action_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reminder_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reminder history"
  ON public.reminder_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminder history"
  ON public.reminder_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_reminder_history_user_id ON public.reminder_history(user_id);
CREATE INDEX idx_reminder_history_reminder_id ON public.reminder_history(reminder_id);
CREATE INDEX idx_reminder_history_created_at ON public.reminder_history(created_at DESC);