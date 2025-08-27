import { format, addDays, isToday, isTomorrow, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

export interface NextDoseInfo {
  time: string;
  date: Date;
  formattedTime: string;
  isToday: boolean;
  isTomorrow: boolean;
  minutesUntil: number;
}

export function calculateNextDose(
  reminderTime: string, // "14:30"
  daysOfWeek: number[], // [1,2,3,4,5,6,7] where 1=Monday, 7=Sunday
  timezone: string = 'UTC'
): NextDoseInfo | null {
  try {
    const now = toZonedTime(new Date(), timezone);
    const [hours, minutes] = reminderTime.split(':').map(Number);
    
    // Create today's dose time
    let nextDoseDate = setMilliseconds(
      setSeconds(
        setMinutes(
          setHours(now, hours),
          minutes
        ),
        0
      ),
      0
    );
    
    // Get current day of week (1=Monday, 7=Sunday)
    let currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    
    // If today's dose time has passed or today isn't a scheduled day, find next occurrence
    let searchDay = currentDayOfWeek;
    let daysToAdd = 0;
    let foundNextDose = false;
    
    // Check if today's dose is still upcoming
    if (daysOfWeek.includes(currentDayOfWeek) && nextDoseDate > now) {
      foundNextDose = true;
    } else {
      // Look for the next scheduled day (up to 7 days ahead)
      for (let i = 1; i <= 7; i++) {
        daysToAdd = i;
        searchDay = ((currentDayOfWeek - 1 + i) % 7) + 1; // Convert to 1-7 range
        if (daysOfWeek.includes(searchDay)) {
          foundNextDose = true;
          break;
        }
      }
    }
    
    if (!foundNextDose) {
      return null; // No scheduled days found
    }
    
    // Calculate the next dose date
    if (daysToAdd > 0) {
      nextDoseDate = addDays(nextDoseDate, daysToAdd);
    }
    
    const minutesUntil = Math.round((nextDoseDate.getTime() - now.getTime()) / (1000 * 60));
    
    return {
      time: reminderTime,
      date: nextDoseDate,
      formattedTime: formatInTimeZone(nextDoseDate, timezone, 'h:mm a'),
      isToday: isToday(nextDoseDate),
      isTomorrow: isTomorrow(nextDoseDate),
      minutesUntil: Math.max(0, minutesUntil)
    };
    
  } catch (error) {
    console.error('Error calculating next dose:', error);
    return null;
  }
}

export function formatTimeUntilNext(minutesUntil: number): string {
  if (minutesUntil < 60) {
    return `${minutesUntil}m`;
  } else if (minutesUntil < 1440) { // Less than 24 hours
    const hours = Math.floor(minutesUntil / 60);
    const minutes = minutesUntil % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    const days = Math.floor(minutesUntil / 1440);
    const hours = Math.floor((minutesUntil % 1440) / 60);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
}