import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SmartDeletionResult {
  deletedReminders: number;
  deletedMedications: number;
  preservedMedications: number;
  preservedReasons: string[];
}

export class SmartTrialDeletionService {
  /**
   * Smart deletion for trial expiration - deletes unselected reminders and smartly handles medications
   */
  static async handleTrialExpirationDeletion(
    selectedReminderId: string,
    allReminders: any[],
    userId: string
  ): Promise<SmartDeletionResult> {
    const result: SmartDeletionResult = {
      deletedReminders: 0,
      deletedMedications: 0,
      preservedMedications: 0,
      preservedReasons: []
    };

    try {
      // 1. Get unselected reminders
      const unselectedReminders = allReminders.filter(r => r.id !== selectedReminderId);
      
      if (unselectedReminders.length === 0) {
        return result;
      }

      // 2. Get unique medication IDs from unselected reminders
      const medicationIds = [...new Set(
        unselectedReminders
          .map(r => r.medication_id)
          .filter(Boolean)
      )];

      // 3. Analyze each medication for smart deletion
      const medicationAnalysis = await Promise.all(
        medicationIds.map(medId => this.analyzeMedicationForDeletion(medId, userId))
      );

      // 4. Delete unselected reminders first
      const reminderDeletePromises = unselectedReminders.map(reminder => 
        this.deleteReminderAndNotifications(reminder)
      );
      
      await Promise.all(reminderDeletePromises);
      result.deletedReminders = unselectedReminders.length;

      // 5. Handle medication deletions based on analysis
      for (let i = 0; i < medicationIds.length; i++) {
        const medId = medicationIds[i];
        const analysis = medicationAnalysis[i];

        if (analysis.shouldDelete) {
          const success = await this.deleteMedication(medId, userId);
          if (success) {
            result.deletedMedications++;
          }
        } else {
          result.preservedMedications++;
          result.preservedReasons.push(analysis.reason);
        }
      }

      return result;

    } catch (error) {
      console.error('Error in smart trial deletion:', error);
      throw new Error('Failed to process trial expiration deletion');
    }
  }

  /**
   * Analyze if a medication should be deleted or preserved
   */
  private static async analyzeMedicationForDeletion(
    medicationId: string,
    userId: string
  ): Promise<{ shouldDelete: boolean; reason: string }> {
    
    try {
      // Check if medication is shared with family
      const { data: sharedMeds, error: shareError } = await supabase
        .from('shared_medications')
        .select('*')
        .eq('medication_id', medicationId);

      if (shareError) throw shareError;

      if (sharedMeds && sharedMeds.length > 0) {
        return { shouldDelete: false, reason: 'Shared with family members' };
      }

      // Check adherence history
      const { data: adherenceLogs, error: adherenceError } = await supabase
        .from('medication_adherence_log')
        .select('*')
        .eq('medication_id', medicationId)
        .eq('user_id', userId);

      if (adherenceError) throw adherenceError;

      const adherenceCount = adherenceLogs?.length || 0;

      // Check medication age
      const { data: medication, error: medError } = await supabase
        .from('user_medications')
        .select('created_at, start_date')
        .eq('id', medicationId)
        .eq('user_id', userId)
        .single();

      if (medError) throw medError;

      const createdAt = new Date(medication.created_at);
      const daysSinceCreated = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Decision logic
      if (adherenceCount >= 5) {
        return { shouldDelete: false, reason: 'Has substantial adherence history' };
      }

      if (daysSinceCreated > 7) {
        return { shouldDelete: false, reason: 'Used for more than 7 days' };
      }

      // Check if medication has other active reminders
      const { data: otherReminders, error: reminderError } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('medication_id', medicationId)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (reminderError) throw reminderError;

      if (otherReminders && otherReminders.length > 0) {
        return { shouldDelete: false, reason: 'Has other active reminders' };
      }

      // Safe to delete: no sharing, minimal history, new medication, no other reminders
      return { shouldDelete: true, reason: 'Safe to delete - minimal usage' };

    } catch (error) {
      console.error('Error analyzing medication:', error);
      // If we can't analyze, err on the side of caution and preserve
      return { shouldDelete: false, reason: 'Analysis failed - preserved for safety' };
    }
  }

  /**
   * Delete a reminder and cancel its native notifications
   */
  private static async deleteReminderAndNotifications(reminder: any): Promise<boolean> {
    try {
      // Cancel native notifications first
      try {
        const { nativeNotificationManager } = await import('@/services/nativeNotificationManager');
        await nativeNotificationManager.cancelReminder(reminder.id);
      } catch (notifError) {
        console.warn('Failed to cancel notifications:', notifError);
        // Don't fail the whole operation for notification cancellation
      }

      // Delete the reminder
      const { error } = await supabase
        .from('medication_reminders')
        .delete()
        .eq('id', reminder.id);

      if (error) throw error;
      return true;

    } catch (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }
  }

  /**
   * Delete a medication
   */
  private static async deleteMedication(medicationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_medications')
        .delete()
        .eq('id', medicationId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;

    } catch (error) {
      console.error('Error deleting medication:', error);
      return false;
    }
  }

  /**
   * Generate user-friendly summary message
   */
  static generateSummaryMessage(result: SmartDeletionResult): string {
    const parts = [];
    
    if (result.deletedReminders > 0) {
      parts.push(`${result.deletedReminders} reminder${result.deletedReminders > 1 ? 's' : ''}`);
    }
    
    if (result.deletedMedications > 0) {
      parts.push(`${result.deletedMedications} medication${result.deletedMedications > 1 ? 's' : ''}`);
    }

    const deletedText = parts.length > 0 ? `Deleted ${parts.join(' and ')}.` : '';
    const preservedText = result.preservedMedications > 0 
      ? ` Preserved ${result.preservedMedications} medication${result.preservedMedications > 1 ? 's' : ''} (shared or with history).`
      : '';

    return `${deletedText}${preservedText} Successfully configured for free plan.`;
  }
}