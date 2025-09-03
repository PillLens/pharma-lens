-- Add DELETE policy for family members
-- Allow group creators and invited_by users to remove members
CREATE POLICY "Group creators can remove family members" 
ON public.family_members 
FOR DELETE 
USING (
  -- Allow if user is the group creator
  (family_group_id IN (
    SELECT id FROM public.family_groups 
    WHERE creator_id = auth.uid()
  ))
  -- Or if user is the one who invited the member
  OR (invited_by = auth.uid())
  -- Or if user is removing themselves
  OR (user_id = auth.uid())
);