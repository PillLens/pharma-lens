-- Create family_calls table for call functionality
CREATE TABLE public.family_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id UUID NOT NULL,
  caller_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  status TEXT NOT NULL DEFAULT 'calling' CHECK (status IN ('calling', 'connected', 'ended', 'declined')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.family_calls ENABLE ROW LEVEL SECURITY;

-- Create policies for family calls
CREATE POLICY "Family members can view calls in their groups" 
ON public.family_calls 
FOR SELECT 
USING (
  family_group_id IN (
    SELECT family_group_id 
    FROM public.family_members 
    WHERE user_id = auth.uid() AND invitation_status = 'accepted'
  )
);

CREATE POLICY "Family members can create calls in their groups" 
ON public.family_calls 
FOR INSERT 
WITH CHECK (
  family_group_id IN (
    SELECT family_group_id 
    FROM public.family_members 
    WHERE user_id = auth.uid() AND invitation_status = 'accepted'
  )
  AND auth.uid() = caller_id
);

CREATE POLICY "Call participants can update call status" 
ON public.family_calls 
FOR UPDATE 
USING (
  (auth.uid() = caller_id OR auth.uid() = recipient_id)
  AND family_group_id IN (
    SELECT family_group_id 
    FROM public.family_members 
    WHERE user_id = auth.uid() AND invitation_status = 'accepted'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_family_calls_updated_at
BEFORE UPDATE ON public.family_calls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for family_calls
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_calls;