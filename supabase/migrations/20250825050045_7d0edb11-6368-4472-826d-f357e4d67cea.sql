-- Fix security warning: Set search_path for the function
CREATE OR REPLACE FUNCTION public.get_family_member_profile(member_user_id uuid)
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  last_seen timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Only return basic profile data if the requesting user is in the same family group
  SELECT p.id, p.display_name, p.avatar_url, p.last_seen
  FROM public.profiles p
  WHERE p.id = member_user_id
  AND EXISTS (
    -- Check if both users are in the same family group
    SELECT 1 
    FROM family_members fm1
    JOIN family_members fm2 ON fm1.family_group_id = fm2.family_group_id
    WHERE fm1.user_id = auth.uid() 
    AND fm2.user_id = member_user_id
    AND fm1.invitation_status = 'accepted'
    AND fm2.invitation_status = 'accepted'
  );
$$;