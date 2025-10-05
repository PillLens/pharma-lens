import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ThemeSelectorProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function ThemeSelector({ open, onClose, userId }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme || 'system');

  useEffect(() => {
    if (theme) {
      setSelectedTheme(theme);
    }
  }, [theme]);

  const handleThemeChange = async (newTheme: string) => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ theme: newTheme })
        .eq('id', userId);

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_activity', {
        p_activity_type: 'theme_changed',
        p_activity_data: { theme: newTheme }
      });

      toast.success('Theme updated');
    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error('Failed to save theme preference');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[400px]">
        <SheetHeader>
          <SheetTitle>Choose Theme</SheetTitle>
          <SheetDescription>
            Select your preferred color scheme
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <RadioGroup value={selectedTheme} onValueChange={handleThemeChange}>
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-3 cursor-pointer flex-1">
                <Sun className="h-5 w-5" />
                <div>
                  <p className="font-medium">Light</p>
                  <p className="text-sm text-muted-foreground">Bright and clean</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer mt-3">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-3 cursor-pointer flex-1">
                <Moon className="h-5 w-5" />
                <div>
                  <p className="font-medium">Dark</p>
                  <p className="text-sm text-muted-foreground">Easy on the eyes</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer mt-3">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center gap-3 cursor-pointer flex-1">
                <Monitor className="h-5 w-5" />
                <div>
                  <p className="font-medium">System</p>
                  <p className="text-sm text-muted-foreground">Follow device settings</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </SheetContent>
    </Sheet>
  );
}
