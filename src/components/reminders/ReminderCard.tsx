import React from 'react';
import { Clock, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';

interface ReminderCardProps {
  reminder: {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    times: string[];
    status: 'active' | 'paused';
    nextDose?: string;
  };
  onTap: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onTap,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const { t } = useTranslation();

  const getStatusChip = (status: 'active' | 'paused') => {
    return status === 'active' 
      ? { variant: 'default' as const, label: t('reminders.status.active') }
      : { variant: 'secondary' as const, label: t('reminders.status.paused') };
  };

  const statusChip = getStatusChip(reminder.status);

  return (
    <Card 
      className="rounded-2xl shadow-sm border-0 bg-card transition-all duration-200 active:scale-[0.98] cursor-pointer"
      onClick={onTap}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-foreground text-base">
                {reminder.medicationName}
              </h3>
              <Badge variant={statusChip.variant} className="text-xs px-2 py-1 rounded-full">
                {statusChip.label}
              </Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit className="w-4 h-4 mr-2" />
                {t('reminders.actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}>
                <Clock className="w-4 h-4 mr-2" />
                {reminder.status === 'active' ? t('reminders.actions.pause') : t('reminders.actions.activate')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('reminders.actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Body */}
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{reminder.dosage}</span>
            <span className="mx-2">•</span>
            <span>{reminder.frequency}</span>
          </div>

          {/* Times */}
          <div className="flex flex-wrap gap-2">
            {reminder.times.map((time, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs px-3 py-1 rounded-full bg-muted/50 text-foreground border-border/50"
              >
                {time}
              </Badge>
            ))}
          </div>

          {/* Next dose */}
          {reminder.nextDose && (
            <div className="flex items-center gap-2 pt-2 border-t border-border/20">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Next dose: <span className="font-medium text-foreground">{reminder.nextDose}</span>
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReminderCard;