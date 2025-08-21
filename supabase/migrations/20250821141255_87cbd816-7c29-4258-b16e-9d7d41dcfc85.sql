-- Create products table for medication information
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  generic_name TEXT,
  strength TEXT,
  form TEXT, -- tablet, capsule, liquid, etc.
  manufacturer TEXT,
  country_code TEXT NOT NULL DEFAULT 'AZ',
  barcode TEXT UNIQUE,
  atc_code TEXT, -- Anatomical Therapeutic Chemical code
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create labels table for storing official medication labels
CREATE TABLE public.labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  region TEXT NOT NULL DEFAULT 'AZ',
  language TEXT NOT NULL DEFAULT 'AZ',
  source_name TEXT,
  source_url TEXT,
  version_date DATE,
  raw_text TEXT,
  checksum TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create extractions table for LLM-processed information
CREATE TABLE public.extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label_id UUID REFERENCES public.labels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model_version TEXT NOT NULL DEFAULT 'v1.0',
  extracted_json JSONB NOT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.0,
  risk_flags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sessions table for user scanning sessions
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  region TEXT NOT NULL DEFAULT 'AZ',
  language TEXT NOT NULL DEFAULT 'AZ',
  images TEXT[] DEFAULT '{}',
  barcode_value TEXT,
  selected_product_id UUID REFERENCES public.products(id),
  extraction_id UUID REFERENCES public.extractions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback table for user feedback
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  issue_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pharmacy partners table
CREATE TABLE public.pharmacy_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partner labels table for verified pharmacy content
CREATE TABLE public.partner_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES public.pharmacy_partners(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  label_file_url TEXT,
  verified_by TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_labels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products (public read access)
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (true);

-- Create RLS policies for labels (public read access)
CREATE POLICY "labels_public_read" ON public.labels
  FOR SELECT USING (true);

-- Create RLS policies for extractions (users can see their own)
CREATE POLICY "extractions_user_read" ON public.extractions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "extractions_user_insert" ON public.extractions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "extractions_user_update" ON public.extractions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for sessions (users can see their own)
CREATE POLICY "sessions_user_read" ON public.sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sessions_user_insert" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_user_update" ON public.sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for feedback (users can see their own)
CREATE POLICY "feedback_user_read" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "feedback_user_insert" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for pharmacy partners (public read access)
CREATE POLICY "pharmacy_partners_public_read" ON public.pharmacy_partners
  FOR SELECT USING (true);

-- Create RLS policies for partner labels (public read access)
CREATE POLICY "partner_labels_public_read" ON public.partner_labels
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_country_brand ON public.products(country_code, brand_name);
CREATE INDEX idx_products_generic_name ON public.products USING gin(generic_name gin_trgm_ops);
CREATE INDEX idx_labels_product_id ON public.labels(product_id);
CREATE INDEX idx_labels_region_language ON public.labels(region, language);
CREATE INDEX idx_extractions_user_id ON public.extractions(user_id);
CREATE INDEX idx_extractions_label_id ON public.extractions(label_id);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_feedback_session_id ON public.feedback(session_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_labels_updated_at
  BEFORE UPDATE ON public.labels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extractions_updated_at
  BEFORE UPDATE ON public.extractions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;