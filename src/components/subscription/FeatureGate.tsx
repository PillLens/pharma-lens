import React, { ReactNode } from 'react';
import { Lock, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/TranslatedText';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { UserEntitlements } from '@/services/entitlementsService';
import { PaywallSheet } from './PaywallSheet';

interface FeatureGateProps {
  children: ReactNode;
  feature: keyof UserEntitlements;
  showPaywall?: boolean;
  fallback?: ReactNode;
  className?: string;
}

export function FeatureGate({ 
  children, 
  feature, 
  showPaywall = true, 
  fallback, 
  className = "" 
}: FeatureGateProps) {
  const { checkFeatureAccess, subscription, isInTrial } = useSubscription();
  const [showUpgrade, setShowUpgrade] = React.useState(false);

  const hasAccess = checkFeatureAccess(feature) || isInTrial;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showPaywall) {
    return null;
  }

  // Get feature-specific messaging
  const getFeatureMessage = (feature: keyof UserEntitlements) => {
    switch (feature) {
      case 'reminders_limit':
        return {
          title: "You've reached your reminder limit",
          description: "Free users get 1 reminder. Pro users get unlimited reminders.",
          highlight: "Unlimited Reminders"
        };
      case 'can_create_family_group':
        return {
          title: "Family groups require Pro",
          description: "Create and manage family groups with Pro Individual plan.",
          highlight: "Family Management"
        };
      case 'can_export_reports':
        return {
          title: "Reports require Pro",
          description: "Export detailed medication adherence reports with Pro.",
          highlight: "Advanced Reports"
        };
      case 'hipaa_report_access':
        return {
          title: "HIPAA reports require Pro",
          description: "Access HIPAA compliance reports with Pro Individual plan.",
          highlight: "HIPAA Compliance"
        };
      default:
        return {
          title: "This is a Pro feature",
          description: "Upgrade to Pro Individual to unlock this feature.",
          highlight: "Pro Feature"
        };
    }
  };

  const featureMessage = getFeatureMessage(feature);

  // Show inline gate
  return (
    <>
      <Card className={`relative overflow-hidden opacity-60 ${className}`}>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/60 z-10 flex flex-col items-center justify-center">
          <div className="text-center space-y-3 p-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow mx-auto">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <Badge variant="outline" className="mb-2">
                <Lock className="w-3 h-3 mr-1" />
                {featureMessage.highlight}
              </Badge>
              <h4 className="font-medium text-foreground mb-1">
                {featureMessage.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {featureMessage.description}
              </p>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowUpgrade(true)}
              className="bg-gradient-to-r from-primary to-primary-glow"
            >
              <Crown className="w-4 h-4 mr-2" />
              <TranslatedText translationKey="subscription.upgrade" fallback="Upgrade to Pro" />
            </Button>
          </div>
        </div>

        {/* Dimmed content */}
        <div className="pointer-events-none">
          {children}
        </div>
      </Card>

      <PaywallSheet 
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={feature}
      />
    </>
  );
}

// Inline component for smaller feature locks
export function FeatureLock({ 
  feature, 
  className = "" 
}: { 
  feature: keyof UserEntitlements; 
  className?: string; 
}) {
  const [showUpgrade, setShowUpgrade] = React.useState(false);

  return (
    <>
      <div className={`flex items-center gap-2 p-3 rounded-lg border border-dashed border-muted-foreground/50 ${className}`}>
        <Lock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground flex-1">
          <TranslatedText translationKey="subscription.proFeatureShort" fallback="Pro feature" />
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowUpgrade(true)}
        >
          <TranslatedText translationKey="subscription.upgrade" fallback="Upgrade" />
        </Button>
      </div>

      <PaywallSheet 
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={feature}
      />
    </>
  );
}