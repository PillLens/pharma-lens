import React, { useState } from 'react';
import { Crown, User, CreditCard, Bell, Shield, Globe, ArrowRight, ExternalLink } from 'lucide-react';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { TranslatedText } from '@/components/TranslatedText';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PaywallSheet } from '@/components/subscription/PaywallSheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { subscription, isInTrial, trialDaysRemaining, canStartTrial, refreshEntitlements } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    if (subscription.plan === 'free') {
      setShowPaywall(true);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    if (!canStartTrial) return;
    setShowPaywall(true);
  };

  const getSubscriptionStatusColor = () => {
    if (isInTrial) return 'from-amber-500 to-orange-500';
    if (subscription.plan !== 'free') return 'from-primary to-primary-glow';
    return 'from-muted-foreground to-muted-foreground';
  };

  const getSubscriptionLabel = () => {
    if (isInTrial) return 'Trial Active';
    if (subscription.plan === 'pro_individual') return 'Pro Individual';
    if (subscription.plan === 'pro_family') return 'Pro Family';
    return 'Free Plan';
  };

  return (
    <ProfessionalMobileLayout
      title="Settings"
      showHeader={true}
      className="bg-background"
    >
      <div className="px-4 py-6 space-y-6">
        {/* Account & Subscription Section */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getSubscriptionStatusColor()} flex items-center justify-center`}>
                {subscription.plan !== 'free' || isInTrial ? (
                  <Crown className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">Account & Subscription</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Plan */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Plan</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={subscription.plan === 'free' ? 'outline' : 'default'}
                    className={subscription.plan !== 'free' ? 'bg-gradient-to-r from-primary to-primary-glow text-white' : ''}
                  >
                    {getSubscriptionLabel()}
                  </Badge>
                  {isInTrial && (
                    <Badge variant="secondary" className="text-xs">
                      {trialDaysRemaining} days left
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleManageSubscription}
                disabled={loading}
              >
                {subscription.plan === 'free' ? 'Upgrade' : 'Manage'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Trial CTA */}
            {canStartTrial && subscription.plan === 'free' && (
              <>
                <Separator />
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-amber-800">Start Free Trial</p>
                      <p className="text-sm text-amber-700">Try Pro features free for 14 days</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={handleStartTrial}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    >
                      Start Trial
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Feature Access */}
            <Separator />
            <div>
              <p className="font-medium mb-3">Feature Access</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Family Groups</span>
                  <Badge variant={subscription.plan === 'pro_family' ? 'default' : 'outline'}>
                    {subscription.plan === 'pro_family' ? 'Enabled' : 'Upgrade Required'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Advanced Reports</span>
                  <Badge variant={subscription.plan !== 'free' || isInTrial ? 'default' : 'outline'}>
                    {subscription.plan !== 'free' || isInTrial ? 'Enabled' : 'Upgrade Required'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>HIPAA Compliance</span>
                  <Badge variant={subscription.plan !== 'free' || isInTrial ? 'default' : 'outline'}>
                    {subscription.plan !== 'free' || isInTrial ? 'Enabled' : 'Upgrade Required'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Medication Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified about doses</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Family Alerts</p>
                <p className="text-sm text-muted-foreground">Emergency notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Health Insights</p>
                <p className="text-sm text-muted-foreground">Weekly health reports</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add extra security</p>
              </div>
              <Button variant="outline" size="sm">
                Setup
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Data Export</p>
                <p className="text-sm text-muted-foreground">Download your data</p>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Language & Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Language</p>
                <p className="text-sm text-muted-foreground">English (US)</p>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <PaywallSheet 
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </ProfessionalMobileLayout>
  );
};

export default Settings;