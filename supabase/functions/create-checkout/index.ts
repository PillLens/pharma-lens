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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[CREATE-CHECKOUT] Starting function...');

  // Use the service role key to perform secure operations
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  console.log('[CREATE-CHECKOUT] Supabase client initialized');

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const { plan, billing_cycle = 'monthly' } = await req.json();
    if (!plan) {
      throw new Error("Missing plan in request body");
    }
    logStep("Request parsed", { plan, billing_cycle });

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
    logStep("Price ID determined", { priceId, plan, billing_cycle });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Get user's current subscription status
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('plan, is_trial_eligible')
      .eq('id', user.id)
      .single();

    const isTrialEligible = profile?.is_trial_eligible && profile?.plan === 'free';
    logStep("Trial eligibility checked", { isTrialEligible, currentPlan: profile?.plan });

    // Create checkout session
    const sessionConfig: any = {
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
    };

    // Add trial if eligible
    if (isTrialEligible) {
      sessionConfig.subscription_data = {
        trial_period_days: 14,
        metadata: {
          user_id: user.id,
          plan: plan
        }
      };
      logStep("Trial added to checkout session");
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Store pending subscription info
    if (session.id) {
      await supabaseClient.from('subscriptions').upsert({
        user_id: user.id,
        stripe_sub_id: session.id, // Will be updated by webhook with actual subscription ID
        plan: plan,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      logStep("Pending subscription record created");
    }

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