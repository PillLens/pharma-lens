import { supabase } from "@/integrations/supabase/client";

interface OptimalTimeAnalysis {
  recommendedTime: string;
  confidence: number;
  reasoning: string;
}

interface MissedDoseRecovery {
  canTakeNow: boolean;
  nextSafeTime?: string;
  warning?: string;
}

interface MedicationConflict {
  hasConflict: boolean;
  conflictingMedication?: string;
  conflictType?: string;
  severity?: 'low' | 'medium' | 'high';
  recommendation?: string;
}

class IntelligentReminderService {
  /**
   * Analyze user's adherence patterns to suggest optimal reminder times
   */
  async suggestOptimalTime(userId: string, medicationId: string): Promise<OptimalTimeAnalysis> {
    try {
      // Fetch historical adherence data
      const { data: adherenceData } = await supabase
        .from('medication_adherence_log')
        .select('scheduled_time, taken_time, status')
        .eq('user_id', userId)
        .eq('medication_id', medicationId)
        .eq('status', 'taken')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!adherenceData || adherenceData.length < 5) {
        return {
          recommendedTime: '08:00',
          confidence: 0.3,
          reasoning: 'Insufficient data. Starting with morning time (8 AM).'
        };
      }

      // Analyze when user most consistently takes medication
      const timeAnalysis = adherenceData.reduce((acc, log) => {
        const scheduledHour = new Date(log.scheduled_time).getHours();
        const takenHour = log.taken_time ? new Date(log.taken_time).getHours() : null;
        
        if (takenHour !== null) {
          const diff = Math.abs(takenHour - scheduledHour);
          if (diff <= 1) {
            acc[scheduledHour] = (acc[scheduledHour] || 0) + 1;
          }
        }
        return acc;
      }, {} as Record<number, number>);

      // Find most consistent time
      const bestHour = Object.entries(timeAnalysis)
        .sort(([, a], [, b]) => b - a)[0];

      if (bestHour) {
        const [hour, count] = bestHour;
        const confidence = Math.min(count / adherenceData.length, 1);
        return {
          recommendedTime: `${hour.toString().padStart(2, '0')}:00`,
          confidence,
          reasoning: `You take your medication most consistently at ${hour}:00 (${Math.round(confidence * 100)}% adherence)`
        };
      }

      return {
        recommendedTime: '08:00',
        confidence: 0.5,
        reasoning: 'Based on general patterns, morning time recommended.'
      };
    } catch (error) {
      console.error('Error suggesting optimal time:', error);
      return {
        recommendedTime: '08:00',
        confidence: 0.3,
        reasoning: 'Error analyzing data. Using default time.'
      };
    }
  }

  /**
   * Check if user can safely take a missed dose now
   */
  async checkMissedDoseRecovery(
    userId: string,
    medicationId: string,
    missedTime: string,
    frequency: string
  ): Promise<MissedDoseRecovery> {
    try {
      const now = new Date();
      const missed = new Date(missedTime);
      const hoursSinceMissed = (now.getTime() - missed.getTime()) / (1000 * 60 * 60);

      // Get medication reminders to find next scheduled dose
      const { data: reminders } = await supabase
        .from('medication_reminders')
        .select('reminder_time')
        .eq('user_id', userId)
        .eq('medication_id', medicationId)
        .eq('is_active', true);

      if (!reminders || reminders.length === 0) {
        return {
          canTakeNow: true,
          warning: 'Unable to verify next dose time'
        };
      }

      // Find next scheduled dose
      const nextReminder = reminders
        .map(r => {
          const [hours, minutes] = r.reminder_time.split(':').map(Number);
          const nextDose = new Date(now);
          nextDose.setHours(hours, minutes, 0, 0);
          if (nextDose <= now) {
            nextDose.setDate(nextDose.getDate() + 1);
          }
          return nextDose;
        })
        .sort((a, b) => a.getTime() - b.getTime())[0];

      const hoursUntilNext = (nextReminder.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Determine frequency-based minimum gap
      let minimumGap = 4; // hours
      if (frequency.includes('daily')) minimumGap = 6;
      if (frequency.includes('twice')) minimumGap = 4;
      if (frequency.includes('three') || frequency.includes('thrice')) minimumGap = 3;

      if (hoursUntilNext < minimumGap) {
        return {
          canTakeNow: false,
          nextSafeTime: nextReminder.toISOString(),
          warning: `Too close to next dose. Wait until ${nextReminder.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        };
      }

      if (hoursSinceMissed > 12) {
        return {
          canTakeNow: false,
          warning: 'Too late to take this dose safely. Continue with your regular schedule.'
        };
      }

      return {
        canTakeNow: true
      };
    } catch (error) {
      console.error('Error checking missed dose recovery:', error);
      return {
        canTakeNow: false,
        warning: 'Unable to verify safety. Consult your healthcare provider.'
      };
    }
  }

  /**
   * Check for timing conflicts with other medications
   */
  async checkMedicationConflicts(
    userId: string,
    proposedTime: string,
    excludeMedicationId?: string
  ): Promise<MedicationConflict> {
    try {
      // Get all active reminders for this user
      const { data: reminders } = await supabase
        .from('medication_reminders')
        .select(`
          *,
          user_medications!inner (
            medication_name,
            frequency,
            notes
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .neq('medication_id', excludeMedicationId || '');

      if (!reminders || reminders.length === 0) {
        return { hasConflict: false };
      }

      const [propHours, propMinutes] = proposedTime.split(':').map(Number);
      const proposedMinutes = propHours * 60 + propMinutes;

      // Check for reminders within 30 minutes
      for (const reminder of reminders) {
        const [remHours, remMinutes] = reminder.reminder_time.split(':').map(Number);
        const reminderMinutes = remHours * 60 + remMinutes;
        const diff = Math.abs(proposedMinutes - reminderMinutes);

        if (diff <= 30) {
          // Check if medications should be taken separately
          const notes = reminder.user_medications?.notes?.toLowerCase() || '';
          const shouldSeparate = notes.includes('take separately') || 
                                 notes.includes('on empty stomach') ||
                                 notes.includes('before food');

          if (shouldSeparate) {
            return {
              hasConflict: true,
              conflictingMedication: reminder.user_medications?.medication_name,
              conflictType: 'timing',
              severity: 'medium',
              recommendation: `Consider spacing this at least 1 hour from ${reminder.user_medications?.medication_name}`
            };
          }

          // Mild warning for close timing
          return {
            hasConflict: true,
            conflictingMedication: reminder.user_medications?.medication_name,
            conflictType: 'close_timing',
            severity: 'low',
            recommendation: `This is close to ${reminder.user_medications?.medication_name}. Consider spacing if needed.`
          };
        }
      }

      return { hasConflict: false };
    } catch (error) {
      console.error('Error checking medication conflicts:', error);
      return { hasConflict: false };
    }
  }

  /**
   * Log reminder action to history
   */
  async logReminderAction(
    userId: string,
    reminderId: string,
    medicationId: string,
    actionType: string,
    actionData?: any
  ): Promise<void> {
    try {
      await supabase
        .from('reminder_history')
        .insert({
          user_id: userId,
          reminder_id: reminderId,
          medication_id: medicationId,
          action_type: actionType,
          action_data: actionData || {}
        });
    } catch (error) {
      console.error('Error logging reminder action:', error);
    }
  }
}

export const intelligentReminderService = new IntelligentReminderService();