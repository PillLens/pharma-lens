import { useRef, useState, useEffect } from 'react';
import EnhancedReminderCard from './enhanced/EnhancedReminderCard';
import { ReminderWithMedication } from '@/hooks/useReminders';

interface VirtualizedReminderListProps {
  reminders: ReminderWithMedication[];
  onReminderTap: (reminder: ReminderWithMedication) => void;
  onEditReminder: (reminder: ReminderWithMedication) => void;
  onDeleteReminder: (id: string) => void;
  onToggleReminder: (id: string) => void;
  onMarkTaken?: (medicationId: string, time: string) => void;
  itemHeight?: number;
  overscan?: number;
}

/**
 * Virtualized list component for rendering large numbers of reminders efficiently
 * Only renders items that are visible in the viewport
 */
export const VirtualizedReminderList = ({
  reminders,
  onReminderTap,
  onEditReminder,
  onDeleteReminder,
  onToggleReminder,
  onMarkTaken,
  itemHeight = 300, // Approximate height of a reminder card
  overscan = 3 // Number of items to render outside viewport
}: VirtualizedReminderListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Update container height on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Handle scroll event
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Calculate which items should be visible
  const totalHeight = reminders.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    reminders.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleReminders = reminders.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  // If list is small, don't use virtualization
  if (reminders.length < 10) {
    return (
      <div className="space-y-4">
        {reminders.map((reminder) => (
          <EnhancedReminderCard
            key={reminder.id}
            reminder={{
              id: reminder.id,
              medicationName: reminder.medication?.medication_name || 'Unknown',
              dosage: reminder.medication?.dosage || '',
              frequency: reminder.medication?.frequency || '',
              times: [reminder.reminder_time],
              status: reminder.is_active ? 'active' : 'paused',
              daysOfWeek: reminder.days_of_week || [1, 2, 3, 4, 5, 6, 7]
            }}
            onTap={() => onReminderTap(reminder)}
            onEdit={() => onEditReminder(reminder)}
            onDelete={() => onDeleteReminder(reminder.id)}
            onToggleStatus={() => onToggleReminder(reminder.id)}
            onMarkTaken={(time) => onMarkTaken?.(reminder.medication_id, time)}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto"
      style={{ position: 'relative' }}
    >
      {/* Spacer for total height */}
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`
          }}
          className="space-y-4"
        >
          {visibleReminders.map((reminder) => (
            <EnhancedReminderCard
              key={reminder.id}
              reminder={{
                id: reminder.id,
                medicationName: reminder.medication?.medication_name || 'Unknown',
                dosage: reminder.medication?.dosage || '',
                frequency: reminder.medication?.frequency || '',
                times: [reminder.reminder_time],
                status: reminder.is_active ? 'active' : 'paused',
                daysOfWeek: reminder.days_of_week || [1, 2, 3, 4, 5, 6, 7]
              }}
              onTap={() => onReminderTap(reminder)}
              onEdit={() => onEditReminder(reminder)}
              onDelete={() => onDeleteReminder(reminder.id)}
              onToggleStatus={() => onToggleReminder(reminder.id)}
              onMarkTaken={(time) => onMarkTaken?.(reminder.medication_id, time)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};