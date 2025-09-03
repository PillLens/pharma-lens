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
  plan: 'free' | 'pro_individual';
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
        plan: (profile.plan as 'free' | 'pro_individual') || 'free',
        status: (subscription?.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete') || 'active',
        trial_expires_at: profile.trial_expires_at,
        current_period_end: subscription?.current_period_end,
        cancel_at_period_end: subscription?.cancel_at_period_end || false,
        is_trial_eligible: profile.is_trial_eligible || false
      };

      // Determine if user is in trial - check if trial is still active
      if (profile.trial_expires_at) {
        const now = new Date();
        const trialEnd = new Date(profile.trial_expires_at);
        
        if (trialEnd > now) {
          userSubscription.status = 'trialing';
          console.log('User is in active trial period:', userId, 'expires:', trialEnd);
        } else {
          console.log('User trial has expired:', userId, 'expired:', trialEnd);
        }
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
    try {
      console.log('Calculating trial days for user:', userId);
      
      // Get trial dates directly from database to ensure accuracy
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('trial_expires_at, trial_started_at, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching trial data:', error);
        return 0;
      }

      if (!profile.trial_expires_at) {
        console.log('No trial expiration date found for user');
        return 0;
      }

      const trialEnd = new Date(profile.trial_expires_at);
      const now = new Date();
      
      // Validate trial end date is in the future
      if (trialEnd <= now) {
        console.log('Trial has expired for user:', userId);
        return 0;
      }

      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log('Trial days remaining:', diffDays);
      return Math.max(0, diffDays);
    } catch (error) {
      console.error('Error calculating trial days:', error);
      return 0;
    }
  }

  async isInTrial(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    return subscription.status === 'trialing';
  }

  async canStartTrial(userId: string): Promise<boolean> {
    try {
      console.log('Checking trial eligibility for user:', userId);
      
      // Get current profile data directly from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_trial_eligible, plan, trial_expires_at, trial_started_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking trial eligibility:', error);
        return false;
      }

      const canStart = profile.is_trial_eligible && 
                      profile.plan === 'free' && 
                      (!profile.trial_started_at || !profile.trial_expires_at);
      
      console.log('Trial eligibility result:', canStart);
      return canStart;
    } catch (error) {
      console.error('Error in canStartTrial:', error);
      return false;
    }
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
    // Free users get basic features only - trial users get entitlements via database function
    return {
      can_create_family_group: false,
      can_export_reports: false,
      reminders_limit: 1,
      hipaa_report_access: false,
      max_devices: 1,
      max_family_members: 0
    };
  }

  private getDefaultSubscription(): UserSubscription {
    // Return safe defaults without artificial trial dates
    // All trial logic should use database-stored registration dates only
    console.warn('Using default subscription - this should only happen for unauthenticated users');
    
    return {
      plan: 'free',
      status: 'active', // Default to active, not trialing
      is_trial_eligible: false // Conservative default
    };
  }

  // Pricing information
  getPricingPlans() {
    return {
      pro_individual: {
        name: 'Pro Individual',
        monthly: { price: 5.99, stripe_product_id: 'prod_SvnkjphfFmzJCU' },
        yearly: { price: 39.99, stripe_product_id: 'prod_Svnk7nMQJbI9y9' }
      }
    };
  }
}

export const entitlementsService = new EntitlementsService();