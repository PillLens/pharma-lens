import React, { useState, useEffect } from 'react';
import { Clock, Edit, Trash2, MoreVertical, CheckCircle2, Circle, Bell, Pill, Calendar, Timer, Target, TrendingUp, Pause, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
import { getCurrentTimeInTimezone } from '@/utils/timezoneUtils';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { calculateNextDose, formatTimeUntilNext } from '@/utils/nextDoseCalculator';
import { useLongPress } from '@/hooks/useLongPress';
import { hapticService } from '@/services/hapticService';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface EnhancedReminderCardProps {
  reminder: {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    times: string[];
    status: 'active' | 'paused';
    nextDose?: string;
    notes?: string;
    adherenceRate?: number;
    streak?: number;
    lastTaken?: string;
    daysOfWeek?: number[];
    dosesToday?: { time: string; taken: boolean }[];
  };
  onTap: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onMarkTaken?: (time: string) => void;
}

const EnhancedReminderCard: React.FC<EnhancedReminderCardProps> = ({
  reminder,
  onTap,
  onEdit,
  onDelete,
  onToggleStatus,
  onMarkTaken
}) => {
  const { t } = useTranslation();
  const { timezone } = useUserTimezone();
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(() => getCurrentTimeInTimezone(timezone));
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Long press handler for quick actions
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      setShowQuickActions(true);
      hapticService.impact('medium');
    },
    onClick: () => onTap(),
    delay: 500,
    haptic: true
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimeInTimezone(timezone));
    }, 60000);
    return () => clearInterval(timer);
  }, [timezone]);

  // Calculate time until next dose using the new calculator
  useEffect(() => {
    const calculateTimeUntilNext = () => {
      if (reminder.times.length === 0) return '';
      
      // Find the next untaken dose
      const currentTimeStr = new Date().toTimeString().slice(0, 5);
      const dosesToday = reminder.dosesToday || [];
      
      // Find next untaken dose today
      const nextUntakenToday = reminder.times.find(time => {
        const doseStatus = dosesToday.find(d => d.time === time);
        const isNotTaken = !doseStatus?.taken;
        const isInFuture = time > currentTimeStr;
        return isNotTaken && isInFuture;
      });
      
      if (nextUntakenToday) {
        // Calculate time until next untaken dose today
        const nextDose = calculateNextDose(nextUntakenToday, reminder.daysOfWeek || [1, 2, 3, 4, 5, 6, 7], timezone);
        if (nextDose) {
          return formatTimeUntilNext(nextDose.minutesUntil);
        }
      }
      
      // If no untaken doses today, find next dose tomorrow
      const firstTimeToday = reminder.times[0];
      const daysOfWeek = reminder.daysOfWeek || [1, 2, 3, 4, 5, 6, 7];
      const nextDose = calculateNextDose(firstTimeToday, daysOfWeek, timezone);
      
      if (nextDose) {
        return formatTimeUntilNext(nextDose.minutesUntil);
      }
      
      return '';
    };

    setTimeUntilNext(calculateTimeUntilNext());
  }, [reminder.times, reminder.daysOfWeek, reminder.dosesToday, currentTime, timezone]);

  const getStatusVariant = (status: 'active' | 'paused') => {
    return status === 'active' 
      ? { variant: 'default' as const, label: t('reminders.status.active') }
      : { variant: 'secondary' as const, label: t('reminders.status.paused') };
  };

  const getCardVariant = () => {
    if (reminder.status === 'paused') return 'opacity-60';
    
    const now = new Date().toTimeString().slice(0, 5);
    const hasOverdue = reminder.times.some(time => time < now);
    
    if (hasOverdue) return 'ring-2 ring-warning/50 bg-warning/5';
    return 'bg-gradient-to-br from-card to-primary/5';
  };

  const statusInfo = getStatusVariant(reminder.status);
  const adherenceRate = reminder.adherenceRate || 85;
  const streak = reminder.streak || 0;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card 
          className={`rounded-3xl border-0 shadow-sm transition-all duration-300 hover:shadow-lg active:scale-[0.98] cursor-pointer max-w-sm mx-auto ${getCardVariant()}`}
          {...longPressHandlers}
        >
      <CardContent className="p-3">
        {/* Header with medication info */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="mb-1">
                  <h3 className="font-bold text-foreground text-lg leading-tight mb-2">
                    {reminder.medicationName}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusInfo.variant} className="text-xs px-3 py-1 rounded-full font-medium">
                    {statusInfo.label}
                  </Badge>
                  {reminder.times.length > 1 && (
                    <Badge variant="outline" className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border-blue-200">
                      {reminder.times.length}x daily
                    </Badge>
                  )}
                  {streak > 0 && (
                    <Badge variant="outline" className="text-xs px-2 py-1 rounded-full bg-success/10 text-success border-success/20">
                      🔥 {streak} days
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-full opacity-60 hover:opacity-100 hover:bg-primary/10"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit className="w-4 h-4 mr-3" />
                {t('reminders.actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}>
                <Clock className="w-4 h-4 mr-3" />
                {reminder.status === 'active' ? t('reminders.actions.pause') : t('reminders.actions.activate')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                {t('reminders.actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Medication details */}
        <div className="space-y-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
            <span className="text-muted-foreground font-medium">Dosage & Frequency</span>
            <div className="text-left sm:text-right">
              <div className="font-semibold text-foreground text-base">{reminder.dosage}</div>
              <div className="text-muted-foreground text-sm hidden">{reminder.frequency}</div>
            </div>
          </div>

          {/* Adherence Progress */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
              <span className="text-muted-foreground flex items-center gap-2 font-medium">
                <Target className="w-4 h-4" />
                Adherence Rate
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-base">{adherenceRate}%</span>
                <TrendingUp className="w-3 h-3 text-success" />
              </div>
            </div>
            <Progress value={adherenceRate} className="h-2 bg-muted/50" />
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Today's Schedule</span>
            </div>
            {reminder.times.length > 1 && (
              <span className="text-xs text-muted-foreground">
                {reminder.times.length} doses
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {reminder.times.map((time, index) => {
              const currentTimeStr = new Date().toTimeString().slice(0, 5);
              const dosesToday = reminder.dosesToday || [];
              const doseStatus = dosesToday.find(d => d.time === time);
              const isTaken = doseStatus?.taken || false;
              const isPast = time < currentTimeStr;
              const isCurrent = Math.abs(new Date(`1970-01-01T${time}:00`).getTime() - new Date(`1970-01-01T${currentTimeStr}:00`).getTime()) < 30 * 60 * 1000;
              
              console.log(`Rendering dose ${time} for ${reminder.medicationName}:`, {
                dosesToday,
                doseStatus, 
                isTaken,
                isPast,
                isCurrent,
                currentTimeStr
              });
              
              // Show taken doses with a different visual state but don't hide them completely
              const isRecentlyTaken = isTaken;
              
              const getDoseLabel = (time: string, totalTimes: number) => {
                if (totalTimes === 1) return '';
                
                const [hours] = time.split(':').map(Number);
                
                if (hours >= 5 && hours < 12) return 'Morning';
                if (hours >= 12 && hours < 17) return 'Afternoon';
                if (hours >= 17 && hours < 21) return 'Evening';
                if (hours >= 21 || hours < 5) return 'Night';
                
                return `Dose ${reminder.times.indexOf(time) + 1}`;
              };
              
              const doseLabel = getDoseLabel(time, reminder.times.length);
              
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                    isRecentlyTaken
                      ? 'bg-success/20 text-success border border-success/30 opacity-60'
                      : isCurrent 
                        ? 'bg-primary text-primary-foreground shadow-md animate-pulse' 
                        : isPast 
                          ? 'bg-warning/10 text-warning border border-warning/20' 
                          : 'bg-muted/50 text-foreground border border-border/50'
                  }`}
                  onClick={() => {
                    if (onMarkTaken && (isCurrent || isPast) && !isRecentlyTaken) {
                      onMarkTaken(time);
                    }
                  }}
                >
                  {isRecentlyTaken ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isCurrent || isPast ? (
                    <Circle className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">{time}</span>
                    {doseLabel && (
                      <span className="text-xs opacity-75">{doseLabel}</span>
                    )}
                  </div>
                  {isRecentlyTaken ? (
                    <span className="ml-auto text-xs text-success font-medium">✓ Taken</span>
                  ) : (isCurrent || isPast) && onMarkTaken && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkTaken(time);
                      }}
                    >
                      Take Now
                    </Button>
                  )}
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>

        {/* Next dose countdown */}
        {reminder.status === 'active' && timeUntilNext && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-primary/10 to-primary-light/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Timer className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Next dose in</div>
                <div className="text-xs text-muted-foreground">Stay on track!</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{timeUntilNext}</div>
              <div className="text-xs text-muted-foreground">remaining</div>
            </div>
          </div>
        )}

        {/* Paused state message */}
        {reminder.status === 'paused' && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 text-muted-foreground">
            <Bell className="w-5 h-5" />
            <div className="text-sm">
              Reminder paused - tap to reactivate
            </div>
          </div>
        )}
      </CardContent>
    </Card>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 rounded-2xl">
        <ContextMenuItem 
          onClick={(e) => { 
            e.stopPropagation(); 
            onEdit(); 
            hapticService.buttonPress();
          }}
          className="cursor-pointer"
        >
          <Edit className="w-4 h-4 mr-3" />
          {t('reminders.actions.edit')}
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={(e) => { 
            e.stopPropagation(); 
            onToggleStatus(); 
            hapticService.buttonPress();
          }}
          className="cursor-pointer"
        >
          {reminder.status === 'active' ? (
            <>
              <Pause className="w-4 h-4 mr-3" />
              {t('reminders.actions.pause')}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-3" />
              {t('reminders.actions.activate')}
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={(e) => { 
            e.stopPropagation(); 
            onDelete(); 
            hapticService.impact('light');
          }}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <Trash2 className="w-4 h-4 mr-3" />
          {t('reminders.actions.delete')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default EnhancedReminderCard;