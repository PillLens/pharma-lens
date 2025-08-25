import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Pill, 
  Clock, 
  Calendar, 
  Save,
  Loader2
} from 'lucide-react';
import BottomSheet from '@/components/ui/mobile/BottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';
import { UserMedication } from '@/hooks/useMedicationHistory';
import { useReminders } from '@/hooks/useReminders';
import FrequencyChips from './FrequencyChips';

interface MedicationFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  medication?: UserMedication | null;
  onSave: (data: Partial<UserMedication>) => Promise<void>;
  isLoading?: boolean;
}

const medicationSchema = z.object({
  name: z.string().min(1, 'medications.validation.nameRequired'),
  genericName: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().min(1, 'medications.validation.frequencyRequired'),
  form: z.string().optional(),
  strength: z.string().optional(),
  startDate: z.date({ required_error: 'medications.validation.startDateRequired' }),
  endDate: z.date().optional(),
  prescriber: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'completed']),
  reminderTimes: z.array(z.string()).optional(),
  reminderDays: z.array(z.number()).optional(),
  enableReminders: z.boolean().optional()
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: 'medications.validation.endDateAfterStart',
  path: ['endDate']
});

type MedicationFormData = z.infer<typeof medicationSchema>;

const MedicationFormSheet: React.FC<MedicationFormSheetProps> = ({
  isOpen,
  onClose,
  medication,
  onSave,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const { addReminder } = useReminders();
  const [currentStep, setCurrentStep] = useState(0);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const form = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: '',
      genericName: '',
      dosage: '',
      frequency: '',
      form: 'tablet',
      strength: '',
      startDate: new Date(),
      endDate: undefined,
      prescriber: '',
      notes: '',
      status: 'active',
      reminderTimes: ['08:00'],
      reminderDays: [1, 2, 3, 4, 5, 6, 7],
      enableReminders: true
    }
  });

  useEffect(() => {
    if (medication) {
      form.reset({
        name: medication.medication_name,
        genericName: medication.generic_name || '',
        dosage: medication.dosage || '',
        frequency: medication.frequency,
        form: 'tablet', // Default since not in interface
        strength: '', // Default since not in interface
        startDate: new Date(medication.start_date),
        endDate: medication.end_date ? new Date(medication.end_date) : undefined,
        prescriber: medication.prescriber || '',
        notes: medication.notes || '',
        status: medication.is_active ? 'active' : 'inactive'
      });
    } else {
      form.reset({
        name: '',
        genericName: '',
        dosage: '',
        frequency: '',
        form: 'tablet',
        strength: '',
        startDate: new Date(),
        endDate: undefined,
        prescriber: '',
        notes: '',
        status: 'active',
        reminderTimes: ['08:00'],
        reminderDays: [1, 2, 3, 4, 5, 6, 7],
        enableReminders: true
      });
    }
    setCurrentStep(0);
  }, [medication, form, isOpen]);

  const handleSave = async (data: MedicationFormData) => {
    try {
      const medicationData = {
        medication_name: data.name,
        generic_name: data.genericName,
        dosage: data.dosage,
        frequency: data.frequency,
        start_date: data.startDate.toISOString(),
        end_date: data.endDate?.toISOString(),
        prescriber: data.prescriber,
        notes: data.notes,
        is_active: data.status === 'active',
        // Pass reminder data along for parent to handle
        _reminderSettings: data.enableReminders ? {
          reminderTimes: data.reminderTimes || [],
          reminderDays: data.reminderDays || [],
          enableReminders: data.enableReminders
        } : undefined
      };
      
      await onSave(medicationData);
      onClose();
    } catch (error) {
      console.error('Error saving medication:', error);
    }
  };

  const formSections = [
    {
      title: t('medications.form.basics'),
      icon: Pill,
      fields: ['name', 'genericName', 'form', 'strength']
    },
    {
      title: t('medications.form.dosageFrequency'),
      icon: Clock,
      fields: ['dosage', 'frequency']
    },
    {
      title: t('medications.form.datesStatus'),
      icon: Calendar,
      fields: ['startDate', 'endDate', 'prescriber', 'notes', 'status']
    },
    {
      title: 'Reminders',
      icon: Clock,
      fields: ['enableReminders', 'reminderTimes', 'reminderDays']
    }
  ];

  const currentSection = formSections[currentStep];
  const isLastStep = currentStep === formSections.length - 1;

  const validateCurrentStep = async () => {
    const currentFields = currentSection.fields;
    const isValid = await form.trigger(currentFields as any);
    return isValid;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && !isLastStep) {
      setCurrentStep(prev => prev + 1);
    } else if (isValid && isLastStep) {
      form.handleSubmit(handleSave)();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('medications.brandName')} *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Enter medication name"
                className="rounded-xl"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{t(form.formState.errors.name.message as string)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="genericName">{t('medications.genericName')}</Label>
              <Input
                id="genericName"
                {...form.register('genericName')}
                placeholder="Generic name (optional)"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="form">{t('medications.form')}</Label>
                <Select 
                  value={form.watch('form')} 
                  onValueChange={(value) => form.setValue('form', value)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="tablet">{t('medications.tablet')}</SelectItem>
                    <SelectItem value="capsule">{t('medications.capsule')}</SelectItem>
                    <SelectItem value="syrup">{t('medications.syrup')}</SelectItem>
                    <SelectItem value="injection">{t('medications.injection')}</SelectItem>
                    <SelectItem value="cream">{t('medications.cream')}</SelectItem>
                    <SelectItem value="drops">{t('medications.drops')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strength">{t('medications.strength')}</Label>
                <Input
                  id="strength"
                  {...form.register('strength')}
                  placeholder="e.g., 500mg"
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="dosage">{t('medications.dosage')}</Label>
              <Input
                id="dosage"
                {...form.register('dosage')}
                placeholder="e.g., 1 tablet, 2 capsules"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-4">
              <Label>{t('medications.frequency')} *</Label>
              <FrequencyChips
                selected={form.watch('frequency')}
                onSelect={(frequency) => form.setValue('frequency', frequency)}
              />
              {form.formState.errors.frequency && (
                <p className="text-sm text-destructive">{t(form.formState.errors.frequency.message as string)}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('medications.startDate')} *</Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-xl",
                        !form.watch('startDate') && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {form.watch('startDate') ? format(form.watch('startDate'), "MMM dd, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                   <PopoverContent className="w-auto p-0 bg-background border shadow-lg z-50" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={form.watch('startDate')}
                      onSelect={(date) => {
                        if (date) {
                          form.setValue('startDate', date);
                          setStartDateOpen(false);
                        }
                      }}
                      className="pointer-events-auto"
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.startDate && (
                  <p className="text-sm text-destructive">{t(form.formState.errors.startDate.message as string)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('medications.endDate')}</Label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-xl",
                        !form.watch('endDate') && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {form.watch('endDate') ? format(form.watch('endDate'), "MMM dd, yyyy") : "Optional"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border shadow-lg z-50" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={form.watch('endDate')}
                      onSelect={(date) => {
                        form.setValue('endDate', date);
                        setEndDateOpen(false);
                      }}
                      className="pointer-events-auto"
                      disabled={(date) => date < form.watch('startDate')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.endDate && (
                  <p className="text-sm text-destructive">{t(form.formState.errors.endDate.message as string)}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prescriber">{t('medications.prescriber')}</Label>
              <Input
                id="prescriber"
                {...form.register('prescriber')}
                placeholder="Dr. Name (optional)"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('medications.notes')}</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Additional notes (optional)"
                className="rounded-xl min-h-20"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-accent/50 rounded-xl">
              <div className="space-y-1">
                <Label htmlFor="status" className="text-sm font-medium">Active Status</Label>
                <p className="text-xs text-muted-foreground">This medication is currently being taken</p>
              </div>
              <Switch
                id="status"
                checked={form.watch('status') === 'active'}
                onCheckedChange={(checked) => form.setValue('status', checked ? 'active' : 'inactive')}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-accent/50 rounded-xl">
              <div className="space-y-1">
                <Label htmlFor="enableReminders" className="text-sm font-medium">Enable Reminders</Label>
                <p className="text-xs text-muted-foreground">Set up automatic medication reminders</p>
              </div>
              <Switch
                id="enableReminders"
                checked={form.watch('enableReminders')}
                onCheckedChange={(checked) => form.setValue('enableReminders', checked)}
              />
            </div>

            {form.watch('enableReminders') && (
              <>
                <div className="space-y-4">
                  <Label>Reminder Times</Label>
                  <div className="space-y-3">
                    {form.watch('reminderTimes')?.map((time, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => {
                            const times = [...(form.watch('reminderTimes') || [])];
                            times[index] = e.target.value;
                            form.setValue('reminderTimes', times);
                          }}
                          className="flex-1 rounded-xl"
                        />
                        {(form.watch('reminderTimes')?.length || 0) > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const times = [...(form.watch('reminderTimes') || [])];
                              times.splice(index, 1);
                              form.setValue('reminderTimes', times);
                            }}
                            className="p-2"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const times = [...(form.watch('reminderTimes') || [])];
                        times.push('08:00');
                        form.setValue('reminderTimes', times);
                      }}
                      className="w-full rounded-xl"
                    >
                      + Add Another Time
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Days of Week</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      const dayNumber = index + 1;
                      const isSelected = form.watch('reminderDays')?.includes(dayNumber);
                      return (
                        <Button
                          key={day}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const days = [...(form.watch('reminderDays') || [])];
                            if (isSelected) {
                              const dayIndex = days.indexOf(dayNumber);
                              if (dayIndex > -1) days.splice(dayIndex, 1);
                            } else {
                              days.push(dayNumber);
                            }
                            form.setValue('reminderDays', days);
                          }}
                          className="aspect-square p-0 text-xs"
                        >
                          {day}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose}
      height="full"
      title={medication ? `${t('common.edit')} ${t('medications.title')}` : t('medications.add')}
      className="scrollbar-hide"
    >
      <div className="flex flex-col h-full">
        {/* Step Indicator */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            {formSections.map((section, index) => (
              <div key={index} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  index <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </div>
                {index < formSections.length - 1 && (
                  <div className={cn(
                    "w-16 h-1 mx-2",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <currentSection.icon className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-foreground">{currentSection.title}</h3>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-border safe-area-bottom">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                className="flex-1 rounded-2xl"
              >
                {t('common.back')}
              </Button>
            )}
            
            <Button
              type="button"
              onClick={currentStep > 0 ? onClose : onClose}
              variant="outline"
              className={cn(
                "rounded-2xl",
                currentStep === 0 ? "flex-1" : "px-6"
              )}
            >
              {t('common.cancel')}
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="flex-1 rounded-2xl"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLastStep ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('common.save')}
                </>
              ) : (
                t('common.next')
              )}
            </Button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};

export default MedicationFormSheet;