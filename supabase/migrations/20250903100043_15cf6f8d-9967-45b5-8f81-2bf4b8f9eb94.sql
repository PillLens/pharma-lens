-- Add missing foreign key relationships only
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