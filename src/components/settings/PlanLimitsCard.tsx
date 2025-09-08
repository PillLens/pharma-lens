import React from 'react';
import { Crown, Users, FileText, Shield, Smartphone, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/TranslatedText';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';

interface PlanLimitsCardProps {
  onUpgrade: () => void;
}

export function PlanLimitsCard({ onUpgrade }: PlanLimitsCardProps) {
  const { entitlements, subscription, isInTrial, trialDaysRemaining } = useSubscription();

  // Mock usage data - replace with actual usage from your service
  const currentUsage = {
    reminders: 1, // This should come from your medication service
    devices: 1,   // This should come from your device tracking
    familyMembers: 0 // This should come from your family service
  };

  const isPro = subscription.plan !== 'free' || isInTrial;

  const limitItems = [
    {
      icon: AlertCircle,
      label: 'Medication Reminders',
      current: currentUsage.reminders,
      max: entitlements.reminders_limit,
      unlimited: entitlements.reminders_limit === -1,
      color: 'text-blue-500'
    },
    {
      icon: Smartphone,
      label: 'Active Devices',
      current: currentUsage.devices,
      max: entitlements.max_devices,
      unlimited: entitlements.max_devices === -1,
      color: 'text-green-500'
    },
    {
      icon: Users,
      label: 'Family Members',
      current: currentUsage.familyMembers,
      max: entitlements.can_create_family_group ? 5 : 0,
      unlimited: false,
      color: 'text-purple-500',
      proOnly: !entitlements.can_create_family_group
    }
  ];

  const getProgressValue = (current: number, max: number) => {
    if (max === -1) return 0; // Unlimited
    return Math.min((current / max) * 100, 100);
  };

  const getProgressColor = (current: number, max: number) => {
    if (max === -1) return 'bg-green-500'; // Unlimited
    const percentage = (current / max) * 100;
    if (percentage >= 90) return '[&>*]:bg-red-500';
    if (percentage >= 70) return '[&>*]:bg-yellow-500';
    return '[&>*]:bg-primary';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <TranslatedText translationKey="settings.planLimits.title" fallback="Plan Usage" />
          </CardTitle>
          <Badge 
            variant={isPro ? "default" : "outline"}
            className={isPro ? "bg-gradient-to-r from-primary to-primary-glow text-white" : ""}
          >
            {isInTrial ? (
              <>
                <Crown className="w-3 h-3 mr-1" />
                Trial ({trialDaysRemaining} days left)
              </>
            ) : subscription.plan === 'pro_individual' ? (
              <>
                <Crown className="w-3 h-3 mr-1" />
                Pro Individual
              </>
            ) : (
              'Free Plan'
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {limitItems.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="font-medium">{item.label}</span>
                {item.proOnly && (
                  <Badge variant="outline" className="text-xs">
                    <Crown className="w-2 h-2 mr-1" />
                    Pro
                  </Badge>
                )}
              </div>
              <span className="text-muted-foreground">
                {item.proOnly ? (
                  'Not available'
                ) : item.unlimited ? (
                  `${item.current} / Unlimited`
                ) : (
                  `${item.current} / ${item.max}`
                )}
              </span>
            </div>
            
            {!item.proOnly && (
              <Progress 
                value={getProgressValue(item.current, item.max)} 
                className={cn("h-2", getProgressColor(item.current, item.max))}
              />
            )}
            
            {item.proOnly && (
              <div className="h-2 bg-muted rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent animate-pulse" />
              </div>
            )}
          </div>
        ))}

        {!isPro && (
          <div className="pt-2 border-t border-border">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Upgrade to Pro for unlimited features
              </p>
              <Button 
                size="sm" 
                onClick={onUpgrade}
                className="w-full bg-gradient-to-r from-primary to-primary-glow"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}

        {/* Pro Features Preview */}
        {!isPro && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Pro features you'll unlock:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-500" />
                <span>Advanced Reports</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-green-500" />
                <span>HIPAA Reports</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-purple-500" />
                <span>Family Groups</span>
              </div>
              <div className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-yellow-500" />
                <span>Priority Support</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}