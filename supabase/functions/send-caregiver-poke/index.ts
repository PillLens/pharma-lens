import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to_user_id, from_user_id, group_id, med_id } = await req.json();

    if (!to_user_id || !from_user_id || !group_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to_user_id, from_user_id, group_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify sender is a caregiver in the family group
    const { data: senderMembership, error: memberError } = await supabase
      .from('family_members')
      .select('role, permissions')
      .eq('user_id', from_user_id)
      .eq('family_group_id', group_id)
      .eq('invitation_status', 'accepted')
      .single();

    if (memberError || !senderMembership) {
      return new Response(
        JSON.stringify({ error: 'Sender not authorized in family group' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting (3 pokes per 3 hours)
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .from('poke_rate_limits')
      .select('poke_count')
      .eq('sender_id', from_user_id)
      .eq('recipient_id', to_user_id)
      .eq('family_group_id', group_id)
      .gte('window_start', threeHoursAgo)
      .single();

    if (rateLimitError && rateLimitError.code !== 'PGRST116') {
      console.error('Rate limit check error:', rateLimitError);
      return new Response(
        JSON.stringify({ error: 'Failed to check rate limits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (rateLimitCheck && rateLimitCheck.poke_count >= 3) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 3 pokes per 3 hours.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update or create rate limit record
    await supabase
      .from('poke_rate_limits')
      .upsert({
        sender_id: from_user_id,
        recipient_id: to_user_id,
        family_group_id: group_id,
        poke_count: rateLimitCheck ? rateLimitCheck.poke_count + 1 : 1,
        window_start: rateLimitCheck ? undefined : new Date().toISOString(),
      }, {
        onConflict: 'sender_id,recipient_id,family_group_id'
      });

    // Get recipient's notification preferences and quiet hours
    const { data: recipientProfile, error: profileError } = await supabase
      .from('profiles')
      .select('notification_preferences, timezone')
      .eq('id', to_user_id)
      .single();

    if (profileError || !recipientProfile) {
      return new Response(
        JSON.stringify({ error: 'Recipient profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const preferences = recipientProfile.notification_preferences || {};
    
    // Check if notifications are enabled and respect quiet hours
    if (!preferences.enabled || !preferences.family) {
      return new Response(
        JSON.stringify({ message: 'Notification not sent - recipient has disabled family notifications' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check quiet hours
    const now = new Date();
    const quietStart = preferences.quietHours?.start || '22:00';
    const quietEnd = preferences.quietHours?.end || '07:00';
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + (currentMinute / 60);
    
    const [quietStartHour, quietStartMin] = quietStart.split(':').map(Number);
    const [quietEndHour, quietEndMin] = quietEnd.split(':').map(Number);
    const quietStartTime = quietStartHour + (quietStartMin / 60);
    const quietEndTime = quietEndHour + (quietEndMin / 60);
    
    const isQuietTime = quietStartTime > quietEndTime 
      ? (currentTime >= quietStartTime || currentTime <= quietEndTime)
      : (currentTime >= quietStartTime && currentTime <= quietEndTime);

    if (isQuietTime) {
      return new Response(
        JSON.stringify({ message: 'Notification not sent - recipient is in quiet hours' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recipient's OneSignal player ID
    const { data: deviceToken, error: deviceError } = await supabase
      .from('device_tokens')
      .select('onesignal_player_id, language')
      .eq('user_id', to_user_id)
      .eq('is_active', true)
      .single();

    if (deviceError || !deviceToken?.onesignal_player_id) {
      return new Response(
        JSON.stringify({ error: 'Recipient device not found or not registered' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send OneSignal notification
    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Deno.env.get('ONESIGNAL_REST_API_KEY')}`,
      },
      body: JSON.stringify({
        app_id: Deno.env.get('ONESIGNAL_APP_ID'),
        include_player_ids: [deviceToken.onesignal_player_id],
        headings: {
          en: 'Medication Reminder',
          az: 'Dərman Xatırlatması',
          tr: 'İlaç Hatırlatması',
          ru: 'Напоминание о лекарстве'
        },
        contents: {
          en: 'Someone reminded you to take your medication.',
          az: 'Kimsə sizə dərmanınızı almağı xatırlatdı.',
          tr: 'Biri ilacınızı almanızı hatırlattı.',
          ru: 'Кто-то напомнил вам принять лекарство.'
        },
        data: {
          type: 'poke',
          groupId: group_id,
          medId: med_id,
          fromUserId: from_user_id,
          deepLink: 'app://reminders/today'
        }
      })
    });

    const oneSignalResult = await oneSignalResponse.json();

    // Log the notification
    await supabase
      .from('notification_delivery_logs')
      .insert({
        user_id: to_user_id,
        notification_type: 'caregiver_poke',
        delivery_method: 'onesignal',
        success: oneSignalResponse.ok,
        error_message: oneSignalResponse.ok ? null : oneSignalResult.errors?.[0]?.message,
        notification_data: {
          from_user_id,
          group_id,
          med_id,
          onesignal_id: oneSignalResult.id
        }
      });

    if (!oneSignalResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to send notification', details: oneSignalResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Poke sent successfully',
        notification_id: oneSignalResult.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-caregiver-poke:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});