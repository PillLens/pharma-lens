-- Fix security vulnerability: Restrict access to notification_delivery_logs
-- Remove overly permissive policy and implement proper access control

-- Drop the overly permissive policy that allows public access
DROP POLICY IF EXISTS "System can manage delivery logs" ON public.notification_delivery_logs;

-- Create a policy for system to INSERT notification logs
-- This allows edge functions with service role to create logs
CREATE POLICY "System can insert notification logs"
ON public.notification_delivery_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Keep existing policy for users to view their own logs (already exists and is correct)
-- Policy: "Users can view their own delivery logs" with USING (auth.uid() = user_id)
-- This ensures users can only see their own notification logs

-- Add policy to prevent any updates to logs (audit trail integrity)
CREATE POLICY "No one can update notification logs"
ON public.notification_delivery_logs
FOR UPDATE
TO authenticated
USING (false);

-- Add policy to prevent any deletions (audit trail integrity)
CREATE POLICY "No one can delete notification logs"
ON public.notification_delivery_logs
FOR DELETE
TO authenticated
USING (false);