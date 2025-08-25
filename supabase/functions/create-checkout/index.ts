import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== SIMPLE TEST START ===");
  
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Step 1: Basic function execution");

    // Test 1: Environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("Step 2: Environment check", {
      hasStripeKey: !!stripeKey,
      stripeKeyLength: stripeKey?.length || 0,
      stripeKeyPrefix: stripeKey?.substring(0, 8) || "none"
    });

    if (!stripeKey) {
      console.log("FAILED: No Stripe key found");
      return new Response(JSON.stringify({ 
        error: "STRIPE_SECRET_KEY not found",
        hasKey: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log("Step 3: Stripe key found, returning success");

    return new Response(JSON.stringify({ 
      success: true,
      message: "Basic test passed - Stripe key found",
      keyPrefix: stripeKey.substring(0, 8),
      keyLength: stripeKey.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("CAUGHT ERROR:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(JSON.stringify({ 
      error: "Function crashed: " + error.message,
      stack: error.stack,
      type: "caught_error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});