import React, { useState } from 'react';
import { Clock, Bell, Check, ChevronDown, Pill, Calendar, Volume2 } from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { TranslatedText } from '@/components/TranslatedText';
import MobileDaySelector from './MobileDaySelector';
import MobileTimePickerSheet from './MobileTimePickerSheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReminderFormData {
  medicationId: string;
  time: string;
  daysOfWeek: number[];
  sound: boolean;
  vibration: boolean;
  led: boolean;
}

interface MobileReminderFormProps {
  medications: any[];
  initialData?: Partial<ReminderFormData>;
  onSubmit: (data: ReminderFormData) => Promise<boolean>;
  onCancel: () => void;
  isEditing?: boolean;
  medicationName?: string; // For edit mode where medication is fixed
}

const MobileReminderForm: React.FC<MobileReminderFormProps> = ({
  medications,
  initialData = {},
  onSubmit,
  onCancel,
  isEditing = false,
  medicationName
}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ReminderFormData>({
    medicationId: initialData.medicationId || '',
    time: initialData.time || '08:00',
    daysOfWeek: initialData.daysOfWeek || [1, 2, 3, 4, 5, 6, 7],
    sound: initialData.sound ?? true,
    vibration: initialData.vibration ?? true,
    led: initialData.led ?? true
  });

  const handleInputChange = <K extends keyof ReminderFormData>(
    field: K, 
    value: ReminderFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: number) => {
    const newDays = formData.daysOfWeek.includes(day)
      ? formData.daysOfWeek.filter(d => d !== day)
      : [...formData.daysOfWeek, day].sort();
    
    handleInputChange('daysOfWeek', newDays);
  };

  const canSubmit = () => {
    return formData.medicationId && formData.time && formData.daysOfWeek.length > 0;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit(formData);
      if (success) {
        // Form will be closed by parent
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const selectedMedication = medications.find(med => med.id === formData.medicationId);

  return (
    <div className="p-4 space-y-6">
      {/* Medication Selection */}
      {!isEditing ? (
        <div>
          <Label className="text-sm font-medium mb-3 block">
            <TranslatedText translationKey="reminder.selectMedication" fallback="Select Medication" />
          </Label>
          <Select 
            value={formData.medicationId} 
            onValueChange={(value) => handleInputChange('medicationId', value)}
          >
            <SelectTrigger className="h-12">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Choose a medication" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {medications.filter(med => med.is_active).map((medication) => (
                <SelectItem key={medication.id} value={medication.id}>
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-primary" />
                    <div>
                      <div className="font-medium">{medication.medication_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {medication.dosage} • {medication.frequency}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedMedication && (
            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-primary" />
                <div>
                  <div className="font-medium text-sm">{selectedMedication.medication_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedMedication.dosage} • {selectedMedication.frequency}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            <div>
              <div className="font-semibold text-foreground">{medicationName}</div>
              <div className="text-sm text-muted-foreground">
                <TranslatedText translationKey="reminder.editingReminder" fallback="Editing reminder for this medication" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          <TranslatedText translationKey="reminder.reminderTime" fallback="Reminder Time" />
        </Label>
        <MobileButton
          variant="outline"
          onClick={() => setShowTimePicker(true)}
          className="w-full h-12 justify-between"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{formatTime(formData.time)}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </MobileButton>
      </div>

      {/* Days Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          <TranslatedText translationKey="reminder.reminderDays" fallback="Reminder Days" />
        </Label>
        <MobileDaySelector
          selectedDays={formData.daysOfWeek}
          onDayToggle={handleDayToggle}
        />
      </div>

      {/* Notification Settings */}
      <div>
        <Label className="text-sm font-medium mb-4 block">
          <TranslatedText translationKey="reminder.notificationSettings" fallback="Notification Settings" />
        </Label>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">
                  <TranslatedText translationKey="reminder.sound" fallback="Sound" />
                </Label>
                <p className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="reminder.soundDesc" fallback="Play notification sound" />
                </p>
              </div>
            </div>
            <Switch
              checked={formData.sound}
              onCheckedChange={(checked) => handleInputChange('sound', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">
                  <TranslatedText translationKey="reminder.vibration" fallback="Vibration" />
                </Label>
                <p className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="reminder.vibrationDesc" fallback="Vibrate device on notification" />
                </p>
              </div>
            </div>
            <Switch
              checked={formData.vibration}
              onCheckedChange={(checked) => handleInputChange('vibration', checked)}
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      {canSubmit() && (
        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <h4 className="text-sm font-medium text-foreground mb-2">
            <TranslatedText translationKey="reminder.preview" fallback="Preview" />
          </h4>
          <div className="text-sm text-muted-foreground">
            <p>
              {isEditing ? medicationName : selectedMedication?.medication_name} at {formatTime(formData.time)}
            </p>
            <p className="mt-1">
              {formData.daysOfWeek.length === 7 ? (
                <TranslatedText translationKey="reminder.everyday" fallback="Every day" />
              ) : formData.daysOfWeek.length === 5 && formData.daysOfWeek.every(d => d >= 1 && d <= 5) ? (
                <TranslatedText translationKey="reminder.weekdays" fallback="Weekdays only" />
              ) : (
                <TranslatedText 
                  translationKey="reminder.customDays" 
                  fallback={`${formData.daysOfWeek.length} days per week`} 
                />
              )}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <MobileButton
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          <TranslatedText translationKey="common.cancel" fallback="Cancel" />
        </MobileButton>
        
        <MobileButton
          onClick={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
          loading={isSubmitting}
          className="flex-1"
        >
          <Check className="w-4 h-4 mr-2" />
          <TranslatedText 
            translationKey={isEditing ? "common.update" : "common.create"} 
            fallback={isEditing ? "Update" : "Create"} 
          />
        </MobileButton>
      </div>

      {/* Time Picker Sheet */}
      <MobileTimePickerSheet
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onTimeSelect={(time) => handleInputChange('time', time)}
        selectedTime={formData.time}
        title="Select Reminder Time"
      />
    </div>
  );
};

export default MobileReminderForm;