import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Pill, 
  Clock, 
  TrendingUp, 
  Heart, 
  Sun, 
  Moon,
  Activity,
  Calendar,
  Bell,
  Shield,
  Plus,
  Crown,
  ChevronRight,
  Settings as SettingsIcon,
  Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/TranslatedText';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import { TrialBanner } from '@/components/subscription/TrialBanner';
import PullToRefreshWrapper from '@/components/mobile/PullToRefreshWrapper';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from '@/components/ui/mobile/MobileCard';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QuickStatsGrid } from '@/components/ui/QuickStatsGrid';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorCard } from '@/components/dashboard/ErrorCard';
import { VitalSignsCard } from '@/components/dashboard/VitalSignsCard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, isInTrial, trialDaysRemaining, refreshEntitlements } = useSubscription();
  const { dashboardStats, loading, error, refetch } = useDashboardData();
  const { toast: toastHook } = useToast();

  // Handle checkout success/cancel
  useEffect(() => {
    const checkCheckoutSuccess = () => {
      const params = new URLSearchParams(location.search);
      if (params.get("checkout") === "success") {
        console.log("[CHECKOUT-SUCCESS] Payment completed successfully");
        toastHook({
          title: "Payment Successful!",
          description: "Your subscription has been activated.",
        });
        // Strip query param from URL
        window.history.replaceState({}, "", "/dashboard");
        // Refresh subscription data
        refreshEntitlements();
      } else if (params.get("checkout") === "cancel") {
        console.log("[CHECKOUT-CANCEL] Payment was cancelled");
        toastHook({
          title: "Payment Cancelled",
          description: "Your subscription was not activated.",
          variant: "destructive"
        });
        // Strip query param from URL
        window.history.replaceState({}, "", "/dashboard");
      }
    };

    checkCheckoutSuccess();
  }, [toastHook, refreshEntitlements]);

  const handleRefresh = async () => {
    await refreshEntitlements();
  };

  const getPlanBadgeVariant = () => {
    if (isInTrial) return 'secondary';
    if (subscription.plan === 'free') return 'outline';
    return 'default';
  };

  const { t } = useTranslation();

  const getPlanDisplayName = () => {
    if (isInTrial) {
      return `${t('dashboard.trial', 'Trial')} (${trialDaysRemaining}${t('common.daysLeft', 'd left')})`;
    }
    
    switch (subscription.plan) {
      case 'pro_individual':
        return t('dashboard.proIndividual', 'Pro Individual');
      default:
        return t('dashboard.free', 'Free');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning', 'Good morning');
    if (hour < 17) return t('dashboard.goodAfternoon', 'Good afternoon');
    return t('dashboard.goodEvening', 'Good evening');
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return Sun;
    if (hour < 17) return Sun;
    return Moon;
  };

  const GreetingIcon = getGreetingIcon();

  const quickStats = [
    {
      icon: Pill,
      value: dashboardStats.medications.active,
      label: t('dashboard.activeMedications', 'Active Medications'),
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      onClick: () => navigate('/medications')
    },
    {
      icon: Bell,
      value: dashboardStats.reminders.active,
      label: t('dashboard.activeReminders', 'Active Reminders'),
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20',
      onClick: () => navigate('/reminders')
    },
    {
      icon: Users,
      value: dashboardStats.family.members || 0,
      label: t('dashboard.familyMembers', 'Family Members'),
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      borderColor: 'border-purple-200 dark:border-purple-800',
      onClick: () => {
        toast.info('🚧 Coming Soon!', {
          description: 'Family management features are being developed.',
          duration: 3000,
        });
      }
    },
    {
      icon: TrendingUp,
      value: `${dashboardStats.adherence.rate}%`,
      label: t('dashboard.adherenceRate', 'Adherence Rate'),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      onClick: () => navigate('/medications')
    },
  ];

  // Show skeleton during initial load
  if (loading && !dashboardStats) {
    return (
      <ProfessionalMobileLayout showHeader={false}>
        <DashboardSkeleton />
      </ProfessionalMobileLayout>
    );
  }

  // Show error card if there's an error
  if (error && !dashboardStats) {
    return (
      <ProfessionalMobileLayout showHeader={false}>
        <div className="p-6">
          <ErrorCard onRetry={refetch} />
        </div>
      </ProfessionalMobileLayout>
    );
  }

  return (
    <ProfessionalMobileLayout showHeader={false}>
      <PullToRefreshWrapper onRefresh={handleRefresh}>
        <div className="min-h-screen bg-background" data-scrollable>
          {/* Enhanced Header with Glassmorphism */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-background" />
            <div className="relative px-4 pt-6 pb-8">
              {/* Floating decorative elements */}
              
              {/* Main header content */}
              <div className="relative z-10">
                {/* Top row with greeting and plan */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                          <GreetingIcon className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground leading-tight">
                          {getGreeting()}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <p className="text-sm text-muted-foreground font-medium">
                            {user?.email?.split('@')[0] || 'User'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Plan badge with enhanced styling */}
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getPlanBadgeVariant()} 
                        className={cn(
                          "px-4 py-2 text-xs font-bold border",
                          isInTrial 
                            ? "bg-warning/20 text-warning border-warning/30" 
                            : subscription.plan === 'free'
                            ? "bg-muted text-muted-foreground border-border"
                            : "bg-primary/20 text-primary border-primary/30"
                        )}
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        {getPlanDisplayName()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Status indicators row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Health status */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-full border border-success/20">
                      <Heart className="w-3 h-3 text-red-500" />
                      <span className="text-xs font-medium text-success">
                        <TranslatedText translationKey="dashboard.healthActive" fallback="Health Active" />
                      </span>
                    </div>
                    
                    {/* Sync status */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-info/10 rounded-full border border-info/20">
                      <div className="w-2 h-2 rounded-full bg-info" />
                      <span className="text-xs font-medium text-info">
                        <TranslatedText translationKey="dashboard.synced" fallback="Synced" />
                      </span>
                    </div>
                  </div>

                  {/* Today's date with subtle styling */}
                  <div className="text-xs text-muted-foreground font-medium bg-muted/30 px-3 py-1 rounded-full border border-border/50">
                    {new Date().toLocaleDateString(t('common.locale', 'en-US'), { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Subtle separator line */}
                <div className="mt-6 h-px bg-border" />
              </div>
            </div>
          </div>

          {/* Trial Banner */}
          {isInTrial && (
            <div className="px-6 mb-6">
              <TrialBanner />
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="px-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">{t('dashboard.quickOverview')}</h2>
            </div>
            <QuickStatsGrid stats={quickStats} />
          </div>

          {/* Vital Signs Card */}
          <div className="px-6 mb-8">
            <VitalSignsCard />
          </div>

          {/* Today's Focus Card */}
          <div className="px-6 mb-8">
            <MobileCard className="border">
              <MobileCardHeader className="relative z-10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <MobileCardTitle className="text-lg font-semibold">{t('dashboard.todaysFocus')}</MobileCardTitle>
                </div>
              </MobileCardHeader>
              <MobileCardContent className="relative z-10 space-y-4">
                {/* Adherence Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('dashboard.dailyAdherence')}</span>
                    <span className="text-sm font-bold text-primary">{dashboardStats.adherence.rate}%</span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={dashboardStats.adherence.rate} 
                      className="h-3"
                    />
                  </div>
                </div>

                {/* Today's Tasks */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-500">{dashboardStats.adherence.completedToday}</div>
                    <div className="text-xs text-muted-foreground">{t('dashboard.completed')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-500">{dashboardStats.adherence.totalToday - dashboardStats.adherence.completedToday}</div>
                    <div className="text-xs text-muted-foreground">{t('dashboard.pending')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-500">{dashboardStats.adherence.missedToday}</div>
                    <div className="text-xs text-muted-foreground">{t('dashboard.missed')}</div>
                  </div>
                </div>
              </MobileCardContent>
            </MobileCard>
          </div>

          {/* Action Cards */}
          <div className="px-6 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-sm"></div>
              </div>
              <h3 className="text-lg font-medium text-foreground">
                <TranslatedText translationKey="dashboard.quickActions" fallback="Quick Actions" />
              </h3>
            </div>
            
            <div className="bg-background rounded-xl border overflow-hidden">
              {/* Add Medication */}
              <div
                onClick={() => navigate('/medications')}
                className="p-4 border-b border-border/30 active:bg-muted/50 cursor-pointer transition-colors duration-150 hover:bg-muted/30 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground mb-0.5 text-base">
                      <TranslatedText translationKey="dashboard.addMedication" />
                    </div>
                    <div className="text-sm text-muted-foreground leading-tight">
                      <TranslatedText translationKey="dashboard.scanOrEnterDetails" />
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/60 flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
                </div>
              </div>

              {/* View Reminders */}
              <div
                onClick={() => navigate('/reminders')}
                className="p-4 border-b border-border/30 active:bg-muted/50 cursor-pointer transition-colors duration-150 hover:bg-muted/30 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground mb-0.5 text-base">
                      <TranslatedText translationKey="dashboard.manageReminders" />
                    </div>
                    <div className="text-sm text-muted-foreground leading-tight">
                      {dashboardStats.reminders.active} <TranslatedText translationKey="dashboard.activeRemindersText" />
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/60 flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
                </div>
              </div>


              {/* Settings Card */}
              <div
                onClick={() => navigate('/settings')}
                className="p-4 active:bg-muted/50 cursor-pointer transition-colors duration-150 hover:bg-muted/30 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-950/30 flex items-center justify-center flex-shrink-0">
                    <SettingsIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground mb-0.5 text-base">
                      <TranslatedText translationKey="navigation.settings" />
                    </div>
                    <div className="text-sm text-muted-foreground leading-tight">
                      <TranslatedText translationKey="dashboard.manageAccountPreferences" />
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/60 flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PullToRefreshWrapper>
    </ProfessionalMobileLayout>
  );
};

export default Dashboard;