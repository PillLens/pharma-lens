import React, { useState } from 'react';
import { Plus, Clock, Pill, Calendar, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

interface AddReminderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminderData: any) => void;
  isLoading?: boolean;
  medications?: Array<{
    id: string;
    name: string;
  }>;
}

const AddReminderSheet: React.FC<AddReminderSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  medications = []
}) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    medicationId: '',
    dosage: '',
    frequency: '',
    times: [] as string[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: ''
  });

  const [newTime, setNewTime] = useState('08:00');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const frequencyOptions = [
    { value: 'once', label: t('reminders.frequency.once') },
    { value: 'twice', label: t('reminders.frequency.twice') },
    { value: 'custom', label: t('reminders.frequency.custom') }
  ];

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.medicationId) {
      newErrors.medication = t('reminders.validation.medicationRequired');
    }
    if (!formData.dosage.trim()) {
      newErrors.dosage = t('reminders.validation.dosageRequired');
    }
    if (formData.times.length === 0) {
      newErrors.times = t('reminders.validation.timesRequired');
    }
    if (!formData.startDate) {
      newErrors.startDate = t('reminders.validation.startDateRequired');
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave(formData);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      medicationId: '',
      dosage: '',
      frequency: '',
      times: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: ''
    });
    setNewTime('08:00');
    setErrors({});
  };

  const addTime = () => {
    if (newTime && !formData.times.includes(newTime)) {
      setFormData(prev => ({
        ...prev,
        times: [...prev.times, newTime].sort()
      }));
      setNewTime('08:00');
    }
  };

  const removeTime = (timeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.filter(time => time !== timeToRemove)
    }));
  };

  const handleFrequencyChange = (frequency: string) => {
    setFormData(prev => ({ ...prev, frequency }));
    
    // Auto-populate times based on frequency
    if (frequency === 'once' && formData.times.length === 0) {
      setFormData(prev => ({ ...prev, times: ['08:00'] }));
    } else if (frequency === 'twice' && formData.times.length === 0) {
      setFormData(prev => ({ ...prev, times: ['08:00', '20:00'] }));
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left pb-6">
          <SheetTitle className="text-lg font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {t('reminders.form.title')}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Medication Selection */}
          <div className="space-y-2">
            <Label htmlFor="medication" className="text-sm font-medium">
              {t('reminders.form.medication')}
            </Label>
            <Select 
              value={formData.medicationId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, medicationId: value }))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={t('reminders.form.medicationPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {medications.map((medication) => (
                  <SelectItem key={medication.id} value={medication.id}>
                    {medication.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.medication && (
              <p className="text-xs text-destructive">{errors.medication}</p>
            )}
          </div>

          {/* Dosage */}
          <div className="space-y-2">
            <Label htmlFor="dosage" className="text-sm font-medium">
              {t('reminders.form.dosage')}
            </Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
              placeholder={t('reminders.form.dosagePlaceholder')}
              className="rounded-xl"
            />
            {errors.dosage && (
              <p className="text-xs text-destructive">{errors.dosage}</p>
            )}
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('reminders.form.frequency')}
            </Label>
            <div className="flex flex-wrap gap-2">
              {frequencyOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant={formData.frequency === option.value ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2 rounded-xl text-sm transition-all duration-200"
                  onClick={() => handleFrequencyChange(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Times */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('reminders.form.times')}
            </Label>
            
            {/* Add Time */}
            <div className="flex gap-2">
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="rounded-xl flex-1"
              />
              <Button
                type="button"
                onClick={addTime}
                size="sm"
                className="rounded-xl px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Time Chips */}
            {formData.times.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.times.map((time) => (
                  <Badge
                    key={time}
                    variant="outline"
                    className="px-3 py-2 rounded-xl bg-muted/50 text-foreground border-border/50 flex items-center gap-2"
                  >
                    <Clock className="w-3 h-3" />
                    {time}
                    <button
                      type="button"
                      onClick={() => removeTime(time)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            {errors.times && (
              <p className="text-xs text-destructive">{errors.times}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">
                {t('reminders.form.startDate')}
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="rounded-xl"
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium">
                {t('reminders.form.endDate')}
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              {t('reminders.form.notes')}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={t('reminders.form.notesPlaceholder')}
              className="rounded-xl min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
            >
              {t('reminders.form.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              {t('reminders.form.save')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddReminderSheet;