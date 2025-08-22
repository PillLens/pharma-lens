import React, { useState, useEffect } from 'react';
import { Plus, Bell } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import RemindersEmptyState from '@/components/reminders/RemindersEmptyState';
import ReminderSummaryCards from '@/components/reminders/ReminderSummaryCards';
import ReminderCard from '@/components/reminders/ReminderCard';
import ReminderDetailsSheet from '@/components/reminders/ReminderDetailsSheet';
import AddReminderSheet from '@/components/reminders/AddReminderSheet';
import RemindersFloatingActionButton from '@/components/reminders/RemindersFloatingActionButton';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';

// Type definition for reminder
type Reminder = {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  times: string[];
  status: 'active' | 'paused';
  nextDose?: string;
  notes?: string;
};

// Mock data - replace with actual data fetching
const mockReminders: Reminder[] = [
  {
    id: '1',
    medicationName: 'Amoxicillin',
    dosage: '1 tablet',
    frequency: 'Twice daily',
    times: ['08:00', '20:00'],
    status: 'active',
    nextDose: 'Today at 8:00 PM',
    notes: 'Take with food'
  },
  {
    id: '2',
    medicationName: 'Ibuprofen',
    dosage: '2 tablets',
    frequency: 'Every 8 hours',
    times: ['08:00', '16:00', '00:00'],
    status: 'paused'
  }
];

const mockMedications = [
  { id: '1', name: 'Amoxicillin' },
  { id: '2', name: 'Ibuprofen' },
  { id: '3', name: 'Metformin' },
  { id: '4', name: 'Lisinopril' }
];

const Reminders: React.FC = () => {
  const { t } = useTranslation();
  
  // State management
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Sheet states
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showReminderDetails, setShowReminderDetails] = useState(false);
  const [isAddingReminder, setIsAddingReminder] = useState(false);

  // Load reminders data
  const loadReminders = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real app, fetch reminders from API
      setReminders(mockReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load reminders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  // Handlers
  const handleAddReminder = async (reminderData: any) => {
    try {
      setIsAddingReminder(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new reminder
      const newReminder: Reminder = {
        id: Date.now().toString(),
        medicationName: mockMedications.find(m => m.id === reminderData.medicationId)?.name || 'Unknown',
        dosage: reminderData.dosage,
        frequency: reminderData.frequency,
        times: reminderData.times,
        status: 'active',
        nextDose: `Today at ${reminderData.times[0]}`,
        notes: reminderData.notes
      };
      
      setReminders(prev => [...prev, newReminder]);
      setShowAddReminder(false);
      
      toast({
        title: t('reminders.messages.reminderAdded'),
        description: `Reminder for ${newReminder.medicationName} added successfully`,
      });
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to add reminder',
        variant: 'destructive',
      });
    } finally {
      setIsAddingReminder(false);
    }
  };

  const handleReminderTap = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setShowReminderDetails(true);
  };

  const handleEditReminder = () => {
    // Close details sheet and show edit sheet
    setShowReminderDetails(false);
    setShowAddReminder(true);
  };

  const handleDeleteReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    toast({
      title: t('reminders.messages.reminderDeleted'),
      description: 'Reminder deleted successfully',
    });
  };

  const handleToggleReminderStatus = (reminderId: string) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === reminderId 
        ? { 
            ...reminder, 
            status: reminder.status === 'active' ? 'paused' : 'active',
            nextDose: reminder.status === 'active' ? undefined : `Today at ${reminder.times[0]}`
          }
        : reminder
    ));
    
    const reminder = reminders.find(r => r.id === reminderId);
    const newStatus = reminder?.status === 'active' ? 'paused' : 'active';
    
    toast({
      title: newStatus === 'active' ? t('reminders.messages.reminderActivated') : t('reminders.messages.reminderPaused'),
      description: `Reminder ${newStatus === 'active' ? 'activated' : 'paused'} successfully`,
    });
  };

  const handleSummaryCardTap = (type: 'active' | 'medications' | 'today') => {
    // Handle filtering logic here
    toast({
      title: 'Filter',
      description: `Filtering by ${type}`,
    });
  };

  // Calculate summary stats
  const activeReminders = reminders.filter(r => r.status === 'active').length;
  const medicationsCovered = new Set(reminders.map(r => r.medicationName)).size;
  const todaysDoses = reminders
    .filter(r => r.status === 'active')
    .reduce((total, r) => total + r.times.length, 0);

  return (
    <ProfessionalMobileLayout title={t('reminders.title')} showHeader={true}>
      <div className="flex items-center justify-end px-4 py-2 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddReminder(true)}
          className="text-primary hover:text-primary/80"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="pt-4">
            <ReminderSummaryCards
              activeReminders={activeReminders}
              medicationsCovered={medicationsCovered}
              todaysDoses={todaysDoses}
              onCardTap={handleSummaryCardTap}
            />
          </div>

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
                {reminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onTap={() => handleReminderTap(reminder)}
                    onEdit={() => {
                      setSelectedReminder(reminder);
                      handleEditReminder();
                    }}
                    onDelete={() => handleDeleteReminder(reminder.id)}
                    onToggleStatus={() => handleToggleReminderStatus(reminder.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <RemindersFloatingActionButton
        onClick={() => setShowAddReminder(true)}
      />

      {/* Bottom Sheets */}
      <AddReminderSheet
        isOpen={showAddReminder}
        onClose={() => setShowAddReminder(false)}
        onSave={handleAddReminder}
        isLoading={isAddingReminder}
        medications={mockMedications}
      />

      <ReminderDetailsSheet
        reminder={selectedReminder}
        isOpen={showReminderDetails}
        onClose={() => setShowReminderDetails(false)}
        onEdit={handleEditReminder}
      />
    </ProfessionalMobileLayout>
  );
};

// Loading Skeleton Component
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Summary Cards Skeleton */}
    <div className="grid grid-cols-3 gap-3 px-4 pt-4">
      {[1, 2, 3].map((i) => (
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
        {[1, 2, 3].map((i) => (
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