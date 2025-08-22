-- Fix security issues identified by Supabase linter

-- Fix function search path issues by updating existing functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_endpoint text, p_limit integer DEFAULT 60, p_window_minutes integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    DELETE FROM api_rate_limits 
    WHERE window_end < (now() - interval '1 hour');
END;
$function$;