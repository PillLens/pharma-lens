import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return value !== null && value !== undefined ? `"${String(value).replace(/"/g, '""')}"` : '';
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

function generateExportFile(userData: any, format: 'csv' | 'json'): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    userId: userData.profile?.id || 'unknown',
    userEmail: userData.profile?.email || 'unknown',
    ...userData
  };
  
  if (format === 'json') {
    return JSON.stringify(exportData, null, 2);
  } else {
    // For CSV, flatten the structure
    let csvContent = 'PillLens Data Export\n\n';
    
    // Profile section
    if (userData.profile) {
      csvContent += 'Profile Information\n';
      csvContent += generateCSV([userData.profile]) + '\n\n';
    }
    
    // Medications section
    if (userData.medications && userData.medications.length > 0) {
      csvContent += 'Medications\n';
      csvContent += generateCSV(userData.medications) + '\n\n';
    }
    
    // Adherence Log section
    if (userData.adherenceLog && userData.adherenceLog.length > 0) {
      csvContent += 'Adherence Log\n';
      csvContent += generateCSV(userData.adherenceLog) + '\n\n';
    }
    
    // Sessions section
    if (userData.sessions && userData.sessions.length > 0) {
      csvContent += 'Sessions\n';
      csvContent += generateCSV(userData.sessions) + '\n\n';
    }
    
    return csvContent;
  }
}

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

    // Check rate limit using the database function
    const { data: canProceed, error: rateLimitError } = await supabaseClient
      .rpc('check_rate_limit', {
        p_identifier: user.id,
        p_endpoint: 'export-user-data',
        p_limit: 1,
        p_window_minutes: 60 // 1 hour window
      });

    if (rateLimitError || !canProceed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. You can export your data once per hour.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch comprehensive user data
    const [
      { data: profile },
      { data: medications },
      { data: adherenceLog },
      { data: sessions },
      { data: familyGroups },
      { data: familyMembers },
      { data: deviceTokens },
      { data: feedback },
      { data: healthCheckups }
    ] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabaseClient.from('user_medications').select('*').eq('user_id', user.id),
      supabaseClient.from('medication_adherence_log').select('*').eq('user_id', user.id),
      supabaseClient.from('sessions').select('*').eq('user_id', user.id),
      supabaseClient.from('family_groups').select('*').eq('creator_id', user.id),
      supabaseClient.from('family_members').select('*').eq('user_id', user.id),
      supabaseClient.from('device_tokens').select('*').eq('user_id', user.id),
      supabaseClient.from('feedback').select('*').eq('user_id', user.id),
      supabaseClient.from('daily_health_checkups').select('*').eq('user_id', user.id)
    ]);

    const completeUserData = {
      profile,
      medications: medications || [],
      adherenceLog: adherenceLog || [],
      sessions: sessions || [],
      familyGroups: familyGroups || [],
      familyMembers: familyMembers || [],
      deviceTokens: deviceTokens || [],
      feedback: feedback || [],
      healthCheckups: healthCheckups || []
    };

    // Generate file content
    const format = 'json'; // Default to JSON, can be made configurable
    const fileContent = generateExportFile(completeUserData, format);
    const fileName = `pilllens-export-${user.id}-${new Date().toISOString().split('T')[0]}.${format}`;
    
    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('user-exports')
      .upload(`${user.id}/${fileName}`, fileContent, {
        contentType: format === 'json' ? 'application/json' : 'text/csv',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to generate export file');
    }

    // Generate signed URL for download (valid for 1 hour)
    const { data: signedUrlData, error: urlError } = await supabaseClient.storage
      .from('user-exports')
      .createSignedUrl(`${user.id}/${fileName}`, 3600);

    if (urlError || !signedUrlData?.signedUrl) {
      console.error('URL generation error:', urlError);
      throw new Error('Failed to generate download link');
    }

    // Log export for audit purposes
    await supabaseClient.from('usage_analytics').insert({
      user_id: user.id,
      event_type: 'data_export',
      event_data: {
        format,
        fileName,
        recordCounts: {
          medications: medications?.length || 0,
          adherenceLog: adherenceLog?.length || 0,
          sessions: sessions?.length || 0,
          familyGroups: familyGroups?.length || 0,
          feedback: feedback?.length || 0
        }
      }
    });

    return new Response(JSON.stringify({ 
      downloadUrl: signedUrlData.signedUrl,
      fileName,
      format,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      message: 'Your data export is ready for download. Link expires in 1 hour.',
      recordCounts: {
        medications: medications?.length || 0,
        adherenceRecords: adherenceLog?.length || 0,
        scanSessions: sessions?.length || 0,
        familyGroups: familyGroups?.length || 0,
        feedback: feedback?.length || 0,
        healthCheckups: healthCheckups?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to export data. Please try again later.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});