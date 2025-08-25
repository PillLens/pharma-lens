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

    console.log(`Starting account deletion for user: ${user.id}`);

    // Delete user-related data in order (respecting foreign key constraints)
    const tablesToClean = [
      'medication_adherence_log',
      'medication_reminders', 
      'shared_medications',
      'user_medications',
      'sessions',
      'family_members',
      'family_groups',
      'communication_logs',
      'care_tasks',
      'family_appointments',
      'location_sharing',
      'emergency_contacts',
      'device_tokens',
      'push_notifications',
      'notification_preferences',
      'user_settings',
      'extractions',
      'feedback',
      'profiles'
    ];

    for (const table of tablesToClean) {
      try {
        const { error } = await supabaseClient
          .from(table)
          .delete()
          .eq('user_id', user.id);
        
        if (error) {
          console.warn(`Warning: Could not delete from ${table}:`, error.message);
        } else {
          console.log(`Cleaned table: ${table}`);
        }
      } catch (tableError) {
        console.warn(`Warning: Error cleaning table ${table}:`, tableError);
      }
    }

    // Delete the user from auth.users (this cascades to profiles due to foreign key)
    const { error: deleteUserError } = await supabaseClient.auth.admin.deleteUser(user.id);
    
    if (deleteUserError) {
      console.error('Failed to delete user from auth:', deleteUserError);
      throw deleteUserError;
    }

    console.log(`Account deletion completed for user: ${user.id}`);

    return new Response(JSON.stringify({ 
      message: 'Account successfully deleted' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});