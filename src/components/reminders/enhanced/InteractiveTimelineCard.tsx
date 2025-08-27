import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Circle, AlertCircle, Bell, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getCurrentTimeInTimezone } from '@/utils/timezoneUtils';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { useTranslation } from '@/hooks/useTranslation';

interface TimelineEntry {
  id: string;
  time: string;
  medication: string;
  dosage: string;
  status: 'upcoming' | 'current' | 'taken' | 'missed' | 'overdue';
  color: string;
}

interface InteractiveTimelineCardProps {
  entries: TimelineEntry[];
  userTimezone?: string;
  onMarkTaken?: (entryId: string) => void;
  onSnooze?: (entryId: string) => void;
}

const InteractiveTimelineCard: React.FC<InteractiveTimelineCardProps> = ({
  entries,
  userTimezone,
  onMarkTaken,
  onSnooze
}) => {
  const { t } = useTranslation();
  const { timezone: currentUserTimezone } = useUserTimezone();
  const effectiveTimezone = userTimezone || currentUserTimezone;
  const [currentTime, setCurrentTime] = useState(() => getCurrentTimeInTimezone(effectiveTimezone));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimeInTimezone(effectiveTimezone));
    }, 60000);
    return () => clearInterval(timer);
  }, [effectiveTimezone]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'missed':
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'current':
        return <Bell className="w-5 h-5 text-primary animate-pulse" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return 'bg-success/10 border-success/20';
      case 'missed':
      case 'overdue':
        return 'bg-destructive/10 border-destructive/20';
      case 'current':
        return 'bg-primary/10 border-primary/20 ring-2 ring-primary/30';
      default:
        return 'bg-muted/30 border-border';
    }
  };

  const completedCount = entries.filter(e => e.status === 'taken').length;
  const completionRate = (completedCount / entries.length) * 100;

  return (
    <Card className="rounded-3xl border-0 bg-gradient-to-br from-card to-primary/5 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">{t('reminders.timeline.todaysTimeline')}</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} {t('reminders.timeline.of')} {entries.length} {t('reminders.timeline.dosesCompleted')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{Math.round(completionRate)}%</div>
            <div className="text-xs text-muted-foreground">{t('reminders.timeline.progress')}</div>
          </div>
        </div>

        <Progress value={completionRate} className="mb-6 h-2" />

        <div className="space-y-0 divide-y divide-border/20">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 py-4 px-2 hover:bg-muted/30 transition-colors duration-200"
            >
              {/* Status icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                entry.status === 'taken' ? 'bg-success/20 text-success' :
                entry.status === 'current' ? 'bg-primary/20 text-primary' :
                entry.status === 'missed' || entry.status === 'overdue' ? 'bg-destructive/20 text-destructive' :
                'bg-muted/50 text-muted-foreground'
              }`}>
                {getStatusIcon(entry.status)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">
                        {entry.medication}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {entry.dosage}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {entry.time}
                    </div>
                  </div>
                  
                  {/* Action buttons for current/upcoming entries */}
                  {(entry.status === 'current' || entry.status === 'upcoming') && (
                    <div className="flex gap-2">
                      {entry.status === 'current' && (
                        <>
                          <button
                            onClick={() => onSnooze?.(entry.id)}
                            className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/50 hover:bg-muted/70 rounded-full transition-colors"
                          >
                            {t('reminders.timeline.snooze')}
                          </button>
                          <button
                            onClick={() => onMarkTaken?.(entry.id)}
                            className="px-3 py-1 text-xs font-medium text-success bg-success/10 hover:bg-success/20 rounded-full transition-colors"
                          >
                            {t('reminders.timeline.markTaken')}
                          </button>
                        </>
                      )}
                      {entry.status === 'upcoming' && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick stats at bottom */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/20">
          <div className="text-center">
            <div className="text-lg font-bold text-success">{entries.filter(e => e.status === 'taken').length}</div>
            <div className="text-xs text-muted-foreground">{t('reminders.timeline.taken')}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{entries.filter(e => e.status === 'upcoming').length}</div>
            <div className="text-xs text-muted-foreground">{t('reminders.timeline.upcoming')}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-destructive">{entries.filter(e => e.status === 'missed' || e.status === 'overdue').length}</div>
            <div className="text-xs text-muted-foreground">{t('reminders.timeline.missed')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveTimelineCard;