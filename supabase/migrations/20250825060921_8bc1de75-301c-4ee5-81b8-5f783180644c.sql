-- Update device_tokens table to support OneSignal
ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS onesignal_player_id TEXT;
ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Create rate limiting table for caregiver pokes  
CREATE TABLE IF NOT EXISTS poke_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  family_group_id UUID NOT NULL,
  poke_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on poke_rate_limits
ALTER TABLE poke_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for poke_rate_limits
CREATE POLICY "Users can view their own poke limits" ON poke_rate_limits
  FOR SELECT USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));

CREATE POLICY "System can manage poke limits" ON poke_rate_limits
  FOR ALL USING (true) WITH CHECK (true);

-- Create missed dose tracking for daily digest
CREATE TABLE IF NOT EXISTS missed_dose_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  medication_id UUID NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  date DATE NOT NULL,
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on missed_dose_tracking
ALTER TABLE missed_dose_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for missed_dose_tracking
CREATE POLICY "Users can view their own missed doses" ON missed_dose_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage missed dose tracking" ON missed_dose_tracking
  FOR ALL USING (true) WITH CHECK (true);

-- Create notification delivery tracking
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  notification_type TEXT NOT NULL,
  delivery_method TEXT NOT NULL, -- 'local', 'onesignal'
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  notification_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notification_delivery_logs
ALTER TABLE notification_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_delivery_logs
CREATE POLICY "Users can view their own delivery logs" ON notification_delivery_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage delivery logs" ON notification_delivery_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_poke_rate_limits_sender_recipient ON poke_rate_limits(sender_id, recipient_id, window_start);
CREATE INDEX IF NOT EXISTS idx_missed_dose_tracking_user_date ON missed_dose_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_user_type ON notification_delivery_logs(user_id, notification_type);
CREATE INDEX IF NOT EXISTS idx_device_tokens_onesignal ON device_tokens(onesignal_player_id) WHERE onesignal_player_id IS NOT NULL;

-- Update triggers for timestamp management
CREATE TRIGGER update_poke_rate_limits_updated_at
  BEFORE UPDATE ON poke_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_missed_dose_tracking_updated_at
  BEFORE UPDATE ON missed_dose_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();