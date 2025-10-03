import * as React from 'react';
import { useState, useEffect, memo } from 'react';
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
import { ReminderLimitBanner } from '@/components/reminders/ReminderLimitBanner';
import { TrialExpirationHandler } from '@/components/reminders/TrialExpirationHandler';
import { PaywallSheet } from '@/components/subscription/PaywallSheet';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import ReminderFilters, { ReminderFilterState } from '@/components/reminders/ReminderFilters';
import NotificationStatusIndicator from '@/components/reminders/NotificationStatusIndicator';
import MarkAllTakenButton from '@/components/reminders/MarkAllTakenButton';
import DeleteConfirmDialog from '@/components/reminders/DeleteConfirmDialog';
import LastUpdatedIndicator from '@/components/reminders/LastUpdatedIndicator';
import RemindersLoadingSkeleton from '@/components/reminders/RemindersLoadingSkeleton';
import PullToRefreshWrapper from '@/components/mobile/PullToRefreshWrapper';
import { ReminderErrorBoundary } from '@/components/reminders/ReminderErrorBoundary';
import { OfflineIndicator } from '@/components/reminders/OfflineIndicator';
import { useReminders, ReminderWithMedication } from '@/hooks/useReminders';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSnooze } from '@/hooks/useSnooze';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentTimeInTimezone, parseTimeInTimezone, isDoseTime, createScheduledTime } from '@/utils/timezoneUtils';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { medicationAnalyticsService } from '@/services/medicationAnalyticsService';
import { medicationAdherenceService } from '@/services/medicationAdherenceService';
import { scheduledDoseService } from '@/services/scheduledDoseService';
import { reminderOfflineQueue } from '@/services/reminderOfflineQueue';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

const Reminders: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { 
    reminders, 
    loading, 
    addReminder, 
    updateReminder, 
    deleteReminder, 
    toggleReminderStatus,
    getReminderLimitInfo,
    refetch: fetchReminders
  } = useReminders();
  
  const { isInTrial, trialDaysRemaining, subscription } = useSubscription();
  const { snoozeReminder, getSnoozeState, canSnooze, isSnoozing } = useSnooze();

  // State management
  const [selectedReminder, setSelectedReminder] = useState<ReminderWithMedication | null>(null);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [showReminderDetails, setShowReminderDetails] = useState(false);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string | null>(null);
  const [timezoneFetching, setTimezoneFetching] = useState(true);
  const [userMedications, setUserMedications] = useState<any[]>([]);
  const [filters, setFilters] = useState<ReminderFilterState>({
    searchQuery: '',
    status: 'all',
    sortBy: 'time',
    sortOrder: 'asc',
    timeRange: 'all'
  });
  
  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);
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
  const [limitInfo, setLimitInfo] = useState<any>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showTrialExpiredDialog, setShowTrialExpiredDialog] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; reminder: ReminderWithMedication | null }>({
    isOpen: false,
    reminder: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize offline queue on mount
  useEffect(() => {
    reminderOfflineQueue.initialize();
  }, []);

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

      // Fetch reminder limit info
      const info = await getReminderLimitInfo();
      setLimitInfo(info);
    } catch (error) {
      console.error('Error fetching real medication data:', error);
    }
  };

  useEffect(() => {
    fetchRealData();

    // Check for trial expiration on load - only show if user has more than 1 ACTIVE reminder
    const activeReminders = reminders.filter(r => r.is_active);
    if (user && !isInTrial && subscription.plan === 'free' && activeReminders.length > 1) {
      // Check if user has already handled trial expiration recently
      const handledKey = `trial_handled_${user.id}`;
      const lastHandled = localStorage.getItem(handledKey);
      const now = Date.now();
      
      // Only show dialog if not handled in the last 24 hours
      if (!lastHandled || (now - parseInt(lastHandled)) > 24 * 60 * 60 * 1000) {
        setShowTrialExpiredDialog(true);
      }
    }
  }, [user, isInTrial, subscription.plan, reminders]);

  // Handle reminder actions
  const handleToggleReminder = async (id: string) => {
    await toggleReminderStatus(id);
  };

  const handleDeleteReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    
    setDeleteConfirm({ isOpen: true, reminder });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.reminder) return;
    
    setIsDeleting(true);
    try {
      await deleteReminder(deleteConfirm.reminder.id);
      toast({
        title: t('reminders.messages.reminderDeleted'),
        description: 'Reminder deleted successfully'
      });
      setDeleteConfirm({ isOpen: false, reminder: null });
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to delete reminder',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditReminder = (reminder: ReminderWithMedication) => {
    setSelectedReminder(reminder);
    setEditMode('edit');
    setShowAddReminder(true);
  };

  const handleReminderTap = (reminder: ReminderWithMedication) => {
    setSelectedReminder(reminder);
    setShowReminderDetails(true);
  };

  const handleAddReminder = async (reminderData: any) => {
    // Check limits first using the hook's built-in validation
    const canCreate = await getReminderLimitInfo();
    if (!canCreate?.canCreate) {
      toast({
        title: 'Reminder Limit Reached',
        description: 'You\'ve reached your reminder limit. Upgrade to Pro for unlimited reminders.',
        variant: 'destructive'
      });
      return;
    }

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
        // Comprehensive data refresh to ensure UI consistency
        await Promise.all([
          fetchRealData(),
          fetchReminders()
        ]);
        
        // Force additional refresh after delay for database consistency
        setTimeout(async () => {
          await Promise.all([
            fetchRealData(),
            fetchReminders()
          ]);
        }, 1000);
        
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

  const handleSnooze = async (entryId: string) => {
    try {
      const [reminderId, reminderTime] = entryId.split('-');
      const reminder = reminders.find(r => r.id === reminderId);
      
      if (!reminder) return;

      if (!canSnooze(reminder.medication_id, reminderTime)) {
        toast({
          title: 'Cannot Snooze',
          description: 'Maximum snooze limit reached',
          variant: 'destructive'
        });
        return;
      }

      await snoozeReminder(reminder.medication_id, reminderTime, { minutes: 15, maxSnoozes: 3 });
    } catch (error) {
      console.error('Error snoozing reminder:', error);
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
    <ReminderErrorBoundary>
      <ProfessionalMobileLayout title={t('reminders.title')} showHeader={true}>
        {/* Timezone & Offline Indicator Header */}
        <div className="px-4 py-2 bg-primary/5 text-xs text-muted-foreground text-center border-b border-border/20 flex items-center justify-between">
          <span>Timezone: {timezone} | Current time: {getCurrentTimeInTimezone(timezone).toLocaleTimeString()}</span>
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            {!loading && !timezoneFetching && (
              <MarkAllTakenButton
                pendingDoses={timelineEntries
                  .filter(e => e.status === 'current' || e.status === 'overdue')
                  .map(e => {
                    const [medicationId] = e.id.split('-');
                    return {
                      medicationId,
                      medicationName: e.medication,
                      time: e.time
                    };
                  })}
                onMarkAll={async (doses) => {
                  for (const dose of doses) {
                    await handleMarkTaken(`${dose.medicationId}-${dose.time}`);
                  }
                }}
              />
            )}
          </div>
        </div>

      {/* Main Content */}
      {loading || timezoneFetching ? (
        <RemindersLoadingSkeleton />
      ) : (
        <PullToRefreshWrapper onRefresh={async () => {
          await Promise.all([fetchRealData(), fetchReminders()]);
        }}>
          <div className="space-y-6">
            {/* Last Updated */}
            <LastUpdatedIndicator
              lastUpdated={lastUpdated}
              onRefresh={async () => {
                await Promise.all([fetchRealData(), fetchReminders()]);
              }}
            />

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
            todaySchedule={timelineEntries
              .filter(entry => entry.status !== 'taken') // Filter out taken doses
              .map(entry => ({
                time: entry.time,
                medication: entry.medication,
                status: entry.status
              }))}
            onCardTap={handleSummaryCardTap}
          />
          </div>

          {/* Reminder Limit Banner */}
          {limitInfo && (
            <ReminderLimitBanner
              current={limitInfo.current}
              limit={limitInfo.limit}
              isInTrial={limitInfo.isInTrial}
              trialDays={limitInfo.trialDays}
              onUpgrade={() => setShowUpgrade(true)}
            />
          )}

          {/* Notification Status Indicator */}
          <div className="px-4">
            <NotificationStatusIndicator showTestButton={true} />
          </div>

          {/* Reminder Filters */}
          {reminders.length > 0 && (
            <div className="px-4">
              <ReminderFilters
                filters={filters}
                onFiltersChange={setFilters}
                resultCount={reminders.filter(r => {
                  // Apply search filter
                  if (filters.searchQuery && !r.medication?.medication_name?.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
                    return false;
                  }
                  // Apply status filter
                  if (filters.status !== 'all') {
                    if (filters.status === 'active' && !r.is_active) return false;
                    if (filters.status === 'paused' && r.is_active) return false;
                  }
                  // Apply time range filter
                  if (filters.timeRange === 'today') {
                    const now = getCurrentTimeInTimezone(timezone);
                    const reminderTime = r.reminder_time;
                    // Check if reminder is for today
                    const today = now.getDay();
                    const adjustedToday = today === 0 ? 7 : today;
                    if (!r.days_of_week?.includes(adjustedToday)) return false;
                  }
                  return true;
                }).length}
              />
            </div>
          )}

          {/* Interactive Timeline */}
          {timelineEntries.length > 0 && (
            <div className="px-4">
              <InteractiveTimelineCard
                entries={timelineEntries}
                userTimezone={timezone}
                onMarkTaken={handleMarkTaken}
                onSnooze={handleSnooze}
              />
            </div>
          )}

          {/* Reminders List */}
          <div className="px-4">
            {reminders.length === 0 ? (
              <RemindersEmptyState onAddReminder={() => setShowAddReminder(true)} />
            ) : (
              <RemindersByMedication 
                reminders={reminders}
                timezone={timezone}
                overallAdherenceRate={overallAdherenceRate}
                longestStreak={longestStreak}
                onReminderTap={handleReminderTap}
                onEditReminder={handleEditReminder}
                onDeleteReminder={handleDeleteReminder}
                onToggleReminder={handleToggleReminder}
                onMarkTaken={async (medicationId: string, time: string) => {
                  try {
                    if (!user) return;
                    
                    const success = await scheduledDoseService.markScheduledDoseAsTaken(
                      user.id,
                      medicationId,
                      time,
                      'Marked as taken from reminder card'
                    );
                    
                    if (success) {
                      // Immediate comprehensive refresh
                      await Promise.all([
                        fetchRealData(),
                        fetchReminders()
                      ]);
                      
                      // Force additional refresh for consistency
                      setTimeout(async () => {
                        await Promise.all([
                          fetchRealData(),
                          fetchReminders()
                        ]);
                      }, 1000);
                      
                      const medication = reminders.find(r => r.medication_id === medicationId)?.medication;
                      toast({
                        title: t('toast.doseTaken'),
                        description: t('toast.medicationMarkedTaken', { 
                          medication: medication?.medication_name || 'Medication', 
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
            )}
          </div>
          </div>
        </PullToRefreshWrapper>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, reminder: null })}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        itemName={deleteConfirm.reminder?.medication?.medication_name}
      />

      {/* Floating Action Button */}
      <RemindersFloatingActionButton 
        onClick={async () => {
          const canCreate = await getReminderLimitInfo();
          if (canCreate?.canCreate) {
            setShowAddReminder(true);
          } else {
            setShowUpgrade(true);
          }
        }} 
      />

      {/* Bottom Sheets */}
      <AddReminderSheet
        isOpen={showAddReminder}
        onClose={() => {
          setShowAddReminder(false);
          setEditMode('create');
          setSelectedReminder(null);
        }}
        onSave={handleAddReminder}
        isLoading={isAddingReminder}
        medications={userMedications}
        mode={editMode}
        initialData={selectedReminder && editMode === 'edit' ? {
          medicationId: selectedReminder.medication_id,
          dosage: selectedReminder.medication?.dosage || '',
          frequency: selectedReminder.medication?.frequency || '',
          times: [selectedReminder.reminder_time],
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          notes: '',
          daysOfWeek: selectedReminder.days_of_week || [1, 2, 3, 4, 5, 6, 7]
        } : undefined}
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

        {/* Trial Expiration Handler */}
        <TrialExpirationHandler
          isOpen={showTrialExpiredDialog}
          onClose={() => setShowTrialExpiredDialog(false)}
          onUpgrade={() => {
            setShowTrialExpiredDialog(false);
            setShowUpgrade(true);
          }}
          onSuccess={fetchReminders}
        />

        {/* Upgrade Paywall */}
        <PaywallSheet
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          feature="reminders_limit"
        />
      </ProfessionalMobileLayout>
    </ReminderErrorBoundary>
  );
};

// Component to group reminders by medication and handle dose status
const RemindersByMedication: React.FC<{
  reminders: ReminderWithMedication[];
  timezone: string;
  overallAdherenceRate: number;
  longestStreak: number;
  onReminderTap: (reminder: ReminderWithMedication) => void;
  onEditReminder: (reminder: ReminderWithMedication) => void;
  onDeleteReminder: (id: string) => void;
  onToggleReminder: (id: string) => void;
  onMarkTaken: (medicationId: string, time: string) => Promise<void>;
}> = ({
  reminders,
  timezone,
  overallAdherenceRate,
  longestStreak,
  onReminderTap,
  onEditReminder,
  onDeleteReminder,
  onToggleReminder,
  onMarkTaken
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [medicationDoseStatus, setMedicationDoseStatus] = useState<{[key: string]: {time: string; taken: boolean}[]}>({});

  // Group reminders by medication
  const groupedReminders = reminders.reduce((acc, reminder) => {
    const medicationId = reminder.medication_id;
    if (!acc[medicationId]) {
      acc[medicationId] = [];
    }
    acc[medicationId].push(reminder);
    return acc;
  }, {} as {[key: string]: ReminderWithMedication[]});

  // Fetch today's dose status for each medication
  useEffect(() => {
    const fetchDoseStatus = async () => {
      if (!user) return;
      
      console.log('Fetching dose status for medications...');
      const statusMap: {[key: string]: {time: string; taken: boolean}[]} = {};
      
      for (const medicationId of Object.keys(groupedReminders)) {
        try {
          const medicationReminders = groupedReminders[medicationId];
          const today = format(getCurrentTimeInTimezone(timezone), 'yyyy-MM-dd');
          
          // Get all times for this medication
          const allTimes = medicationReminders.map(r => r.reminder_time);
          
          console.log(`Fetching adherence for medication ${medicationId} on ${today}`);
          console.log('All times for this medication:', allTimes);
          
          // Query adherence log for today's doses
          const { data: adherenceLog, error } = await supabase
            .from('medication_adherence_log')
            .select('*')
            .eq('user_id', user.id)
            .eq('medication_id', medicationId)
            .gte('scheduled_time', `${today}T00:00:00`)
            .lt('scheduled_time', `${today}T23:59:59`)
            .eq('status', 'taken');

          if (error) {
            console.error('Error fetching adherence log:', error);
            throw error;
          }

          console.log('Adherence log entries found:', adherenceLog);

              // Create dose status array with timezone-aware time matching
              const doseStatus = allTimes.map(time => {
                console.log(`Checking time ${time} for taken status...`);
                
                const taken = adherenceLog?.some(log => {
                  // Convert UTC scheduled_time to user's timezone for comparison
                  const logDate = new Date(log.scheduled_time);
                  const logInUserTz = toZonedTime(logDate, timezone);
                  
                  // Extract time in HH:mm format from the timezone-adjusted date
                  const logTimeHHMM = `${logInUserTz.getHours().toString().padStart(2, '0')}:${logInUserTz.getMinutes().toString().padStart(2, '0')}`;
                  
                  // Normalize reminder time to HH:mm format
                  const reminderTimeHHMM = time.includes(':') ? time.substring(0, 5) : time;
                  
                  console.log(`  Comparing reminder time "${reminderTimeHHMM}" with log time "${logTimeHHMM}"`);
                  console.log(`  Log entry scheduled_time:`, log.scheduled_time);
                  console.log(`  Log date in user timezone:`, logInUserTz.toLocaleString());
                  
                  // Allow 2-minute tolerance for time matching to handle small discrepancies
                  const reminderMinutes = parseInt(reminderTimeHHMM.split(':')[0]) * 60 + parseInt(reminderTimeHHMM.split(':')[1]);
                  const logMinutes = parseInt(logTimeHHMM.split(':')[0]) * 60 + parseInt(logTimeHHMM.split(':')[1]);
                  const timeDiff = Math.abs(reminderMinutes - logMinutes);
                  
                  const matches = timeDiff <= 2; // 2-minute tolerance
                  
                  if (matches) {
                    console.log(`  ✓ Match found! Time difference: ${timeDiff} minutes`);
                  }
                  
                  return matches;
                }) || false;
                
                console.log(`  Final result for ${time}: taken = ${taken}`);
                return { time, taken };
              });

          console.log(`Dose status for medication ${medicationId}:`, doseStatus);
          statusMap[medicationId] = doseStatus;
        } catch (error) {
          console.error(`Error fetching dose status for medication ${medicationId}:`, error);
          // Fallback: mark all doses as not taken
          const medicationReminders = groupedReminders[medicationId];
          statusMap[medicationId] = medicationReminders.map(r => ({ time: r.reminder_time, taken: false }));
        }
      }
      
      setMedicationDoseStatus(statusMap);
    };

    fetchDoseStatus();
    
    // Also listen for medication data changes to refresh dose status
    const handleMedicationDataChange = () => {
      console.log('Medication data changed, refreshing dose status...');
      setTimeout(() => fetchDoseStatus(), 500);
    };
    
    window.addEventListener('medicationDataChanged', handleMedicationDataChange);
    
    return () => {
      window.removeEventListener('medicationDataChanged', handleMedicationDataChange);
    };
  }, [reminders, user, timezone]);

  return (
    <div className="space-y-3">
      <h2 className="font-medium text-foreground flex items-center gap-2 mb-4">
        <Bell className="w-4 h-4" />
        {t('reminders.timeline.yourReminders')} ({Object.keys(groupedReminders).length})
      </h2>
      {Object.entries(groupedReminders).map(([medicationId, medicationReminders]) => {
        const firstReminder = medicationReminders[0];
        const allTimes = medicationReminders.map(r => r.reminder_time).sort();
        const daysOfWeek = firstReminder.days_of_week;
        const isActive = medicationReminders.some(r => r.is_active);
        const dosesToday = medicationDoseStatus[medicationId] || [];
        
        return (
          <EnhancedReminderCard
            key={medicationId}
            reminder={{
              id: firstReminder.id,
              medicationName: firstReminder.medication?.medication_name || 'Unknown',
              dosage: firstReminder.medication?.dosage || '',
              frequency: firstReminder.medication?.frequency || '',
              times: allTimes,
              status: isActive ? 'active' : 'paused',
              nextDose: '',
              daysOfWeek: daysOfWeek,
              notes: '',
              adherenceRate: overallAdherenceRate,
              streak: longestStreak,
              lastTaken: '',
              dosesToday: dosesToday
            }}
            onTap={() => onReminderTap(firstReminder)}
            onEdit={() => onEditReminder(firstReminder)}
            onDelete={() => onDeleteReminder(firstReminder.id)}
            onToggleStatus={() => onToggleReminder(firstReminder.id)}
            onMarkTaken={async (time: string) => {
              // Immediately update local state for instant UI feedback
              setMedicationDoseStatus(prev => {
                const currentStatus = prev[medicationId] || [];
                const updatedStatus = currentStatus.map(dose => 
                  dose.time === time ? { ...dose, taken: true } : dose
                );
                return {
                  ...prev,
                  [medicationId]: updatedStatus
                };
              });
              
              // Then call the actual mark taken function
              await onMarkTaken(medicationId, time);
              
              // Force refresh of dose status immediately and after delay
              const refreshDoseStatus = async () => {
                const { data: adherenceLog } = await supabase
                  .from('medication_adherence_log')
                  .select('*')
                  .eq('user_id', user?.id)
                  .eq('medication_id', medicationId)
                  .gte('scheduled_time', `${format(getCurrentTimeInTimezone(timezone), 'yyyy-MM-dd')}T00:00:00`)
                  .lt('scheduled_time', `${format(getCurrentTimeInTimezone(timezone), 'yyyy-MM-dd')}T23:59:59`)
                  .eq('status', 'taken');
                
                const allTimes = medicationReminders.map(r => r.reminder_time);
                const updatedDoseStatus = allTimes.map(timeSlot => {
                  const taken = adherenceLog?.some(log => {
                    // Convert UTC scheduled_time to user's timezone for comparison
                    const logDate = new Date(log.scheduled_time);
                    const logInUserTz = toZonedTime(logDate, timezone);
                    
                    // Extract time in HH:mm format from the timezone-adjusted date
                    const logTimeHHMM = `${logInUserTz.getHours().toString().padStart(2, '0')}:${logInUserTz.getMinutes().toString().padStart(2, '0')}`;
                    const reminderTimeHHMM = timeSlot.includes(':') ? timeSlot.substring(0, 5) : timeSlot;
                    
                    // Allow 2-minute tolerance for time matching
                    const reminderMinutes = parseInt(reminderTimeHHMM.split(':')[0]) * 60 + parseInt(reminderTimeHHMM.split(':')[1]);
                    const logMinutes = parseInt(logTimeHHMM.split(':')[0]) * 60 + parseInt(logTimeHHMM.split(':')[1]);
                    const timeDiff = Math.abs(reminderMinutes - logMinutes);
                    
                    return timeDiff <= 2; // 2-minute tolerance
                  }) || false;
                  return { time: timeSlot, taken };
                });
                
                setMedicationDoseStatus(prev => ({
                  ...prev,
                  [medicationId]: updatedDoseStatus
                }));
              };
              
              // Refresh immediately and then again after a delay for consistency
              await refreshDoseStatus();
              setTimeout(refreshDoseStatus, 1500);
            }}
          />
        );
      })}
    </div>
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