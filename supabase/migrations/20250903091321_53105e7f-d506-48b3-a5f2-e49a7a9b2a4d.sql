-- Clean up duplicate invitations and accept all pending invitations for users who have already signed up
-- This fixes the issue where multiple invitations exist for the same email

-- Accept all pending invitations for rbayov@gmail.com who has already signed up
UPDATE family_members 
SET 
  invitation_status = 'accepted',
  accepted_at = NOW(),
  user_id = (SELECT id FROM profiles WHERE email = 'rbayov@gmail.com' LIMIT 1),
  invited_email = NULL,
  updated_at = NOW()
WHERE invited_email = 'rbayov@gmail.com' 
  AND invitation_status = 'pending';

-- Create a function to prevent duplicate invitations in the future
CREATE OR REPLACE FUNCTION prevent_duplicate_family_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's already a pending or accepted invitation for this email/user in this group
  IF EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_group_id = NEW.family_group_id 
    AND (
      (NEW.user_id IS NOT NULL AND user_id = NEW.user_id) OR
      (NEW.invited_email IS NOT NULL AND invited_email = NEW.invited_email)
    )
    AND invitation_status IN ('pending', 'accepted')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'User already has a pending or accepted invitation for this family group';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent duplicate invitations
DROP TRIGGER IF EXISTS prevent_duplicate_invitations ON family_members;
CREATE TRIGGER prevent_duplicate_invitations
  BEFORE INSERT OR UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_family_invitations();