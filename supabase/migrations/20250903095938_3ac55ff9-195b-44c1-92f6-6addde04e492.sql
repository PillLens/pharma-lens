-- Add missing foreign key relationships for family_members table
-- This will fix the Supabase query errors for profile relationships

-- Add foreign key from family_members.user_id to profiles.id (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'family_members_user_id_fkey' 
        AND table_name = 'family_members'
    ) THEN
        ALTER TABLE public.family_members 
        ADD CONSTRAINT family_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key from family_members.invited_by to profiles.id (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'family_members_invited_by_fkey' 
        AND table_name = 'family_members'
    ) THEN
        ALTER TABLE public.family_members 
        ADD CONSTRAINT family_members_invited_by_fkey 
        FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key from family_groups.creator_id to profiles.id (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'family_groups_creator_id_fkey' 
        AND table_name = 'family_groups'
    ) THEN
        ALTER TABLE public.family_groups 
        ADD CONSTRAINT family_groups_creator_id_fkey 
        FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create shared_medications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.shared_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL,
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sharing_permissions JSONB NOT NULL DEFAULT '{"view": true, "edit": false, "delete": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on shared_medications
ALTER TABLE public.shared_medications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shared_medications
CREATE POLICY "Family members can view shared medications" 
ON public.shared_medications 
FOR SELECT 
USING (is_family_member(auth.uid(), family_group_id));

CREATE POLICY "Users can share their own medications" 
ON public.shared_medications 
FOR INSERT 
WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Medication owners can update sharing" 
ON public.shared_medications 
FOR UPDATE 
USING (auth.uid() = shared_by);

CREATE POLICY "Medication owners can delete sharing" 
ON public.shared_medications 
FOR DELETE 
USING (auth.uid() = shared_by);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_shared_medications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shared_medications_updated_at ON public.shared_medications;
CREATE TRIGGER update_shared_medications_updated_at
    BEFORE UPDATE ON public.shared_medications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_shared_medications_updated_at();