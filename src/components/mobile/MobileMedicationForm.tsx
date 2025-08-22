import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Camera, Pill, Calendar, User, FileText } from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { TouchOptimizedInput } from '@/components/ui/mobile/TouchOptimizedInput';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TranslatedText } from '@/components/TranslatedText';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface MedicationFormData {
  medication_name: string;
  generic_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
  prescriber: string;
  notes: string;
  is_active: boolean;
}

interface MobileMedicationFormProps {
  initialData?: Partial<MedicationFormData>;
  onSubmit: (data: MedicationFormData) => Promise<boolean>;
  onCancel: () => void;
  onScanPress?: () => void;
  isEditing?: boolean;
}

const MobileMedicationForm: React.FC<MobileMedicationFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  onScanPress,
  isEditing = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData.start_date ? new Date(initialData.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData.end_date ? new Date(initialData.end_date) : undefined
  );

  const [formData, setFormData] = useState<MedicationFormData>({
    medication_name: initialData.medication_name || '',
    generic_name: initialData.generic_name || '',
    dosage: initialData.dosage || '',
    frequency: initialData.frequency || '',
    start_date: initialData.start_date || '',
    end_date: initialData.end_date || '',
    prescriber: initialData.prescriber || '',
    notes: initialData.notes || '',
    is_active: initialData.is_active ?? true
  });

  const frequencyOptions = [
    'Once daily',
    'Twice daily', 
    'Three times daily',
    'Four times daily',
    'As needed',
    'Weekly',
    'Monthly'
  ];

  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      icon: Pill,
      fields: ['medication_name', 'generic_name', 'dosage']
    },
    {
      id: 'schedule',
      title: 'Schedule & Dates',
      icon: Calendar,
      fields: ['frequency', 'start_date', 'end_date']
    },
    {
      id: 'details',
      title: 'Additional Details',
      icon: FileText,
      fields: ['prescriber', 'notes', 'is_active']
    }
  ];

  const handleInputChange = (field: keyof MedicationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (stepIndex: number) => {
    const step = steps[stepIndex];
    return step.fields.every(field => {
      if (field === 'medication_name' || field === 'dosage' || field === 'frequency' || field === 'start_date') {
        return formData[field as keyof MedicationFormData] !== '';
      }
      return true;
    });
  };

  const canProceed = () => {
    return validateStep(currentStep);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : formData.start_date,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : formData.end_date
      };
      
      const success = await onSubmit(submitData);
      if (success) {
        // Form will be closed by parent
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-border">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200',
            index < currentStep
              ? 'bg-success text-success-foreground'
              : index === currentStep
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}>
            {index < currentStep ? (
              <Check className="w-4 h-4" />
            ) : (
              <step.icon className="w-4 h-4" />
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              'w-8 h-0.5 transition-colors duration-200',
              index < currentStep ? 'bg-success' : 'bg-muted'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                <TranslatedText translationKey="medication.basicInfo" fallback="Basic Information" />
              </h3>
              <p className="text-sm text-muted-foreground">
                <TranslatedText translationKey="medication.basicInfoDesc" fallback="Enter the basic details of your medication" />
              </p>
            </div>

            {onScanPress && !isEditing && (
              <div className="px-4">
                <MobileButton
                  variant="outline"
                  onClick={onScanPress}
                  className="w-full mb-4 border-dashed border-primary/30 text-primary hover:bg-primary/5"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  <TranslatedText translationKey="medication.scanToFill" fallback="Scan to auto-fill" />
                </MobileButton>
              </div>
            )}

            <div className="px-4 space-y-4">
              <div>
                <Label htmlFor="medication_name" className="text-sm font-medium">
                  <TranslatedText translationKey="medication.brandName" fallback="Brand Name" /> *
                </Label>
                <TouchOptimizedInput
                  id="medication_name"
                  value={formData.medication_name}
                  onChange={(e) => handleInputChange('medication_name', e.target.value)}
                  placeholder="e.g., Panadol, Aspirin"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="generic_name" className="text-sm font-medium">
                  <TranslatedText translationKey="medication.genericName" fallback="Generic Name" />
                </Label>
                <TouchOptimizedInput
                  id="generic_name"
                  value={formData.generic_name}
                  onChange={(e) => handleInputChange('generic_name', e.target.value)}
                  placeholder="e.g., Paracetamol, Acetylsalicylic acid"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="dosage" className="text-sm font-medium">
                  <TranslatedText translationKey="medication.dosage" fallback="Dosage" /> *
                </Label>
                <TouchOptimizedInput
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => handleInputChange('dosage', e.target.value)}
                  placeholder="e.g., 500mg, 10mg"
                  required
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-6">
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                <TranslatedText translationKey="medication.scheduleInfo" fallback="Schedule & Dates" />
              </h3>
              <p className="text-sm text-muted-foreground">
                <TranslatedText translationKey="medication.scheduleInfoDesc" fallback="Set your medication schedule and duration" />
              </p>
            </div>

            <div className="px-4 space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  <TranslatedText translationKey="medication.frequency" fallback="How often?" /> *
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {frequencyOptions.map((option) => (
                    <MobileButton
                      key={option}
                      variant={formData.frequency === option ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleInputChange('frequency', option)}
                      className="h-12 text-xs"
                    >
                      {option}
                    </MobileButton>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    <TranslatedText translationKey="medication.startDate" fallback="Start Date" /> *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <MobileButton
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal mt-2',
                          !startDate && 'text-muted-foreground'
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick date'}
                      </MobileButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    <TranslatedText translationKey="medication.endDate" fallback="End Date" />
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <MobileButton
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal mt-2',
                          !endDate && 'text-muted-foreground'
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'MMM d, yyyy') : 'Optional'}
                      </MobileButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                        disabled={(date) => startDate ? date < startDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                <TranslatedText translationKey="medication.additionalDetails" fallback="Additional Details" />
              </h3>
              <p className="text-sm text-muted-foreground">
                <TranslatedText translationKey="medication.additionalDetailsDesc" fallback="Add optional information about this medication" />
              </p>
            </div>

            <div className="px-4 space-y-4">
              <div>
                <Label htmlFor="prescriber" className="text-sm font-medium">
                  <TranslatedText translationKey="medication.prescriber" fallback="Prescriber" />
                </Label>
                <TouchOptimizedInput
                  id="prescriber"
                  value={formData.prescriber}
                  onChange={(e) => handleInputChange('prescriber', e.target.value)}
                  placeholder="Doctor's name"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  <TranslatedText translationKey="medication.notes" fallback="Notes" />
                </Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional notes or instructions"
                  rows={3}
                  className={cn(
                    "w-full px-4 py-3 text-base rounded-lg border-2 transition-all duration-300 mt-2",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2",
                    "border-border bg-background text-foreground",
                    "focus:border-primary focus:ring-primary/20",
                    "hover:border-primary/50 resize-none",
                    "placeholder:text-muted-foreground"
                  )}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <Label htmlFor="is_active" className="text-sm font-medium">
                    <TranslatedText translationKey="medication.currentlyTaking" fallback="Currently taking this medication" />
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    <TranslatedText translationKey="medication.currentlyTakingDesc" fallback="Turn off if you've stopped taking this medication" />
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <MobileButton
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              <TranslatedText translationKey="common.previous" fallback="Previous" />
            </MobileButton>
          )}
          
          <MobileButton
            variant="outline"
            onClick={onCancel}
            className={currentStep === 0 ? 'flex-1' : ''}
          >
            <TranslatedText translationKey="common.cancel" fallback="Cancel" />
          </MobileButton>

          <MobileButton
            onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext}
            disabled={!canProceed() || isSubmitting}
            loading={isSubmitting}
            className="flex-1"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                <TranslatedText 
                  translationKey={isEditing ? "common.update" : "common.save"} 
                  fallback={isEditing ? "Update" : "Save"} 
                />
              </>
            ) : (
              <>
                <TranslatedText translationKey="common.continue" fallback="Continue" />
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </MobileButton>
        </div>
      </div>
    </div>
  );
};

export default MobileMedicationForm;