import React from 'react';
import { Bell, Plus, ChevronRight, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TranslatedText } from '@/components/TranslatedText';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';

const QuickActionCards: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardStats, loading } = useDashboardData();

  // Format next reminder text
  const getNextReminderText = () => {
    if (!dashboardStats.reminders.nextReminder) {
      return dashboardStats.reminders.active > 0 ? 'No reminders today' : '0 active reminders';
    }
    
    const { time } = dashboardStats.reminders.nextReminder;
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    const diffMs = reminderTime.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffHours <= 0) {
      return 'Reminder due now';
    } else if (diffHours === 1) {
      return 'Next reminder in 1 hour';
    } else {
      return `Next reminder in ${diffHours} hours`;
    }
  };

  const quickActions = [
    {
      icon: Plus,
      titleKey: 'dashboard.addMedication',
      description: 'Scan or enter medication details',
      route: '/medications?action=add',
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50 dark:bg-blue-950/30'
    },
    {
      icon: Bell,
      titleKey: 'dashboard.manageReminders',
      description: getNextReminderText(),
      route: '/reminders',
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-50 dark:bg-orange-950/30'
    },
    {
      icon: Settings,
      titleKey: 'navigation.settings',
      description: 'Manage your account and preferences',
      route: '/settings',
      iconColor: 'text-gray-500',
      iconBg: 'bg-gray-50 dark:bg-gray-950/30'
    }
  ];

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-sm"></div>
        </div>
        <h2 className="text-lg font-medium text-foreground">
          <TranslatedText translationKey="dashboard.quickActions" fallback="Quick Actions" />
        </h2>
      </div>

      <div className="bg-background rounded-xl border border-border/60 overflow-hidden">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <div key={`skeleton-${index}`} className={`p-4 ${index < 2 ? 'border-b border-border/30' : ''}`}>
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="w-4 h-4" />
              </div>
            </div>
          ))
        ) : (
          quickActions.map((action, index) => (
            <div
              key={index}
              onClick={() => navigate(action.route)}
              className={`p-4 ${index < quickActions.length - 1 ? 'border-b border-border/30' : ''} 
                        active:bg-muted/50 cursor-pointer transition-colors duration-150 
                        hover:bg-muted/30 group`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${action.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground mb-0.5 text-base">
                    <TranslatedText translationKey={action.titleKey} />
                  </div>
                  <div className="text-sm text-muted-foreground leading-tight">
                    {action.description}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/60 flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default QuickActionCards;