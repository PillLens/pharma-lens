import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/TranslatedText';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { TrialBanner } from '@/components/subscription/TrialBanner';
import PullToRefreshWrapper from '@/components/mobile/PullToRefreshWrapper';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, isInTrial, trialDaysRemaining, refreshEntitlements } = useSubscription();

  const handleRefresh = async () => {
    await refreshEntitlements();
  };

  const getPlanBadgeVariant = () => {
    if (isInTrial) return 'secondary';
    if (subscription.plan === 'free') return 'outline';
    return 'default';
  };

  const getPlanDisplayName = () => {
    if (isInTrial) {
      return `Trial (${trialDaysRemaining}d left)`;
    }
    
    switch (subscription.plan) {
      case 'pro_individual':
        return 'Pro Individual';
      case 'pro_family':
        return 'Pro Family';
      default:
        return 'Free';
    }
  };

  return (
    <ProfessionalMobileLayout
      showHeader={false}
    >
      <PullToRefreshWrapper onRefresh={handleRefresh}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-6 pb-4">
            <div className="text-left">
              <h1 className="text-2xl font-bold">
                <TranslatedText 
                  translationKey="dashboard.goodMorning" 
                  fallback="Good morning" 
                />
              </h1>
              <p className="text-base text-muted-foreground">
                {user?.email?.split('@')[0] || 'User'}
              </p>
            </div>
            <Badge variant={getPlanBadgeVariant()} className="text-xs">
              {getPlanDisplayName()}
            </Badge>
          </div>

          {/* Trial Banner */}
          {isInTrial && <TrialBanner />}
          
          {/* Dashboard Cards */}
          <DashboardCards onNavigate={navigate} />
        </div>
      </PullToRefreshWrapper>
    </ProfessionalMobileLayout>
  );
};

export default Dashboard;