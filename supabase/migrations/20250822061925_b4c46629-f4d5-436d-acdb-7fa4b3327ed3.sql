-- Fix UUID issues and add database optimization indexes
-- First, let's add proper indexes for performance optimization

-- Products table indexes for search optimization
CREATE INDEX IF NOT EXISTS idx_products_brand_name_gin ON products USING gin(to_tsvector('english', brand_name));
CREATE INDEX IF NOT EXISTS idx_products_generic_name_gin ON products USING gin(to_tsvector('english', generic_name));
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_atc_code ON products(atc_code) WHERE atc_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_country_verification ON products(country_code, verification_status);
CREATE INDEX IF NOT EXISTS idx_products_active_ingredients_gin ON products USING gin(active_ingredients);

-- User medications indexes
CREATE INDEX IF NOT EXISTS idx_user_medications_user_active ON user_medications(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_medications_end_date ON user_medications(end_date) WHERE end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_medications_start_date ON user_medications(start_date);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_timestamp ON performance_metrics(user_id, timestamp) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_timestamp ON performance_metrics(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name_timestamp ON performance_metrics(metric_name, timestamp);

-- Usage analytics indexes
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_timestamp ON usage_analytics(user_id, timestamp) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usage_analytics_event_type_timestamp ON usage_analytics(event_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_session_timestamp ON usage_analytics(session_id, timestamp) WHERE session_id IS NOT NULL;

-- Error reports indexes
CREATE INDEX IF NOT EXISTS idx_error_reports_user_timestamp ON error_reports(user_id, timestamp) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_reports_severity_timestamp ON error_reports(severity, timestamp);
CREATE INDEX IF NOT EXISTS idx_error_reports_session_timestamp ON error_reports(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_error_reports_resolved ON error_reports(resolved, timestamp) WHERE resolved = false;

-- Family groups and members indexes
CREATE INDEX IF NOT EXISTS idx_family_members_user_status ON family_members(user_id, invitation_status);
CREATE INDEX IF NOT EXISTS idx_family_members_group_status ON family_members(family_group_id, invitation_status);
CREATE INDEX IF NOT EXISTS idx_shared_medications_family_group ON shared_medications(family_group_id);

-- Medication interactions indexes
CREATE INDEX IF NOT EXISTS idx_medication_interactions_a_b ON medication_interactions(medication_a_id, medication_b_id);
CREATE INDEX IF NOT EXISTS idx_medication_interactions_severity ON medication_interactions(severity_score) WHERE severity_score IS NOT NULL;

-- Create rate limiting table for API protection
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP address, user ID, or API key
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    window_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 minute'),
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_identifier_endpoint ON api_rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON api_rate_limits(window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_blocked ON api_rate_limits(is_blocked) WHERE is_blocked = true;

-- Enable RLS on rate limiting table
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for rate limiting (system can manage all records)
CREATE POLICY "System can manage rate limits" ON public.api_rate_limits
FOR ALL USING (true) WITH CHECK (true);

-- Create security audit log table for HIPAA compliance
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT true,
    failure_reason TEXT,
    sensitive_data_accessed BOOLEAN NOT NULL DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    session_id TEXT,
    additional_context JSONB
);

-- Indexes for security audit logs
CREATE INDEX IF NOT EXISTS idx_security_audit_user_timestamp ON security_audit_logs(user_id, timestamp) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_audit_action_timestamp ON security_audit_logs(action, timestamp);
CREATE INDEX IF NOT EXISTS idx_security_audit_resource ON security_audit_logs(resource_type, resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_audit_ip_timestamp ON security_audit_logs(ip_address, timestamp) WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_audit_sensitive_data ON security_audit_logs(sensitive_data_accessed, timestamp) WHERE sensitive_data_accessed = true;

-- Enable RLS on security audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for security audit logs (users can view their own, system can create all)
CREATE POLICY "Users can view their own audit logs" ON public.security_audit_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create audit logs" ON public.security_audit_logs
FOR INSERT WITH CHECK (true);

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM api_rate_limits 
    WHERE window_end < (now() - interval '1 hour');
END;
$$;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_limit INTEGER DEFAULT 60,
    p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_count INTEGER;
    window_start_time TIMESTAMP WITH TIME ZONE;
    window_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate window times
    window_start_time := date_trunc('minute', now()) - (p_window_minutes - 1) * interval '1 minute';
    window_end_time := window_start_time + p_window_minutes * interval '1 minute';
    
    -- Check if already blocked
    IF EXISTS (
        SELECT 1 FROM api_rate_limits 
        WHERE identifier = p_identifier 
        AND endpoint = p_endpoint 
        AND is_blocked = true 
        AND window_end > now()
    ) THEN
        RETURN false;
    END IF;
    
    -- Get current count in window
    SELECT COALESCE(SUM(request_count), 0)
    INTO current_count
    FROM api_rate_limits
    WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start >= window_start_time
    AND window_end <= window_end_time;
    
    -- If over limit, block
    IF current_count >= p_limit THEN
        INSERT INTO api_rate_limits (identifier, endpoint, request_count, window_start, window_end, is_blocked)
        VALUES (p_identifier, p_endpoint, 1, window_start_time, window_end_time, true)
        ON CONFLICT DO NOTHING;
        RETURN false;
    END IF;
    
    -- Otherwise, increment counter
    INSERT INTO api_rate_limits (identifier, endpoint, request_count, window_start, window_end)
    VALUES (p_identifier, p_endpoint, 1, window_start_time, window_end_time)
    ON CONFLICT (identifier, endpoint) WHERE window_start = window_start_time AND window_end = window_end_time
    DO UPDATE SET 
        request_count = api_rate_limits.request_count + 1,
        updated_at = now();
    
    RETURN true;
END;
$$;