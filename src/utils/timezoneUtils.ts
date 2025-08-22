import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format, parse, isAfter, isBefore, addDays, startOfDay } from 'date-fns';

/**
 * Get user's timezone from profile or fallback to browser timezone
 */
export const getUserTimezone = (userTimezone?: string | null): string => {
  if (userTimezone) return userTimezone;
  
  // Fallback to browser's timezone
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC'; // Ultimate fallback
  }
};

/**
 * Get current time in user's timezone
 */
export const getCurrentTimeInTimezone = (timezone: string): Date => {
  return toZonedTime(new Date(), timezone);
};

/**
 * Parse time string (HH:mm) and convert to today's date in user's timezone
 */
export const parseTimeInTimezone = (timeString: string, timezone: string): Date => {
  const today = getCurrentTimeInTimezone(timezone);
  const todayStr = format(today, 'yyyy-MM-dd');
  const dateTimeStr = `${todayStr}T${timeString}:00`;
  
  try {
    const parsedDate = parse(dateTimeStr, "yyyy-MM-dd'T'HH:mm:ss", new Date());
    return toZonedTime(parsedDate, timezone);
  } catch (error) {
    console.error('Error parsing time:', error);
    return today;
  }
};

/**
 * Check if current time is within a dose window
 */
export const isDoseTime = (
  doseTime: string, 
  timezone: string, 
  windowMinutes: number = 30
): { isDue: boolean; isPast: boolean; isCurrent: boolean } => {
  const now = getCurrentTimeInTimezone(timezone);
  const doseDateTime = parseTimeInTimezone(doseTime, timezone);
  
  const windowStart = new Date(doseDateTime.getTime() - windowMinutes * 60 * 1000);
  const windowEnd = new Date(doseDateTime.getTime() + windowMinutes * 60 * 1000);
  
  const isCurrent = now >= windowStart && now <= windowEnd;
  const isPast = now > windowEnd;
  const isDue = now >= windowStart;
  
  return { isDue, isPast, isCurrent };
};

/**
 * Get next dose time for different frequencies
 */
export const getNextDoseTime = (
  frequency: string, 
  timezone: string, 
  recentlyTaken: boolean = false
): { isDue: boolean; nextTime: string; isOverdue: boolean } => {
  const now = getCurrentTimeInTimezone(timezone);
  const currentHour = now.getHours();
  
  const checkTime = (timeStr: string, label: string) => {
    const { isDue, isPast, isCurrent } = isDoseTime(timeStr, timezone, 30);
    return {
      time: timeStr,
      label,
      isDue: isDue && !recentlyTaken,
      isPast,
      isCurrent: isCurrent && !recentlyTaken,
      isOverdue: isPast && !recentlyTaken
    };
  };
  
  switch (frequency) {
    case 'once_daily': {
      const morning = checkTime('08:00', '8:00 AM');
      
      if (morning.isOverdue) {
        return { isDue: false, nextTime: 'Overdue: 8:00 AM', isOverdue: true };
      }
      if (morning.isDue || morning.isCurrent) {
        return { isDue: true, nextTime: 'Due at 8:00 AM', isOverdue: false };
      }
      return { isDue: false, nextTime: 'Next: Tomorrow 8:00 AM', isOverdue: false };
    }
    
    case 'twice_daily': {
      const morning = checkTime('08:00', '8:00 AM');
      const evening = checkTime('20:00', '8:00 PM');
      
      if (evening.isOverdue) {
        return { isDue: false, nextTime: 'Overdue: 8:00 PM', isOverdue: true };
      }
      if (evening.isDue || evening.isCurrent) {
        return { isDue: true, nextTime: 'Due at 8:00 PM', isOverdue: false };
      }
      if (morning.isOverdue && currentHour < 20) {
        return { isDue: false, nextTime: 'Next: Today 8:00 PM (Morning dose overdue)', isOverdue: true };
      }
      if (morning.isDue || morning.isCurrent) {
        return { isDue: true, nextTime: 'Due at 8:00 AM', isOverdue: false };
      }
      if (currentHour >= 8 && currentHour < 20) {
        return { isDue: false, nextTime: 'Next: Today 8:00 PM', isOverdue: false };
      }
      return { isDue: false, nextTime: 'Next: Tomorrow 8:00 AM', isOverdue: false };
    }
    
    case 'three_times_daily': {
      const morning = checkTime('08:00', '8:00 AM');
      const afternoon = checkTime('14:00', '2:00 PM');
      const evening = checkTime('20:00', '8:00 PM');
      
      if (evening.isOverdue) {
        return { isDue: false, nextTime: 'Overdue: 8:00 PM', isOverdue: true };
      }
      if (evening.isDue || evening.isCurrent) {
        return { isDue: true, nextTime: 'Due at 8:00 PM', isOverdue: false };
      }
      if (afternoon.isOverdue && currentHour < 20) {
        return { isDue: false, nextTime: 'Next: Today 8:00 PM (2:00 PM dose overdue)', isOverdue: true };
      }
      if (afternoon.isDue || afternoon.isCurrent) {
        return { isDue: true, nextTime: 'Due at 2:00 PM', isOverdue: false };
      }
      if (morning.isOverdue && currentHour < 14) {
        return { isDue: false, nextTime: 'Next: Today 2:00 PM (Morning dose overdue)', isOverdue: true };
      }
      if (morning.isDue || morning.isCurrent) {
        return { isDue: true, nextTime: 'Due at 8:00 AM', isOverdue: false };
      }
      if (currentHour >= 8 && currentHour < 14) {
        return { isDue: false, nextTime: 'Next: Today 2:00 PM', isOverdue: false };
      }
      if (currentHour >= 14 && currentHour < 20) {
        return { isDue: false, nextTime: 'Next: Today 8:00 PM', isOverdue: false };
      }
      return { isDue: false, nextTime: 'Next: Tomorrow 8:00 AM', isOverdue: false };
    }
    
    default:
      return { isDue: false, nextTime: 'As needed', isOverdue: false };
  }
};

/**
 * Format time for user's timezone
 */
export const formatTimeInTimezone = (date: Date, timezone: string, formatStr: string = 'HH:mm'): string => {
  return formatInTimeZone(date, timezone, formatStr);
};