import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface FrequencyChipsProps {
  selected: string;
  onSelect: (frequency: string) => void;
  className?: string;
}

const FrequencyChips: React.FC<FrequencyChipsProps> = ({
  selected,
  onSelect,
  className
}) => {
  const { t } = useTranslation();

  const frequencies = [
    { key: 'once_daily', label: t('medications.frequency.onceDaily') },
    { key: 'twice_daily', label: t('medications.frequency.twiceDaily') },
    { key: 'three_times', label: t('medications.frequency.threeTimes') },
    { key: 'four_times', label: t('medications.frequency.fourTimes') },
    { key: 'every_8h', label: t('medications.frequency.every8h') },
    { key: 'every_12h', label: t('medications.frequency.every12h') },
    { key: 'as_needed', label: t('medications.frequency.asNeeded') },
    { key: 'custom', label: t('medications.frequency.custom') }
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {t('medications.selectFrequency')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {frequencies.map((freq) => (
          <button
            key={freq.key}
            onClick={() => onSelect(freq.key)}
            className={cn(
              "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 touch-target",
              "border border-border hover:border-primary/50",
              "flex items-center justify-center text-center",
              selected === freq.key
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-card-foreground hover:bg-accent"
            )}
          >
            {freq.label}
          </button>
        ))}
      </div>

      {selected === 'custom' && (
        <div className="mt-4 p-4 bg-accent/50 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground text-center">
            Custom frequency - set specific times in the reminder section
          </p>
        </div>
      )}
    </div>
  );
};

export default FrequencyChips;