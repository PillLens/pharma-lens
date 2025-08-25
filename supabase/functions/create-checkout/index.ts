import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== BASIC TEST START ===");
  
  if (req.method === "OPTIONS") {
    console.log("OPTIONS request handled");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("POST request received");
    
    // Test environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("Stripe key check:", {
      exists: !!stripeKey,
      prefix: stripeKey ? stripeKey.substring(0, 10) : "undefined"
    });
    
    if (!stripeKey) {
      console.log("ERROR: No Stripe key found");
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Test body parsing
    let body;
    try {
      body = await req.json();
      console.log("Body parsed successfully:", body);
    } catch (e) {
      console.log("Body parse error:", e.message);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("Basic test passed - returning success");
    return new Response(JSON.stringify({ 
      status: "test_success",
      stripe_key_present: true,
      body_received: body
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.log("Unexpected error:", error.message);
    console.log("Error stack:", error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      type: "unexpected_error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});