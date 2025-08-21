-- Create user_medications table for medication management
CREATE TABLE public.user_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  prescriber TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_medications ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own medications" 
ON public.user_medications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medications" 
ON public.user_medications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications" 
ON public.user_medications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications" 
ON public.user_medications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_medications_updated_at
BEFORE UPDATE ON public.user_medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_medications_user_id ON public.user_medications(user_id);
CREATE INDEX idx_user_medications_is_active ON public.user_medications(is_active);
CREATE INDEX idx_user_medications_generic_name ON public.user_medications(generic_name);