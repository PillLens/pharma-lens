import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { 
  apiVersion: "2023-10-16" 
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

// Use service role key to update subscription data
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

serve(async (req) => {
  console.log("[STRIPE-WEBHOOK] Received webhook");
  
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    console.error("[STRIPE-WEBHOOK] No signature header");
    return new Response("No signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    console.log("[STRIPE-WEBHOOK] Event verified:", event.type);
  } catch (err) {
    console.error("[STRIPE-WEBHOOK] Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  const recordStatus = async (userId: string, stripeSubId: string, plan: string, status: string, periodEnd?: number) => {
    console.log("[STRIPE-WEBHOOK] Recording status:", { userId, plan, status, periodEnd });
    
    try {
      // Update profiles table
      const profileUpdate: any = { plan };
      if (status === 'trialing' || status === 'active') {
        profileUpdate.trial_expires_at = null; // Clear trial if they have active subscription
      }

      await supabase.from('profiles').update(profileUpdate).eq('id', userId);

      // Upsert subscription record
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_sub_id: stripeSubId,
        plan,
        status,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      console.log("[STRIPE-WEBHOOK] Status recorded successfully");
    } catch (error) {
      console.error("[STRIPE-WEBHOOK] Failed to record status:", error);
    }
  };

  const getCustomerUserId = async (customerId: string): Promise<string | null> => {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', (customer as Stripe.Customer).email)
        .single();
      
      return data?.id || null;
    } catch (error) {
      console.error("[STRIPE-WEBHOOK] Failed to get user ID:", error);
      return null;
    }
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.metadata?.user_id;
      const plan = session.metadata?.plan || 'pro_individual';
      
      if (!userId) {
        console.error("[STRIPE-WEBHOOK] No userId in session metadata");
        break;
      }

      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await recordStatus(userId, sub.id, plan, sub.status, sub.current_period_end);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = await getCustomerUserId(sub.customer as string);
      
      if (!userId) {
        console.error("[STRIPE-WEBHOOK] Could not find user for customer:", sub.customer);
        break;
      }

      // Determine plan from price ID or metadata
      const plan = sub.metadata?.plan || 'pro_individual'; // fallback
      await recordStatus(userId, sub.id, plan, sub.status, sub.current_period_end);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = await getCustomerUserId(sub.customer as string);
      
      if (!userId) {
        console.error("[STRIPE-WEBHOOK] Could not find user for customer:", sub.customer);
        break;
      }

      // Downgrade to free plan
      await recordStatus(userId, sub.id, 'free', 'canceled');
      break;
    }

    default:
      console.log("[STRIPE-WEBHOOK] Unhandled event type:", event.type);
  }

  return new Response("ok", { status: 200 });
});