import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Pill, 
  Clock, 
  Users, 
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
  Settings as SettingsIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/TranslatedText';
import { useToast } from '@/hooks/use-toast';

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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, isInTrial, trialDaysRemaining, refreshEntitlements } = useSubscription();
  const { dashboardStats, loading } = useDashboardData();
  const { toast } = useToast();

  // Handle checkout success/cancel
  useEffect(() => {
    const checkCheckoutSuccess = () => {
      const params = new URLSearchParams(location.search);
      if (params.get("checkout") === "success") {
        console.log("[CHECKOUT-SUCCESS] Payment completed successfully");
        toast({
          title: "Payment Successful!",
          description: "Your subscription has been activated.",
        });
        // Strip query param from URL
        window.history.replaceState({}, "", "/dashboard");
        // Refresh subscription data
        refreshEntitlements();
      } else if (params.get("checkout") === "cancel") {
        console.log("[CHECKOUT-CANCEL] Payment was cancelled");
        toast({
          title: "Payment Cancelled",
          description: "Your subscription was not activated.",
          variant: "destructive"
        });
        // Strip query param from URL
        window.history.replaceState({}, "", "/dashboard");
      }
    };

    checkCheckoutSuccess();
  }, [toast, refreshEntitlements]);

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
      case 'pro_family':
        return t('dashboard.proFamily', 'Pro Family');
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
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      route: '/medications'
    },
    {
      icon: Bell,
      value: dashboardStats.reminders.active,
      label: t('dashboard.activeReminders', 'Active Reminders'),
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      route: '/reminders'
    },
    {
      icon: TrendingUp,
      value: `${dashboardStats.adherence.rate}%`,
      label: t('dashboard.adherenceRate', 'Adherence Rate'),
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      route: '/medications'
    },
    {
      icon: Users,
      value: dashboardStats.family.members,
      label: t('dashboard.familyMembers', 'Family Members'),
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      route: '/family'
    }
  ];

  return (
    <ProfessionalMobileLayout showHeader={false}>
      <PullToRefreshWrapper onRefresh={handleRefresh}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
          {/* Enhanced Header with Glassmorphism */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
            <div className="relative px-4 pt-6 pb-8">
              {/* Floating decorative elements */}
              <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-xl animate-float" />
              <div className="absolute top-8 left-8 w-12 h-12 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full blur-lg animate-float" style={{ animationDelay: '1s' }} />
              
              {/* Main header content */}
              <div className="relative z-10">
                {/* Top row with greeting and plan */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center backdrop-blur-sm border border-primary/20 shadow-soft">
                          <GreetingIcon className="w-5 h-5 text-primary animate-pulse" />
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
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
                          "px-4 py-2 text-xs font-bold shadow-lg border-0 backdrop-blur-sm",
                          isInTrial 
                            ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 animate-glow-pulse" 
                            : subscription.plan === 'free'
                            ? "bg-gradient-to-r from-muted/50 to-muted/30 text-muted-foreground"
                            : "bg-gradient-to-r from-primary/20 to-primary/10 text-primary"
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
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full border border-green-500/20 shadow-soft">
                      <Heart className="w-3 h-3 text-red-500 animate-heartbeat" />
                      <span className="text-xs font-medium text-green-700">Health Active</span>
                    </div>
                    
                    {/* Sync status */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full border border-blue-500/20 shadow-soft">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-xs font-medium text-blue-700">Synced</span>
                    </div>
                  </div>

                  {/* Today's date with subtle styling */}
                  <div className="text-xs text-muted-foreground font-medium bg-muted/30 px-3 py-1 rounded-full border border-border/50">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Subtle separator line */}
                <div className="mt-6 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
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
              <h2 className="text-lg font-semibold">Quick Overview</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {quickStats.map((stat, index) => (
                <MobileCard
                  key={index}
                  interactive
                  onClick={() => navigate(stat.route)}
                  className="group hover:scale-[1.02] transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-card/80 to-card backdrop-blur-sm"
                >
                  <MobileCardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn(
                        "p-2 rounded-xl transition-all duration-300 group-hover:scale-110",
                        stat.bgColor
                      )}>
                        <stat.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                          {stat.value}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  </MobileCardContent>
                </MobileCard>
              ))}
            </div>
          </div>

          {/* Today's Focus Card */}
          <div className="px-6 mb-8">
            <MobileCard className="border-0 shadow-xl bg-gradient-to-br from-primary/5 via-card to-card backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full transform translate-x-16 -translate-y-16" />
              <MobileCardHeader className="relative z-10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <MobileCardTitle className="text-lg font-semibold">Today's Focus</MobileCardTitle>
                </div>
              </MobileCardHeader>
              <MobileCardContent className="relative z-10 space-y-4">
                {/* Adherence Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Daily Adherence</span>
                    <span className="text-sm font-bold text-primary">{dashboardStats.adherence.rate}%</span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={dashboardStats.adherence.rate} 
                      className="h-3 bg-muted/50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40 rounded-full animate-pulse" 
                         style={{ width: `${dashboardStats.adherence.rate}%` }} />
                  </div>
                </div>

                {/* Today's Tasks */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-500">{dashboardStats.adherence.completedToday}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-500">{dashboardStats.adherence.totalToday - dashboardStats.adherence.completedToday}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-500">{dashboardStats.adherence.missedToday}</div>
                    <div className="text-xs text-muted-foreground">Missed</div>
                  </div>
                </div>
              </MobileCardContent>
            </MobileCard>
          </div>

          {/* Action Cards */}
          <div className="px-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Quick Actions
            </h3>
            
            <div className="grid gap-4">
              {/* Add Medication */}
              <MobileCard 
                interactive 
                onClick={() => navigate('/medications')}
                className="group hover:scale-[1.01] transition-all duration-300 border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10"
              >
                <MobileCardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Add New Medication</h4>
                      <p className="text-sm text-muted-foreground">Scan or enter medication details</p>
                    </div>
                    <div className="text-primary group-hover:translate-x-1 transition-transform">
                      →
                    </div>
                  </div>
                </MobileCardContent>
              </MobileCard>

              {/* View Reminders */}
              <MobileCard 
                interactive 
                onClick={() => navigate('/reminders')}
                className="group hover:scale-[1.01] transition-all duration-300 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-amber-500/10"
              >
                <MobileCardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                      <Bell className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Manage Reminders</h4>
                      <p className="text-sm text-muted-foreground">{dashboardStats.reminders.active} active reminders</p>
                    </div>
                    <div className="text-amber-500 group-hover:translate-x-1 transition-transform">
                      →
                    </div>
                  </div>
                </MobileCardContent>
              </MobileCard>

              {/* Family Care */}
              <MobileCard 
                interactive 
                onClick={() => navigate('/family')}
                className="group hover:scale-[1.01] transition-all duration-300 border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-purple-500/10"
              >
                <MobileCardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                      <Users className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Family Health</h4>
                      <p className="text-sm text-muted-foreground">
                        {dashboardStats.family.groups > 0 
                          ? `${dashboardStats.family.members} family members` 
                          : 'Set up family care'
                        }
                      </p>
                    </div>
                    <div className="text-purple-500 group-hover:translate-x-1 transition-transform">
                      →
                    </div>
                  </div>
                </MobileCardContent>
              </MobileCard>

              {/* Settings Card */}
              <MobileCard 
                interactive 
                onClick={() => navigate('/settings')}  
                className="group hover:scale-[1.01] transition-all duration-300 border border-slate-500/20 bg-gradient-to-r from-slate-500/5 to-slate-500/10"
              >
                <MobileCardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-500/10 rounded-xl group-hover:bg-slate-500/20 transition-colors">
                      <SettingsIcon className="w-6 h-6 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Settings</h4>
                      <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
                    </div>
                    <div className="text-slate-500 group-hover:translate-x-1 transition-transform">
                      →
                    </div>
                  </div>
                </MobileCardContent>
              </MobileCard>
            </div>
          </div>
        </div>
      </PullToRefreshWrapper>
    </ProfessionalMobileLayout>
  );
};

export default Dashboard;