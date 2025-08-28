import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get client identifier for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const identifier = `${user.id}:${clientIP}`;

    // Check rate limit using Supabase RPC function
    const { data: rateLimitAllowed, error: rateLimitError } = await supabase.rpc(
      'check_rate_limit',
      {
        p_identifier: identifier,
        p_endpoint: 'image_upload',
        p_limit: 10, // 10 uploads per minute
        p_window_minutes: 1
      }
    );

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError);
    } else if (!rateLimitAllowed) {
      // Log rate limit violation
      await supabase
        .from('security_audit_logs')
        .insert({
          user_id: user.id,
          action: 'rate_limit_exceeded',
          resource_type: 'image_upload',
          ip_address: clientIP,
          user_agent: userAgent,
          success: false,
          failure_reason: 'Rate limit exceeded'
        });

      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const imageType = formData.get('imageType') as string;

    // Validate required fields
    if (!file || !productId || !imageType) {
      const error = 'Missing required fields: file, productId, imageType';
      console.error(error);
      return new Response(
        JSON.stringify({ error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate file type (only allow images)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const error = `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`;
      console.error(error);
      return new Response(
        JSON.stringify({ error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const error = `File too large: ${file.size} bytes. Maximum: ${maxSize} bytes`;
      console.error(error);
      return new Response(
        JSON.stringify({ error }),
        { 
          status: 413, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate productId format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      const error = 'Invalid productId format';
      console.error(error);
      return new Response(
        JSON.stringify({ error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate imageType
    const validImageTypes = ['label', 'package', 'pill'];
    if (!validImageTypes.includes(imageType)) {
      const error = `Invalid imageType: ${imageType}. Allowed: ${validImageTypes.join(', ')}`;
      console.error(error);
      return new Response(
        JSON.stringify({ error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate secure filename
    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${productId}/${imageType}/${timestamp}_${randomId}.${fileExtension}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('medication-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      
      // Log upload failure
      await supabase
        .from('security_audit_logs')
        .insert({
          user_id: user.id,
          action: 'image_upload_failed',
          resource_type: 'storage',
          resource_id: fileName,
          ip_address: clientIP,
          user_agent: userAgent,
          success: false,
          failure_reason: uploadError.message,
          additional_context: {
            file_size: file.size,
            file_type: file.type,
            product_id: productId,
            image_type: imageType
          }
        });

      return new Response(
        JSON.stringify({ error: 'Upload failed: ' + uploadError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('medication-images')
      .getPublicUrl(fileName);

    // Log successful upload
    await supabase
      .from('security_audit_logs')
      .insert({
        user_id: user.id,
        action: 'image_upload_success',
        resource_type: 'storage',
        resource_id: fileName,
        ip_address: clientIP,
        user_agent: userAgent,
        success: true,
        additional_context: {
          file_size: file.size,
          file_type: file.type,
          product_id: productId,
          image_type: imageType,
          public_url: publicUrl
        }
      });

    console.log(`Successfully uploaded: ${fileName} for user: ${user.id}`);

    return new Response(
      JSON.stringify({
        message: 'File uploaded successfully',
        path: uploadData.path,
        publicUrl: publicUrl
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in secure-image-upload:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});