import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("[TEST-CHECKOUT] Function started successfully");
  
  if (req.method === "OPTIONS") {
    console.log("[TEST-CHECKOUT] CORS preflight handled");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[TEST-CHECKOUT] Processing request");
    
    // Test environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    console.log("[TEST-CHECKOUT] Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasStripeKey: !!stripeKey
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Test function working!",
      environment: {
        hasSupabaseUrl: !!supabaseUrl,
        hasStripeKey: !!stripeKey
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.log("[TEST-CHECKOUT] ERROR:", error.message);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});