import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action, minutes } = await req.json();

    if (action !== 'track' && action !== 'check') {
      throw new Error('Invalid action');
    }

    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

    if (action === 'check') {
      // Get current usage for the month
      const { data: usage, error: usageError } = await supabaseClient
        .from('ai_chat_usage')
        .select('minutes_used')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();

      if (usageError) throw usageError;

      // Get user entitlements
      const { data: entitlements, error: entError } = await supabaseClient
        .rpc('get_user_entitlements', { user_uuid: user.id });

      if (entError) throw entError;

      const limit = entitlements?.ai_chat_minutes_per_month ?? 3;
      const used = usage?.minutes_used ?? 0;
      const remaining = limit === -1 ? -1 : Math.max(0, limit - used);
      const canChat = limit === -1 || remaining > 0;

      return new Response(
        JSON.stringify({
          canChat,
          minutesUsed: used,
          minutesLimit: limit,
          minutesRemaining: remaining,
          isUnlimited: limit === -1
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'track') {
      if (!minutes || minutes <= 0) {
        throw new Error('Invalid minutes value');
      }

      // Upsert usage record
      const { error: upsertError } = await supabaseClient
        .from('ai_chat_usage')
        .upsert({
          user_id: user.id,
          month: currentMonth,
          minutes_used: minutes,
          session_count: 1,
          last_session_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,month',
          ignoreDuplicates: false
        });

      if (upsertError) {
        // If upsert fails, try update
        const { data: existing } = await supabaseClient
          .from('ai_chat_usage')
          .select('minutes_used, session_count')
          .eq('user_id', user.id)
          .eq('month', currentMonth)
          .maybeSingle();

        if (existing) {
          const { error: updateError } = await supabaseClient
            .from('ai_chat_usage')
            .update({
              minutes_used: existing.minutes_used + minutes,
              session_count: existing.session_count + 1,
              last_session_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('month', currentMonth);

          if (updateError) throw updateError;
        } else {
          throw upsertError;
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in track-ai-chat-usage:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
