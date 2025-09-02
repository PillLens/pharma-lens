import React from 'react';
import { Clock, Calendar, Edit, Bell, FileText } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

interface ReminderDetailsSheetProps {
  reminder: {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    times: string[];
    status: 'active' | 'paused';
    nextDose?: string;
    notes?: string;
    schedule?: string[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const ReminderDetailsSheet: React.FC<ReminderDetailsSheetProps> = ({
  reminder,
  isOpen,
  onClose,
  onEdit
}) => {
  const { t } = useTranslation();

  if (!reminder) return null;

  const getStatusChip = (status: 'active' | 'paused') => {
    return status === 'active' 
      ? { variant: 'default' as const, label: t('reminders.status.active') }
      : { variant: 'secondary' as const, label: t('reminders.status.paused') };
  };

  // Format time to remove seconds and make it user-friendly
  const formatTime = (time: string) => {
    if (time.includes(':')) {
      const parts = time.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return time;
  };

  // Convert raw frequency to user-friendly text
  const formatFrequency = (frequency: string) => {
    const frequencyMap: { [key: string]: string } = {
      'once_daily': 'Once daily',
      'twice_daily': '2x daily', 
      'three_times_daily': '3x daily',
      'four_times_daily': '4x daily',
      'weekly': 'Weekly',
      'as_needed': 'As needed'
    };
    return frequencyMap[frequency] || frequency;
  };

  const statusChip = getStatusChip(reminder.status);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="text-left pb-6">
          <SheetTitle className="text-lg font-semibold">
            {reminder.medicationName}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Schedule Section */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-foreground">
                    {t('reminders.details.schedule')}
                  </h3>
                </div>
                <Badge variant={statusChip.variant} className="text-xs px-2 py-1 rounded-full">
                  {statusChip.label}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {reminder.times.map((time, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-sm px-3 py-1.5 rounded-lg bg-muted/50 text-foreground border-border/50 font-mono"
                      >
                        {formatTime(time)}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">{formatFrequency(reminder.frequency)}</span>
                </div>
                
                <div className="text-sm font-medium text-foreground">
                  {reminder.dosage}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Dose */}
          {reminder.nextDose && (
            <Card className="rounded-2xl shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="font-medium text-foreground">
                    {t('reminders.details.nextDose')}
                  </h3>
                </div>
                
                <div className="text-sm font-medium text-foreground">
                  {reminder.nextDose}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {reminder.notes && (
            <Card className="rounded-2xl shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-foreground">
                    {t('reminders.details.notes')}
                  </h3>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {reminder.notes}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Button */}
          <div className="pt-2">
            <Button 
              onClick={onEdit}
              size="lg"
              className="w-full rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Edit className="w-4 h-4 mr-2" />
              {t('reminders.details.editButton')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReminderDetailsSheet;