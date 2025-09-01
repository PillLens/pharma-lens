import { supabase } from '@/integrations/supabase/client';
import { createScheduledTime } from '@/utils/timezoneUtils';

export class ScheduledDoseService {
  /**
   * Generate scheduled doses for today based on active reminders - Fixed duplicate prevention
   */
  async generateTodaysScheduledDoses(userId: string): Promise<void> {
    try {
      // Get active reminders
      const { data: reminders } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!reminders || reminders.length === 0) return;

      const today = new Date();
      const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday (0) to 7
      
      // Get today's date boundaries 
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Get existing entries for today to avoid duplicates - check both scheduled and taken
      const { data: existingEntries } = await supabase
        .from('medication_adherence_log')
        .select('medication_id, scheduled_time, status')
        .eq('user_id', userId)
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString());

      console.log(`[DEBUG] Existing entries for today:`, existingEntries);

      // Create a set of existing keys with exact scheduled times
      const existingKeys = new Set(
        existingEntries?.map(entry => `${entry.medication_id}-${entry.scheduled_time}`) || []
      );

      const scheduledEntries = [];

      for (const reminder of reminders) {
        // Check if this reminder should fire today
        if (reminder.days_of_week.includes(currentDayOfWeek)) {
          const scheduledTime = createScheduledTime(reminder.reminder_time);
          const entryKey = `${reminder.medication_id}-${scheduledTime.toISOString()}`;

          console.log(`[DEBUG] Checking reminder ${reminder.reminder_time} -> ${scheduledTime.toISOString()}, key: ${entryKey}`);
          console.log(`[DEBUG] Existing keys:`, Array.from(existingKeys));

          // Only add if not already exists
          if (!existingKeys.has(entryKey)) {
            scheduledEntries.push({
              user_id: userId,
              medication_id: reminder.medication_id,
              scheduled_time: scheduledTime.toISOString(),
              status: 'scheduled'
            });
            console.log(`[DEBUG] Adding new scheduled entry for ${reminder.reminder_time}`);
          } else {
            console.log(`[DEBUG] Entry already exists for ${reminder.reminder_time}`);
          }
        }
      }

      console.log(`[DEBUG] Scheduled entries to insert:`, scheduledEntries);

      if (scheduledEntries.length > 0) {
        const { error } = await supabase
          .from('medication_adherence_log')
          .insert(scheduledEntries);
        
        if (error) {
          console.error('[ERROR] Failed to insert scheduled entries:', error);
        } else {
          console.log(`[DEBUG] Successfully inserted ${scheduledEntries.length} scheduled entries`);
        }
      }
    } catch (error) {
      console.error('Error generating scheduled doses:', error);
    }
  }

  /**
   * Mark a scheduled dose as taken with correct timing - Fixed to prevent duplicates
   */
  async markScheduledDoseAsTaken(
    userId: string,
    medicationId: string,
    reminderTime: string,
    notes?: string
  ): Promise<boolean> {
    try {
      // First ensure today's scheduled doses are generated
      await this.generateTodaysScheduledDoses(userId);

      // Find ANY existing dose for today (regardless of status) 
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Look for any existing dose entry for this medication today
      const { data: existingDoses } = await supabase
        .from('medication_adherence_log')
        .select('id, status, scheduled_time, taken_time')
        .eq('user_id', userId)
        .eq('medication_id', medicationId)
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString());

      console.log(`[DEBUG] Found ${existingDoses?.length || 0} existing doses for medication ${medicationId}:`, existingDoses);

      // Find the dose that matches this reminder time (more flexible matching)
      let targetDose = null;
      if (existingDoses) {
        for (const dose of existingDoses) {
          const doseTime = new Date(dose.scheduled_time);
          const doseTimeStr = `${doseTime.getHours().toString().padStart(2, '0')}:${doseTime.getMinutes().toString().padStart(2, '0')}`;
          const reminderTimeShort = reminderTime.substring(0, 5); // Get HH:MM part
          
          console.log(`[DEBUG] Comparing dose time ${doseTimeStr} with reminder time ${reminderTimeShort}`);
          
          if (doseTimeStr === reminderTimeShort) {
            targetDose = dose;
            break;
          }
        }
      }

      if (targetDose) {
        // Update the existing dose to mark it as taken (only if not already taken)
        if (targetDose.status !== 'taken') {
          const { error } = await supabase
            .from('medication_adherence_log')
            .update({
              status: 'taken',
              taken_time: new Date().toISOString(),
              notes: notes || 'Marked via Take Now button',
              reported_by: userId
            })
            .eq('id', targetDose.id);

          console.log(`[DEBUG] Updated existing dose ${targetDose.id} from ${targetDose.status} to taken, error:`, error);
          return !error;
        } else {
          console.log(`[DEBUG] Dose ${targetDose.id} already marked as taken`);
          return true;
        }
      }

      // If no dose found, create a new one with the scheduled time
      console.log(`[DEBUG] No existing dose found for ${reminderTime}, creating new entry`);
      const scheduledTime = createScheduledTime(reminderTime);
      
      const { error } = await supabase
        .from('medication_adherence_log')
        .insert({
          user_id: userId,
          medication_id: medicationId,
          scheduled_time: scheduledTime.toISOString(),
          taken_time: new Date().toISOString(),
          status: 'taken',
          notes: notes || 'Marked via Take Now button'
        });

      console.log(`[DEBUG] Created new entry, error:`, error);
      
      if (error) {
        console.error(`[ERROR] Failed to create dose entry:`, error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error marking dose as taken:', error);
      return false;
    }
  }

  /**
   * Clean up duplicate adherence entries that are within 1 minute of each other
   */
  async cleanupDuplicateEntries(userId: string): Promise<void> {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all adherence entries for today
      const { data: allEntries } = await supabase
        .from('medication_adherence_log')
        .select('id, medication_id, scheduled_time, status, taken_time')
        .eq('user_id', userId)
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString())
        .order('medication_id, scheduled_time');

      if (!allEntries || allEntries.length === 0) return;

      console.log(`[DEBUG] All entries before cleanup:`, allEntries);

      const groupedByMedication = new Map();
      
      // Group entries by medication
      allEntries.forEach(entry => {
        if (!groupedByMedication.has(entry.medication_id)) {
          groupedByMedication.set(entry.medication_id, []);
        }
        groupedByMedication.get(entry.medication_id).push(entry);
      });

      const entriesToDelete = [];

      // Check for duplicates within each medication group
      for (const [medicationId, entries] of groupedByMedication) {
        for (let i = 0; i < entries.length; i++) {
          for (let j = i + 1; j < entries.length; j++) {
            const entry1 = entries[i];
            const entry2 = entries[j];
            
            const time1 = new Date(entry1.scheduled_time);
            const time2 = new Date(entry2.scheduled_time);
            
            // If entries are within 1 minute of each other
            const timeDiff = Math.abs(time1.getTime() - time2.getTime());
            if (timeDiff <= 60000) { // 1 minute in milliseconds
              // Keep the entry with 'taken' status, or the later one if both have same status
              const entryToDelete = entry1.status === 'taken' ? entry2 : 
                                   entry2.status === 'taken' ? entry1 :
                                   (time1 > time2 ? entry1 : entry2);
              
              if (!entriesToDelete.some(e => e.id === entryToDelete.id)) {
                entriesToDelete.push(entryToDelete);
              }
            }
          }
        }
      }

      console.log(`[DEBUG] Entries to delete:`, entriesToDelete);

      // Delete duplicate entries
      if (entriesToDelete.length > 0) {
        const deleteIds = entriesToDelete.map(e => e.id);
        const { error } = await supabase
          .from('medication_adherence_log')
          .delete()
          .in('id', deleteIds);

        if (error) {
          console.error('[ERROR] Failed to delete duplicate entries:', error);
        } else {
          console.log(`[DEBUG] Successfully deleted ${deleteIds.length} duplicate entries`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up duplicate entries:', error);
    }
  }

  /**
   * Get today's adherence status for dashboard - Fixed counting based on active reminders
   */
  async getTodaysAdherenceStatus(userId: string) {
    try {
      // First clean up any duplicate entries
      await this.cleanupDuplicateEntries(userId);
      
      // Then ensure today's scheduled doses are generated
      await this.generateTodaysScheduledDoses(userId);

      const today = new Date();
      const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Get active reminders for today to know expected doses
      const { data: activeReminders } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      // Calculate expected doses for today based on active reminders
      const expectedToday = activeReminders?.filter(r => 
        r.days_of_week.includes(currentDayOfWeek)
      ).length || 0;

      // Get actual adherence data for today
      const { data: adherenceData } = await supabase
        .from('medication_adherence_log')
        .select('medication_id, scheduled_time, status')
        .eq('user_id', userId)
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString())
        .order('medication_id, scheduled_time, status');

      if (!adherenceData) {
        return {
          totalToday: expectedToday,
          completedToday: 0,
          missedToday: 0,
          pendingToday: expectedToday
        };
      }

      // Group by medication_id + scheduled_time to eliminate duplicates
      const uniqueDoses = new Map();
      
      console.log(`[DEBUG] Raw adherence data for today:`, adherenceData);
      
      adherenceData.forEach(entry => {
        const key = `${entry.medication_id}-${entry.scheduled_time}`;
        const existing = uniqueDoses.get(key);
        
        // Only keep the entry with highest priority: taken > missed > scheduled
        if (!existing || 
            (entry.status === 'taken' && existing.status !== 'taken') ||
            (entry.status === 'missed' && existing.status === 'scheduled')) {
          uniqueDoses.set(key, entry);
        }
      });
      
      console.log(`[DEBUG] Unique doses after deduplication:`, Array.from(uniqueDoses.values()));

      const uniqueEntries = Array.from(uniqueDoses.values());
      const taken = uniqueEntries.filter(a => a.status === 'taken').length;
      const scheduled = uniqueEntries.filter(a => a.status === 'scheduled').length;
      const missed = uniqueEntries.filter(a => a.status === 'missed').length;

      // Use expected doses as the total, not the sum of database entries
      return {
        totalToday: expectedToday,
        completedToday: taken,
        missedToday: missed,
        pendingToday: expectedToday - taken - missed
      };
    } catch (error) {
      console.error('Error getting adherence status:', error);
      return {
        totalToday: 0,
        completedToday: 0,
        missedToday: 0,
        pendingToday: 0
      };
    }
  }
}

export const scheduledDoseService = new ScheduledDoseService();