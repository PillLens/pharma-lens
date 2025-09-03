import React, { useState } from 'react';
import { Crown, Check, Star, Users, FileText, Shield, X } from 'lucide-react';
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
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <featureHighlight.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <SheetTitle className="text-xl">
                  <TranslatedText 
                    translationKey="subscription.unlockPremium" 
                    fallback="Unlock Premium Features" 
                  />
                </SheetTitle>
                <SheetDescription>
                  {featureHighlight.description}
                </SheetDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {canStartTrial && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-amber-800">
                  <TranslatedText translationKey="subscription.14dayTrial" fallback="14-Day Free Trial" />
                </span>
              </div>
              <p className="text-sm text-amber-700">
                <TranslatedText 
                  translationKey="subscription.trialDescription" 
                  fallback="Try all Pro Individual features free for 14 days. Cancel anytime." 
                />
              </p>
            </div>
          )}
        </SheetHeader>

        <div className="space-y-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
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

          {/* Pricing Cards */}
          <div className="grid gap-4">
            {/* Pro Individual */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      <TranslatedText translationKey="subscription.proIndividual" fallback="Pro Individual" />
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      <TranslatedText 
                        translationKey="subscription.proIndividualDescription" 
                        fallback="Perfect for personal medication management" 
                      />
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ${isYearly ? '39.99' : '5.99'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <TranslatedText 
                        translationKey={isYearly ? "subscription.perYear" : "subscription.perMonth"} 
                        fallback={isYearly ? "/year" : "/month"} 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      <TranslatedText translationKey="subscription.unlimitedMedications" fallback="Unlimited medications" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      <TranslatedText translationKey="subscription.advancedReports" fallback="Advanced reports & exports" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      <TranslatedText translationKey="subscription.hipaaReports" fallback="HIPAA compliance reports" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      <TranslatedText translationKey="subscription.maxDevices" fallback="Up to 3 devices" />
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={(e) => handleUpgrade('pro_individual', e)}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-primary-glow"
                >
                  {canStartTrial && !isInTrial ? (
                    <TranslatedText translationKey="subscription.startFreeTrial" fallback="Start Free Trial" />
                  ) : (
                    <TranslatedText translationKey="subscription.upgrade" fallback="Upgrade" />
                  )}
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Testimonials Placeholder */}
          <div className="text-center space-y-4 py-6">
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground italic">
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