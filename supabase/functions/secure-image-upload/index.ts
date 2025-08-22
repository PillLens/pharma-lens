import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // Check rate limits
    const rateLimitResult = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: 'image-upload',
      p_limit: 20, // 20 uploads per minute
      p_window_minutes: 1
    });

    if (!rateLimitResult) {
      // Log rate limit violation
      await supabase.from('security_audit_logs').insert({
        user_id: user.id,
        action: 'rate_limit_exceeded',
        resource_type: 'image_upload',
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        failure_reason: 'Rate limit exceeded for image uploads',
        sensitive_data_accessed: false,
        additional_context: {
          endpoint: 'image-upload',
          limit: 20,
          window_minutes: 1
        }
      });

      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }

    // Parse the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const imageType = formData.get('type') as string;

    if (!file || !productId || !imageType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, productId, type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (file.size > maxSizeBytes) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 10MB.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate secure filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomSuffix = crypto.randomUUID().substring(0, 8);
    const fileName = `${productId}/${imageType}_${timestamp}_${randomSuffix}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('medication-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      // Log upload failure
      await supabase.from('security_audit_logs').insert({
        user_id: user.id,
        action: 'image_upload_failed',
        resource_type: 'medication_image',
        resource_id: fileName,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        failure_reason: uploadError.message,
        sensitive_data_accessed: true,
        additional_context: {
          fileName,
          fileSize: file.size,
          fileType: file.type
        }
      });

      return new Response(
        JSON.stringify({ error: 'Upload failed', details: uploadError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('medication-images')
      .getPublicUrl(fileName);

    // Log successful upload
    await supabase.from('security_audit_logs').insert({
      user_id: user.id,
      action: 'image_uploaded',
      resource_type: 'medication_image',
      resource_id: fileName,
      ip_address: clientIP,
      user_agent: userAgent,
      success: true,
      sensitive_data_accessed: true,
      additional_context: {
        fileName,
        fileSize: file.size,
        fileType: file.type,
        productId,
        imageType
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          path: uploadData.path,
          url: urlData.publicUrl,
          fileName,
          size: file.size,
          type: file.type
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Secure image upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});