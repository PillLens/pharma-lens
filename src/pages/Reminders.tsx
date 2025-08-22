import React, { useState } from 'react';
import { Plus, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import RemindersEmptyState from '@/components/reminders/RemindersEmptyState';
import EnhancedSummaryDashboard from '@/components/reminders/enhanced/EnhancedSummaryDashboard';
import EnhancedReminderCard from '@/components/reminders/enhanced/EnhancedReminderCard';
import InteractiveTimelineCard from '@/components/reminders/enhanced/InteractiveTimelineCard';
import ReminderDetailsSheet from '@/components/reminders/ReminderDetailsSheet';
import AddReminderSheet from '@/components/reminders/AddReminderSheet';
import RemindersFloatingActionButton from '@/components/reminders/RemindersFloatingActionButton';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import { useReminders, ReminderWithMedication } from '@/hooks/useReminders';

// Mock medications for the add reminder sheet - replace with real data
const mockMedications = [
  { id: '1', name: 'Amoxicillin' },
  { id: '2', name: 'Ibuprofen' },
  { id: '3', name: 'Metformin' },
  { id: '4', name: 'Lisinopril' }
];

const Reminders: React.FC = () => {
  const { t } = useTranslation();
  const { 
    reminders, 
    loading, 
    addReminder, 
    updateReminder, 
    deleteReminder, 
    toggleReminderStatus 
  } = useReminders();

  // State management
  const [selectedReminder, setSelectedReminder] = useState<ReminderWithMedication | null>(null);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showReminderDetails, setShowReminderDetails] = useState(false);
  const [isAddingReminder, setIsAddingReminder] = useState(false);

  // Handle reminder actions
  const handleToggleReminder = async (id: string) => {
    await toggleReminderStatus(id);
  };

  const handleDeleteReminder = async (id: string) => {
    await deleteReminder(id);
    toast({
      title: t('reminders.messages.reminderDeleted'),
      description: 'Reminder deleted successfully'
    });
  };

  const handleEditReminder = (reminder: ReminderWithMedication) => {
    setSelectedReminder(reminder);
    setShowReminderDetails(true);
  };

  const handleReminderTap = (reminder: ReminderWithMedication) => {
    setSelectedReminder(reminder);
    setShowReminderDetails(true);
  };

  const handleAddReminder = async (reminderData: any) => {
    try {
      setIsAddingReminder(true);
      
      const result = await addReminder({
        medication_id: reminderData.medicationId,
        reminder_time: reminderData.times[0], // Take first time
        days_of_week: [1, 2, 3, 4, 5, 6, 7], // Default to all days
        notification_settings: {
          sound: true,
          vibration: true,
          led: true
        }
      });

      if (result) {
        setShowAddReminder(false);
        toast({
          title: t('reminders.messages.reminderAdded'),
          description: 'Reminder added successfully'
        });
      }
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to add reminder',
        variant: 'destructive'
      });
    } finally {
      setIsAddingReminder(false);
    }
  };

  const handleSummaryCardTap = (type: 'active' | 'medications' | 'today') => {
    toast({
      title: 'Filter',
      description: `Filtering by ${type}`
    });
  };

  // Calculate summary stats from real data
  const activeReminders = reminders.filter(r => r.is_active).length;
  const medicationsCovered = new Set(reminders.map(r => r.medication?.medication_name).filter(Boolean)).size;
  const todaysDoses = reminders.filter(r => r.is_active).length; // Simplified calculation

  // Mock data for advanced stats (replace with real calculations)
  const overallAdherenceRate = 85;
  const longestStreak = 7;
  const missedDoses = 2;
  const weeklyAdherence = [
    { day: 'Mon', rate: 95 },
    { day: 'Tue', rate: 88 },
    { day: 'Wed', rate: 92 },
    { day: 'Thu', rate: 85 },
    { day: 'Fri', rate: 96 },
    { day: 'Sat', rate: 89 },
    { day: 'Sun', rate: 93 }
  ];

  // Create timeline entries from real reminder data
  const timelineEntries = reminders
    .filter(r => r.is_active)
    .map(r => ({
      id: `${r.id}-${r.reminder_time}`,
      time: r.reminder_time,
      medication: r.medication?.medication_name || 'Unknown',
      dosage: r.medication?.dosage || '',
      status: getCurrentTimeStatus(r.reminder_time),
      color: 'primary' as const
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  function getCurrentTimeStatus(time: string): 'upcoming' | 'current' | 'taken' | 'missed' {
    const currentTime = new Date().toTimeString().slice(0, 5);
    const timeDiff = new Date(`1970-01-01T${time}:00`).getTime() - new Date(`1970-01-01T${currentTime}:00`).getTime();
    if (Math.abs(timeDiff) < 30 * 60 * 1000) return 'current'; // Within 30 minutes
    if (timeDiff < 0) return Math.random() > 0.3 ? 'taken' : 'missed'; // Past time
    return 'upcoming'; // Future time
  }

  return (
    <ProfessionalMobileLayout title={t('reminders.title')} showHeader={true}>
      {/* Main Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Enhanced Summary Dashboard */}
          <div className="pt-4">
            <EnhancedSummaryDashboard
              activeReminders={activeReminders}
              medicationsCovered={medicationsCovered}
              todaysDoses={todaysDoses}
              adherenceRate={overallAdherenceRate}
              streak={longestStreak}
              missedDoses={missedDoses}
              weeklyAdherence={weeklyAdherence}
              onCardTap={handleSummaryCardTap}
            />
          </div>

          {/* Interactive Timeline */}
          {timelineEntries.length > 0 && (
            <div className="px-4">
              <InteractiveTimelineCard
                entries={timelineEntries}
                onMarkTaken={(entryId) => {
                  toast({
                    title: 'Dose Marked as Taken',
                    description: 'Great job staying on track! 🎉'
                  });
                }}
                onSnooze={(entryId) => {
                  toast({
                    title: 'Reminder Snoozed',
                    description: "We'll remind you again in 15 minutes"
                  });
                }}
              />
            </div>
          )}

          {/* Reminders List */}
          <div className="px-4">
            {reminders.length === 0 ? (
              <RemindersEmptyState onAddReminder={() => setShowAddReminder(true)} />
            ) : (
              <div className="space-y-3">
                <h2 className="font-medium text-foreground flex items-center gap-2 mb-4">
                  <Bell className="w-4 h-4" />
                  Your Reminders ({reminders.length})
                </h2>
                {reminders.map(reminder => (
                  <EnhancedReminderCard
                    key={reminder.id}
                    reminder={{
                      id: reminder.id,
                      medicationName: reminder.medication?.medication_name || 'Unknown',
                      dosage: reminder.medication?.dosage || '',
                      frequency: reminder.medication?.frequency || '',
                      times: [reminder.reminder_time],
                      status: reminder.is_active ? 'active' : 'paused',
                      nextDose: '', // Calculate based on reminder_time and days_of_week
                      notes: '',
                      adherenceRate: 85, // Calculate from adherence log
                      streak: 7, // Calculate from adherence log
                      lastTaken: '', // Get from adherence log
                      dosesToday: [] // Calculate from reminder_time and days_of_week
                    }}
                    onTap={() => handleReminderTap(reminder)}
                    onEdit={() => handleEditReminder(reminder)}
                    onDelete={() => handleDeleteReminder(reminder.id)}
                    onToggleStatus={() => handleToggleReminder(reminder.id)}
                    onMarkTaken={(time) => {
                      toast({
                        title: 'Dose Marked as Taken',
                        description: `${reminder.medication?.medication_name} at ${time} marked as taken`
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <RemindersFloatingActionButton onClick={() => setShowAddReminder(true)} />

      {/* Bottom Sheets */}
      <AddReminderSheet
        isOpen={showAddReminder}
        onClose={() => setShowAddReminder(false)}
        onSave={handleAddReminder}
        isLoading={isAddingReminder}
        medications={mockMedications}
      />

      <ReminderDetailsSheet
        reminder={selectedReminder ? {
          id: selectedReminder.id,
          medicationName: selectedReminder.medication?.medication_name || 'Unknown',
          dosage: selectedReminder.medication?.dosage || '',
          frequency: selectedReminder.medication?.frequency || '',
          times: [selectedReminder.reminder_time],
          status: selectedReminder.is_active ? 'active' : 'paused',
          nextDose: '',
          notes: ''
        } : null}
        isOpen={showReminderDetails}
        onClose={() => setShowReminderDetails(false)}
        onEdit={() => {
          setShowReminderDetails(false);
          setShowAddReminder(true);
        }}
      />
    </ProfessionalMobileLayout>
  );
};

// Loading Skeleton Component
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Summary Cards Skeleton */}
    <div className="grid grid-cols-3 gap-3 px-4 pt-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl bg-card p-4">
          <div className="space-y-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Reminders List Skeleton */}
    <div className="px-4 space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl bg-card p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-12 rounded-full" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Reminders;