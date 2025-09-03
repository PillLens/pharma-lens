-- Add index for invited_email to improve performance when looking up email-based invitations
CREATE INDEX IF NOT EXISTS idx_family_members_invited_email 
ON family_members(invited_email) 
WHERE invited_email IS NOT NULL;

-- Add index for combined lookup of invitation status and email
CREATE INDEX IF NOT EXISTS idx_family_members_invitation_email_status 
ON family_members(invited_email, invitation_status) 
WHERE invited_email IS NOT NULL;