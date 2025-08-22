import React from 'react';
import { Pill, Bell, Users, Activity, TrendingUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from '@/components/ui/mobile/MobileCard';
import { TranslatedText } from '@/components/TranslatedText';
import { useDashboardData } from '@/hooks/useDashboardData';

const QuickStatsCards: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardStats, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            <TranslatedText translationKey="dashboard.quickStats" fallback="Quick Stats" />
          </h2>
          <TrendingUp className="w-5 h-5 text-success" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: Pill,
      count: dashboardStats.medications.active,
      label: 'medications',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      route: '/medications'
    },
    {
      icon: Bell,
      count: dashboardStats.reminders.active,
      label: 'reminders',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20', 
      route: '/reminders'
    },
    {
      icon: Users,
      count: dashboardStats.family.groups,
      label: 'family',
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/20',
      route: '/family'
    },
    {
      icon: Activity,
      count: dashboardStats.scans.recentCount,
      label: 'scans',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      route: '/history'
    }
  ];

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          <TranslatedText translationKey="dashboard.quickStats" fallback="Quick Stats" />
        </h2>
        <TrendingUp className="w-5 h-5 text-success" />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <MobileCard
            key={index}
            variant="glass"
            interactive
            onClick={() => navigate(stat.route)}
            className={`${stat.borderColor} ${stat.bgColor} hover:scale-[1.02] transition-all duration-200`}
          >
            <MobileCardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center shadow-soft`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{stat.count}</div>
                </div>
              </div>
            </MobileCardHeader>
            <MobileCardContent>
              <p className="text-sm text-muted-foreground capitalize">
                <TranslatedText translationKey={`dashboard.${stat.label}`} fallback={stat.label} />
              </p>
            </MobileCardContent>
          </MobileCard>
        ))}
      </div>
    </div>
  );
};

export default QuickStatsCards;