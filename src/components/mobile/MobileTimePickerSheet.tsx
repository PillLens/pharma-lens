import React, { useState, useRef, useEffect } from 'react';
import { Clock, Check } from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { cn } from '@/lib/utils';
import { TranslatedText } from '@/components/TranslatedText';

interface MobileTimePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeSelect: (time: string) => void;
  selectedTime?: string;
  title?: string;
}

const MobileTimePickerSheet: React.FC<MobileTimePickerSheetProps> = ({
  isOpen,
  onClose,
  onTimeSelect,
  selectedTime = '08:00',
  title = 'Select Time'
}) => {
  const [hours, setHours] = useState(parseInt(selectedTime.split(':')[0]));
  const [minutes, setMinutes] = useState(parseInt(selectedTime.split(':')[1]));
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  const hoursArray = Array.from({ length: 24 }, (_, i) => i);
  const minutesArray = Array.from({ length: 60 }, (_, i) => i);

  useEffect(() => {
    if (isOpen) {
      // Scroll to selected values
      setTimeout(() => {
        if (hoursRef.current) {
          const hourElement = hoursRef.current.children[hours] as HTMLElement;
          hourElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (minutesRef.current) {
          const minuteElement = minutesRef.current.children[minutes] as HTMLElement;
          minuteElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [isOpen, hours, minutes]);

  const handleConfirm = () => {
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    onTimeSelect(timeString);
    onClose();
  };

  const formatHour = (hour: number) => {
    return hour.toString().padStart(2, '0');
  };

  const formatMinute = (minute: number) => {
    return minute.toString().padStart(2, '0');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Time Picker Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-xl shadow-floating border-t border-border animate-slide-up">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              <TranslatedText translationKey="timePicker.title" fallback={title} />
            </h2>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatHour(hours)}:{formatMinute(minutes)}
          </div>
        </div>

        {/* Time Picker */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Hours Column */}
            <div className="flex flex-col items-center">
              <label className="text-sm font-medium text-muted-foreground mb-3">
                <TranslatedText translationKey="timePicker.hours" fallback="Hours" />
              </label>
              <div 
                ref={hoursRef}
                className="h-40 overflow-y-auto scroll-smooth scrollbar-hide"
                style={{ scrollSnapType: 'y mandatory' }}
              >
                <div className="py-16"> {/* Padding for centering */}
                  {hoursArray.map((hour) => (
                    <div
                      key={hour}
                      className={cn(
                        'h-12 flex items-center justify-center cursor-pointer transition-all duration-200 rounded-lg mx-2',
                        'scroll-snap-align-center',
                        hour === hours
                          ? 'bg-primary text-primary-foreground font-semibold scale-110 shadow-card'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      )}
                      onClick={() => setHours(hour)}
                    >
                      {formatHour(hour)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="text-2xl font-bold text-muted-foreground mt-8">:</div>

            {/* Minutes Column */}
            <div className="flex flex-col items-center">
              <label className="text-sm font-medium text-muted-foreground mb-3">
                <TranslatedText translationKey="timePicker.minutes" fallback="Minutes" />
              </label>
              <div 
                ref={minutesRef}
                className="h-40 overflow-y-auto scroll-smooth scrollbar-hide"
                style={{ scrollSnapType: 'y mandatory' }}
              >
                <div className="py-16"> {/* Padding for centering */}
                  {minutesArray.filter(m => m % 5 === 0).map((minute) => (
                    <div
                      key={minute}
                      className={cn(
                        'h-12 flex items-center justify-center cursor-pointer transition-all duration-200 rounded-lg mx-2',
                        'scroll-snap-align-center',
                        minute === minutes
                          ? 'bg-primary text-primary-foreground font-semibold scale-110 shadow-card'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      )}
                      onClick={() => setMinutes(minute)}
                    >
                      {formatMinute(minute)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Time Buttons */}
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
              <TranslatedText translationKey="timePicker.quickSelect" fallback="Quick Select" />
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '8:00', value: [8, 0] },
                { label: '12:00', value: [12, 0] },
                { label: '18:00', value: [18, 0] },
                { label: '22:00', value: [22, 0] }
              ].map(({ label, value }) => (
                <MobileButton
                  key={label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHours(value[0]);
                    setMinutes(value[1]);
                  }}
                  className={cn(
                    'h-10 text-xs',
                    hours === value[0] && minutes === value[1] && 'border-primary bg-primary/5'
                  )}
                >
                  {label}
                </MobileButton>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <MobileButton
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              <TranslatedText translationKey="common.cancel" fallback="Cancel" />
            </MobileButton>
            <MobileButton
              onClick={handleConfirm}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              <TranslatedText translationKey="common.confirm" fallback="Confirm" />
            </MobileButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileTimePickerSheet;