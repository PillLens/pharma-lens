import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentTimeInTimezone, parseTimeInTimezone, isDoseTime, createScheduledTime } from '@/utils/timezoneUtils';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { medicationAnalyticsService } from '@/services/medicationAnalyticsService';
import { medicationAdherenceService } from '@/services/medicationAdherenceService';
import { scheduledDoseService } from '@/services/scheduledDoseService';

const Reminders: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
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
  const [userTimezone, setUserTimezone] = useState<string | null>(null);
  const [timezoneFetching, setTimezoneFetching] = useState(true);
  const [userMedications, setUserMedications] = useState<any[]>([]);
  const [realAdherenceData, setRealAdherenceData] = useState({
    adherenceRate: 0,
    streak: 0,
    missedDoses: 0,
    weeklyAdherence: [] as any[]
  });
  const [todaysAdherence, setTodaysAdherence] = useState({
    totalToday: 0,
    completedToday: 0,
    pendingToday: 0,
    missedToday: 0
  });

  // Fetch user's timezone from profile
  useEffect(() => {
    const fetchUserTimezone = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('timezone')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user timezone:', error);
        } else {
          setUserTimezone(profile?.timezone || null);
        }
      } catch (error) {
        console.error('Error fetching timezone:', error);
      } finally {
        setTimezoneFetching(false);
      }
    };

    fetchUserTimezone();
  }, [user]);

  // Fetch user medications and real adherence data
  const fetchRealData = async () => {
    if (!user) return;
    
    try {
      // Fetch user medications
      const { data: medications, error: medError } = await supabase
        .from('user_medications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (medError) throw medError;
      setUserMedications(medications || []);

      // Fetch real adherence statistics
      const stats = await medicationAnalyticsService.getOverallStats(user.id);
      const weeklyData = await medicationAnalyticsService.getWeeklyAdherence(user.id);
      
      setRealAdherenceData({
        adherenceRate: stats.averageAdherence,
        streak: stats.currentStreak,
        missedDoses: stats.totalDoses - stats.takenDoses,
        weeklyAdherence: weeklyData
      });

      // Fetch today's actual dose adherence status
      const todayStatus = await scheduledDoseService.getTodaysAdherenceStatus(user.id);
      setTodaysAdherence(todayStatus);
    } catch (error) {
      console.error('Error fetching real medication data:', error);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, [user]);

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

  const handleMarkTaken = async (entryId: string) => {
    try {
      if (!user) return;
      
      // Parse entry ID to get reminder ID and time
      const [reminderId, reminderTime] = entryId.split('-');
      const reminder = reminders.find(r => r.id === reminderId);
      
      if (!reminder) {
        toast({
          title: t('common.error'),
          description: 'Reminder not found',
          variant: 'destructive'
        });
        return;
      }

      // Use the scheduled dose service to properly mark as taken
      const success = await scheduledDoseService.markScheduledDoseAsTaken(
        user.id,
        reminder.medication_id,
        reminderTime,
        'Marked as taken from timeline'
      );

      if (success) {
        // Refresh all data
        await fetchRealData();
        toast({
          title: t('toast.doseTaken'),
          description: t('toast.greatJobStayingOnTrack')
        });
      } else {
        toast({
          title: t('common.error'),
          description: 'Failed to mark dose as taken',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error marking dose as taken:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to mark dose as taken',
        variant: 'destructive'
      });
    }
  };

  const handleSummaryCardTap = (type: 'active' | 'medications' | 'today') => {
    toast({
      title: t('toast.filter'),
      description: t('toast.filteringBy', { type })
    });
  };

  // Calculate summary stats from real data
  const activeReminders = reminders.filter(r => r.is_active).length;
  const medicationsCovered = new Set(reminders.map(r => r.medication?.medication_name).filter(Boolean)).size;

  // Use real adherence data
  const overallAdherenceRate = realAdherenceData.adherenceRate;
  const longestStreak = realAdherenceData.streak;
  const missedDoses = realAdherenceData.missedDoses;
  const weeklyAdherence = realAdherenceData.weeklyAdherence.map(day => ({
    day: day.name,
    rate: day.adherence
  }));

  const { timezone } = useUserTimezone();

  // Create timeline entries from real reminder data with timezone-aware status
  const [timelineEntries, setTimelineEntries] = useState<any[]>([]);
  
  useEffect(() => {
    const buildTimelineEntries = async () => {
      const entries = [];
      for (const r of reminders.filter(r => r.is_active)) {
        const status = await getCurrentTimeStatus(r.reminder_time, timezone, r.id);
        entries.push({
          id: `${r.id}-${r.reminder_time}`,
          time: r.reminder_time,
          medication: r.medication?.medication_name || 'Unknown',
          dosage: r.medication?.dosage || '',
          status,
          color: 'primary' as const
        });
      }
      entries.sort((a, b) => a.time.localeCompare(b.time));
      setTimelineEntries(entries);
    };
    
    if (reminders.length > 0 && timezone) {
      buildTimelineEntries();
    }
  }, [reminders, timezone, realAdherenceData]);

  async function getCurrentTimeStatus(reminderTime: string, timezone: string, reminderId: string): Promise<'upcoming' | 'current' | 'taken' | 'missed' | 'overdue'> {
    try {
      // Use timezone-aware time checking
      const doseCheck = isDoseTime(reminderTime, timezone, 30); // 30 minute window
      
      const reminder = reminders.find(r => r.id === reminderId);
      if (reminder) {
        // Use consistent time construction method
        const scheduledDateTime = createScheduledTime(reminderTime);
        
        // Check adherence log for this specific scheduled time (with some tolerance for exact time matching)
        const timeStart = new Date(scheduledDateTime.getTime() - 30 * 60 * 1000); // 30 minutes before
        const timeEnd = new Date(scheduledDateTime.getTime() + 30 * 60 * 1000); // 30 minutes after
        
        const { data: adherenceLog } = await supabase
          .from('medication_adherence_log')
          .select('*')
          .eq('user_id', user?.id)
          .eq('medication_id', reminder.medication_id)
          .gte('scheduled_time', timeStart.toISOString())
          .lte('scheduled_time', timeEnd.toISOString())
          .eq('status', 'taken');
        
        // If there's a taken entry for this specific time slot, mark as taken
        if (adherenceLog && adherenceLog.length > 0) {
          return 'taken';
        }
      }
      
      if (doseCheck.isCurrent) {
        return 'current';
      } else if (doseCheck.isPast) {
        return 'overdue';
      } else {
        return 'upcoming';
      }
    } catch (error) {
      console.error('Error checking dose time:', error);
      return 'upcoming'; // Fallback to upcoming
    }
  }

  return (
    <ProfessionalMobileLayout title={t('reminders.title')} showHeader={true}>
      {/* Timezone Display */}
      <div className="px-4 py-2 bg-primary/5 text-xs text-muted-foreground text-center border-b border-border/20">
        Timezone: {timezone} | Current time: {getCurrentTimeInTimezone(timezone).toLocaleTimeString()}
      </div>

      {/* Main Content */}
      {loading || timezoneFetching ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Enhanced Summary Dashboard */}
          <div className="pt-4">
          <EnhancedSummaryDashboard
            activeReminders={activeReminders}
            medicationsCovered={medicationsCovered}
            todaysDoses={todaysAdherence.totalToday}
            completedDoses={todaysAdherence.completedToday}
            adherenceRate={overallAdherenceRate}
            streak={longestStreak}
            missedDoses={missedDoses}
            weeklyAdherence={weeklyAdherence}
            todaySchedule={timelineEntries.map(entry => ({
              time: entry.time,
              medication: entry.medication,
              status: entry.status
            }))}
            onCardTap={handleSummaryCardTap}
          />
          </div>

          {/* Interactive Timeline */}
          {timelineEntries.length > 0 && (
            <div className="px-4">
              <InteractiveTimelineCard
                entries={timelineEntries}
                userTimezone={timezone}
                onMarkTaken={handleMarkTaken}
                onSnooze={(entryId) => {
                  toast({
                    title: t('toast.reminderSnoozed'),
                    description: t('toast.remindAgainIn15')
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
                  {t('reminders.timeline.yourReminders')} ({reminders.length})
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
                      daysOfWeek: reminder.days_of_week,
                      notes: '',
                       adherenceRate: overallAdherenceRate, // Use real adherence rate
                       streak: longestStreak, // Use real streak
                       lastTaken: '', // Could be calculated from adherence log
                      dosesToday: [] // Calculate from reminder_time and days_of_week
                    }}
                    onTap={() => handleReminderTap(reminder)}
                    onEdit={() => handleEditReminder(reminder)}
                    onDelete={() => handleDeleteReminder(reminder.id)}
                    onToggleStatus={() => handleToggleReminder(reminder.id)}
                    onMarkTaken={async (time) => {
                      try {
                        if (!user) return;
                        
                        const success = await scheduledDoseService.markScheduledDoseAsTaken(
                          user.id,
                          reminder.medication_id,
                          time,
                          'Marked as taken from reminder card'
                        );
                        
                        if (success) {
                          await fetchRealData();
                          toast({
                            title: t('toast.doseTaken'),
                            description: t('toast.medicationMarkedTaken', { 
                              medication: reminder.medication?.medication_name, 
                              time 
                            })
                          });
                        }
                      } catch (error) {
                        console.error('Error marking dose as taken:', error);
                        toast({
                          title: t('common.error'),
                          description: 'Failed to mark dose as taken',
                          variant: 'destructive'
                        });
                      }
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
        medications={userMedications}
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