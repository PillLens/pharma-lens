import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("[MINIMAL-TEST] Function started - method:", req.method);
  
  if (req.method === "OPTIONS") {
    console.log("[MINIMAL-TEST] Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[MINIMAL-TEST] Processing request");
    
    // Test environment variable access
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    console.log("[MINIMAL-TEST] Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasStripeKey: !!stripeKey,
      supabaseUrlLength: supabaseUrl?.length || 0,
      stripeKeyLength: stripeKey?.length || 0
    });

    // Test basic request parsing
    let body = {};
    try {
      body = await req.json();
      console.log("[MINIMAL-TEST] Request body parsed:", body);
    } catch (e) {
      console.log("[MINIMAL-TEST] No JSON body or parse error:", e.message);
    }

    // Test headers
    const authHeader = req.headers.get("Authorization");
    console.log("[MINIMAL-TEST] Auth header present:", !!authHeader);

    console.log("[MINIMAL-TEST] Test completed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Minimal test function working",
      environmentCheck: {
        hasSupabaseUrl: !!supabaseUrl,
        hasStripeKey: !!stripeKey
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("[MINIMAL-TEST] ERROR:", errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});