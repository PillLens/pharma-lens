import React, { useState } from 'react';
import { Crown, Check, Star, Users, FileText, Shield, X, Bot } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { TranslatedText } from '@/components/TranslatedText';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { UserEntitlements, entitlementsService } from '@/services/entitlementsService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


interface PaywallSheetProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: keyof UserEntitlements;
}

export function PaywallSheet({ isOpen, onClose, feature }: PaywallSheetProps) {
  const { subscription, canStartTrial, isInTrial, trialDaysRemaining, refreshEntitlements } = useSubscription();
  const { toast } = useToast();
  const [isYearly, setIsYearly] = useState(true);
  const [loading, setLoading] = useState(false);

  const pricing = entitlementsService.getPricingPlans();

  const handleUpgrade = async (plan: 'pro_individual', event?: React.MouseEvent) => {
    // Prevent event bubbling and double clicks
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (loading) {
      console.log('[CHECKOUT] Already loading, ignoring click');
      return;
    }

    console.log('[CHECKOUT] Button clicked for plan:', plan);

    try {
      console.log('[CHECKOUT] Starting upgrade process', { plan, billing_cycle: isYearly ? 'yearly' : 'monthly' });
      setLoading(true);

      console.log('[CHECKOUT] Calling supabase function...');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan, billing_cycle: isYearly ? 'yearly' : 'monthly' }
      });

      console.log('[CHECKOUT] Function response:', JSON.stringify({ data, error }, null, 2));

      if (error) {
        console.error('[CHECKOUT] Supabase function error:', error);
        console.error('[CHECKOUT] Error message:', error.message);
        console.error('[CHECKOUT] Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      if (data?.url) {
        console.log('[CHECKOUT] Got checkout URL:', data.url);
        console.log('[CHECKOUT] Attempting to open checkout...');
        
        // Check if we're on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('[CHECKOUT] Is mobile device:', isMobile);
        
        if (isMobile) {
          // On mobile, always use same-tab redirect for better compatibility
          console.log('[CHECKOUT] Mobile detected, using same-tab redirect');
          window.location.href = data.url;
        } else {
          // On desktop, try new tab first, fallback to same-tab
          const newWindow = window.open(data.url, '_blank');
          
          if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
            console.error('[CHECKOUT] Popup blocked, using same-tab redirect...');
            window.location.href = data.url;
          } else {
            console.log('[CHECKOUT] Checkout opened in new tab');
            // Close the paywall sheet since checkout opened successfully
            onClose();
          }
        }
      } else {
        console.error('[CHECKOUT] No URL in response:', data);
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('[CHECKOUT] Full error details:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFeatureHighlight = (feature?: keyof UserEntitlements) => {
    switch (feature) {
      case 'can_create_family_group':
        return {
          icon: Users,
          title: 'Family Management',
          description: 'Create and manage family groups, invite members, and share medications.'
        };
      case 'can_export_reports':
        return {
          icon: FileText,
          title: 'Advanced Reports',
          description: 'Export detailed adherence reports and medication history.'
        };
      case 'hipaa_report_access':
        return {
          icon: Shield,
          title: 'Security & Compliance',
          description: 'Access HIPAA compliance reports and advanced security features.'
        };
      case 'ai_chat_minutes_per_month':
        return {
          icon: Bot,
          title: '10 AI Voice Minutes/Month',
          description: 'Chat with your AI health assistant using premium voice technology (OpenAI GPT-4 + ElevenLabs).'
        };
      default:
        return {
          icon: Crown,
          title: 'Premium Features',
          description: 'Unlock all advanced features with a Pro subscription.'
        };
    }
  };

  const featureHighlight = getFeatureHighlight(feature);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[95vh] overflow-y-auto p-4 sm:p-6">
        <SheetHeader className="space-y-3 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center flex-shrink-0">
                <featureHighlight.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg sm:text-xl leading-tight">
                  <TranslatedText 
                    translationKey="subscription.unlockPremium" 
                    fallback="Unlock Premium Features" 
                  />
                </SheetTitle>
                <SheetDescription className="text-sm sm:text-base mt-1">
                  {featureHighlight.description}
                </SheetDescription>
              </div>
            </div>
          </div>

          {canStartTrial && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                <span className="font-semibold text-amber-800 dark:text-amber-200 text-sm sm:text-base">
                  <TranslatedText translationKey="subscription.14dayTrial" fallback="14-Day Free Trial" />
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                <TranslatedText 
                  translationKey="subscription.trialDescription" 
                  fallback="Try all Pro Individual features free for 14 days. Cancel anytime." 
                />
              </p>
            </div>
          )}
        </SheetHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <span className={`text-sm ${!isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
              <TranslatedText translationKey="subscription.monthly" fallback="Monthly" />
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={`text-sm ${isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
              <TranslatedText translationKey="subscription.yearly" fallback="Yearly" />
            </span>
            {isYearly && (
              <Badge variant="secondary" className="text-xs">
                <TranslatedText translationKey="subscription.save30percent" fallback="Save 30%" />
              </Badge>
            )}
          </div>

          {/* Free vs Pro Comparison */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                {/* Free Plan */}
                <div className="p-3 sm:p-4 bg-muted/30">
                  <div className="text-center mb-3 sm:mb-4">
                    <h3 className="font-semibold text-muted-foreground text-sm sm:text-base">Free Plan</h3>
                    <div className="text-xl sm:text-2xl font-bold text-muted-foreground">$0</div>
                    <div className="text-xs text-muted-foreground">Forever</div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>Basic medication scanning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>1 medication reminder</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>3 AI voice minutes/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>1 device only</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <X className="w-3 h-3 flex-shrink-0" />
                      <span>No family groups</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <X className="w-3 h-3 flex-shrink-0" />
                      <span>No advanced reports</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <X className="w-3 h-3 flex-shrink-0" />
                      <span>No HIPAA compliance</span>
                    </div>
                  </div>
                </div>

                {/* Pro Plan */}
                <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/5 to-primary-glow/5 relative">
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary-glow text-white text-xs px-2 py-1">
                    Most Popular
                  </Badge>
                  <div className="text-center mb-3 sm:mb-4 mt-2">
                    <h3 className="font-semibold text-sm sm:text-base">Pro Individual</h3>
                    <div className="text-xl sm:text-2xl font-bold">
                      ${isYearly ? '39.99' : '5.99'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isYearly ? '/year' : '/month'}
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>Everything in Free</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>Unlimited reminders</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>Up to 3 devices</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>Family group management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>Advanced reports & exports</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>10 AI voice minutes/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>HIPAA compliance reports</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Button */}
          <Button 
            onClick={(e) => handleUpgrade('pro_individual', e)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary-glow text-white h-12 sm:h-14 text-sm sm:text-base font-semibold"
          >
            {canStartTrial && !isInTrial ? (
              <TranslatedText translationKey="subscription.startFreeTrial" fallback="Start Free Trial" />
            ) : (
              <TranslatedText translationKey="subscription.upgrade" fallback="Upgrade to Pro" />
            )}
          </Button>

          {/* Testimonials Placeholder */}
          <div className="text-center space-y-3 sm:space-y-4 py-4 sm:py-6">
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground italic px-4">
              <TranslatedText 
                translationKey="subscription.testimonialPlaceholder" 
                fallback="Join thousands of users managing their health with confidence" 
              />
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}