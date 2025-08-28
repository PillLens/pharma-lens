import { useState } from "react";
import { Clock, Calendar, Bell, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/useTranslation";
import { useMedicationHistory } from "@/hooks/useMedicationHistory";
import { useReminders } from "@/hooks/useReminders";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomSheet from "@/components/ui/mobile/BottomSheet";

interface MedicationData {
  brand_name: string;
  generic_name?: string;
  strength?: string;
  form?: string;
  manufacturer?: string;
  indications?: string[];
  contraindications?: string[];
  warnings?: string[];
  side_effects?: string[];
  active_ingredients?: string[];
  usage_instructions?: {
    dosage?: string;
    frequency?: string;
    duration?: string;
    timing?: string;
    route?: string;
    special_instructions?: string;
  };
  storage_instructions?: string;
  drug_interactions?: string[];
  pregnancy_safety?: string;
  age_restrictions?: string;
  expiry_date?: string;
  confidence_score: number;
}

interface ScanResultDialogProps {
  open: boolean;
  onClose: () => void;
  medicationData: MedicationData;
}

export const ScanResultDialog = ({ open, onClose, medicationData }: ScanResultDialogProps) => {
  const { t } = useTranslation();
  const { addMedication } = useMedicationHistory();
  const { addReminder } = useReminders();
  const isMobile = useIsMobile();
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [formData, setFormData] = useState({
    dosage: medicationData.usage_instructions?.dosage || '',
    frequency: medicationData.usage_instructions?.frequency || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    prescriber: '',
    notes: '',
    createReminder: true,
    reminderTimes: ['09:00']
  });

  const handleAddToMedications = async () => {
    try {
      const medicationResult = await addMedication({
        medication_name: medicationData.brand_name,
        generic_name: medicationData.generic_name || null,
        dosage: formData.dosage,
        frequency: formData.frequency,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        prescriber: formData.prescriber || null,
        notes: formData.notes || null,
        is_active: true
      });

      // Create reminders if enabled and medication was added successfully
      if (formData.createReminder && medicationResult && formData.reminderTimes.length > 0) {
        console.log('Creating reminders for medication:', medicationResult.id);
        let successfulReminders = 0;
        
        for (const time of formData.reminderTimes) {
          const reminderResult = await addReminder({
            medication_id: medicationResult.id,
            reminder_time: time,
            days_of_week: [1, 2, 3, 4, 5, 6, 7], // All days by default
            notification_settings: {
              sound: true,
              vibration: true,
              led: true
            }
          });
          
          if (reminderResult) {
            successfulReminders++;
            console.log('Successfully created reminder:', (reminderResult as any)?.id);
          } else {
            console.error('Failed to create reminder for time:', time);
          }
        }
        
        if (successfulReminders === 0) {
          console.error('All reminder creations failed');
        }
      }

      toast({
        title: t('common.success'),
        description: formData.createReminder 
          ? t('toast.medicationAndReminderAdded')
          : t('toast.medicationAdded'),
      });

      onClose();
    } catch (error) {
      console.error('Error adding medication from scan:', error);
      toast({
        title: t('common.error'),
        description: t('toast.failedToAddMedication'),
        variant: "destructive",
      });
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "bg-success text-success-foreground";
    if (score >= 0.6) return "bg-warning text-warning-foreground";
    return "bg-destructive text-destructive-foreground";
  };

  const addReminderTime = () => {
    setFormData(prev => ({
      ...prev,
      reminderTimes: [...prev.reminderTimes, '12:00']
    }));
  };

  const removeReminderTime = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reminderTimes: prev.reminderTimes.filter((_, i) => i !== index)
    }));
  };

  const updateReminderTime = (index: number, time: string) => {
    setFormData(prev => ({
      ...prev,
      reminderTimes: prev.reminderTimes.map((t, i) => i === index ? time : t)
    }));
  };

  const renderContent = () => (
    <div className="space-y-4">
      {/* Header with medication name and confidence */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground mb-1">
            {medicationData.brand_name}
          </h2>
          {medicationData.generic_name && (
            <p className="text-sm text-muted-foreground mb-2">
              {t('medications.genericName')}: {medicationData.generic_name}
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {medicationData.strength && <span>{medicationData.strength}</span>}
            {medicationData.form && <span>• {medicationData.form}</span>}
            {medicationData.manufacturer && <span>• {medicationData.manufacturer}</span>}
          </div>
        </div>
        <Badge className={getConfidenceColor(medicationData.confidence_score)}>
          {Math.round(medicationData.confidence_score * 100)}%
        </Badge>
      </div>

      {/* Usage Instructions */}
      {medicationData.usage_instructions && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            {t('medications.howToUse')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {medicationData.usage_instructions.dosage && (
              <div>
                <span className="font-medium">{t('medications.dosage')}: </span>
                <span>{medicationData.usage_instructions.dosage}</span>
              </div>
            )}
            {medicationData.usage_instructions.frequency && (
              <div>
                <span className="font-medium">{t('medications.frequency')}: </span>
                <span>{medicationData.usage_instructions.frequency}</span>
              </div>
            )}
            {medicationData.usage_instructions.timing && (
              <div>
                <span className="font-medium">{t('medications.timing')}: </span>
                <span>{medicationData.usage_instructions.timing}</span>
              </div>
            )}
            {medicationData.usage_instructions.duration && (
              <div>
                <span className="font-medium">{t('medications.duration')}: </span>
                <span>{medicationData.usage_instructions.duration}</span>
              </div>
            )}
          </div>
          {medicationData.usage_instructions.special_instructions && (
            <div className="mt-3 p-3 bg-muted/50 rounded">
              <span className="font-medium">{t('medications.specialInstructions')}: </span>
              <span className="text-muted-foreground">
                {medicationData.usage_instructions.special_instructions}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={() => setShowScheduleForm(!showScheduleForm)} 
          className="flex-1"
        >
          <Calendar className="w-4 h-4 mr-2" />
          {showScheduleForm ? t('common.cancel') : t('medications.addToMyMedications')}
        </Button>
        {!isMobile && (
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
        )}
      </div>

      {/* Schedule Form */}
      {showScheduleForm && (
        <Card className="p-4 border-primary/30">
          <h3 className="font-semibold mb-4">{t('medications.createSchedule')}</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dosage">{t('medications.dosage')}</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder={`${t('common.enterText')}...`}
                />
              </div>
              <div>
                <Label htmlFor="frequency">{t('medications.frequency')}</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('medications.selectFrequency')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once_daily">{t('medications.onceDaily')}</SelectItem>
                    <SelectItem value="twice_daily">{t('medications.twiceDaily')}</SelectItem>
                    <SelectItem value="three_times_daily">{t('medications.threeTimes')}</SelectItem>
                    <SelectItem value="four_times_daily">{t('medications.fourTimes')}</SelectItem>
                    <SelectItem value="as_needed">{t('medications.asNeeded')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">{t('medications.startDate')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">{t('medications.endDate')} ({t('common.optional')})</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="prescriber">{t('medications.prescriber')} ({t('common.optional')})</Label>
              <Input
                id="prescriber"
                value={formData.prescriber}
                onChange={(e) => setFormData(prev => ({ ...prev, prescriber: e.target.value }))}
                placeholder={`${t('common.enterText')}...`}
              />
            </div>

            <div>
              <Label htmlFor="notes">{t('medications.notes')} ({t('common.optional')})</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={`${t('common.enterText')}...`}
                rows={3}
              />
            </div>

            {/* Reminder Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('reminders.createReminder')}</Label>
                <Switch
                  checked={formData.createReminder}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, createReminder: checked }))}
                />
              </div>

              {formData.createReminder && (
                <div className="space-y-2">
                  <Label>{t('reminders.reminderTimes')}</Label>
                  {formData.reminderTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => updateReminderTime(index, e.target.value)}
                        className="flex-1"
                      />
                      {formData.reminderTimes.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeReminderTime(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addReminderTime}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('reminders.addTime')}
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button 
                onClick={handleAddToMedications} 
                className="flex-1"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {t('medications.saveMedication')}
              </Button>
              <Button variant="outline" onClick={() => setShowScheduleForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Detailed Information Cards */}
      <div className="space-y-4">
        {medicationData.indications && medicationData.indications.length > 0 && (
          <Card className="p-4">
            <h4 className="font-semibold mb-2">{t('medications.indications')}</h4>
            <ul className="space-y-1">
              {medicationData.indications.map((indication, index) => (
                <li key={index} className="text-sm text-muted-foreground">• {indication}</li>
              ))}
            </ul>
          </Card>
        )}

        {medicationData.warnings && medicationData.warnings.length > 0 && (
          <Card className="p-4 bg-warning/10">
            <h4 className="font-semibold mb-2 text-warning">{t('safety.warnings')}</h4>
            <ul className="space-y-1">
              {medicationData.warnings.map((warning, index) => (
                <li key={index} className="text-sm text-muted-foreground">• {warning}</li>
              ))}
            </ul>
          </Card>
        )}

        {medicationData.storage_instructions && (
          <Card className="p-4">
            <h4 className="font-semibold mb-2">{t('medications.storage')}</h4>
            <p className="text-sm text-muted-foreground">{medicationData.storage_instructions}</p>
          </Card>
        )}
      </div>
    </div>
  );

  return isMobile ? (
    <BottomSheet
      isOpen={open}
      onClose={onClose}
      title={t('scanner.medicationFound')}
      height="lg"
    >
      <div className="px-4 pt-4 pb-8 space-y-4 overflow-y-auto scrollbar-hide smooth-scroll max-h-[70vh]">
        {renderContent()}
      </div>
    </BottomSheet>
  ) : (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('scanner.medicationFound')}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto scrollbar-hide smooth-scroll pr-2 space-y-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};