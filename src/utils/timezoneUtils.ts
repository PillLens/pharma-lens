import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format, parse, isAfter, isBefore, addDays, startOfDay } from 'date-fns';

/**
 * Get user's timezone from browser
 */
export const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC'; // Ultimate fallback
  }
};

/**
 * Get current time in specified timezone
 */
export const getCurrentTimeInTimezone = (timezone: string): Date => {
  return toZonedTime(new Date(), timezone);
};

/**
 * Parse time string (HH:mm) and convert to today's date in specified timezone
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
 * Get next dose time for different frequencies (LEGACY - Use medicationTimingService instead)
 * This is kept for backward compatibility but should be replaced with medicationTimingService
 */
export const getNextDoseTime = (
  frequency: string, 
  timezone: string,
  recentlyTaken: boolean = false
): { isDue: boolean; nextTime: string; isOverdue: boolean } => {
  console.warn('Using legacy getNextDoseTime - consider using medicationTimingService instead');
  
  const now = getCurrentTimeInTimezone(timezone);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  const checkTime = (timeStr: string, label: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const doseTimeInMinutes = hours * 60 + minutes;
    const windowStart = doseTimeInMinutes - 30; // 30 minutes before
    const windowEnd = doseTimeInMinutes + 30;   // 30 minutes after
    
    const isDue = currentTimeInMinutes >= windowStart && currentTimeInMinutes <= windowEnd && !recentlyTaken;
    const isPast = currentTimeInMinutes > windowEnd;
    const isOverdue = isPast && !recentlyTaken;
    
    return {
      time: timeStr,
      label,
      isDue,
      isPast,
      isOverdue,
      doseTimeInMinutes
    };
  };
  
  switch (frequency) {
    case 'once_daily': {
      const morning = checkTime('08:00', '8:00 AM');
      
      if (morning.isOverdue) {
        return { isDue: false, nextTime: 'Next: Tomorrow 8:00 AM', isOverdue: true };
      }
      if (morning.isDue) {
        return { isDue: true, nextTime: 'Due at 8:00 AM', isOverdue: false };
      }
      return { isDue: false, nextTime: 'Next: Tomorrow 8:00 AM', isOverdue: false };
    }
    
    case 'twice_daily': {
      const morning = checkTime('08:00', '8:00 AM');
      const evening = checkTime('20:00', '8:00 PM');
      
      // If both doses have passed for today
      if (morning.isPast && evening.isPast) {
        return { 
          isDue: false, 
          nextTime: 'Next: Tomorrow 8:00 AM', 
          isOverdue: evening.isOverdue || morning.isOverdue 
        };
      }
      
      // If evening dose is due or overdue
      if (evening.isDue) {
        return { isDue: true, nextTime: 'Due at 8:00 PM', isOverdue: false };
      }
      if (evening.isOverdue) {
        return { isDue: false, nextTime: 'Next: Tomorrow 8:00 AM', isOverdue: true };
      }
      
      // If morning dose is due or overdue, but evening is still upcoming
      if (morning.isDue) {
        return { isDue: true, nextTime: 'Due at 8:00 AM', isOverdue: false };
      }
      if (morning.isPast && !evening.isPast) {
        return { 
          isDue: false, 
          nextTime: 'Next: Today 8:00 PM', 
          isOverdue: morning.isOverdue 
        };
      }
      
      // Before first dose of the day
      return { isDue: false, nextTime: 'Next: Today 8:00 AM', isOverdue: false };
    }
    
    case 'three_times_daily': {
      const morning = checkTime('08:00', '8:00 AM');
      const afternoon = checkTime('14:00', '2:00 PM');
      const evening = checkTime('20:00', '8:00 PM');
      
      // If all doses have passed for today
      if (morning.isPast && afternoon.isPast && evening.isPast) {
        return { 
          isDue: false, 
          nextTime: 'Next: Tomorrow 8:00 AM', 
          isOverdue: evening.isOverdue || afternoon.isOverdue || morning.isOverdue 
        };
      }
      
      // Check evening dose
      if (evening.isDue) {
        return { isDue: true, nextTime: 'Due at 8:00 PM', isOverdue: false };
      }
      if (evening.isOverdue) {
        return { isDue: false, nextTime: 'Next: Tomorrow 8:00 AM', isOverdue: true };
      }
      if (!evening.isPast) {
        return { 
          isDue: false, 
          nextTime: 'Next: Today 8:00 PM', 
          isOverdue: afternoon.isOverdue || morning.isOverdue 
        };
      }
      
      // Check afternoon dose
      if (afternoon.isDue) {
        return { isDue: true, nextTime: 'Due at 2:00 PM', isOverdue: false };
      }
      if (afternoon.isPast && !evening.isPast) {
        return { 
          isDue: false, 
          nextTime: 'Next: Today 8:00 PM', 
          isOverdue: afternoon.isOverdue || morning.isOverdue 
        };
      }
      
      // Check morning dose
      if (morning.isDue) {
        return { isDue: true, nextTime: 'Due at 8:00 AM', isOverdue: false };
      }
      if (morning.isPast && !afternoon.isPast) {
        return { 
          isDue: false, 
          nextTime: 'Next: Today 2:00 PM', 
          isOverdue: morning.isOverdue 
        };
      }
      
      // Before first dose of the day
      return { isDue: false, nextTime: 'Next: Today 8:00 AM', isOverdue: false };
    }
    
    default:
      return { isDue: false, nextTime: 'As needed', isOverdue: false };
  }
};

/**
 * Format time for specified timezone
 */
export const formatTimeInTimezone = (date: Date, timezone: string, formatStr: string = 'HH:mm'): string => {
  return formatInTimeZone(date, timezone, formatStr);
};

/**
 * Creates a consistent scheduled time for medication reminders
 * Always creates the same UTC time for the same reminder time on the same day
 */
export const createScheduledTime = (reminderTime: string, timezone: string = 'UTC'): Date => {
  const [hours, minutes] = reminderTime.split(':').map(Number);
  
  // Create a date for today in UTC, then set the exact time
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const date = today.getUTCDate();
  
  // Create consistent UTC time - same reminder time always creates same UTC timestamp for same day
  const scheduledTime = new Date(Date.UTC(year, month, date, hours, minutes, 0, 0));
  
  console.log(`[DEBUG] createScheduledTime - input: ${reminderTime}, output: ${scheduledTime.toISOString()}`);
  
  return scheduledTime;
};