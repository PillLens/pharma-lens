import React from 'react';
import { Pill, Bell, Users, Activity, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuickStatsGrid } from '@/components/ui/QuickStatsGrid';
import { TranslatedText } from '@/components/TranslatedText';
import { useDashboardData } from '@/hooks/useDashboardData';
import { toast } from 'sonner';

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
            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: Pill,
      value: dashboardStats.medications.active,
      label: 'medications',
      translationKey: 'dashboard.medications',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      onClick: () => navigate('/medications')
    },
    {
      icon: Bell,
      value: dashboardStats.reminders.active,
      label: 'reminders',
      translationKey: 'dashboard.reminders',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20', 
      onClick: () => navigate('/reminders')
    },
    {
      icon: Users,
      value: '0',
      label: 'family',
      translationKey: 'dashboard.family',
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
      icon: Activity,
      value: dashboardStats.scans.recentCount,
      label: 'scans',
      translationKey: 'dashboard.scans',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      onClick: () => navigate('/history')
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
      
      <QuickStatsGrid stats={stats} />
    </div>
  );
};

export default QuickStatsCards;