-- Create storage bucket for user data exports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-exports', 
  'user-exports', 
  false, 
  52428800, -- 50MB limit
  ARRAY['application/json', 'text/csv', 'application/zip']
);

-- Create policies for user exports bucket
CREATE POLICY "Users can upload their own export files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'user-exports' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can download their own export files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'user-exports' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own export files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'user-exports' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);