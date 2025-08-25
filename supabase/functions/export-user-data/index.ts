import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw userError;
    const user = userData.user;
    if (!user) throw new Error('User not authenticated');

    // Rate limiting check
    const { data: rateLimitData } = await supabaseClient
      .from('api_rate_limits')
      .select('*')
      .eq('identifier', user.id)
      .eq('endpoint', 'export-user-data')
      .gte('window_end', new Date().toISOString())
      .single();

    if (rateLimitData && rateLimitData.request_count >= 1) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait before requesting another export.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update rate limit
    await supabaseClient.from('api_rate_limits').upsert({
      identifier: user.id,
      endpoint: 'export-user-data',
      request_count: 1,
      window_start: new Date().toISOString(),
      window_end: new Date(Date.now() + 60000).toISOString() // 1 minute window
    });

    // Fetch user data
    const [
      { data: profile },
      { data: medications },
      { data: reminders },
      { data: sessions },
      { data: adherenceLog }
    ] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', user.id).single(),
      supabaseClient.from('user_medications').select('*').eq('user_id', user.id),
      supabaseClient.from('medication_reminders').select('*').eq('user_id', user.id),
      supabaseClient.from('sessions').select('*').eq('user_id', user.id),
      supabaseClient.from('medication_adherence_log').select('*').eq('user_id', user.id)
    ]);

    // Create CSV content
    const csvData = {
      profile: profile || {},
      medications: medications || [],
      reminders: reminders || [],
      sessions: sessions || [],
      adherenceLog: adherenceLog || []
    };

    // Convert to CSV format
    const csvContent = JSON.stringify(csvData, null, 2);
    
    // In a real implementation, you would:
    // 1. Generate a proper CSV file
    // 2. Upload to storage bucket
    // 3. Return a signed URL for download
    // For now, we'll return a data URL
    
    const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(csvContent)}`;

    return new Response(JSON.stringify({ 
      downloadUrl: dataUrl,
      message: 'Data export ready for download' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});