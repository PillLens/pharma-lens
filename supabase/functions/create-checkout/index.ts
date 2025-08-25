import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== CREATE-CHECKOUT DIAGNOSTIC START ===");
  
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Test environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    console.log("Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasStripeKey: !!stripeKey,
      stripeKeyLength: stripeKey?.length || 0,
      stripeKeyPrefix: stripeKey?.substring(0, 7) || "none"
    });

    if (!stripeKey) {
      console.log("ERROR: STRIPE_SECRET_KEY is missing");
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY is not set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Test Stripe import
    console.log("Testing Stripe import...");
    const Stripe = (await import("https://esm.sh/stripe@14.21.0")).default;
    console.log("Stripe imported successfully");

    // Test basic Stripe initialization
    console.log("Initializing Stripe...");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    console.log("Stripe initialized successfully");

    // Test auth header
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);

    // Test body parsing
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

    console.log("All diagnostic checks passed!");
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Diagnostic successful - Stripe key is working",
      environment: {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasStripeKey: !!stripeKey,
        stripeKeyPrefix: stripeKey?.substring(0, 7) || "none"
      },
      receivedBody: body
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Diagnostic error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      type: "diagnostic_error",
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});