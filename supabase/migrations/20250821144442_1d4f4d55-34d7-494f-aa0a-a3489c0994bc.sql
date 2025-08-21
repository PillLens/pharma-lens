-- Create storage buckets for medication images and leaflets
INSERT INTO storage.buckets (id, name, public) VALUES ('medication-images', 'medication-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('medication-leaflets', 'medication-leaflets', false);

-- Create storage policies for medication images (public read)
CREATE POLICY "Medication images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medication-images');

CREATE POLICY "Admin can upload medication images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medication-images');

-- Create storage policies for leaflets (authenticated users only)
CREATE POLICY "Users can view medication leaflets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medication-leaflets' AND auth.role() = 'authenticated');

CREATE POLICY "Admin can upload medication leaflets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medication-leaflets');

-- Expand products table with additional fields for production
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS leaflet_url TEXT,
ADD COLUMN IF NOT EXISTS active_ingredients TEXT[],
ADD COLUMN IF NOT EXISTS dosage_forms TEXT[],
ADD COLUMN IF NOT EXISTS therapeutic_class TEXT,
ADD COLUMN IF NOT EXISTS prescription_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS safety_warnings TEXT[],
ADD COLUMN IF NOT EXISTS storage_conditions TEXT,
ADD COLUMN IF NOT EXISTS expiry_monitoring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS search_keywords TEXT[],
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual';

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_products_search_keywords ON products USING GIN(search_keywords);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_atc_code ON products(atc_code);
CREATE INDEX IF NOT EXISTS idx_products_verification_status ON products(verification_status);

-- Create medication interactions table
CREATE TABLE IF NOT EXISTS public.medication_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_a_id UUID REFERENCES products(id),
  medication_b_id UUID REFERENCES products(id),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('major', 'moderate', 'minor')),
  description TEXT NOT NULL,
  management_advice TEXT,
  severity_score INTEGER CHECK (severity_score >= 1 AND severity_score <= 10),
  evidence_level TEXT CHECK (evidence_level IN ('high', 'moderate', 'low')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(medication_a_id, medication_b_id)
);

-- Enable RLS on interactions table
ALTER TABLE public.medication_interactions ENABLE ROW LEVEL SECURITY;

-- Create policy for reading interactions
CREATE POLICY "Anyone can read medication interactions" 
ON public.medication_interactions 
FOR SELECT 
USING (true);

-- Create analytics table for usage tracking
CREATE TABLE IF NOT EXISTS public.usage_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  session_id UUID,
  event_type TEXT NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  platform TEXT,
  version TEXT
);

-- Enable RLS on analytics
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;

-- Analytics policies
CREATE POLICY "Users can insert their own analytics" 
ON public.usage_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create trigger for updating products updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();