-- Add location and timezone fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN city text,
ADD COLUMN country text,
ADD COLUMN location_permission_granted boolean DEFAULT false,
ADD COLUMN location_permission_asked boolean DEFAULT false;

-- Create indexes for better performance on location queries
CREATE INDEX idx_profiles_location ON public.profiles(country, city);

-- Update the handle_new_user function to set timezone from browser
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    display_name, 
    is_trial_eligible, 
    trial_expires_at,
    trial_started_at,
    timezone,
    location_permission_asked,
    location_permission_granted
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    true,
    now() + interval '14 days', -- 14-day trial
    now(),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'), -- Get timezone from signup metadata if provided
    false,
    false
  );
  RETURN NEW;
END;
$$;