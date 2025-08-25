import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== CREATE-CHECKOUT FUNCTION START ===");
  
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Handling POST request");

  try {
    // Test 1: Basic environment access
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    console.log("Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasStripeKey: !!stripeKey,
      stripeKeyLength: stripeKey?.length || 0,
      stripeKeyStart: stripeKey?.substring(0, 8) || "none"
    });

    // Test 2: Auth header
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);

    // Test 3: Body parsing
    let body;
    try {
      body = await req.json();
      console.log("Body parsed successfully:", body);
    } catch (e) {
      console.log("Body parse failed:", e.message);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // If we get here, basic functionality works
    console.log("Basic test completed successfully");
    
    return new Response(JSON.stringify({ 
      status: "success",
      message: "Basic function test passed",
      environment: {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasStripeKey: !!stripeKey,
        stripeKeyLength: stripeKey?.length || 0
      },
      receivedBody: body
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Function error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      type: "function_error",
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});