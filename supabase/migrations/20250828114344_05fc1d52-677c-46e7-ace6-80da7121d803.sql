-- Fix security issue: Restrict access to medication_interactions table
-- Remove the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can read medication interactions" ON public.medication_interactions;

-- Create a more secure policy that requires authentication
CREATE POLICY "Authenticated users can read medication interactions"
ON public.medication_interactions
FOR SELECT
TO authenticated
USING (true);

-- Add audit logging for medication interaction access
CREATE TABLE IF NOT EXISTS public.medication_interaction_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    interaction_id UUID REFERENCES public.medication_interactions(id),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address INET,
    user_agent TEXT,
    query_details JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on the audit table
ALTER TABLE public.medication_interaction_audit ENABLE ROW LEVEL SECURITY;

-- Only allow system to insert audit logs, users can view their own
CREATE POLICY "System can insert interaction audit logs"
ON public.medication_interaction_audit
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own interaction audit logs"
ON public.medication_interaction_audit
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a security definer function for controlled system access
CREATE OR REPLACE FUNCTION public.get_drug_interactions(
    medication_a_id_param UUID,
    medication_b_id_param UUID
)
RETURNS TABLE(
    id UUID,
    interaction_type TEXT,
    description TEXT,
    severity_score INTEGER,
    management_advice TEXT,
    evidence_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Log the access for audit purposes
    INSERT INTO public.medication_interaction_audit (
        user_id,
        query_details
    ) VALUES (
        auth.uid(),
        jsonb_build_object(
            'medication_a_id', medication_a_id_param,
            'medication_b_id', medication_b_id_param,
            'function', 'get_drug_interactions'
        )
    );

    RETURN QUERY
    SELECT 
        mi.id,
        mi.interaction_type,
        mi.description,
        mi.severity_score,
        mi.management_advice,
        mi.evidence_level
    FROM public.medication_interactions mi
    WHERE (mi.medication_a_id = medication_a_id_param AND mi.medication_b_id = medication_b_id_param)
       OR (mi.medication_a_id = medication_b_id_param AND mi.medication_b_id = medication_a_id_param);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_drug_interactions(UUID, UUID) TO authenticated;

-- Add rate limiting for interaction checks
CREATE TABLE IF NOT EXISTS public.interaction_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    window_end TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 hour'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.interaction_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage interaction rate limits"
ON public.interaction_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to check rate limits for drug interaction queries
CREATE OR REPLACE FUNCTION public.check_interaction_rate_limit(user_uuid UUID, limit_per_hour INTEGER DEFAULT 100)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_count INTEGER;
    window_start_time TIMESTAMP WITH TIME ZONE;
    window_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate current hour window
    window_start_time := date_trunc('hour', now());
    window_end_time := window_start_time + interval '1 hour';
    
    -- Get current count for this user in this hour
    SELECT COALESCE(SUM(request_count), 0)
    INTO current_count
    FROM public.interaction_rate_limits
    WHERE user_id = user_uuid
    AND window_start >= window_start_time
    AND window_end <= window_end_time;
    
    -- If over limit, return false
    IF current_count >= limit_per_hour THEN
        RETURN false;
    END IF;
    
    -- Otherwise, increment counter and return true
    INSERT INTO public.interaction_rate_limits (user_id, window_start, window_end)
    VALUES (user_uuid, window_start_time, window_end_time)
    ON CONFLICT DO NOTHING;
    
    UPDATE public.interaction_rate_limits
    SET request_count = request_count + 1,
        updated_at = now()
    WHERE user_id = user_uuid
    AND window_start = window_start_time
    AND window_end = window_end_time;
    
    RETURN true;
END;
$$;

-- Clean up old rate limit entries (called by a scheduled job)
CREATE OR REPLACE FUNCTION public.cleanup_interaction_rate_limits()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    DELETE FROM public.interaction_rate_limits 
    WHERE window_end < (now() - interval '24 hours');
END;
$$;