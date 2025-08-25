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
    const { event_type, group_id, user_id, metadata = {} } = await req.json();

    if (!event_type || !group_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event_type, group_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active family members in the group (excluding the user who triggered the event)
    const { data: familyMembers, error: membersError } = await supabase
      .from('family_members')
      .select(`
        user_id,
        profiles!inner(notification_preferences, timezone),
        device_tokens!inner(onesignal_player_id, language, is_active)
      `)
      .eq('family_group_id', group_id)
      .eq('invitation_status', 'accepted')
      .eq('device_tokens.is_active', true)
      .neq('user_id', user_id || ''); // Exclude the user who triggered the event

    if (membersError) {
      console.error('Error fetching family members:', membersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch family members' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!familyMembers || familyMembers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No family members to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Define notification content based on event type
    const eventMessages = {
      member_joined: {
        en: { title: 'Family Group Update', body: 'A new member joined your care group.' },
        az: { title: 'Ailə Qrupu Yeniləməsi', body: 'Qayğı qrupunuza yeni üzv qoşuldu.' },
        tr: { title: 'Aile Grubu Güncellemesi', body: 'Bakım grubunuza yeni bir üye katıldı.' },
        ru: { title: 'Обновление семейной группы', body: 'Новый участник присоединился к вашей группе заботы.' }
      },
      member_accepted: {
        en: { title: 'Family Group Update', body: 'Someone accepted your family group invitation.' },
        az: { title: 'Ailə Qrupu Yeniləməsi', body: 'Kimsə ailə qrupu dəvətinizi qəbul etdi.' },
        tr: { title: 'Aile Grubu Güncellemesi', body: 'Biri aile grubu davetinizi kabul etti.' },
        ru: { title: 'Обновление семейной группы', body: 'Кто-то принял ваше приглашение в семейную группу.' }
      },
      sharing_updated: {
        en: { title: 'Medication Sharing Update', body: 'Medication sharing settings were updated.' },
        az: { title: 'Dərman Paylaşımı Yeniləməsi', body: 'Dərman paylaşımı parametrləri yeniləndi.' },
        tr: { title: 'İlaç Paylaşım Güncellemesi', body: 'İlaç paylaşım ayarları güncellendi.' },
        ru: { title: 'Обновление обмена лекарствами', body: 'Настройки обмена лекарствами были обновлены.' }
      },
      appointment_scheduled: {
        en: { title: 'New Appointment', body: 'A new appointment was scheduled for your family.' },
        az: { title: 'Yeni Randevu', body: 'Ailəniz üçün yeni randevu təyin edildi.' },
        tr: { title: 'Yeni Randevu', body: 'Aileniz için yeni bir randevu planlandı.' },
        ru: { title: 'Новая встреча', body: 'Для вашей семьи назначена новая встреча.' }
      }
    };

    const messageTemplate = eventMessages[event_type as keyof typeof eventMessages] || eventMessages.member_joined;

    const notifications = [];

    for (const member of familyMembers) {
      const profile = member.profiles;
      const deviceToken = member.device_tokens?.[0];

      if (!profile || !deviceToken?.onesignal_player_id) {
        continue;
      }

      const preferences = profile.notification_preferences || {};
      
      // Skip if family notifications are disabled
      if (!preferences.enabled || !preferences.family) {
        continue;
      }

      const language = deviceToken.language || 'en';
      const content = messageTemplate[language as keyof typeof messageTemplate] || messageTemplate.en;

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
            [language]: content.title,
            en: content.title
          },
          contents: {
            [language]: content.body,
            en: content.body
          },
          data: {
            type: 'family_event',
            event_type,
            groupId: group_id,
            triggeredBy: user_id,
            metadata,
            deepLink: `app://family/${group_id}`
          }
        })
      });

      const oneSignalResult = await oneSignalResponse.json();

      // Log the notification
      await supabase
        .from('notification_delivery_logs')
        .insert({
          user_id: member.user_id,
          notification_type: 'family_group_event',
          delivery_method: 'onesignal',
          success: oneSignalResponse.ok,
          error_message: oneSignalResponse.ok ? null : oneSignalResult.errors?.[0]?.message,
          notification_data: {
            event_type,
            group_id,
            triggered_by: user_id,
            metadata,
            onesignal_id: oneSignalResult.id
          }
        });

      notifications.push({
        userId: member.user_id,
        success: oneSignalResponse.ok,
        notificationId: oneSignalResult.id
      });
    }

    // Log the family activity
    await supabase
      .from('family_activity_log')
      .insert({
        family_group_id: group_id,
        user_id: user_id || null,
        activity_type: event_type,
        activity_data: {
          notifications_sent: notifications.length,
          metadata
        },
        priority: 'normal'
      });

    console.log(`Sent ${notifications.length} family group event notifications for ${event_type}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        event_type,
        notifications_sent: notifications.length,
        details: notifications
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in family-group-events:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});