-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security definer functions to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_family_groups(user_uuid UUID)
RETURNS TABLE(family_group_id UUID)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT fm.family_group_id
  FROM family_members fm
  WHERE fm.user_id = user_uuid 
  AND fm.invitation_status = 'accepted';
$$;

CREATE OR REPLACE FUNCTION public.is_family_member(user_uuid UUID, group_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = user_uuid 
    AND fm.family_group_id = group_uuid
    AND fm.invitation_status = 'accepted'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_invite_to_group(user_uuid UUID, group_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_groups fg
    WHERE fg.id = group_uuid
    AND fg.creator_id = user_uuid
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view family groups they belong to" ON public.family_groups;
DROP POLICY IF EXISTS "Users can view family members in their groups" ON public.family_members;
DROP POLICY IF EXISTS "Users can invite family members" ON public.family_members;
DROP POLICY IF EXISTS "Family members can view shared medications" ON public.shared_medications;

-- Create new RLS policies using security definer functions
CREATE POLICY "Users can view family groups they belong to" ON public.family_groups
  FOR SELECT USING (
    creator_id = auth.uid() OR 
    id IN (SELECT family_group_id FROM public.get_user_family_groups(auth.uid()))
  );

CREATE POLICY "Users can view family members in their groups" ON public.family_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.is_family_member(auth.uid(), family_group_id)
  );

CREATE POLICY "Users can invite family members" ON public.family_members
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND 
    public.can_invite_to_group(auth.uid(), family_group_id)
  );

CREATE POLICY "Family members can view shared medications" ON public.shared_medications
  FOR SELECT USING (
    shared_by = auth.uid() OR
    public.is_family_member(auth.uid(), family_group_id)
  );

-- Function to find user by email
CREATE OR REPLACE FUNCTION public.find_user_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.profiles WHERE email = user_email LIMIT 1;
$$;

-- Function to get profile by user id
CREATE OR REPLACE FUNCTION public.get_profile(user_uuid UUID)
RETURNS TABLE(id UUID, email TEXT, display_name TEXT, avatar_url TEXT)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT p.id, p.email, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = user_uuid;
$$;

-- Add updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  family_invitations BOOLEAN DEFAULT true,
  medication_reminders BOOLEAN DEFAULT true,
  health_alerts BOOLEAN DEFAULT true,
  emergency_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger for notification preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();