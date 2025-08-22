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
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("Stripe key verified");

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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseClient.from("profiles").upsert({
        id: user.id,
        email: user.email,
        stripe_customer_id: null,
        plan: 'free',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      return new Response(JSON.stringify({ 
        plan: 'free', 
        status: 'active',
        is_trial_eligible: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
    });

    const activeSubscriptions = subscriptions.data.filter(sub => 
      ['active', 'trialing', 'past_due'].includes(sub.status)
    );

    let plan = 'free';
    let status = 'active';
    let trialExpiresAt = null;
    let currentPeriodEnd = null;
    let cancelAtPeriodEnd = false;

    if (activeSubscriptions.length > 0) {
      const subscription = activeSubscriptions[0];
      status = subscription.status;
      currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      cancelAtPeriodEnd = subscription.cancel_at_period_end;

      // Determine plan from price
      const priceId = subscription.items.data[0].price.id;
      if (priceId.includes('individual')) {
        plan = 'pro_individual';
      } else if (priceId.includes('family')) {
        plan = 'pro_family';
      }

      // Handle trial
      if (subscription.status === 'trialing' && subscription.trial_end) {
        trialExpiresAt = new Date(subscription.trial_end * 1000).toISOString();
        // During trial, activate pro features
        plan = plan || 'pro_individual';
      }

      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        status, 
        plan,
        trialExpiresAt,
        currentPeriodEnd 
      });

      // Update or create subscription record
      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        stripe_sub_id: subscription.id,
        plan: plan,
        status: status,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_sub_id' });
    } else {
      logStep("No active subscription found");
    }

    // Update profile
    const profileUpdate: any = {
      id: user.id,
      email: user.email,
      stripe_customer_id: customerId,
      plan: plan,
      updated_at: new Date().toISOString(),
    };

    if (trialExpiresAt) {
      profileUpdate.trial_expires_at = trialExpiresAt;
      if (!profileUpdate.trial_started_at) {
        profileUpdate.trial_started_at = new Date().toISOString();
      }
      profileUpdate.is_trial_eligible = false;
    }

    await supabaseClient.from("profiles").upsert(profileUpdate, { onConflict: 'id' });

    logStep("Updated database with subscription info", { plan, status, trialExpiresAt });
    
    return new Response(JSON.stringify({
      plan: plan,
      status: status,
      trial_expires_at: trialExpiresAt,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: cancelAtPeriodEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});