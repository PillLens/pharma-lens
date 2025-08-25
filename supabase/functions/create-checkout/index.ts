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

  // Use the service role key to perform secure operations
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

    // Parse request body
    const { plan, billing_cycle = 'monthly' } = await req.json();
    if (!plan) {
      throw new Error("Missing plan in request body");
    }
    logStep("Request parsed", { plan, billing_cycle });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Define plan pricing configuration
    const planConfig: { [key: string]: { name: string; monthlyAmount: number; description: string } } = {
      'pro_individual': {
        name: 'Pro Individual',
        monthlyAmount: 999, // $9.99 per month
        description: 'Individual plan with advanced features'
      },
      'pro_family': {
        name: 'Pro Family',
        monthlyAmount: 1999, // $19.99 per month
        description: 'Family plan with shared features for up to 5 members'
      }
    };

    const config = planConfig[plan];
    if (!config) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    // Calculate amount based on billing cycle
    const isYearly = billing_cycle === 'yearly';
    const amount = isYearly 
      ? Math.round(config.monthlyAmount * 12 * 0.7) // 30% discount for yearly
      : config.monthlyAmount;
    const interval = isYearly ? 'year' : 'month';

    logStep("Pricing calculated", { amount, interval, isYearly });

    // Create or get existing product and price for this plan
    let price;
    try {
      // First try to find existing product
      const products = await stripe.products.list({ 
        active: true,
        limit: 100
      });
      
      let product = products.data.find(p => p.name === config.name);
      
      if (!product) {
        // Create new product if not found
        product = await stripe.products.create({
          name: config.name,
          description: config.description,
          type: 'service'
        });
        logStep("Created new product", { productId: product.id, name: config.name });
      } else {
        logStep("Found existing product", { productId: product.id, name: config.name });
      }

      // Look for existing price for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        type: 'recurring'
      });

      const existingPrice = prices.data.find(p => 
        p.unit_amount === amount && 
        p.recurring?.interval === interval
      );

      if (existingPrice) {
        price = existingPrice;
        logStep("Found existing price", { priceId: price.id, amount });
      } else {
        // Create new price
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: amount,
          currency: 'usd',
          recurring: {
            interval: interval as 'month' | 'year'
          }
        });
        logStep("Created new price", { priceId: price.id, amount });
      }
    } catch (error) {
      logStep("Error creating/finding product/price", { error: error.message });
      throw new Error(`Failed to create pricing: ${error.message}`);
    }

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
        price: price.id,
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