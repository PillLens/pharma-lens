import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Award, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HealthInsight {
  type: 'positive' | 'warning' | 'neutral';
  icon: React.ElementType;
  title: string;
  description: string;
  metric?: string;
}

interface HealthInsightsCardProps {
  adherenceRate: number;
  streak: number;
  missedToday: number;
  totalToday: number;
}

export const HealthInsightsCard = ({ 
  adherenceRate, 
  streak, 
  missedToday,
  totalToday 
}: HealthInsightsCardProps) => {
  const insights: HealthInsight[] = [];

  // Adherence trend
  if (adherenceRate >= 90) {
    insights.push({
      type: 'positive',
      icon: TrendingUp,
      title: 'Excellent Adherence',
      description: 'You\'re maintaining a healthy medication routine',
      metric: `${adherenceRate}%`
    });
  } else if (adherenceRate >= 70) {
    insights.push({
      type: 'neutral',
      icon: Activity,
      title: 'Good Progress',
      description: 'Keep up the consistency with your medications',
      metric: `${adherenceRate}%`
    });
  } else {
    insights.push({
      type: 'warning',
      icon: TrendingDown,
      title: 'Needs Attention',
      description: 'Consider setting more reminders to stay on track',
      metric: `${adherenceRate}%`
    });
  }

  // Streak achievement
  if (streak >= 7) {
    insights.push({
      type: 'positive',
      icon: Award,
      title: `${streak} Day Streak!`,
      description: 'Amazing consistency with your health routine',
    });
  }

  // Missed doses warning
  if (missedToday > 0) {
    insights.push({
      type: 'warning',
      icon: AlertCircle,
      title: 'Missed Doses Today',
      description: `${missedToday} of ${totalToday} doses haven't been taken yet`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'neutral',
      icon: Activity,
      title: 'Stay Healthy',
      description: 'Keep tracking your medications for better health insights',
    });
  }

  return (
    <Card className="p-6 border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Health Insights</h3>
        <Activity className="w-5 h-5 text-primary" />
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const colorClasses = {
            positive: 'bg-success/10 text-success border-success/20',
            warning: 'bg-warning/10 text-warning border-warning/20',
            neutral: 'bg-primary/10 text-primary border-primary/20'
          };

          return (
            <div key={index} className="flex gap-3">
              <div className={`w-10 h-10 rounded-lg ${colorClasses[insight.type]} border flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground text-sm">
                    {insight.title}
                  </h4>
                  {insight.metric && (
                    <Badge variant="secondary" className="text-xs">
                      {insight.metric}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {insight.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
