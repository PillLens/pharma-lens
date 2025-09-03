-- Drop the problematic function if it exists and create a proper one
DROP FUNCTION IF EXISTS find_user_by_email_auth(text);

-- Update the existing find_user_by_email function to be more robust
CREATE OR REPLACE FUNCTION find_user_by_email(user_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simply return the user ID if they exist in profiles
  RETURN (SELECT id FROM public.profiles WHERE email = user_email LIMIT 1);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_user_by_email(text) TO authenticated;