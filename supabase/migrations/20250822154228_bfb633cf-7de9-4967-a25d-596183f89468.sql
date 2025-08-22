-- Update existing users to have 14-day trial if they don't have one
UPDATE public.profiles 
SET 
  is_trial_eligible = true,
  trial_expires_at = CASE 
    WHEN trial_expires_at IS NULL OR trial_expires_at < now() 
    THEN now() + interval '14 days'
    ELSE trial_expires_at
  END
WHERE trial_expires_at IS NULL OR trial_expires_at < now();

-- Update the handle_new_user function to automatically give new users 14-day trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    display_name, 
    is_trial_eligible, 
    trial_expires_at,
    trial_started_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    true,
    now() + interval '14 days', -- 14-day trial
    now()
  );
  RETURN NEW;
END;
$function$;