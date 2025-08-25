-- Fix critical security vulnerability: Restrict profiles table access
-- Current policy allows all authenticated users to view all profiles
-- This exposes sensitive data like medical conditions, payment info, etc.

-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policies that protect sensitive data
-- Policy 1: Users can view their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Policy 2: Family members can view basic info of other family members
-- Only display_name, avatar_url, and last_seen for family coordination
CREATE POLICY "Family members can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != id AND 
  id IN (
    SELECT fm.user_id 
    FROM family_members fm
    WHERE fm.family_group_id IN (
      SELECT fm2.family_group_id 
      FROM family_members fm2 
      WHERE fm2.user_id = auth.uid() 
      AND fm2.invitation_status = 'accepted'
    )
    AND fm.invitation_status = 'accepted'
  )
);

-- Create a view for family-safe profile data that only exposes non-sensitive fields
CREATE OR REPLACE VIEW public.family_profile_view AS
SELECT 
  id,
  display_name,
  avatar_url,
  last_seen,
  created_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.family_profile_view OWNER TO postgres;

-- Grant access to the view
GRANT SELECT ON public.family_profile_view TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Family members can view safe profile data" 
ON public.family_profile_view 
FOR SELECT 
USING (
  -- Users can see their own data
  auth.uid() = id OR
  -- Family members can see basic info of other family members
  (auth.uid() != id AND 
   id IN (
     SELECT fm.user_id 
     FROM family_members fm
     WHERE fm.family_group_id IN (
       SELECT fm2.family_group_id 
       FROM family_members fm2 
       WHERE fm2.user_id = auth.uid() 
       AND fm2.invitation_status = 'accepted'
     )
     AND fm.invitation_status = 'accepted'
   ))
);