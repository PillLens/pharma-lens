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

    // Log the notification attempt
    const { data: logData, error: logError } = await supabase
      .from('push_notifications')
      .insert({
        user_id: userId,
        title,
        body,
        data,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging notification:', logError);
    }

    // In a real implementation, you would integrate with FCM/APNs here
    // For now, we'll simulate the notification sending
    console.log('Sending notification:', { userId, title, body, data, deviceToken });

    // Simulate notification delivery
    const success = Math.random() > 0.1; // 90% success rate for simulation
    
    if (success && logData) {
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
          notificationId: logData.id
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
            error_message: 'Simulated delivery failure'
          })
          .eq('id', logData.id);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to deliver notification',
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