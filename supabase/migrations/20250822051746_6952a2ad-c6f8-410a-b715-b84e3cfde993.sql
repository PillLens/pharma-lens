-- Create family sharing tables
CREATE TABLE public.family_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  creator_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family members table
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('caregiver', 'patient', 'emergency_contact')),
  permissions JSONB NOT NULL DEFAULT '{"view_medications": true, "edit_medications": false, "receive_alerts": true}'::jsonb,
  invited_by UUID,
  invitation_status TEXT NOT NULL DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_group_id, user_id)
);

-- Create shared medications table
CREATE TABLE public.shared_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.user_medications(id) ON DELETE CASCADE,
  family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  sharing_permissions JSONB NOT NULL DEFAULT '{"view": true, "edit": false, "delete": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(medication_id, family_group_id)
);

-- Create medication reminders table
CREATE TABLE public.medication_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medication_id UUID NOT NULL REFERENCES public.user_medications(id) ON DELETE CASCADE,
  reminder_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}'::integer[], -- 1=Monday, 7=Sunday
  is_active BOOLEAN NOT NULL DEFAULT true,
  notification_settings JSONB NOT NULL DEFAULT '{"sound": true, "vibration": true, "led": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for family_groups
CREATE POLICY "Users can create family groups" 
ON public.family_groups 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view family groups they belong to" 
ON public.family_groups 
FOR SELECT 
USING (
  id IN (
    SELECT family_group_id 
    FROM public.family_members 
    WHERE user_id = auth.uid() AND invitation_status = 'accepted'
  ) OR creator_id = auth.uid()
);

CREATE POLICY "Group creators can update their groups" 
ON public.family_groups 
FOR UPDATE 
USING (auth.uid() = creator_id);

-- Create RLS policies for family_members
CREATE POLICY "Users can invite family members" 
ON public.family_members 
FOR INSERT 
WITH CHECK (
  invited_by = auth.uid() AND 
  family_group_id IN (
    SELECT id FROM public.family_groups WHERE creator_id = auth.uid()
  )
);

CREATE POLICY "Users can view family members in their groups" 
ON public.family_members 
FOR SELECT 
USING (
  family_group_id IN (
    SELECT family_group_id 
    FROM public.family_members 
    WHERE user_id = auth.uid() AND invitation_status = 'accepted'
  ) OR user_id = auth.uid()
);

CREATE POLICY "Users can update their own family membership" 
ON public.family_members 
FOR UPDATE 
USING (auth.uid() = user_id OR invited_by = auth.uid());

-- Create RLS policies for shared_medications
CREATE POLICY "Users can share their medications" 
ON public.shared_medications 
FOR INSERT 
WITH CHECK (
  shared_by = auth.uid() AND 
  medication_id IN (
    SELECT id FROM public.user_medications WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Family members can view shared medications" 
ON public.shared_medications 
FOR SELECT 
USING (
  family_group_id IN (
    SELECT family_group_id 
    FROM public.family_members 
    WHERE user_id = auth.uid() AND invitation_status = 'accepted'
  )
);

CREATE POLICY "Medication owners can update sharing settings" 
ON public.shared_medications 
FOR UPDATE 
USING (auth.uid() = shared_by);

-- Create RLS policies for medication_reminders
CREATE POLICY "Users can manage their own reminders" 
ON public.medication_reminders 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_family_groups_updated_at
BEFORE UPDATE ON public.family_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_medications_updated_at
BEFORE UPDATE ON public.shared_medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medication_reminders_updated_at
BEFORE UPDATE ON public.medication_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();