import React from 'react';
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
  Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/TranslatedText';
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
      label: 'Active Medications',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      route: '/medications'
    },
    {
      icon: Bell,
      value: dashboardStats.reminders.active,
      label: 'Active Reminders',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      route: '/reminders'
    },
    {
      icon: TrendingUp,
      value: `${dashboardStats.adherence.rate}%`,
      label: 'Adherence Rate',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      route: '/medications'
    },
    {
      icon: Users,
      value: dashboardStats.family.members,
      label: 'Family Members',
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
            <div className="relative px-6 pt-8 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <GreetingIcon className="w-5 h-5 text-primary animate-pulse" />
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      {getGreeting()}
                    </h1>
                  </div>
                  <p className="text-lg text-muted-foreground font-medium">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge 
                    variant={getPlanBadgeVariant()} 
                    className={cn(
                      "px-3 py-1 text-xs font-semibold shadow-md",
                      isInTrial && "animate-medical-pulse"
                    )}
                  >
                    {getPlanDisplayName()}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="w-3 h-3 text-red-500 animate-heartbeat" />
                    <span>Health tracking active</span>
                  </div>
                </div>
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

              {/* Security Status */}
              <MobileCard className="border border-green-500/20 bg-gradient-to-r from-green-500/5 to-green-500/10">
                <MobileCardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <Shield className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Security Status</h4>
                      <p className="text-sm text-muted-foreground">All data encrypted & secure</p>
                    </div>
                    <Badge variant="default" className="bg-green-500 text-white">Active</Badge>
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