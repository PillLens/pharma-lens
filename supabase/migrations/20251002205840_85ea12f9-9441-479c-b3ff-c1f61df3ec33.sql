-- Create voice_conversation_analytics table for tracking AI voice chat usage
CREATE TABLE IF NOT EXISTS public.voice_conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  duration_minutes DECIMAL NOT NULL DEFAULT 0,
  message_count INTEGER NOT NULL DEFAULT 0,
  estimated_cost DECIMAL,
  voice_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.voice_conversation_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own voice analytics"
  ON public.voice_conversation_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice analytics"
  ON public.voice_conversation_analytics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage voice analytics"
  ON public.voice_conversation_analytics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_voice_analytics_user_date 
  ON public.voice_conversation_analytics(user_id, session_start DESC);