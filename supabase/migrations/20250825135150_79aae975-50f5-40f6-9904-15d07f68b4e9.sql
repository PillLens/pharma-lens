-- Add notification permission tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN notification_permission_asked boolean DEFAULT false;