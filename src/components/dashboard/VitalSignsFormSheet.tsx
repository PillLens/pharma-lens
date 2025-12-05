import React, { useState } from 'react';
import { Activity, Heart, Thermometer, Scale, Droplet, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useVitalSigns } from '@/hooks/useVitalSigns';

interface VitalSignsFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function VitalSignsFormSheet({ isOpen, onClose, onSuccess }: VitalSignsFormSheetProps) {
  const { addVitalSign } = useVitalSigns();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    weight: '',
    temperature: '',
    blood_glucose: '',
    oxygen_saturation: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addVitalSign({
        recorded_at: new Date().toISOString(),
        blood_pressure_systolic: formData.blood_pressure_systolic ? Number(formData.blood_pressure_systolic) : undefined,
        blood_pressure_diastolic: formData.blood_pressure_diastolic ? Number(formData.blood_pressure_diastolic) : undefined,
        heart_rate: formData.heart_rate ? Number(formData.heart_rate) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        temperature: formData.temperature ? Number(formData.temperature) : undefined,
        blood_glucose: formData.blood_glucose ? Number(formData.blood_glucose) : undefined,
        oxygen_saturation: formData.oxygen_saturation ? Number(formData.oxygen_saturation) : undefined,
        notes: formData.notes || undefined,
      });

      // Reset form
      setFormData({
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        heart_rate: '',
        weight: '',
        temperature: '',
        blood_glucose: '',
        oxygen_saturation: '',
        notes: '',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving vital signs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Record Vital Signs
          </SheetTitle>
          <SheetDescription>
            Enter your current health measurements
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Blood Pressure */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Heart className="h-4 w-4 text-red-500" />
              Blood Pressure
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="systolic" className="text-xs text-muted-foreground">Systolic (mmHg)</Label>
                <Input
                  id="systolic"
                  type="number"
                  placeholder="120"
                  value={formData.blood_pressure_systolic}
                  onChange={(e) => handleChange('blood_pressure_systolic', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="diastolic" className="text-xs text-muted-foreground">Diastolic (mmHg)</Label>
                <Input
                  id="diastolic"
                  type="number"
                  placeholder="80"
                  value={formData.blood_pressure_diastolic}
                  onChange={(e) => handleChange('blood_pressure_diastolic', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Heart Rate */}
          <div className="space-y-2">
            <Label htmlFor="heart_rate" className="flex items-center gap-2 text-base font-medium">
              <Activity className="h-4 w-4 text-primary" />
              Heart Rate (bpm)
            </Label>
            <Input
              id="heart_rate"
              type="number"
              placeholder="72"
              value={formData.heart_rate}
              onChange={(e) => handleChange('heart_rate', e.target.value)}
            />
          </div>

          {/* Blood Glucose */}
          <div className="space-y-2">
            <Label htmlFor="blood_glucose" className="flex items-center gap-2 text-base font-medium">
              <Droplet className="h-4 w-4 text-blue-500" />
              Blood Glucose (mg/dL)
            </Label>
            <Input
              id="blood_glucose"
              type="number"
              placeholder="100"
              value={formData.blood_glucose}
              onChange={(e) => handleChange('blood_glucose', e.target.value)}
            />
          </div>

          {/* Oxygen Saturation */}
          <div className="space-y-2">
            <Label htmlFor="oxygen_saturation" className="flex items-center gap-2 text-base font-medium">
              <Wind className="h-4 w-4 text-cyan-500" />
              Oxygen Saturation (%)
            </Label>
            <Input
              id="oxygen_saturation"
              type="number"
              placeholder="98"
              max={100}
              value={formData.oxygen_saturation}
              onChange={(e) => handleChange('oxygen_saturation', e.target.value)}
            />
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight" className="flex items-center gap-2 text-base font-medium">
              <Scale className="h-4 w-4 text-green-500" />
              Weight (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="70"
              value={formData.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
            />
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <Label htmlFor="temperature" className="flex items-center gap-2 text-base font-medium">
              <Thermometer className="h-4 w-4 text-orange-500" />
              Temperature (°C)
            </Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              placeholder="36.6"
              value={formData.temperature}
              onChange={(e) => handleChange('temperature', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-medium">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about your readings..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 pb-8">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Saving...' : 'Save Vital Signs'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
