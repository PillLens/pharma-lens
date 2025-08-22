import React from 'react';
import { cn } from '@/lib/utils';
import { TranslatedText } from '@/components/TranslatedText';

interface MobileDaySelectorProps {
  selectedDays: number[];
  onDayToggle: (day: number) => void;
  className?: string;
}

const MobileDaySelector: React.FC<MobileDaySelectorProps> = ({
  selectedDays,
  onDayToggle,
  className
}) => {
  const daysOfWeek = [
    { value: 1, label: 'M', fullName: 'Monday' },
    { value: 2, label: 'T', fullName: 'Tuesday' },
    { value: 3, label: 'W', fullName: 'Wednesday' },
    { value: 4, label: 'T', fullName: 'Thursday' },
    { value: 5, label: 'F', fullName: 'Friday' },
    { value: 6, label: 'S', fullName: 'Saturday' },
    { value: 7, label: 'S', fullName: 'Sunday' }
  ];

  const handleDayPress = (day: number) => {
    onDayToggle(day);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const isAllSelected = selectedDays.length === 7;
  const isWeekdaysSelected = selectedDays.length === 5 && selectedDays.every(d => d >= 1 && d <= 5);
  const isWeekendsSelected = selectedDays.length === 2 && selectedDays.includes(6) && selectedDays.includes(7);

  const handleQuickSelect = (type: 'all' | 'weekdays' | 'weekends' | 'none') => {
    let newDays: number[] = [];
    
    switch (type) {
      case 'all':
        newDays = [1, 2, 3, 4, 5, 6, 7];
        break;
      case 'weekdays':
        newDays = [1, 2, 3, 4, 5];
        break;
      case 'weekends':
        newDays = [6, 7];
        break;
      case 'none':
        newDays = [];
        break;
    }
    
    // Toggle each day to match the desired selection
    newDays.forEach(day => {
      if (!selectedDays.includes(day)) {
        onDayToggle(day);
      }
    });
    
    // Remove days that shouldn't be selected
    selectedDays.forEach(day => {
      if (!newDays.includes(day)) {
        onDayToggle(day);
      }
    });

    if (navigator.vibrate) {
      navigator.vibrate(75);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Quick Select Buttons */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => handleQuickSelect('all')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200',
            isAllSelected
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
          )}
        >
          <TranslatedText translationKey="daySelector.everyday" fallback="Everyday" />
        </button>
        <button
          onClick={() => handleQuickSelect('weekdays')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200',
            isWeekdaysSelected
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
          )}
        >
          <TranslatedText translationKey="daySelector.weekdays" fallback="Weekdays" />
        </button>
        <button
          onClick={() => handleQuickSelect('weekends')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200',
            isWeekendsSelected
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
          )}
        >
          <TranslatedText translationKey="daySelector.weekends" fallback="Weekends" />
        </button>
      </div>

      {/* Day Selector Grid */}
      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map((day) => (
          <button
            key={day.value}
            onClick={() => handleDayPress(day.value)}
            className={cn(
              'aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 touch-manipulation',
              'hover:scale-105 active:scale-95',
              selectedDays.includes(day.value)
                ? 'bg-primary text-primary-foreground shadow-card scale-105'
                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
            )}
            aria-label={`Toggle ${day.fullName}`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Selected Days Summary */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {selectedDays.length === 0 && (
            <TranslatedText translationKey="daySelector.noDaysSelected" fallback="No days selected" />
          )}
          {selectedDays.length === 7 && (
            <TranslatedText translationKey="daySelector.everyDay" fallback="Every day" />
          )}
          {selectedDays.length === 5 && isWeekdaysSelected && (
            <TranslatedText translationKey="daySelector.weekdaysOnly" fallback="Weekdays only" />
          )}
          {selectedDays.length === 2 && isWeekendsSelected && (
            <TranslatedText translationKey="daySelector.weekendsOnly" fallback="Weekends only" />
          )}
          {selectedDays.length > 0 && !isAllSelected && !isWeekdaysSelected && !isWeekendsSelected && (
            <TranslatedText 
              translationKey="daySelector.customDays" 
              fallback={`${selectedDays.length} days selected`} 
            />
          )}
        </p>
      </div>
    </div>
  );
};

export default MobileDaySelector;