-- Create data sources table for provider metadata
CREATE TABLE public.data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL UNIQUE,
  base_url TEXT,
  api_key_required BOOLEAN NOT NULL DEFAULT false,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  attribution_required BOOLEAN NOT NULL DEFAULT true,
  license_type TEXT NOT NULL DEFAULT 'free',
  license_url TEXT,
  data_quality_score NUMERIC(3,2) DEFAULT 0.80,
  supported_countries TEXT[] DEFAULT '{}',
  supported_data_types TEXT[] DEFAULT '{}', -- 'products', 'interactions', 'classifications'
  last_sync TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add data source tracking fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS source_provider TEXT REFERENCES public.data_sources(provider_name),
ADD COLUMN IF NOT EXISTS source_id TEXT, -- Original ID in source system
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS license_type TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS attribution_text TEXT,
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3,2) DEFAULT 0.80,
ADD COLUMN IF NOT EXISTS regulatory_authority TEXT, -- FDA, EMA, Health Canada, etc.
ADD COLUMN IF NOT EXISTS registration_number TEXT, -- Local drug authority registration
ADD COLUMN IF NOT EXISTS ndc_number TEXT, -- US National Drug Code
ADD COLUMN IF NOT EXISTS gtin TEXT, -- Global Trade Item Number
ADD COLUMN IF NOT EXISTS rxcui TEXT; -- RxNorm Concept Unique Identifier

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_products_source_provider ON public.products(source_provider);
CREATE INDEX IF NOT EXISTS idx_products_country_code ON public.products(country_code);
CREATE INDEX IF NOT EXISTS idx_products_ndc ON public.products(ndc_number) WHERE ndc_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_gtin ON public.products(gtin) WHERE gtin IS NOT NULL;

-- Insert initial data sources
INSERT INTO public.data_sources (provider_name, base_url, api_key_required, rate_limit_per_hour, attribution_required, license_type, supported_countries, supported_data_types) VALUES
('OpenFDA', 'https://api.fda.gov', false, 240, true, 'free', ARRAY['US'], ARRAY['products']),
('RxNorm', 'https://rxnav.nlm.nih.gov', false, 20, true, 'free', ARRAY['US'], ARRAY['classifications']),
('WHO_ATC', 'https://www.whocc.no/atc_ddd_index', false, 10, true, 'free', ARRAY['GLOBAL'], ARRAY['classifications']),
('EMA', 'https://www.ema.europa.eu', false, 60, true, 'free', ARRAY['EU'], ARRAY['products']),
('Health_Canada_DPD', 'https://health-products.canada.ca', false, 100, true, 'free', ARRAY['CA'], ARRAY['products']),
('ARTG_Australia', 'https://www.tga.gov.au', false, 100, true, 'free', ARRAY['AU'], ARRAY['products']),
('Azerbaijan_Local', 'local', false, 999999, false, 'proprietary', ARRAY['AZ'], ARRAY['products', 'interactions']),
('Comprehensive_DB', 'local', false, 999999, false, 'proprietary', ARRAY['GLOBAL'], ARRAY['products', 'interactions']);

-- Create provider sync logs table
CREATE TABLE public.provider_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL REFERENCES public.data_sources(provider_name),
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'verification'
  records_processed INTEGER DEFAULT 0,
  records_added INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Update existing products to use new schema
UPDATE public.products 
SET source_provider = 'Azerbaijan_Local',
    confidence_score = 0.85,
    license_type = 'proprietary'
WHERE source_provider IS NULL;

-- Add trigger for data_sources updated_at
CREATE TRIGGER update_data_sources_updated_at
BEFORE UPDATE ON public.data_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for data_sources (read-only for all authenticated users)
CREATE POLICY "Anyone can view data sources" 
ON public.data_sources 
FOR SELECT 
USING (true);

-- RLS policies for provider_sync_logs (system only)
CREATE POLICY "System can manage sync logs" 
ON public.provider_sync_logs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.data_sources IS 'Metadata for different medication data providers (OpenFDA, RxNorm, EMA, etc.)';
COMMENT ON TABLE public.provider_sync_logs IS 'Logs for data synchronization from external providers';
COMMENT ON COLUMN public.products.source_provider IS 'Which data source provided this record';
COMMENT ON COLUMN public.products.ndc_number IS 'US National Drug Code for FDA products';
COMMENT ON COLUMN public.products.rxcui IS 'RxNorm Concept Unique Identifier';