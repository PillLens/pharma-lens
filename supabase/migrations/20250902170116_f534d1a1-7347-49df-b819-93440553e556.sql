-- Update the family_members role constraint to include 'family' and 'emergency' roles
ALTER TABLE public.family_members DROP CONSTRAINT family_members_role_check;

-- Add new constraint with additional valid roles
ALTER TABLE public.family_members ADD CONSTRAINT family_members_role_check 
CHECK ((role = ANY (ARRAY['caregiver'::text, 'patient'::text, 'emergency_contact'::text, 'family'::text, 'emergency'::text])));