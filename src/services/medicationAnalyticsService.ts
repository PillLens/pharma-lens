import { supabase } from '@/integrations/supabase/client';

export interface AdherenceData {
  name: string;
  adherence: number;
  missed: number;
  taken: number;
}

export interface EffectivenessData {
  medication: string;
  effectiveness: number;
  sideEffects: number;
}

export interface CategoryAdherence {
  name: string;
  value: number;
  color: string;
  count: number;
}

export interface TimePreference {
  time: string;
  medications: number;
  adherence: number;
}

export interface MedicationInsight {
  type: 'positive' | 'warning' | 'info' | 'urgent';
  title: string;
  description: string;
  action: string;
}

class MedicationAnalyticsService {
  // Calculate weekly adherence data from medication_adherence_log
  async getWeeklyAdherence(userId: string): Promise<AdherenceData[]> {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const { data: adherenceLog, error } = await supabase
        .from('medication_adherence_log')
        .select('*')
        .eq('user_id', userId)
        .gte('scheduled_time', weekStart.toISOString())
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      // Group by day of week
      const weeklyData: AdherenceData[] = [
        { name: 'Mon', adherence: 0, missed: 0, taken: 0 },
        { name: 'Tue', adherence: 0, missed: 0, taken: 0 },
        { name: 'Wed', adherence: 0, missed: 0, taken: 0 },
        { name: 'Thu', adherence: 0, missed: 0, taken: 0 },
        { name: 'Fri', adherence: 0, missed: 0, taken: 0 },
        { name: 'Sat', adherence: 0, missed: 0, taken: 0 },
        { name: 'Sun', adherence: 0, missed: 0, taken: 0 }
      ];

      adherenceLog?.forEach(log => {
        const dayIndex = new Date(log.scheduled_time).getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert Sunday=0 to Sunday=6
        
        if (log.status === 'taken') {
          weeklyData[adjustedIndex].taken++;
        } else if (log.status === 'missed') {
          weeklyData[adjustedIndex].missed++;
        }
      });

      // Calculate adherence percentages
      weeklyData.forEach(day => {
        const total = day.taken + day.missed;
        day.adherence = total > 0 ? Math.round((day.taken / total) * 100) : 100;
      });

      return weeklyData;
    } catch (error) {
      console.error('Error fetching weekly adherence:', error);
      return []; // Return empty array on error
    }
  }

  // Calculate medication effectiveness based on adherence and user feedback
  async getMedicationEffectiveness(userId: string): Promise<EffectivenessData[]> {
    try {
      const { data: medications, error } = await supabase
        .from('user_medications')
        .select(`
          *,
          medication_adherence_log(status)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const effectivenessData: EffectivenessData[] = medications?.map(med => {
        const adherenceLogs = med.medication_adherence_log || [];
        const takenCount = adherenceLogs.filter((log: any) => log.status === 'taken').length;
        const totalCount = adherenceLogs.length;
        
        const effectiveness = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 85;
        
        return {
          medication: med.medication_name,
          effectiveness,
          sideEffects: Math.floor(Math.random() * 30) + 10 // Random for now, should be from user feedback
        };
      }) || [];

      return effectivenessData;
    } catch (error) {
      console.error('Error fetching medication effectiveness:', error);
      return [];
    }
  }

  // Calculate adherence by medication category
  async getAdherenceByCategory(userId: string): Promise<CategoryAdherence[]> {
    try {
      const { data: medications, error } = await supabase
        .from('user_medications')
        .select(`
          *,
          medication_adherence_log(status)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      // Group medications by therapeutic class (simplified categories)
      const categories: Record<string, { medications: any[]; colors: string[] }> = {
        'Cardiovascular': { medications: [], colors: ['#ef4444'] },
        'Diabetes': { medications: [], colors: ['#3b82f6'] },
        'Pain Relief': { medications: [], colors: ['#8b5cf6'] },
        'Other': { medications: [], colors: ['#f59e0b'] }
      };

      medications?.forEach(med => {
        const medName = med.medication_name.toLowerCase();
        if (medName.includes('blood') || medName.includes('pressure') || medName.includes('heart')) {
          categories['Cardiovascular'].medications.push(med);
        } else if (medName.includes('diabetes') || medName.includes('metformin') || medName.includes('insulin')) {
          categories['Diabetes'].medications.push(med);
        } else if (medName.includes('pain') || medName.includes('ibuprofen') || medName.includes('aspirin')) {
          categories['Pain Relief'].medications.push(med);
        } else {
          categories['Other'].medications.push(med);
        }
      });

      const categoryData: CategoryAdherence[] = Object.entries(categories)
        .filter(([_, data]) => data.medications.length > 0)
        .map(([name, data]) => {
          const totalLogs = data.medications.reduce((sum, med) => 
            sum + (med.medication_adherence_log || []).length, 0
          );
          const takenLogs = data.medications.reduce((sum, med) => 
            sum + (med.medication_adherence_log || []).filter((log: any) => log.status === 'taken').length, 0
          );
          
          const adherence = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 85;
          
          return {
            name,
            value: adherence,
            color: data.colors[0],
            count: data.medications.length
          };
        });

      return categoryData;
    } catch (error) {
      console.error('Error fetching adherence by category:', error);
      return [];
    }
  }

  // Get time preferences based on reminder_time patterns
  async getTimePreferences(userId: string): Promise<TimePreference[]> {
    try {
      const { data: reminders, error } = await supabase
        .from('medication_reminders')
        .select(`
          reminder_time,
          medication_adherence_log(status)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      // Group by time periods
      const timeGroups: Record<string, { count: number; adherenceLogs: any[] }> = {
        '6:00 AM': { count: 0, adherenceLogs: [] },
        '12:00 PM': { count: 0, adherenceLogs: [] },
        '6:00 PM': { count: 0, adherenceLogs: [] },
        '9:00 PM': { count: 0, adherenceLogs: [] }
      };

      reminders?.forEach(reminder => {
        const time = reminder.reminder_time;
        const hour = parseInt(time.split(':')[0]);
        
        let timeSlot: string;
        if (hour >= 5 && hour < 10) timeSlot = '6:00 AM';
        else if (hour >= 10 && hour < 15) timeSlot = '12:00 PM';
        else if (hour >= 15 && hour < 20) timeSlot = '6:00 PM';
        else timeSlot = '9:00 PM';
        
        timeGroups[timeSlot].count++;
        if (reminder.medication_adherence_log) {
          timeGroups[timeSlot].adherenceLogs.push(...reminder.medication_adherence_log);
        }
      });

      const timePreferences: TimePreference[] = Object.entries(timeGroups).map(([time, data]) => {
        const totalLogs = data.adherenceLogs.length;
        const takenLogs = data.adherenceLogs.filter((log: any) => log.status === 'taken').length;
        const adherence = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 90;
        
        return {
          time,
          medications: data.count,
          adherence
        };
      }).filter(pref => pref.medications > 0);

      return timePreferences;
    } catch (error) {
      console.error('Error fetching time preferences:', error);
      return [];
    }
  }

  // Generate insights based on medication data
  async getMedicationInsights(userId: string): Promise<MedicationInsight[]> {
    try {
      const weeklyAdherence = await this.getWeeklyAdherence(userId);
      const timePreferences = await this.getTimePreferences(userId);
      
      const insights: MedicationInsight[] = [];
      
      // Check overall adherence
      const avgAdherence = weeklyAdherence.reduce((sum, day) => sum + day.adherence, 0) / weeklyAdherence.length;
      if (avgAdherence >= 90) {
        insights.push({
          type: 'positive',
          title: 'Great Consistency!',
          description: `You've maintained ${Math.round(avgAdherence)}% adherence this week.`,
          action: 'Keep it up!'
        });
      }
      
      // Check for problematic times
      const lowAdherenceTime = timePreferences.find(time => time.adherence < 80);
      if (lowAdherenceTime) {
        insights.push({
          type: 'warning',
          title: 'Timing Challenge',
          description: `${lowAdherenceTime.time} shows lower adherence rates.`,
          action: 'Consider adjusting reminder time'
        });
      }
      
      // Add medication effectiveness insight
      insights.push({
        type: 'info',
        title: 'Medication Tracking',
        description: 'Your consistent tracking helps identify patterns.',
        action: 'Share with doctor'
      });
      
      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  // Calculate overall statistics - filter out invalid entries
  async getOverallStats(userId: string) {
    try {
      const { data: adherenceLog, error } = await supabase
        .from('medication_adherence_log')
        .select('status, scheduled_time, medication_id')
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: false });

      if (error) throw error;

      // Get active reminders to validate which entries are legitimate
      const { data: reminders } = await supabase
        .from('medication_reminders')
        .select('reminder_time, medication_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      // Create a set of valid reminder times for validation
      const validReminderTimes = new Set();
      reminders?.forEach(r => {
        // Create the expected scheduled time format for this reminder
        const scheduledTime = new Date();
        const [hours, minutes] = r.reminder_time.split(':').map(Number);
        scheduledTime.setUTCHours(hours, minutes, 0, 0);
        
        // Add all possible dates (last 30 days) for this reminder time
        for (let i = 0; i < 30; i++) {
          const testDate = new Date(scheduledTime);
          testDate.setUTCDate(testDate.getUTCDate() - i);
          validReminderTimes.add(`${r.medication_id}-${testDate.toISOString()}`);
        }
      });

      // Filter adherence log to only include entries that match actual reminders
      const validLogs = adherenceLog?.filter(log => {
        const key = `${log.medication_id}-${log.scheduled_time}`;
        return validReminderTimes.has(key);
      }) || [];

      console.log(`[DEBUG] Analytics - Total logs: ${adherenceLog?.length}, Valid logs: ${validLogs.length}`);

      const totalDoses = validLogs.length;
      const takenDoses = validLogs.filter(log => log.status === 'taken').length;
      const averageAdherence = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
      
      // Calculate real streak based on consecutive days with all doses taken
      const currentStreak = this.calculateStreakFromLogs(validLogs);

      return {
        averageAdherence,
        currentStreak,
        totalDoses,
        takenDoses
      };
    } catch (error) {
      console.error('Error fetching overall stats:', error);
      return {
        averageAdherence: 0,
        currentStreak: 0,
        totalDoses: 0,
        takenDoses: 0
      };
    }
  }

  // Calculate streak from adherence logs
  private calculateStreakFromLogs(logs: any[]): number {
    if (logs.length === 0) return 0;

    // Group logs by date
    const logsByDate: Record<string, any[]> = {};
    logs.forEach(log => {
      const date = new Date(log.scheduled_time).toISOString().split('T')[0];
      if (!logsByDate[date]) {
        logsByDate[date] = [];
      }
      logsByDate[date].push(log);
    });

    // Get sorted dates (most recent first)
    const sortedDates = Object.keys(logsByDate).sort().reverse();
    
    let streak = 0;
    
    // Check each day backwards from most recent
    for (const date of sortedDates) {
      const dayLogs = logsByDate[date];
      
      // Check if all doses for this day were taken
      const allTaken = dayLogs.every(log => log.status === 'taken');
      const hasDoses = dayLogs.length > 0;
      
      if (hasDoses && allTaken) {
        streak++;
      } else if (hasDoses) {
        // If there were doses but not all taken, break the streak
        break;
      }
      // If no doses scheduled for this day, continue checking
    }

    return streak;
  }
}

export const medicationAnalyticsService = new MedicationAnalyticsService();