import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[DEBUG-STRIPE] Function started");
    
    // Check environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("[DEBUG-STRIPE] Environment check:", {
      hasStripeKey: !!stripeKey,
      stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 8) + "..." : "missing",
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Test Stripe connection
    console.log("[DEBUG-STRIPE] Testing Stripe connection...");
    
    try {
      // Try to list customers (this will fail if the key is invalid)
      const customers = await stripe.customers.list({ limit: 1 });
      console.log("[DEBUG-STRIPE] Stripe connection successful, found", customers.data.length, "customers");
    } catch (stripeError) {
      console.error("[DEBUG-STRIPE] Stripe connection failed:", stripeError);
      throw new Error(`Stripe connection failed: ${stripeError.message}`);
    }

    // Test price IDs
    const priceIds = {
      pro_individual: {
        monthly: "price_1S3zVEEQjcZdgqoDPhQ6FCHG", // $5.99 USD
        yearly: "price_1S3zWIEQjcZdgqoDA4dn6luh"   // $39.99 USD
      },
      pro_family: {
        monthly: "price_1Rzw9iK6MpH3rgygNBVM2lDk", // $9.99 USD
        yearly: "price_1Rzw9xK6MpH3rgygAjYI0B1Y"   // $69.99 USD
      }
    };

    console.log("[DEBUG-STRIPE] Testing price IDs...");
    
    for (const [planName, prices] of Object.entries(priceIds)) {
      for (const [cycle, priceId] of Object.entries(prices)) {
        try {
          const price = await stripe.prices.retrieve(priceId);
          console.log(`[DEBUG-STRIPE] Price ${planName} ${cycle} (${priceId}):`, {
            active: price.active,
            amount: price.unit_amount,
            currency: price.currency,
            mode: price.livemode ? 'live' : 'test'
          });
        } catch (priceError) {
          console.error(`[DEBUG-STRIPE] Failed to retrieve price ${priceId}:`, priceError.message);
        }
      }
    }

    // Test user authentication
    const supabaseClient = createClient(
      supabaseUrl ?? "",
      supabaseServiceKey ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        
        if (userError) {
          console.error("[DEBUG-STRIPE] User auth error:", userError.message);
        } else {
          console.log("[DEBUG-STRIPE] User authenticated:", {
            userId: userData.user?.id,
            email: userData.user?.email
          });
        }
      } catch (authError) {
        console.error("[DEBUG-STRIPE] Auth check failed:", authError);
      }
    } else {
      console.log("[DEBUG-STRIPE] No authorization header provided");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Debug completed successfully. Check function logs for details.",
      stripeKeyType: stripeKey.startsWith('sk_live_') ? 'live' : 
                     stripeKey.startsWith('sk_test_') ? 'test' : 'unknown'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[DEBUG-STRIPE] ERROR:", errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      details: "Check function logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});