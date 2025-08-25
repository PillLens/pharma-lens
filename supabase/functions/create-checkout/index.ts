import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

console.log("[CREATE-CHECKOUT] Function file loaded successfully");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  console.log("[CREATE-CHECKOUT] Request received", req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("[CREATE-CHECKOUT] Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[CREATE-CHECKOUT] Starting function...');

  try {
    console.log("[CREATE-CHECKOUT] Step 1: Environment check");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    console.log("[CREATE-CHECKOUT] Environment variables:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasStripeKey: !!stripeKey,
      stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 8) + '...' : 'undefined'
    });

    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    
    if (!stripeKey.startsWith('sk_')) {
      throw new Error(`STRIPE_SECRET_KEY appears to be invalid. Got: ${stripeKey.substring(0, 10)}...`);
    }

    console.log("[CREATE-CHECKOUT] Step 2: Initialize Supabase client");
    const supabaseClient = createClient(
      supabaseUrl ?? "",
      supabaseServiceKey ?? "",
      { auth: { persistSession: false } }
    );

    console.log("[CREATE-CHECKOUT] Step 3: Check authorization");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("[CREATE-CHECKOUT] Step 4: Authenticate user");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    
    console.log("[CREATE-CHECKOUT] User authenticated:", user.email);

    console.log("[CREATE-CHECKOUT] Step 5: Parse request body");
    const requestBody = await req.json();
    const { plan, billing_cycle = 'monthly' } = requestBody;
    
    console.log("[CREATE-CHECKOUT] Request details:", { plan, billing_cycle });
    
    if (!plan) {
      throw new Error("Missing plan in request body");
    }

    console.log("[CREATE-CHECKOUT] Step 6: Initialize Stripe");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Map to specific Stripe price IDs
    const priceMapping = {
      'pro_individual': {
        'monthly': 'price_1Rzw9FK6MpH3rgygAuEJal37', // $5.99
        'yearly': 'price_1Rzw9UK6MpH3rgygirn3a1cd'   // $39.99
      },
      'pro_family': {
        'monthly': 'price_1Rzw9iK6MpH3rgygNBVM2lDk', // $9.99
        'yearly': 'price_1Rzw9xK6MpH3rgygAjYI0B1Y'   // $69.99
      }
    };

    const priceId = priceMapping[plan as keyof typeof priceMapping]?.[billing_cycle as keyof typeof priceMapping['pro_individual']];
    if (!priceId) {
      throw new Error(`Invalid plan or billing cycle: ${plan}, ${billing_cycle}`);
    }
    
    console.log("[CREATE-CHECKOUT] Using price ID:", priceId);

    console.log("[CREATE-CHECKOUT] Step 7: Check for existing customer");
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("[CREATE-CHECKOUT] Found existing customer:", customerId);
    } else {
      console.log("[CREATE-CHECKOUT] No existing customer found");
    }

    console.log("[CREATE-CHECKOUT] Step 8: Create checkout session");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard?checkout=success`,
      cancel_url: `${req.headers.get("origin")}/dashboard?checkout=canceled`,
      metadata: {
        user_id: user.id,
        plan: plan
      }
    });

    console.log("[CREATE-CHECKOUT] Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("[CREATE-CHECKOUT] ERROR:", errorMessage);
    console.error("[CREATE-CHECKOUT] ERROR STACK:", errorStack);
    console.error("[CREATE-CHECKOUT] ERROR TYPE:", typeof error);
    console.error("[CREATE-CHECKOUT] ERROR CONSTRUCTOR:", error?.constructor?.name);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: "Check edge function logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});