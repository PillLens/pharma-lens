import React from 'react';
import { Clock, Bell, CheckCircle, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/TranslatedText';
import { useDashboardData } from '@/hooks/useDashboardData';

const TodaysOverview: React.FC = () => {
  const { dashboardStats, loading } = useDashboardData();

  // Calculate time until next reminder
  const getTimeUntilReminder = (reminderTime?: string): string => {
    if (!reminderTime) return '';
    
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);
    
    // If the reminder time has passed for today, it's for tomorrow
    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }
    
    const diffMs = reminderDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours === 0) {
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return 'tomorrow';
    }
  };

  if (loading) {
    return (
      <div className="px-4 mb-6">
        <div className="h-48 bg-muted/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const todayData = {
    nextReminder: dashboardStats.reminders.nextReminder,
    completedToday: dashboardStats.adherence.completedToday,
    missedToday: dashboardStats.adherence.missedToday,
    totalToday: dashboardStats.adherence.totalToday,
    streakDays: dashboardStats.adherence.streak
  };

  const completionRate = Math.round((todayData.completedToday / todayData.totalToday) * 100);
  const hasUpcomingReminders = todayData.totalToday - todayData.completedToday > 0;

  return (
    <div className="px-4 mb-6">
      <MobileCard 
        variant="medical" 
        className="bg-gradient-to-r from-primary/5 to-primary-glow/5 border-primary/20"
      >
        <MobileCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <MobileCardTitle className="text-base">
                <TranslatedText translationKey="dashboard.todaysOverview" fallback="Today's Overview" />
              </MobileCardTitle>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Badge>
          </div>
        </MobileCardHeader>
        
        <MobileCardContent>
          <div className="space-y-4">
            {/* Progress Summary */}
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-muted stroke-current"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-primary stroke-current"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${completionRate}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{completionRate}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {todayData.completedToday} of {todayData.totalToday} doses
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <TranslatedText translationKey="dashboard.todayProgress" fallback="Today's progress" />
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 text-success text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold">{todayData.streakDays}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="dashboard.dayStreak" fallback="day streak" />
                </div>
              </div>
            </div>

            {/* Next Reminder */}
            {hasUpcomingReminders && todayData.nextReminder && (
              <div className="flex items-center gap-3 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-warning animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    <TranslatedText translationKey="dashboard.nextReminder" fallback="Next reminder" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {todayData.nextReminder?.medication} at {todayData.nextReminder?.time}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-warning">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeUntilReminder(todayData.nextReminder?.time)}</span>
                </div>
              </div>
            )}

            {/* Completion Status */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm font-bold text-success">{todayData.completedToday}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="dashboard.completed" fallback="Completed" />
                </div>
              </div>
              
              <div className="text-center p-2 bg-muted/20 border border-border rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">{todayData.totalToday - todayData.completedToday}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="dashboard.pending" fallback="Pending" />
                </div>
              </div>
              
              <div className="text-center p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-bold text-destructive">{todayData.missedToday}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="dashboard.missed" fallback="Missed" />
                </div>
              </div>
            </div>
          </div>
        </MobileCardContent>
      </MobileCard>
    </div>
  );
};

export default TodaysOverview;