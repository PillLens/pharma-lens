import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MedicationPreferences {
  default_time_slots: string[];
  refill_advance_days: number;
  adherence_reminder_frequency: string;
  privacy_mode: boolean;
}

interface MedicationPreferencesSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function MedicationPreferencesSheet({ open, onClose, userId }: MedicationPreferencesSheetProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<MedicationPreferences>({
    default_time_slots: ['09:00', '13:00', '18:00', '21:00'],
    refill_advance_days: 7,
    adherence_reminder_frequency: 'daily',
    privacy_mode: false
  });

  useEffect(() => {
    if (open) {
      loadPreferences();
    }
  }, [open]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('medication_preferences')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data?.medication_preferences) {
        setPreferences(data.medication_preferences as any);
      }
    } catch (error) {
      console.error('Error loading medication preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ medication_preferences: preferences as any })
        .eq('id', userId);

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_activity', {
        p_activity_type: 'settings_updated',
        p_activity_data: { section: 'medication_preferences' }
      });

      toast.success('Preferences saved');
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Medication Preferences</SheetTitle>
          <SheetDescription>
            Customize your medication management settings
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label>Refill Reminder Advance Days</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={preferences.refill_advance_days}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    refill_advance_days: parseInt(e.target.value) || 7
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Get reminded to refill medications this many days before running out
              </p>
            </div>

            <div className="space-y-2">
              <Label>Adherence Reminder Frequency</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={preferences.adherence_reminder_frequency}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    adherence_reminder_frequency: e.target.value
                  })
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never</option>
              </select>
              <p className="text-sm text-muted-foreground">
                How often to receive adherence summary reminders
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Privacy Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Hide medication names in notifications
                </p>
              </div>
              <Switch
                checked={preferences.privacy_mode}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, privacy_mode: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Default Time Slots</Label>
              <div className="grid grid-cols-2 gap-2">
                {preferences.default_time_slots.map((time, index) => (
                  <Input
                    key={index}
                    type="time"
                    value={time}
                    onChange={(e) => {
                      const newSlots = [...preferences.default_time_slots];
                      newSlots[index] = e.target.value;
                      setPreferences({ ...preferences, default_time_slots: newSlots });
                    }}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Default times for medication reminders
              </p>
            </div>
          </div>
        )}

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
