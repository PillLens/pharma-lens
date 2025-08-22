import React, { useState, useEffect } from 'react';
import { Clock, Plus, Bell, BellOff, Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { notificationService, MedicationReminder, NotificationSettings } from '@/services/notificationService';
import { useMedicationHistory } from '@/hooks/useMedicationHistory';

export const MedicationReminders: React.FC = () => {
  const { medications } = useMedicationHistory();
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [createReminderDialog, setCreateReminderDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<MedicationReminder | null>(null);
  
  // Form states
  const [selectedMedicationId, setSelectedMedicationId] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]); // All days by default
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    sound: true,
    vibration: true,
    led: true
  });

  const daysOfWeek = [
    { value: 1, label: 'Mon', name: 'Monday' },
    { value: 2, label: 'Tue', name: 'Tuesday' },
    { value: 3, label: 'Wed', name: 'Wednesday' },
    { value: 4, label: 'Thu', name: 'Thursday' },
    { value: 5, label: 'Fri', name: 'Friday' },
    { value: 6, label: 'Sat', name: 'Saturday' },
    { value: 7, label: 'Sun', name: 'Sunday' }
  ];

  useEffect(() => {
    initializeNotifications();
    loadReminders();
  }, []);

  const initializeNotifications = async () => {
    const initialized = await notificationService.initialize();
    if (!initialized) {
      toast.warning('Notifications not available on this device');
    }
  };

  const loadReminders = async () => {
    setLoading(true);
    try {
      const userReminders = await notificationService.loadUserReminders();
      setReminders(userReminders);
      
      // Schedule all active reminders
      await notificationService.scheduleMedicationReminders(userReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedMedicationId('');
    setReminderTime('08:00');
    setSelectedDays([1, 2, 3, 4, 5, 6, 7]);
    setNotificationSettings({
      sound: true,
      vibration: true,
      led: true
    });
  };

  const handleCreateReminder = async () => {
    if (!selectedMedicationId || !reminderTime || selectedDays.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    await notificationService.createReminder(selectedMedicationId, {
      time: reminderTime,
      daysOfWeek: selectedDays,
      notificationSettings
    });

    await loadReminders();
    setCreateReminderDialog(false);
    resetForm();
  };

  const handleEditReminder = (reminder: MedicationReminder) => {
    setEditingReminder(reminder);
    setSelectedMedicationId(''); // Can't change medication for existing reminder
    setReminderTime(reminder.time);
    setSelectedDays(reminder.daysOfWeek);
    setNotificationSettings(reminder.notificationSettings);
  };

  const handleUpdateReminder = async () => {
    if (!editingReminder || !reminderTime || selectedDays.length === 0) return;

    await notificationService.updateReminder(editingReminder.id, {
      time: reminderTime,
      daysOfWeek: selectedDays,
      notificationSettings
    });

    await loadReminders();
    setEditingReminder(null);
    resetForm();
  };

  const handleToggleReminder = async (reminder: MedicationReminder) => {
    await notificationService.updateReminder(reminder.id, {
      isActive: !reminder.isActive
    });
    await loadReminders();
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      await notificationService.deleteReminder(reminderId);
      await loadReminders();
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const formatDays = (days: number[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Weekdays';
    if (days.length === 2 && days.includes(6) && days.includes(7)) return 'Weekends';
    
    return days
      .map(d => daysOfWeek.find(day => day.value === d)?.label)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Medication Reminders</h2>
        </div>
        
        <Dialog open={createReminderDialog} onOpenChange={setCreateReminderDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Medication Reminder</DialogTitle>
            </DialogHeader>
            <ReminderForm
              medications={medications}
              selectedMedicationId={selectedMedicationId}
              setSelectedMedicationId={setSelectedMedicationId}
              reminderTime={reminderTime}
              setReminderTime={setReminderTime}
              selectedDays={selectedDays}
              toggleDay={toggleDay}
              notificationSettings={notificationSettings}
              setNotificationSettings={setNotificationSettings}
              onSubmit={handleCreateReminder}
              onCancel={() => {
                setCreateReminderDialog(false);
                resetForm();
              }}
              daysOfWeek={daysOfWeek}
              isEditing={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Reminder Dialog */}
      <Dialog open={!!editingReminder} onOpenChange={(open) => {
        if (!open) {
          setEditingReminder(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Reminder</DialogTitle>
          </DialogHeader>
          {editingReminder && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="font-medium">{editingReminder.medicationName}</p>
            </div>
          )}
          <ReminderForm
            medications={medications}
            selectedMedicationId={selectedMedicationId}
            setSelectedMedicationId={setSelectedMedicationId}
            reminderTime={reminderTime}
            setReminderTime={setReminderTime}
            selectedDays={selectedDays}
            toggleDay={toggleDay}
            notificationSettings={notificationSettings}
            setNotificationSettings={setNotificationSettings}
            onSubmit={handleUpdateReminder}
            onCancel={() => {
              setEditingReminder(null);
              resetForm();
            }}
            daysOfWeek={daysOfWeek}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>

      {/* Reminders List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-4"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        ) : reminders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reminders Set</h3>
              <p className="text-muted-foreground mb-4">
                Set up medication reminders to help you stay on track with your medication schedule.
              </p>
              <Button onClick={() => setCreateReminderDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Reminder
              </Button>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder) => (
            <Card key={reminder.id} className={!reminder.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{reminder.medicationName}</h3>
                      <Badge variant={reminder.isActive ? 'default' : 'secondary'}>
                        {reminder.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{reminder.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDays(reminder.daysOfWeek)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleReminder(reminder)}
                    >
                      {reminder.isActive ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditReminder(reminder)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// Separate form component to reduce complexity
interface ReminderFormProps {
  medications: any[];
  selectedMedicationId: string;
  setSelectedMedicationId: (id: string) => void;
  reminderTime: string;
  setReminderTime: (time: string) => void;
  selectedDays: number[];
  toggleDay: (day: number) => void;
  notificationSettings: NotificationSettings;
  setNotificationSettings: (settings: NotificationSettings) => void;
  onSubmit: () => void;
  onCancel: () => void;
  daysOfWeek: any[];
  isEditing: boolean;
}

const ReminderForm: React.FC<ReminderFormProps> = ({
  medications,
  selectedMedicationId,
  setSelectedMedicationId,
  reminderTime,
  setReminderTime,
  selectedDays,
  toggleDay,
  notificationSettings,
  setNotificationSettings,
  onSubmit,
  onCancel,
  daysOfWeek,
  isEditing
}) => (
  <div className="space-y-4">
    {!isEditing && (
      <div>
        <Label htmlFor="medication">Medication</Label>
        <Select value={selectedMedicationId} onValueChange={setSelectedMedicationId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a medication" />
          </SelectTrigger>
          <SelectContent>
            {medications.filter(med => med.is_active).map((medication) => (
              <SelectItem key={medication.id} value={medication.id}>
                {medication.medication_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )}
    
    <div>
      <Label htmlFor="time">Reminder Time</Label>
      <Input
        id="time"
        type="time"
        value={reminderTime}
        onChange={(e) => setReminderTime(e.target.value)}
      />
    </div>
    
    <div>
      <Label>Days of Week</Label>
      <div className="grid grid-cols-7 gap-2 mt-2">
        {daysOfWeek.map((day) => (
          <div key={day.value} className="text-center">
            <Checkbox
              id={`day-${day.value}`}
              checked={selectedDays.includes(day.value)}
              onCheckedChange={() => toggleDay(day.value)}
            />
            <Label htmlFor={`day-${day.value}`} className="block text-xs mt-1">
              {day.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
    
    <div className="space-y-3">
      <Label>Notification Settings</Label>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="sound">Sound</Label>
          <Switch
            id="sound"
            checked={notificationSettings.sound}
            onCheckedChange={(checked) => 
              setNotificationSettings(prev => ({ ...prev, sound: checked }))
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="vibration">Vibration</Label>
          <Switch
            id="vibration"
            checked={notificationSettings.vibration}
            onCheckedChange={(checked) => 
              setNotificationSettings(prev => ({ ...prev, vibration: checked }))
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="led">LED Light</Label>
          <Switch
            id="led"
            checked={notificationSettings.led}
            onCheckedChange={(checked) => 
              setNotificationSettings(prev => ({ ...prev, led: checked }))
            }
          />
        </div>
      </div>
    </div>
    
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSubmit}>
        {isEditing ? 'Update' : 'Create'} Reminder
      </Button>
    </div>
  </div>
);
