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
    console.log("[CREATE-CHECKOUT] Function started");
    
    // Initialize Stripe INSIDE the request handler where secrets are available
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("[CREATE-CHECKOUT] hasStripeKey:", !!stripeKey);
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Use the service role key to get user data
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const body = await req.json();
    const { plan, billing_cycle } = body;

    if (!plan || !billing_cycle) {
      throw new Error("Missing required parameters: plan and billing_cycle");
    }

    console.log("[CREATE-CHECKOUT] Processing checkout for:", { plan, billing_cycle, email: user.email });

    // Price IDs mapping - your actual Stripe price IDs
    const priceIds = {
      pro_individual: {
        monthly: "price_1Rzw9FK6MpH3rgygAuEJal37", // $5.99 USD
        yearly: "price_1Rzw9UK6MpH3rgygirn3a1cd"   // $39.99 USD
      },
      pro_family: {
        monthly: "price_1Rzw9iK6MpH3rgygNBVM2lDk", // $9.99 USD
        yearly: "price_1Rzw9xK6MpH3rgygAjYI0B1Y"   // $69.99 USD
      }
    };

    const priceId = priceIds[plan as keyof typeof priceIds]?.[billing_cycle as keyof typeof priceIds.pro_individual];
    if (!priceId) {
      throw new Error(`Invalid plan or billing cycle: ${plan}, ${billing_cycle}`);
    }

    // Create or reuse customer
    const customers = await stripe.customers.search({
      query: `email:'${user.email}'`,
      limit: 1
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("[CREATE-CHECKOUT] Found existing customer:", customerId);
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      console.log("[CREATE-CHECKOUT] Created new customer:", customerId);
    }

    // Create Checkout Session
    const siteUrl = Deno.env.get("SITE_URL") || req.headers.get("origin") || "https://a2b03c66-e69a-49a4-9574-1cb9e4a8bd22.sandbox.lovable.dev";
    
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${siteUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/dashboard?checkout=cancel`,
      metadata: { 
        userId: user.id,
        plan: plan,
        billing_cycle: billing_cycle
      },
    });

    console.log("[CREATE-CHECKOUT] Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-CHECKOUT] ERROR:", errorMessage);
    return new Response(JSON.stringify({ error: "checkout_failed", message: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});