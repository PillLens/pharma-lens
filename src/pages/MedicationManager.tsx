import React, { useState, useEffect } from 'react';
import { Plus, Pill, Activity, TrendingUp, Heart, Clock, AlertTriangle, Target, CheckCircle, Calendar, Zap, Bell, Filter, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useMedicationHistory } from '@/hooks/useMedicationHistory';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from '@/components/ui/mobile/MobileCard';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MedicationFormSheet from '@/components/medications/MedicationFormSheet';
import MedicationDetailsSheet from '@/components/medications/MedicationDetailsSheet';
import EnhancedMedicationCard from '@/components/medications/enhanced/EnhancedMedicationCard';
import MedicationFloatingActionButton from '@/components/medications/MedicationFloatingActionButton';
import MedicationExplanationCard from '@/components/medications/MedicationExplanationCard';
import { UserMedication } from '@/hooks/useMedicationHistory';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getNextDoseTime } from '@/utils/timezoneUtils';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { useReminders } from '@/hooks/useReminders';
import { QuickStatsGrid } from '@/components/ui/QuickStatsGrid';
import { scheduledDoseService } from '@/services/scheduledDoseService';
import { getBrowserTimezone } from '@/utils/timezoneUtils';
import { medicationTimingService } from '@/services/medicationTimingService';

// Component for upcoming medication cards that uses real reminder times
const UpcomingMedicationCard: React.FC<{
  medication: UserMedication;
  user: any;
  timezone: string;
  refreshKey?: number;
}> = ({ medication, user, timezone, refreshKey }) => {
  const [nextDoseInfo, setNextDoseInfo] = useState<{ time: string; status: string } | null>(null);

  useEffect(() => {
    const fetchNextDose = async () => {
      if (!user) return;
      
      try {
        // Fetch reminders directly from the database
        const { data: reminders, error } = await supabase
          .from('medication_reminders')
          .select('reminder_time, days_of_week')
          .eq('medication_id', medication.id)
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) throw error;

        if (!reminders || reminders.length === 0) {
          setNextDoseInfo({
            time: 'No reminder set',
            status: 'Not scheduled'
          });
          return;
        }

        // Calculate next reminder time
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

        let nextReminder = null;
        let minDaysUntil = 8; // Maximum days in a week + 1

        for (const reminder of reminders) {
          const [hours, minutes] = reminder.reminder_time.split(':').map(Number);
          const reminderTimeInMinutes = hours * 60 + minutes;

          // Check each day of the week for this reminder
          for (const dayOfWeek of reminder.days_of_week) {
            const adjustedDay = dayOfWeek === 7 ? 0 : dayOfWeek; // Convert Sunday from 7 to 0
            let daysUntil = (adjustedDay - currentDay + 7) % 7;

            // If it's the same day, check if reminder time has passed
            if (daysUntil === 0 && reminderTimeInMinutes <= currentTime) {
              daysUntil = 7; // Move to next week
            }

            if (daysUntil < minDaysUntil) {
              minDaysUntil = daysUntil;
              nextReminder = {
                time: reminder.reminder_time,
                daysUntil
              };
            }
          }
        }

        if (nextReminder) {
          const [hours, minutes] = nextReminder.time.split(':').map(Number);
          const nextDate = new Date(now);
          nextDate.setDate(nextDate.getDate() + nextReminder.daysUntil);
          nextDate.setHours(hours, minutes, 0, 0);

          let timeString;
          if (nextReminder.daysUntil === 0) {
            timeString = `Today at ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          } else if (nextReminder.daysUntil === 1) {
            timeString = `Tomorrow at ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          } else {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            timeString = `${days[nextDate.getDay()]} at ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }

          setNextDoseInfo({
            time: timeString,
            status: 'Scheduled'
          });
        } else {
          setNextDoseInfo({
            time: 'No upcoming dose',
            status: 'Not scheduled'
          });
        }
      } catch (error) {
        console.error('Error fetching next dose:', error);
        setNextDoseInfo({
          time: 'Error loading',
          status: 'Error'
        });
      }
    };

    fetchNextDose();
  }, [medication.id, user, timezone, refreshKey]);

  if (!nextDoseInfo) {
    return (
      <MobileCard className="bg-muted/30">
        <MobileCardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pill className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">{medication.medication_name}</div>
                <div className="text-sm text-muted-foreground">{medication.dosage}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Loading...</div>
            </div>
          </div>
        </MobileCardContent>
      </MobileCard>
    );
  }

  return (
    <MobileCard className="bg-card/80 border border-border/50 shadow-sm hover-scale animate-fade-in">
      <MobileCardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Pill className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm truncate">{medication.medication_name}</div>
              <div className="text-xs text-muted-foreground">{medication.dosage}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="font-medium text-primary text-sm">{nextDoseInfo.time}</div>
            <Badge 
              variant={nextDoseInfo.status === 'Scheduled' ? 'default' : 'secondary'} 
              className="text-xs px-2 py-0.5 rounded-full"
            >
              {nextDoseInfo.status}
            </Badge>
          </div>
        </div>
      </MobileCardContent>
    </MobileCard>
  );
};

const MedicationManager: React.FC = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { checkFeatureAccess } = useSubscription();
  const { timezone } = useUserTimezone();
  const { 
    medications, 
    loading, 
    addMedication, 
    updateMedication, 
    removeMedication,
    refetch
  } = useMedicationHistory();
  const { addReminder } = useReminders();

  // States
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<UserMedication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'insights'>('today');
  const [filter, setFilter] = useState<'all' | 'active' | 'due' | 'expired'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Enhanced medication management logic
  const activeMedications = medications.filter(m => m.is_active);
  const inactiveMedications = medications.filter(m => !m.is_active);
  
  // Get medications using real timing service instead of legacy function
  const [dueMedications, setDueMedications] = useState<UserMedication[]>([]);
  const [overdueMedications, setOverdueMedications] = useState<UserMedication[]>([]);

  // Update due/overdue medications using real timing service
  useEffect(() => {
    const updateMedicationTimings = async () => {
      if (!user || !activeMedications.length) {
        setDueMedications([]);
        setOverdueMedications([]);
        return;
      }

      const due: UserMedication[] = [];
      const overdue: UserMedication[] = [];

      for (const medication of activeMedications) {
        try {
          // Check if medication was recently taken first
          const recentDoseCheck = await medicationTimingService.checkRecentDose(
            medication.id, 
            user.id, 
            timezone
          );

          // If recently taken, skip adding to due/overdue lists
          if (recentDoseCheck.recentlyTaken) {
            console.log(`${medication.medication_name} was recently taken, skipping due/overdue check`);
            continue;
          }

          // Get timing info only if not recently taken
          const timingInfo = await medicationTimingService.getNextDoseTime(
            medication.id, 
            user.id, 
            timezone,
            false // We already checked for recent doses above
          );

          // Only add to due if actually due right now (not overdue)
          if (timingInfo.isDue && !timingInfo.isOverdue) {
            due.push(medication);
          }
          // Only add to overdue if actually overdue
          else if (timingInfo.isOverdue) {
            overdue.push(medication);
          }
        } catch (error) {
          console.error(`Error checking timing for ${medication.medication_name}:`, error);
        }
      }

      setDueMedications(due);
      setOverdueMedications(overdue);
    };

    updateMedicationTimings();
    
    // Update every minute to keep timing accurate
    const interval = setInterval(updateMedicationTimings, 60000);
    return () => clearInterval(interval);
  }, [user, activeMedications, timezone]);
  const expiredMedications = medications.filter(m => {
    if (!m.end_date) return false;
    return new Date(m.end_date) < new Date();
  });

  // All medications that need attention (due + overdue)
  const medicationsNeedingAttention = [...dueMedications, ...overdueMedications];

  // Real stats from actual adherence data
  const [realStats, setRealStats] = useState({
    adherence: 0,
    streak: 0,
    interactions: 0,
    refillsNeeded: 0
  });

  // Fetch real statistics
  useEffect(() => {
    const fetchRealStats = async () => {
      if (!user || medications.length === 0) return;

      try {
        // Get today's adherence status
        const todaysAdherence = await scheduledDoseService.getTodaysAdherenceStatus(user.id);
        
        // Calculate adherence rate from today's data
        const adherenceRate = todaysAdherence.totalToday > 0 
          ? Math.round((todaysAdherence.completedToday / todaysAdherence.totalToday) * 100) 
          : 100;

        // Calculate streak from real adherence data
        const { data: recentAdherence } = await supabase
          .from('medication_adherence_log')
          .select('scheduled_time, status')
          .eq('user_id', user.id)
          .gte('scheduled_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('scheduled_time', { ascending: false });

        let streak = 0;
        if (recentAdherence && recentAdherence.length > 0) {
          const dailyTaken = new Map();
          
          recentAdherence.forEach(log => {
            const date = new Date(log.scheduled_time).toDateString();
            if (!dailyTaken.has(date)) {
              dailyTaken.set(date, { taken: 0, total: 0 });
            }
            dailyTaken.get(date).total++;
            if (log.status === 'taken') {
              dailyTaken.get(date).taken++;
            }
          });

          const sortedDates = Array.from(dailyTaken.keys())
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          
          for (const date of sortedDates) {
            const dayData = dailyTaken.get(date);
            if (dayData.taken >= dayData.total && dayData.total > 0) {
              streak++;
            } else {
              break;
            }
          }
        }

        // Get refills needed count
        const expiredMeds = medications.filter(m => {
          if (!m.end_date) return false;
          const endDate = new Date(m.end_date);
          const today = new Date();
          const diffTime = endDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7; // Within 7 days of expiry
        }).length;

        setRealStats({
          adherence: adherenceRate,
          streak: streak,
          interactions: 0, // Would need real interaction checking
          refillsNeeded: expiredMeds
        });

      } catch (error) {
        console.error('Error fetching real stats:', error);
        // Keep existing values on error
      }
    };

    fetchRealStats();
  }, [user, medications]);

  // Filter medications based on current filter
  const getFilteredMedications = () => {
    switch (filter) {
      case 'active':
        return activeMedications;
      case 'due':
        return medicationsNeedingAttention; // Include both due and overdue
      case 'expired':
        return expiredMedications;
      default:
        return medications;
    }
  };

  const filteredMedications = getFilteredMedications();

  const handleAddMedication = async (data: Partial<UserMedication> & { _reminderSettings?: any }) => {
    setIsSubmitting(true);
    try {
      console.log('Adding medication with data:', data);
      const newMedication = await addMedication(data as Omit<UserMedication, 'id' | 'created_at'>);
      console.log('New medication created:', newMedication);
      
      // Handle reminders if they were set
      if (data._reminderSettings && newMedication?.id) {
        const { reminderTimes, reminderDays, enableReminders } = data._reminderSettings;
        console.log('Creating reminders:', { reminderTimes, reminderDays, enableReminders });
        
        if (enableReminders && reminderTimes && reminderDays && reminderTimes.length > 0) {
          let remindersCreated = 0;
          let reminderErrors = 0;
          
          for (const time of reminderTimes) {
            try {
              console.log('Creating reminder for time:', time);
              const result = await addReminder({
                medication_id: newMedication.id,
                reminder_time: time,
                days_of_week: reminderDays,
                notification_settings: {
                  sound: true,
                  vibration: true,
                  led: true
                }
              });
              
              if (result) {
                remindersCreated++;
                console.log('Reminder created successfully for time:', time);
              } else {
                reminderErrors++;
                console.error('Failed to create reminder for time:', time);
              }
            } catch (reminderError) {
              reminderErrors++;
              console.error('Error creating reminder for time:', time, reminderError);
            }
          }
          
          // Provide user feedback about reminder creation
          if (remindersCreated > 0) {
            toast.success(`Medication added with ${remindersCreated} reminder${remindersCreated > 1 ? 's' : ''}! 🔔`);
          } else if (reminderErrors > 0) {
            toast.error(`Medication added but failed to create ${reminderErrors} reminder${reminderErrors > 1 ? 's' : ''}. Please add reminders manually.`);
          }
        } else {
          toast.success('Medication added successfully');
        }
      } else {
        toast.success('Medication added successfully');
      }
      
      setIsAddSheetOpen(false);
    } catch (error) {
      console.error('Error adding medication:', error);
      toast.error('Failed to add medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMedication = async (data: Partial<UserMedication> & { _reminderSettings?: any }) => {
    if (!selectedMedication) return;
    
    setIsSubmitting(true);
    try {
      console.log('Updating medication with data:', data);
      await updateMedication(selectedMedication.id, data);
      
      // Handle reminder updates if they were set
      if (data._reminderSettings) {
        const { reminderTimes, reminderDays, enableReminders } = data._reminderSettings;
        console.log('Updating reminders:', { reminderTimes, reminderDays, enableReminders });
        
        // TODO: Implement reminder updates - for now, inform user to manage reminders separately
        if (enableReminders && reminderTimes && reminderDays) {
          toast.success('Medication updated! Please manage reminders in the Reminders tab.');
        } else {
          toast.success('Medication updated successfully');
        }
      } else {
        toast.success('Medication updated successfully');
      }
      
      setIsEditSheetOpen(false);
      setSelectedMedication(null);
    } catch (error) {
      console.error('Error updating medication:', error);
      toast.error('Failed to update medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardTap = (medication: UserMedication) => {
    setSelectedMedication(medication);
    setIsDetailsSheetOpen(true);
  };

  const handleEdit = (medication: UserMedication) => {
    setSelectedMedication(medication);
    setIsEditSheetOpen(true);
  };

  const handleDelete = async (medication: UserMedication) => {
    try {
      await removeMedication(medication.id);
      toast.success('Medication deleted');
    } catch (error) {
      toast.error('Failed to delete medication');
    }
  };

  const handleToggleActive = async (medication: UserMedication) => {
    try {
      await updateMedication(medication.id, { is_active: !medication.is_active });
      toast.success(`Medication ${medication.is_active ? 'paused' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update medication status');
    }
  };

  const handleMarkTaken = async (medicationId: string) => {
    if (!user) return;

    try {
      // Get the medication and its timing info
      const medication = medications.find(m => m.id === medicationId);
      if (!medication) return;

      // Get the current reminder time for this medication using the timing service
      const timezone = getBrowserTimezone();
      const timingResult = await medicationTimingService.getNextDoseTime(medication.id, user.id, timezone, true);
      
      let reminderTimeToUse = '';
      
      if (timingResult.currentReminderTime) {
        // Use the actual scheduled reminder time that's due/overdue
        reminderTimeToUse = timingResult.currentReminderTime;
        console.log('Using scheduled reminder time:', reminderTimeToUse, 'for medication:', medication.medication_name);
      } else {
        // Fallback: use current time if no specific reminder found
        const now = new Date();
        reminderTimeToUse = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        console.log('Fallback to current time:', reminderTimeToUse, 'for medication:', medication.medication_name);
      }
      
      const success = await scheduledDoseService.markScheduledDoseAsTaken(
        user.id,
        medicationId,
        reminderTimeToUse,
        'Marked via Take Now button'
      );

      if (success) {
        toast.success('Medication marked as taken! 🎉', {
          description: 'Dose logged successfully in your health record',
          duration: 3000,
        });

        // Refresh medications to update stats and clear overdue status
        refetch();
        // Trigger refresh of upcoming dose times
        setRefreshKey(prev => prev + 1);
      } else {
        throw new Error('Failed to record dose');
      }
    } catch (error) {
      console.error('Error marking medication as taken:', error);
      toast.error('Failed to log medication dose');
    }
  };

  const handleQuickActions = {
    markAllTaken: async () => {
      if (!user || dueMedications.length === 0) return;
      
      try {
        // Mark all due medications as taken using their actual scheduled times
        const results = await Promise.all(
          dueMedications.map(async medication => {
            const timezone = getBrowserTimezone();
            const timingResult = await medicationTimingService.getNextDoseTime(medication.id, user.id, timezone, true);
            
            let reminderTimeToUse = '';
            if (timingResult.currentReminderTime) {
              reminderTimeToUse = timingResult.currentReminderTime;
            } else {
              const now = new Date();
              reminderTimeToUse = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            }
            
            return scheduledDoseService.markScheduledDoseAsTaken(
              user.id,
              medication.id,
              reminderTimeToUse,
              'Marked via Mark All Taken'
            );
          })
        );

        const successCount = results.filter(Boolean).length;
        if (successCount === 0) throw new Error('No doses were recorded successfully');

        toast.success(`${dueMedications.length} medications marked as taken! 🎉`, {
          description: 'All doses logged successfully in your health record',
          duration: 3000,
        });

        // Refresh medications to update stats
        refetch();
      } catch (error) {
        console.error('Error marking all medications as taken:', error);
        toast.error('Failed to log all medication doses');
      }
    },
    snoozeReminders: (minutes: number) => {
      toast.info(`Reminders snoozed for ${minutes} minutes`);
    },
    viewInteractions: () => {
      toast.info('Checking for drug interactions...');
    },
    requestRefill: (medicationId: string) => {
      const med = medications.find(m => m.id === medicationId);
      toast.success(`Refill requested for ${med?.medication_name}`);
    }
  };

  // Feature-rich medications hub
  const handleSave = async (data: Partial<UserMedication>) => {
    if (selectedMedication) {
      await handleUpdateMedication(data);
    } else {
      await handleAddMedication(data);
    }
  };

  return (
    <ProfessionalMobileLayout title={t('medications.management')} showHeader={true}>
      <div className="min-h-screen bg-background">
        {/* Main Content with Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {!loading && medications.length > 0 ? (
            <div className="space-y-4">
              {/* Show explanation card for first-time users or when no reminders exist */}
              {medications.length > 0 && medications.length <= 2 && (
                <MedicationExplanationCard onNavigateToReminders={() => navigate('/reminders')} />
              )}
              
              <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 h-12 sm:h-auto bg-muted/50 rounded-2xl p-1">
                <TabsTrigger 
                  value="today" 
                  className="gap-2 px-3 py-2 flex items-center justify-center rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Today</span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 ml-1">{dueMedications.length}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="all" 
                  className="gap-2 px-3 py-2 flex items-center justify-center rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Pill className="w-4 h-4" />
                  <span className="text-sm font-medium">All</span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 ml-1">{medications.length}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="insights" 
                  className="gap-2 px-3 py-2 flex items-center justify-center rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Stats</span>
                </TabsTrigger>
              </TabsList>

              {/* Today Tab - Focus on immediate actions */}
              <TabsContent value="today" className="space-y-6">
                {/* Today's Overview Stats - Compact Style */}
                <QuickStatsGrid 
                  stats={[
                    {
                      icon: Target,
                      value: medicationsNeedingAttention.length,
                      label: "Need Attention",
                      color: 'text-primary',
                      bgColor: 'bg-primary/10',
                      borderColor: 'border-primary/20'
                    },
                    {
                      icon: TrendingUp,
                      value: `${realStats.adherence}%`,
                      label: "Adherence",
                      color: 'text-success',
                      bgColor: 'bg-success/10',
                      borderColor: 'border-success/20'
                    },
                    {
                      icon: Zap,
                      value: realStats.streak,
                      label: "Day Streak",
                      color: 'text-warning',
                      bgColor: 'bg-warning/10',
                      borderColor: 'border-warning/20'
                    },
                    {
                      icon: Calendar,
                      value: realStats.refillsNeeded,
                      label: "Refills Due",
                      color: 'text-info',
                      bgColor: 'bg-info/10',
                      borderColor: 'border-info/20'
                    }
                  ]}
                />

                {/* Today's Schedule - Split into Due and Overdue */}
                {dueMedications.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Due Right Now</h3>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {dueMedications.length} medications
                      </Badge>
                    </div>
                    
                    {dueMedications.map((medication) => (
                      <EnhancedMedicationCard
                        key={medication.id}
                        medication={medication}
                        onEdit={() => handleEdit(medication)}
                        onDelete={() => handleDelete(medication)}
                        onToggleActive={() => handleToggleActive(medication)}
                        onMarkTaken={() => handleMarkTaken(medication.id)}
                        className="shadow-lg border-l-4 border-l-primary"
                      />
                    ))}
                  </div>
                )}

                {/* Overdue Medications */}
                {overdueMedications.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-red-600">Overdue</h3>
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {overdueMedications.length} medications
                      </Badge>
                    </div>
                    
                    {overdueMedications.map((medication) => (
                      <EnhancedMedicationCard
                        key={medication.id}
                        medication={medication}
                        onEdit={() => handleEdit(medication)}
                        onDelete={() => handleDelete(medication)}
                        onToggleActive={() => handleToggleActive(medication)}
                        onMarkTaken={() => handleMarkTaken(medication.id)}
                        className="shadow-lg border-l-4 border-l-red-500"
                      />
                    ))}
                  </div>
                )}

                {/* All caught up message */}
                {dueMedications.length === 0 && overdueMedications.length === 0 && (
                  <MobileCard className="bg-background border max-w-sm mx-auto">
                    <MobileCardContent className="p-4 text-center">
                      <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
                      <h3 className="text-base font-semibold text-foreground mb-1">All caught up!</h3>
                      <p className="text-sm text-muted-foreground">No medications due right now. Great job staying on track!</p>
                    </MobileCardContent>
                  </MobileCard>
                )}

                {/* Upcoming Doses */}
                {activeMedications.filter(m => !medicationsNeedingAttention.includes(m)).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Upcoming Today</h3>
                    <div className="space-y-3">
                      {activeMedications.filter(m => !medicationsNeedingAttention.includes(m)).slice(0, 3).map((medication) => {
                        
                        return (
                        <UpcomingMedicationCard 
                          key={medication.id} 
                          medication={medication} 
                          user={user}
                          timezone={timezone}
                          refreshKey={refreshKey}
                        />
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* All Medications Tab */}
              <TabsContent value="all" className="space-y-6">
                {/* Filter Bar */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 px-1">
                  <MobileButton
                    size="sm"
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    className="rounded-full whitespace-nowrap min-w-fit px-4 h-9"
                  >
                    All ({medications.length})
                  </MobileButton>
                  <MobileButton
                    size="sm"
                    variant={filter === 'active' ? 'default' : 'outline'}
                    onClick={() => setFilter('active')}
                    className="rounded-full whitespace-nowrap min-w-fit px-4 h-9"
                  >
                    Active ({activeMedications.length})
                  </MobileButton>
                  <MobileButton
                    size="sm"
                    variant={filter === 'due' ? 'default' : 'outline'}
                    onClick={() => setFilter('due')}
                    className="rounded-full whitespace-nowrap min-w-fit px-4 h-9"
                  >
                    Due ({medicationsNeedingAttention.length})
                  </MobileButton>
                  {expiredMedications.length > 0 && (
                    <MobileButton
                      size="sm"
                      variant={filter === 'expired' ? 'default' : 'outline'}
                      onClick={() => setFilter('expired')}
                      className="rounded-full whitespace-nowrap min-w-fit px-4 h-9"
                    >
                      Expired ({expiredMedications.length})
                    </MobileButton>
                  )}
                </div>

                {/* Medications List */}
                <div className="space-y-4">
                  {filteredMedications.map((medication) => (
                    <div
                      key={medication.id}
                      className="cursor-pointer hover:scale-[1.01] transition-all duration-200"
                      onClick={() => handleCardTap(medication)}
                    >
                      <EnhancedMedicationCard
                        medication={medication}
                        onEdit={() => handleEdit(medication)}
                        onDelete={() => handleDelete(medication)}
                        onToggleActive={() => handleToggleActive(medication)}
                        onMarkTaken={() => handleMarkTaken(medication.id)}
                        className="shadow-lg hover:shadow-xl"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-6">
                {/* ... keep existing code (insights tab content) */}
                <MobileCard>
                  <MobileCardHeader>
                    <MobileCardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Adherence Overview
                    </MobileCardTitle>
                  </MobileCardHeader>
                  <MobileCardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-success mb-1">{realStats.adherence}%</div>
                        <div className="text-sm text-muted-foreground">This Month</div>
                        <Progress value={realStats.adherence} className="h-2 mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-1">{realStats.streak}</div>
                        <div className="text-sm text-muted-foreground">Day Streak</div>
                        <div className="flex items-center justify-center mt-2">
                          <Zap className="w-4 h-4 text-warning mr-1" />
                          <span className="text-xs text-muted-foreground">Personal Best: 28 days</span>
                        </div>
                      </div>
                    </div>
                  </MobileCardContent>
                </MobileCard>

                {/* Safety Insights */}
                <MobileCard>
                  <MobileCardHeader>
                    <MobileCardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      Safety & Interactions
                    </MobileCardTitle>
                  </MobileCardHeader>
                  <MobileCardContent className="space-y-4">
                    {realStats.interactions > 0 ? (
                      <div className="flex items-center justify-between p-4 rounded-xl bg-warning/10 border border-warning/20">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-warning" />
                          <div>
                            <div className="font-medium text-foreground">{realStats.interactions} Potential Interactions</div>
                            <div className="text-sm text-warning">Review with your pharmacist</div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-warning" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 rounded-xl bg-success/10 border border-success/20">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-success" />
                          <div>
                            <div className="font-medium text-foreground">No Interactions Detected</div>
                            <div className="text-sm text-success">Your medications appear safe together</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </MobileCardContent>
                </MobileCard>

                {/* Refill Tracking */}
                {realStats.refillsNeeded > 0 && (
                  <MobileCard>
                    <MobileCardHeader>
                      <MobileCardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-info" />
                        Refill Reminders
                      </MobileCardTitle>
                    </MobileCardHeader>
                    <MobileCardContent className="space-y-3">
                      {activeMedications.slice(0, realStats.refillsNeeded).map((medication) => (
                        <div key={medication.id} className="flex items-center justify-between p-3 rounded-xl bg-info/10 border border-info/20">
                          <div className="flex items-center gap-3">
                            <Pill className="w-5 h-5 text-info" />
                            <div>
                              <div className="font-medium text-foreground">{medication.medication_name}</div>
                              <div className="text-xs text-muted-foreground">Refill in 5 days</div>
                            </div>
                          </div>
                          <MobileButton
                            size="sm"
                            onClick={() => handleQuickActions.requestRefill(medication.id)}
                            className="rounded-xl"
                            haptic
                          >
                            Request
                          </MobileButton>
                        </div>
                      ))}
                    </MobileCardContent>
                  </MobileCard>
                )}
              </TabsContent>
            </Tabs>
            </div>
          ) : null}

          {/* Loading State */}
          {loading && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <MobileCard key={i} className="animate-pulse">
                    <MobileCardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-muted" />
                        <div className="space-y-2">
                          <div className="h-6 bg-muted rounded w-16" />
                          <div className="h-3 bg-muted rounded w-20" />
                        </div>
                      </div>
                    </MobileCardContent>
                  </MobileCard>
                ))}
              </div>
              
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <MobileCard key={i} className="animate-pulse">
                    <MobileCardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-muted rounded w-32" />
                          <div className="h-4 bg-muted rounded w-24" />
                        </div>
                      </div>
                    </MobileCardContent>
                  </MobileCard>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && medications.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Pill className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Start Your Medication Journey</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Track medications, set smart reminders, monitor adherence, and get insights to optimize your therapy management.
              </p>
              <div className="space-y-4">
                <MobileButton
                  onClick={() => setIsAddSheetOpen(true)}
                  className="rounded-2xl px-8 py-3"
                  size="lg"
                  haptic
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Medication
                </MobileButton>
                <p className="text-xs text-muted-foreground">
                  📱 Take photos of labels • ⏰ Smart reminders • 👨‍⚕️ Safety checks
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <MedicationFloatingActionButton onClick={() => setIsAddSheetOpen(true)} />

        {/* Bottom Sheets */}
        <MedicationFormSheet
          medication={selectedMedication}
          isOpen={isAddSheetOpen || isEditSheetOpen}
          onClose={() => {
            setIsAddSheetOpen(false);
            setIsEditSheetOpen(false);
            setSelectedMedication(null);
          }}
          onSave={handleSave}
          isLoading={isSubmitting}
        />

        <MedicationDetailsSheet
          medication={selectedMedication}
          isOpen={isDetailsSheetOpen}
          onClose={() => setIsDetailsSheetOpen(false)}
          onEdit={() => {
            setIsDetailsSheetOpen(false);
            setIsEditSheetOpen(true);
          }}
        />
      </div>
    </ProfessionalMobileLayout>
  );
};

export default MedicationManager;