-- Insert missing profile for the current user
INSERT INTO public.profiles (
  id, 
  email, 
  display_name, 
  is_trial_eligible, 
  trial_expires_at,
  trial_started_at,
  plan
)
VALUES (
  '922447d8-2b0a-44dd-9951-4428039bc6dc',
  'bekovrafik@gmail.com',
  'bekovrafik@gmail.com',
  true,
  now() + interval '14 days',
  now(),
  'free'
) ON CONFLICT (id) DO NOTHING;