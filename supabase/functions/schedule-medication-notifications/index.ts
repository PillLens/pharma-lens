import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface MedicationReminder {
  id: string
  user_id: string
  medication_id: string
  reminder_time: string
  days_of_week: number[]
  is_active: boolean
  user_medications: {
    medication_name: string
    dosage: string
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const onesignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    const onesignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!onesignalAppId || !onesignalApiKey) {
      console.error('OneSignal configuration missing')
      return new Response(
        JSON.stringify({ error: 'OneSignal configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get all active medication reminders for today
    const today = new Date()
    const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay() // Convert Sunday (0) to 7

    console.log(`Processing notifications for day of week: ${currentDayOfWeek}`)

    const { data: reminders, error: remindersError } = await supabaseClient
      .from('medication_reminders')
      .select(`
        *,
        user_medications!inner (
          medication_name,
          dosage,
          is_active
        )
      `)
      .eq('is_active', true)
      .eq('user_medications.is_active', true)
      .contains('days_of_week', [currentDayOfWeek])

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError)
      throw remindersError
    }

    console.log(`Found ${reminders?.length || 0} active reminders for today`)

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active reminders found for today', processed: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let processedCount = 0
    const errors: string[] = []

    for (const reminder of reminders as MedicationReminder[]) {
      try {
        // Get user's device tokens
        const { data: deviceTokens, error: tokensError } = await supabaseClient
          .from('device_tokens')
          .select('onesignal_player_id, timezone, language')
          .eq('user_id', reminder.user_id)
          .eq('is_active', true)

        if (tokensError) {
          console.error(`Error fetching tokens for user ${reminder.user_id}:`, tokensError)
          errors.push(`Failed to get tokens for user ${reminder.user_id}`)
          continue
        }

        if (!deviceTokens || deviceTokens.length === 0) {
          console.log(`No active device tokens found for user ${reminder.user_id}`)
          continue
        }

        // Check if it's time to send this reminder
        const [hours, minutes] = reminder.reminder_time.split(':').map(Number)
        const reminderTime = new Date(today)
        reminderTime.setHours(hours, minutes, 0, 0)

        // Only send if the reminder time is within the next hour
        const currentTime = new Date()
        const timeDiff = reminderTime.getTime() - currentTime.getTime()
        const hourInMs = 60 * 60 * 1000

        if (timeDiff > 0 && timeDiff <= hourInMs) {
          // Schedule notification through OneSignal
          for (const token of deviceTokens) {
            if (token.onesignal_player_id) {
              try {
                const notificationPayload = {
                  app_id: onesignalAppId,
                  include_player_ids: [token.onesignal_player_id],
                  headings: {
                    en: 'Medication Reminder 💊',
                    [token.language || 'en']: 'Medication Reminder 💊'
                  },
                  contents: {
                    en: `Time to take ${reminder.user_medications.medication_name} (${reminder.user_medications.dosage})`,
                    [token.language || 'en']: `Time to take ${reminder.user_medications.medication_name} (${reminder.user_medications.dosage})`
                  },
                  data: {
                    type: 'medication_reminder',
                    medication_id: reminder.medication_id,
                    reminder_id: reminder.id,
                    scheduled_time: reminderTime.toISOString()
                  },
                  send_after: reminderTime.toISOString(),
                  timezone_id: token.timezone || 'UTC'
                }

                const response = await fetch('https://onesignal.com/api/v1/notifications', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${onesignalApiKey}`
                  },
                  body: JSON.stringify(notificationPayload)
                })

                const result = await response.json()

                if (response.ok && result.id) {
                  console.log(`Scheduled notification for user ${reminder.user_id} at ${reminder.reminder_time}`)
                  
                  // Log notification in database
                  await supabaseClient
                    .from('push_notifications')
                    .insert({
                      user_id: reminder.user_id,
                      title: 'Medication Reminder 💊',
                      body: `Time to take ${reminder.user_medications.medication_name} (${reminder.user_medications.dosage})`,
                      data: {
                        type: 'medication_reminder',
                        medication_id: reminder.medication_id,
                        reminder_id: reminder.id
                      },
                      device_token: token.onesignal_player_id,
                      status: 'scheduled'
                    })

                  processedCount++
                } else {
                  console.error(`Failed to schedule notification for user ${reminder.user_id}:`, result)
                  errors.push(`OneSignal error for user ${reminder.user_id}: ${result.error || 'Unknown error'}`)
                }
              } catch (notifError) {
                console.error(`Error sending notification to ${token.onesignal_player_id}:`, notifError)
                errors.push(`Notification error for user ${reminder.user_id}: ${notifError.message}`)
              }
            }
          }
        } else {
          console.log(`Reminder for user ${reminder.user_id} at ${reminder.reminder_time} not due within next hour`)
        }
      } catch (reminderError) {
        console.error(`Error processing reminder ${reminder.id}:`, reminderError)
        errors.push(`Reminder processing error: ${reminderError.message}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Medication notifications processed',
        processed: processedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})