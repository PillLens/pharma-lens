import React from 'react';
import { Clock, Bell, BellOff, Edit2, Trash2, MoreVertical, Calendar, Pill, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { TranslatedText } from '@/components/TranslatedText';

interface ReminderData {
  id: string;
  medicationName: string;
  time: string;
  daysOfWeek: number[];
  isActive: boolean;
  notificationSettings: {
    sound: boolean;
    vibration: boolean;
    led: boolean;
  };
  nextNotification?: Date;
}

interface MobileReminderCardProps {
  reminder: ReminderData;
  onEdit: (reminder: ReminderData) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  className?: string;
}

const MobileReminderCard: React.FC<MobileReminderCardProps> = ({
  reminder,
  onEdit,
  onDelete,
  onToggle,
  className
}) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDays = (days: number[]) => {
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Weekdays';
    if (days.length === 2 && days.includes(6) && days.includes(7)) return 'Weekends';
    
    return days.map(d => dayNames[d - 1]).join(', ');
  };

  const getTimeUntilNext = () => {
    if (!reminder.nextNotification || !reminder.isActive) return null;
    
    const now = new Date();
    const next = new Date(reminder.nextNotification);
    const diffMs = next.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Overdue';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours === 0) {
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    }
  };

  const timeUntilNext = getTimeUntilNext();
  const isUpcoming = timeUntilNext && timeUntilNext !== 'Overdue';
  const isOverdue = timeUntilNext === 'Overdue';

  const getCardVariant = () => {
    if (!reminder.isActive) return 'outline';
    if (isOverdue) return 'critical';
    if (isUpcoming) return 'info';
    return 'default';
  };

  return (
    <MobileCard 
      variant={getCardVariant() as any}
      className={cn(
        'transition-all duration-200 hover:shadow-card',
        !reminder.isActive && 'opacity-75',
        className
      )}
    >
      <MobileCardHeader className="pb-1">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center shadow-soft',
                reminder.isActive 
                  ? 'bg-gradient-to-br from-warning to-warning/80' 
                  : 'bg-muted'
              )}>
                <Bell className={cn(
                  'w-3.5 h-3.5',
                  reminder.isActive ? 'text-white' : 'text-muted-foreground'
                )} />
              </div>
              
              <Badge 
                variant={reminder.isActive ? 'default' : 'secondary'}
                className="text-xs font-medium px-2 py-0.5"
              >
                {reminder.isActive ? (
                  <TranslatedText translationKey="reminder.active" fallback="Active" />
                ) : (
                  <TranslatedText translationKey="reminder.inactive" fallback="Inactive" />
                )}
              </Badge>

              {isUpcoming && (
                <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                  <Clock className="w-3 h-3 mr-0.5" />
                  {timeUntilNext}
                </Badge>
              )}

              {isOverdue && (
                <Badge variant="destructive" className="text-xs font-medium animate-pulse px-2 py-0.5">
                  <Clock className="w-3 h-3 mr-0.5" />
                  <TranslatedText translationKey="reminder.overdue" fallback="Overdue" />
                </Badge>
              )}
            </div>

            <MobileCardTitle className="text-sm mb-0.5 line-clamp-1 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              {reminder.medicationName}
            </MobileCardTitle>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className="font-medium">{formatTime(reminder.time)}</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDays(reminder.daysOfWeek)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={reminder.isActive}
              onCheckedChange={(checked) => onToggle(reminder.id, checked)}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <MobileButton
                  variant="ghost"
                  size="sm"
                  className="p-1.5 h-6 w-6"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </MobileButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={() => onEdit(reminder)}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <TranslatedText translationKey="common.edit" fallback="Edit" />
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(reminder.id)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  <TranslatedText translationKey="common.delete" fallback="Delete" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </MobileCardHeader>

      <MobileCardContent>
        <div className="space-y-2">
          {/* Notification Settings */}
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground">
              <TranslatedText translationKey="reminder.notifications" fallback="Notifications:" />
            </div>
            <div className="flex items-center gap-2">
              {reminder.notificationSettings.sound && (
                <div className="flex items-center gap-1 text-xs text-success">
                  <Volume2 className="w-3 h-3" />
                  <TranslatedText translationKey="reminder.sound" fallback="Sound" />
                </div>
              )}
              {reminder.notificationSettings.vibration && (
                <div className="flex items-center gap-1 text-xs text-info">
                  <Bell className="w-3 h-3" />
                  <TranslatedText translationKey="reminder.vibration" fallback="Vibration" />
                </div>
              )}
            </div>
          </div>

          {/* Next Notification */}
          {reminder.isActive && reminder.nextNotification && (
            <div className="p-2 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    <TranslatedText translationKey="reminder.nextReminder" fallback="Next reminder" />
                  </span>
                </div>
                <div className="text-sm text-primary font-medium">
                  {timeUntilNext && timeUntilNext !== 'Overdue' ? (
                    <TranslatedText 
                      translationKey="reminder.inTime" 
                      fallback={`in ${timeUntilNext}`} 
                    />
                  ) : isOverdue ? (
                    <span className="text-destructive">
                      <TranslatedText translationKey="reminder.overdue" fallback="Overdue" />
                    </span>
                  ) : (
                    <TranslatedText translationKey="reminder.today" fallback="Today" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Inactive State */}
          {!reminder.isActive && (
            <div className="p-2 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BellOff className="w-3.5 h-3.5" />
                <TranslatedText 
                  translationKey="reminder.pausedMessage" 
                  fallback="This reminder is currently paused" 
                />
              </div>
            </div>
          )}
        </div>
      </MobileCardContent>
    </MobileCard>
  );
};

export default MobileReminderCard;