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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date();
    
    console.log(`Running missed dose digest for ${today}`);

    // Get all users who have missed doses today and have notifications enabled
    const { data: usersWithMissedDoses, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        notification_preferences,
        timezone,
        device_tokens!inner(onesignal_player_id, language, is_active),
        medication_adherence_log!inner(
          id,
          medication_id,
          scheduled_time,
          status,
          user_medications!inner(medication_name)
        )
      `)
      .eq('device_tokens.is_active', true)
      .eq('medication_adherence_log.status', 'missed')
      .gte('medication_adherence_log.scheduled_time', `${today}T00:00:00`)
      .lt('medication_adherence_log.scheduled_time', `${today}T23:59:59`);

    if (usersError) {
      console.error('Error fetching users with missed doses:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!usersWithMissedDoses || usersWithMissedDoses.length === 0) {
      console.log('No users with missed doses found');
      return new Response(
        JSON.stringify({ message: 'No users with missed doses found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notifications = [];
    const processed = [];

    for (const user of usersWithMissedDoses) {
      const preferences = user.notification_preferences || {};
      
      // Skip if notifications are disabled or missed dose notifications are disabled
      if (!preferences.enabled || !preferences.missedDose) {
        continue;
      }

      // Check if we already processed this user today
      const { data: alreadyProcessed } = await supabase
        .from('missed_dose_tracking')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('is_processed', true)
        .single();

      if (alreadyProcessed) {
        continue;
      }

      const missedCount = user.medication_adherence_log?.length || 0;
      
      if (missedCount === 0) {
        continue;
      }

      const deviceToken = user.device_tokens?.[0];
      if (!deviceToken?.onesignal_player_id) {
        continue;
      }

      // Determine language for localization
      const language = deviceToken.language || 'en';
      
      const localizedContent = {
        en: {
          title: 'Missed Medication Summary',
          body: `You missed ${missedCount} dose${missedCount > 1 ? 's' : ''} today. Review your schedule.`
        },
        az: {
          title: 'Buraxılmış Dərman Xülasəsi',
          body: `Bu gün ${missedCount} doza${missedCount > 1 ? 'nı' : 'sını'} buraxdınız. Planınızı nəzərdən keçirin.`
        },
        tr: {
          title: 'Kaçırılan İlaç Özeti',
          body: `Bugün ${missedCount} doz${missedCount > 1 ? 'unuzu' : 'unuzu'} kaçırdınız. Programınızı gözden geçirin.`
        },
        ru: {
          title: 'Сводка пропущенных лекарств',
          body: `Вы пропустили ${missedCount} приём${missedCount > 1 ? 'ов' : ''} сегодня. Проверьте расписание.`
        }
      };

      const content = localizedContent[language as keyof typeof localizedContent] || localizedContent.en;

      // Send OneSignal notification using real API
      const oneSignalPayload = {
        app_id: Deno.env.get('ONESIGNAL_APP_ID'),
        include_player_ids: [deviceToken.onesignal_player_id],
        headings: {
          [language]: content.title,
          en: content.title
        },
        contents: {
          [language]: content.body,
          en: content.body
        },
        data: {
          type: 'missed_digest',
          date: today,
          missedCount: missedCount,
          deepLink: 'app://reports/daily'
        }
      };

      const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Deno.env.get('ONESIGNAL_REST_API_KEY')}`,
        },
        body: JSON.stringify(oneSignalPayload)
      });

      const oneSignalResult = await oneSignalResponse.json();

      // Log the notification
      await supabase
        .from('notification_delivery_logs')
        .insert({
          user_id: user.id,
          notification_type: 'missed_dose_digest',
          delivery_method: 'onesignal',
          success: oneSignalResponse.ok,
          error_message: oneSignalResponse.ok ? null : oneSignalResult.errors?.[0]?.message,
          notification_data: {
            date: today,
            missed_count: missedCount,
            onesignal_id: oneSignalResult.id
          }
        });

      // Mark as processed
      await supabase
        .from('missed_dose_tracking')
        .upsert({
          user_id: user.id,
          medication_id: user.medication_adherence_log[0]?.medication_id,
          scheduled_time: user.medication_adherence_log[0]?.scheduled_time,
          date: today,
          is_processed: true
        });

      notifications.push({
        userId: user.id,
        missedCount,
        success: oneSignalResponse.ok,
        notificationId: oneSignalResult.id
      });

      processed.push(user.id);
    }

    console.log(`Processed ${processed.length} users, sent ${notifications.length} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed_users: processed.length,
        notifications_sent: notifications.length,
        details: notifications
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in missed-dose-digest:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});