import { supabase } from '@/integrations/supabase/client';

export interface UserEntitlements {
  can_create_family_group: boolean;
  can_export_reports: boolean;
  reminders_limit: number; // -1 for unlimited
  hipaa_report_access: boolean;
  max_devices: number;
  max_family_members?: number;
}

export interface UserSubscription {
  plan: 'free' | 'pro_individual' | 'pro_family';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  trial_expires_at?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  is_trial_eligible: boolean;
}

class EntitlementsService {
  private cache = new Map<string, { data: UserEntitlements; timestamp: number }>();
  private subscriptionCache = new Map<string, { data: UserSubscription; timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getUserEntitlements(userId?: string): Promise<UserEntitlements> {
    if (!userId) {
      return this.getDefaultEntitlements();
    }

    // Check cache first
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_entitlements', { user_uuid: userId });

      if (error) {
        console.error('Error fetching entitlements:', error);
        return this.getDefaultEntitlements();
      }

      const entitlements = (data || this.getDefaultEntitlements()) as UserEntitlements;
      
      // Cache the result
      this.cache.set(userId, {
        data: entitlements,
        timestamp: Date.now()
      });

      return entitlements;
    } catch (error) {
      console.error('Error in getUserEntitlements:', error);
      return this.getDefaultEntitlements();
    }
  }

  async getUserSubscription(userId?: string): Promise<UserSubscription> {
    if (!userId) {
      return this.getDefaultSubscription();
    }

    // Check cache first
    const cached = this.subscriptionCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('plan, trial_started_at, trial_expires_at, is_trial_eligible')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return this.getDefaultSubscription();
      }

      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      const userSubscription: UserSubscription = {
        plan: (profile.plan as 'free' | 'pro_individual' | 'pro_family') || 'free',
        status: (subscription?.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete') || 'active',
        trial_expires_at: profile.trial_expires_at,
        current_period_end: subscription?.current_period_end,
        cancel_at_period_end: subscription?.cancel_at_period_end || false,
        is_trial_eligible: profile.is_trial_eligible || false
      };

      // Determine if user is in trial
      if (profile.trial_expires_at && new Date(profile.trial_expires_at) > new Date()) {
        userSubscription.status = 'trialing';
      }

      // Cache the result
      this.subscriptionCache.set(userId, {
        data: userSubscription,
        timestamp: Date.now()
      });

      return userSubscription;
    } catch (error) {
      console.error('Error in getUserSubscription:', error);
      return this.getDefaultSubscription();
    }
  }

  async checkFeatureAccess(userId: string, feature: keyof UserEntitlements): Promise<boolean> {
    const entitlements = await this.getUserEntitlements(userId);
    return !!entitlements[feature];
  }

  async getRemainingTrialDays(userId: string): Promise<number> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription.trial_expires_at) {
      return 0;
    }

    const trialEnd = new Date(subscription.trial_expires_at);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  async isInTrial(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    return subscription.status === 'trialing';
  }

  async canStartTrial(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    return subscription.is_trial_eligible && subscription.plan === 'free' && subscription.status !== 'trialing';
  }

  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
      this.subscriptionCache.delete(userId);
    } else {
      this.cache.clear();
      this.subscriptionCache.clear();
    }
  }

  private getDefaultEntitlements(): UserEntitlements {
    // All users get full trial access for 14 days
    return {
      can_create_family_group: true,
      can_export_reports: true,
      reminders_limit: -1, // Unlimited during trial
      hipaa_report_access: true,
      max_devices: 3,
      max_family_members: 5
    };
  }

  private getDefaultSubscription(): UserSubscription {
    // All new users get 14-day trial starting immediately
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);
    
    return {
      plan: 'free',
      status: 'trialing',
      trial_expires_at: trialEnd.toISOString(),
      is_trial_eligible: true
    };
  }

  // Pricing information
  getPricingPlans() {
    return {
      pro_individual: {
        name: 'Pro Individual',
        monthly: { price: 5.99, stripe_product_id: 'prod_SvnkjphfFmzJCU' },
        yearly: { price: 39.99, stripe_product_id: 'prod_Svnk7nMQJbI9y9' }
      },
      pro_family: {
        name: 'Pro Family',
        monthly: { price: 9.99, stripe_product_id: 'prod_SvnlNRrwSnGq8t' },
        yearly: { price: 69.99, stripe_product_id: 'prod_SvnlpLbYnb6cSc' }
      }
    };
  }
}

export const entitlementsService = new EntitlementsService();