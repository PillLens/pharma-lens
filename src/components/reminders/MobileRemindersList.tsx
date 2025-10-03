import { useState } from "react";
import EnhancedReminderCard from "./enhanced/EnhancedReminderCard";
import { ReminderWithMedication } from "@/hooks/useReminders";
import { useSwipeable } from "react-swipeable";
import { hapticService } from "@/services/hapticService";
import { Trash2, Edit, Pause, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileRemindersListProps {
  reminders: ReminderWithMedication[];
  onReminderTap: (reminder: ReminderWithMedication) => void;
  onEditReminder: (reminder: ReminderWithMedication) => void;
  onDeleteReminder: (id: string) => void;
  onToggleReminder: (id: string) => void;
  onMarkTaken?: (medicationId: string, time: string) => void;
  onSelect?: (id: string) => void;
  selectedIds?: Set<string>;
  selectionMode?: boolean;
}

export const MobileRemindersList = ({
  reminders,
  onReminderTap,
  onEditReminder,
  onDeleteReminder,
  onToggleReminder,
  onMarkTaken,
  onSelect,
  selectedIds = new Set(),
  selectionMode = false
}: MobileRemindersListProps) => {
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const handleSwipeLeft = (id: string) => {
    hapticService.impact('light');
    setSwipedId(id === swipedId ? null : id);
  };

  const handleSwipeRight = (id: string) => {
    setSwipedId(null);
  };

  const handleAction = (action: () => void) => {
    setSwipedId(null);
    setTimeout(action, 100);
  };

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => {
        const isSwipedOpen = swipedId === reminder.id;
        const isSelected = selectedIds.has(reminder.id);

        const handlers = useSwipeable({
          onSwipedLeft: () => handleSwipeLeft(reminder.id),
          onSwipedRight: () => handleSwipeRight(reminder.id),
          trackMouse: false,
          delta: 50,
          preventScrollOnSwipe: true
        });

        return (
          <div key={reminder.id} className="relative overflow-hidden">
            {/* Hidden Action Buttons Behind Card */}
            {isSwipedOpen && (
              <div className="absolute top-0 right-0 bottom-0 flex items-center gap-2 pr-4 z-0 animate-fade-in">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleAction(() => onEditReminder(reminder))}
                  className="h-12 w-12 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
                >
                  <Edit className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleAction(() => onToggleReminder(reminder.id))}
                  className="h-12 w-12 rounded-full bg-warning/10 hover:bg-warning/20 text-warning"
                >
                  {reminder.is_active ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleAction(() => onDeleteReminder(reminder.id))}
                  className="h-12 w-12 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Main Card with Swipe */}
            <div
              {...handlers}
              className={`relative transition-transform duration-300 ease-out ${
                isSwipedOpen ? '-translate-x-[180px]' : 'translate-x-0'
              }`}
              style={{
                touchAction: 'pan-y' // Allow vertical scrolling
              }}
            >
              {/* Selection Mode Overlay */}
              {selectionMode && (
                <div
                  className="absolute top-4 left-4 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(reminder.id);
                    hapticService.buttonPress();
                  }}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-card border-border'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </div>
                </div>
              )}

              {/* Enhanced Card */}
              <EnhancedReminderCard
                reminder={{
                  id: reminder.id,
                  medicationName: reminder.medication?.medication_name || 'Unknown',
                  dosage: reminder.medication?.dosage || '',
                  frequency: reminder.medication?.frequency || '',
                  times: [reminder.reminder_time],
                  status: reminder.is_active ? 'active' : 'paused',
                  daysOfWeek: reminder.days_of_week || [1, 2, 3, 4, 5, 6, 7]
                }}
                onTap={() => {
                  if (selectionMode) {
                    onSelect?.(reminder.id);
                    hapticService.buttonPress();
                  } else {
                    onReminderTap(reminder);
                  }
                }}
                onEdit={() => onEditReminder(reminder)}
                onDelete={() => onDeleteReminder(reminder.id)}
                onToggleStatus={() => onToggleReminder(reminder.id)}
                onMarkTaken={(time) => {
                  if (onMarkTaken) {
                    onMarkTaken(reminder.medication_id, time);
                    hapticService.impact('medium');
                  }
                }}
              />
            </div>

            {/* Swipe Indicator */}
            {isSwipedOpen && (
              <div className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground animate-fade-in z-0">
                ← Swipe
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};