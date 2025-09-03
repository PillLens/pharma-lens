-- Clean up duplicate invitations properly by keeping only the latest one per email per group
-- First, identify and accept the most recent invitation for each email per group
WITH latest_invitations AS (
  SELECT DISTINCT ON (family_group_id, invited_email)
    id,
    family_group_id,
    invited_email
  FROM family_members 
  WHERE invited_email IS NOT NULL 
    AND invitation_status = 'pending'
  ORDER BY family_group_id, invited_email, created_at DESC
)
UPDATE family_members 
SET 
  invitation_status = 'accepted',
  accepted_at = NOW(),
  user_id = (
    SELECT id FROM profiles 
    WHERE email = family_members.invited_email 
    LIMIT 1
  ),
  invited_email = NULL,
  updated_at = NOW()
FROM latest_invitations
WHERE family_members.id = latest_invitations.id
  AND family_members.invited_email = 'rbayov@gmail.com';

-- Delete all other duplicate pending invitations for the same email/group combinations
DELETE FROM family_members 
WHERE invited_email = 'rbayov@gmail.com' 
  AND invitation_status = 'pending';

-- Also clean up other potential duplicates
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY family_group_id, invited_email 
      ORDER BY created_at DESC
    ) as rn
  FROM family_members 
  WHERE invited_email IS NOT NULL 
    AND invitation_status = 'pending'
)
DELETE FROM family_members 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);