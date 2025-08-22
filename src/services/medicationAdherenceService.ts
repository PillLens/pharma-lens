import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdherenceRecord {
  id: string;
  user_id: string;
  medication_id: string;
  scheduled_time: string;
  taken_time?: string;
  status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  notes?: string;
  reported_by?: string;
  created_at: string;
}

export interface AdherenceStats {
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  skippedDoses: number;
  adherenceRate: number;
  streak: number;
  lastTaken?: string;
}

export interface MedicationReminder {
  id: string;
  user_id: string;
  medication_id: string;
  reminder_time: string;
  days_of_week: number[];
  is_active: boolean;
  notification_settings: {
    sound: boolean;
    vibration: boolean;
    led: boolean;
  };
  created_at: string;
  updated_at: string;
}

export class MedicationAdherenceService {
  async recordMedicationTaken(
    medicationId: string,
    scheduledTime: string,
    actualTime?: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('medication_adherence_log')
        .insert({
          user_id: user.id,
          medication_id: medicationId,
          scheduled_time: scheduledTime,
          taken_time: actualTime || new Date().toISOString(),
          status: 'taken',
          notes,
          reported_by: user.id
        });

      if (error) throw error;

      // Log family activity
      await this.logMedicationActivity(medicationId, 'medication_taken', {
        scheduled_time: scheduledTime,
        taken_time: actualTime,
        notes
      });

      toast.success('Medication marked as taken');
      return true;
    } catch (error) {
      console.error('Error recording medication taken:', error);
      toast.error('Failed to record medication');
      return false;
    }
  }

  async recordMedicationMissed(
    medicationId: string,
    scheduledTime: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('medication_adherence_log')
        .insert({
          user_id: user.id,
          medication_id: medicationId,
          scheduled_time: scheduledTime,
          status: 'missed',
          notes: reason,
          reported_by: user.id
        });

      if (error) throw error;

      // Send notification to caregivers
      await this.notifyCaregiversOfMissedDose(medicationId, scheduledTime, reason);

      toast.warning('Medication marked as missed');
      return true;
    } catch (error) {
      console.error('Error recording missed medication:', error);
      toast.error('Failed to record missed medication');
      return false;
    }
  }

  async getAdherenceHistory(
    medicationId: string,
    days = 30
  ): Promise<AdherenceRecord[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data, error } = await supabase
        .from('medication_adherence_log')
        .select(`
          *,
          medication:user_medications!medication_adherence_log_medication_id_fkey(medication_name, dosage),
          reporter:profiles!medication_adherence_log_reported_by_fkey(display_name, email)
        `)
        .eq('user_id', user.id)
        .eq('medication_id', medicationId)
        .gte('scheduled_time', fromDate.toISOString())
        .order('scheduled_time', { ascending: false });

      if (error) throw error;
      return (data || []) as AdherenceRecord[];
    } catch (error) {
      console.error('Error fetching adherence history:', error);
      return [];
    }
  }

  async getAdherenceStats(medicationId: string, days = 30): Promise<AdherenceStats> {
    try {
      const history = await this.getAdherenceHistory(medicationId, days);
      
      const totalDoses = history.length;
      const takenDoses = history.filter(h => h.status === 'taken').length;
      const missedDoses = history.filter(h => h.status === 'missed').length;
      const skippedDoses = history.filter(h => h.status === 'skipped').length;
      
      const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;
      
      // Calculate current streak
      let streak = 0;
      const sortedHistory = history.sort((a, b) => 
        new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime()
      );
      
      for (const record of sortedHistory) {
        if (record.status === 'taken') {
          streak++;
        } else {
          break;
        }
      }

      const lastTaken = history
        .filter(h => h.status === 'taken')
        .sort((a, b) => new Date(b.taken_time || '').getTime() - new Date(a.taken_time || '').getTime())[0]?.taken_time;

      return {
        totalDoses,
        takenDoses,
        missedDoses,
        skippedDoses,
        adherenceRate,
        streak,
        lastTaken
      };
    } catch (error) {
      console.error('Error calculating adherence stats:', error);
      return {
        totalDoses: 0,
        takenDoses: 0,
        missedDoses: 0,
        skippedDoses: 0,
        adherenceRate: 0,
        streak: 0
      };
    }
  }

  async setupMedicationReminder(
    medicationId: string,
    reminderTime: string,
    daysOfWeek: number[],
    notificationSettings: MedicationReminder['notification_settings']
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('medication_reminders')
        .upsert({
          user_id: user.id,
          medication_id: medicationId,
          reminder_time: reminderTime,
          days_of_week: daysOfWeek,
          notification_settings: notificationSettings,
          is_active: true
        });

      if (error) throw error;

      toast.success('Medication reminder set');
      return true;
    } catch (error) {
      console.error('Error setting medication reminder:', error);
      toast.error('Failed to set reminder');
      return false;
    }
  }

  async getMedicationReminders(): Promise<MedicationReminder[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('medication_reminders')
        .select(`
          *,
          medication:user_medications!medication_reminders_medication_id_fkey(medication_name, dosage, frequency)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('reminder_time');

      if (error) throw error;
      return (data || []) as MedicationReminder[];
    } catch (error) {
      console.error('Error fetching medication reminders:', error);
      return [];
    }
  }

  async generateScheduledDoses(medicationId: string, days = 7): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get medication details and reminders
      const { data: reminders } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('medication_id', medicationId)
        .eq('is_active', true);

      if (!reminders || reminders.length === 0) return;

      const scheduledDoses = [];
      const startDate = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayOfWeek = date.getDay() || 7; // Convert Sunday (0) to 7

        for (const reminder of reminders) {
          if (reminder.days_of_week.includes(dayOfWeek)) {
            const [hours, minutes] = reminder.reminder_time.split(':');
            const scheduledTime = new Date(date);
            scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // Check if this dose is already scheduled
            const { data: existing } = await supabase
              .from('medication_adherence_log')
              .select('id')
              .eq('user_id', user.id)
              .eq('medication_id', medicationId)
              .eq('scheduled_time', scheduledTime.toISOString())
              .single();

            if (!existing) {
              scheduledDoses.push({
                user_id: user.id,
                medication_id: medicationId,
                scheduled_time: scheduledTime.toISOString(),
                status: 'scheduled',
                reported_by: user.id
              });
            }
          }
        }
      }

      if (scheduledDoses.length > 0) {
        await supabase
          .from('medication_adherence_log')
          .insert(scheduledDoses);
      }
    } catch (error) {
      console.error('Error generating scheduled doses:', error);
    }
  }

  async getFamilyAdherenceOverview(familyGroupId: string): Promise<any[]> {
    try {
      // Get family members
      const { data: members } = await supabase
        .from('family_members')
        .select('user_id, user_profile:profiles!family_members_user_id_fkey(display_name, email)')
        .eq('family_group_id', familyGroupId)
        .eq('invitation_status', 'accepted');

      if (!members) return [];

      const adherenceData = [];

      for (const member of members) {
        // Get member's medications
        const { data: medications } = await supabase
          .from('user_medications')
          .select('id, medication_name')
          .eq('user_id', member.user_id)
          .eq('is_active', true);

        if (medications) {
          for (const medication of medications) {
            const stats = await this.getAdherenceStats(medication.id);
            adherenceData.push({
              userId: member.user_id,
              userName: member.user_profile?.display_name || member.user_profile?.email,
              medicationId: medication.id,
              medicationName: medication.medication_name,
              ...stats
            });
          }
        }
      }

      return adherenceData;
    } catch (error) {
      console.error('Error fetching family adherence overview:', error);
      return [];
    }
  }

  private async logMedicationActivity(
    medicationId: string,
    activityType: string,
    data: any
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's family groups
      const { data: userGroups } = await supabase
        .from('family_members')
        .select('family_group_id')
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted');

      if (userGroups) {
        for (const group of userGroups) {
          await supabase
            .from('family_activity_log')
            .insert({
              user_id: user.id,
              family_group_id: group.family_group_id,
              activity_type: activityType,
              activity_data: { medication_id: medicationId, ...data },
              priority: 'normal'
            });
        }
      }
    } catch (error) {
      console.error('Error logging medication activity:', error);
    }
  }

  private async notifyCaregiversOfMissedDose(
    medicationId: string,
    scheduledTime: string,
    reason?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get medication name
      const { data: medication } = await supabase
        .from('user_medications')
        .select('medication_name')
        .eq('id', medicationId)
        .single();

      // Get user's family groups and notify caregivers
      const { data: userGroups } = await supabase
        .from('family_members')
        .select('family_group_id')
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted');

      if (userGroups && medication) {
        for (const group of userGroups) {
          // Get caregivers in this group
          const { data: caregivers } = await supabase
            .from('family_members')
            .select('user_id')
            .eq('family_group_id', group.family_group_id)
            .eq('role', 'caregiver')
            .eq('invitation_status', 'accepted');

          if (caregivers) {
            for (const caregiver of caregivers) {
              await supabase.functions.invoke('send-push-notification', {
                body: {
                  user_id: caregiver.user_id,
                  title: '⚠️ Missed Medication Alert',
                  body: `${medication.medication_name} was missed at ${new Date(scheduledTime).toLocaleTimeString()}`,
                  data: {
                    type: 'missed_medication',
                    medication_id: medicationId,
                    scheduled_time: scheduledTime,
                    reason
                  }
                }
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error notifying caregivers of missed dose:', error);
    }
  }
}

export const medicationAdherenceService = new MedicationAdherenceService();