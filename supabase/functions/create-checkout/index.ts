import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform writes (upsert) in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified", { keyLength: stripeKey.length });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    let body;
    try {
      body = await req.json();
      logStep("Request body parsed", body);
    } catch (e) {
      throw new Error(`Invalid JSON body: ${e.message}`);
    }

    const { plan, billing_cycle } = body;
    if (!plan || !billing_cycle) {
      throw new Error("Missing required parameters: plan and billing_cycle");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer found, will create during checkout");
    }

    // Define pricing based on plan and billing cycle
    const pricing = {
      pro_individual: {
        monthly: { amount: 999, interval: 'month' }, // $9.99/month
        yearly: { amount: 9999, interval: 'year' }, // $99.99/year
      },
      pro_family: {
        monthly: { amount: 1999, interval: 'month' }, // $19.99/month
        yearly: { amount: 19999, interval: 'year' }, // $199.99/year
      }
    };

    const priceInfo = pricing[plan as keyof typeof pricing]?.[billing_cycle as keyof typeof pricing.pro_individual];
    if (!priceInfo) {
      throw new Error(`Invalid plan or billing cycle: ${plan}, ${billing_cycle}`);
    }

    logStep("Creating checkout session", { plan, billing_cycle, amount: priceInfo.amount });

    // Create checkout session
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan === 'pro_individual' ? 'Pro Individual' : 'Pro Family',
              description: `${plan === 'pro_individual' ? 'Individual' : 'Family'} subscription plan`
            },
            unit_amount: priceInfo.amount,
            recurring: {
              interval: priceInfo.interval as 'month' | 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        plan: plan,
        billing_cycle: billing_cycle,
      },
    });

    logStep("Checkout session created successfully", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});