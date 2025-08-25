import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, body, data = {}, deviceToken } = await req.json();

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get OneSignal credentials from environment
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
    const oneSignalRestKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!oneSignalAppId || !oneSignalRestKey) {
      console.error('OneSignal credentials not configured');
      return new Response(
        JSON.stringify({ error: 'OneSignal not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the notification attempt
    const { data: logData, error: logError } = await supabase
      .from('push_notifications')
      .insert({
        user_id: userId,
        title,
        body,
        data,
        device_token: deviceToken,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging notification:', logError);
    }

    try {
      // Send notification via OneSignal API
      const oneSignalPayload = {
        app_id: oneSignalAppId,
        include_player_ids: deviceToken ? [deviceToken] : undefined,
        include_external_user_ids: deviceToken ? undefined : [userId],
        headings: { en: title },
        contents: { en: body },
        data: data || {}
      };

      console.log('Sending OneSignal notification:', { 
        userId, 
        title, 
        body, 
        data, 
        deviceToken,
        oneSignalPayload 
      });

      const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${oneSignalRestKey}`,
        },
        body: JSON.stringify(oneSignalPayload)
      });

      const oneSignalResult = await oneSignalResponse.json();
      console.log('OneSignal response:', oneSignalResult);

      if (oneSignalResponse.ok && logData) {
        // Update notification status to delivered
        await supabase
          .from('push_notifications')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString()
          })
          .eq('id', logData.id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Notification sent successfully',
            notificationId: logData.id,
            oneSignalId: oneSignalResult.id,
            recipients: oneSignalResult.recipients
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Update notification status to failed
        if (logData) {
          await supabase
            .from('push_notifications')
            .update({
              status: 'failed',
              error_message: oneSignalResult.errors?.[0]?.message || 'OneSignal delivery failed'
            })
            .eq('id', logData.id);
        }

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to deliver notification',
            details: oneSignalResult.errors || oneSignalResult,
            notificationId: logData?.id
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (fetchError) {
      console.error('OneSignal API error:', fetchError);
      
      // Update notification status to failed
      if (logData) {
        await supabase
          .from('push_notifications')
          .update({
            status: 'failed',
            error_message: `OneSignal API error: ${fetchError.message}`
          })
          .eq('id', logData.id);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OneSignal API error',
          details: fetchError.message,
          notificationId: logData?.id
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});