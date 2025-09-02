-- Check current role constraint on family_members table
ALTER TABLE family_members DROP CONSTRAINT IF EXISTS family_members_role_check;

-- Add the correct role constraint that matches the frontend code
ALTER TABLE family_members ADD CONSTRAINT family_members_role_check 
CHECK (role IN ('caregiver', 'patient', 'emergency_contact'));