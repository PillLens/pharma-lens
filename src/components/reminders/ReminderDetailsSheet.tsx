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

  const statusChip = getStatusChip(reminder.status);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="text-left pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SheetTitle className="text-lg font-semibold">
                {reminder.medicationName}
              </SheetTitle>
              <Badge variant={statusChip.variant} className="text-xs px-2 py-1 rounded-full">
                {statusChip.label}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Schedule Section */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {t('reminders.details.schedule')}
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {reminder.times.map((time, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-sm px-3 py-2 rounded-xl bg-muted/50 text-foreground border-border/50"
                    >
                      {time}
                    </Badge>
                  ))}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{reminder.dosage}</span>
                  <span className="mx-2">•</span>
                  <span>{reminder.frequency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Frequency Section */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {t('reminders.details.frequency')}
                </h3>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {reminder.frequency}
              </div>
            </CardContent>
          </Card>

          {/* Next Dose */}
          {reminder.nextDose && (
            <Card className="rounded-2xl shadow-sm border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">
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
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">
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
          <div className="pt-4">
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