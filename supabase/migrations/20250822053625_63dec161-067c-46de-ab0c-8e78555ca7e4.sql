-- Create error reports table for error monitoring
CREATE TABLE IF NOT EXISTS public.error_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users,
  session_id TEXT NOT NULL,
  url TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  context JSONB,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crash reports table for mobile crash tracking
CREATE TABLE IF NOT EXISTS public.crash_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crash_id TEXT NOT NULL UNIQUE,
  app_version TEXT NOT NULL,
  platform TEXT NOT NULL,
  device_info JSONB NOT NULL,
  stack_trace TEXT NOT NULL,
  user_actions TEXT[],
  user_id UUID REFERENCES auth.users,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance metrics table for performance monitoring
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users,
  context JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crash_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for error reports
CREATE POLICY "Users can create error reports" 
ON public.error_reports 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own error reports" 
ON public.error_reports 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policies for crash reports
CREATE POLICY "Users can create crash reports" 
ON public.crash_reports 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own crash reports" 
ON public.crash_reports 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policies for performance metrics
CREATE POLICY "Users can create performance metrics" 
ON public.performance_metrics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own performance metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for better performance
CREATE INDEX idx_error_reports_user_id ON public.error_reports(user_id);
CREATE INDEX idx_error_reports_timestamp ON public.error_reports(timestamp DESC);
CREATE INDEX idx_error_reports_severity ON public.error_reports(severity);
CREATE INDEX idx_error_reports_resolved ON public.error_reports(resolved);

CREATE INDEX idx_crash_reports_user_id ON public.crash_reports(user_id);
CREATE INDEX idx_crash_reports_platform ON public.crash_reports(platform);
CREATE INDEX idx_crash_reports_timestamp ON public.crash_reports(timestamp DESC);

CREATE INDEX idx_performance_metrics_user_id ON public.performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_session ON public.performance_metrics(session_id);
CREATE INDEX idx_performance_metrics_name ON public.performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_timestamp ON public.performance_metrics(timestamp DESC);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_error_reports_updated_at
BEFORE UPDATE ON public.error_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create aggregate views for analytics (optional, for performance)
CREATE OR REPLACE VIEW public.error_summary AS
SELECT 
  DATE_TRUNC('day', timestamp) as date,
  error_type,
  severity,
  COUNT(*) as count,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.error_reports
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp), error_type, severity;

CREATE OR REPLACE VIEW public.performance_summary AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  metric_name,
  AVG(metric_value) as avg_value,
  MIN(metric_value) as min_value,
  MAX(metric_value) as max_value,
  COUNT(*) as sample_count
FROM public.performance_metrics
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', timestamp), metric_name;