import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FamilyAppointment {
  id: string;
  family_group_id: string;
  patient_id: string;
  created_by: string;
  title: string;
  description?: string;
  appointment_type: 'medical' | 'dental' | 'therapy' | 'specialist' | 'emergency' | 'consultation';
  appointment_date: string;
  duration_minutes: number;
  provider_name?: string;
  provider_contact?: string;
  location?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  patient?: any;
  creator?: any;
}

export interface AppointmentReminder {
  id: string;
  appointment_id: string;
  reminder_time: string;
  notification_type: 'push' | 'sms' | 'email';
  is_sent: boolean;
  created_at: string;
}

export class AppointmentService {
  async createAppointment(
    familyGroupId: string,
    patientId: string,
    appointmentData: {
      title: string;
      description?: string;
      appointment_type: FamilyAppointment['appointment_type'];
      appointment_date: string;
      duration_minutes?: number;
      provider_name?: string;
      provider_contact?: string;
      location?: string;
    }
  ): Promise<FamilyAppointment | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('family_appointments')
        .insert({
          family_group_id: familyGroupId,
          patient_id: patientId,
          created_by: user.id,
          title: appointmentData.title,
          description: appointmentData.description,
          appointment_type: appointmentData.appointment_type,
          appointment_date: appointmentData.appointment_date,
          duration_minutes: appointmentData.duration_minutes || 60,
          provider_name: appointmentData.provider_name,
          provider_contact: appointmentData.provider_contact,
          location: appointmentData.location,
          status: 'scheduled'
        })
        .select(`
          *,
          patient:profiles!family_appointments_patient_id_fkey(display_name, email, avatar_url),
          creator:profiles!family_appointments_created_by_fkey(display_name, email, avatar_url)
        `)
        .single();

      if (error) throw error;

      const typedData = data as FamilyAppointment;

      // Create automatic reminders
      await this.createAutomaticReminders(typedData.id, appointmentData.appointment_date);

      // Notify family members
      await this.notifyAppointmentCreated(typedData);

      // Log activity
      await this.logAppointmentActivity(familyGroupId, 'appointment_scheduled', {
        appointment_id: typedData.id,
        title: appointmentData.title,
        date: appointmentData.appointment_date
      });

      toast.success('Appointment scheduled successfully');
      return typedData;
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to schedule appointment');
      return null;
    }
  }

  async getFamilyAppointments(
    familyGroupId: string,
    status?: FamilyAppointment['status'],
    upcoming = false
  ): Promise<FamilyAppointment[]> {
    try {
      let query = supabase
        .from('family_appointments')
        .select(`
          *,
          patient:profiles!family_appointments_patient_id_fkey(display_name, email, avatar_url),
          creator:profiles!family_appointments_created_by_fkey(display_name, email, avatar_url)
        `)
        .eq('family_group_id', familyGroupId);

      if (status) {
        query = query.eq('status', status);
      }

      if (upcoming) {
        query = query.gte('appointment_date', new Date().toISOString());
      }

      const { data, error } = await query.order('appointment_date', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as FamilyAppointment[];
    } catch (error) {
      console.error('Error fetching family appointments:', error);
      return [];
    }
  }

  async getMyAppointments(upcoming = false): Promise<FamilyAppointment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('family_appointments')
        .select(`
          *,
          patient:profiles!family_appointments_patient_id_fkey(display_name, email, avatar_url),
          creator:profiles!family_appointments_created_by_fkey(display_name, email, avatar_url)
        `)
        .or(`patient_id.eq.${user.id},created_by.eq.${user.id}`);

      if (upcoming) {
        query = query.gte('appointment_date', new Date().toISOString());
      }

      const { data, error } = await query.order('appointment_date', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as FamilyAppointment[];
    } catch (error) {
      console.error('Error fetching my appointments:', error);
      return [];
    }
  }

  async updateAppointmentStatus(
    appointmentId: string,
    status: FamilyAppointment['status'],
    notes?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('family_appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select('family_group_id, title, appointment_date')
        .single();

      if (error) throw error;

      // Log activity
      if (data) {
        await this.logAppointmentActivity(data.family_group_id, 'appointment_status_changed', {
          appointment_id: appointmentId,
          title: data.title,
          new_status: status,
          notes
        });

        // Notify family if status is significant
        if (['completed', 'cancelled', 'no_show'].includes(status)) {
          await this.notifyAppointmentStatusChange(data, status);
        }
      }

      toast.success(`Appointment marked as ${status.replace('_', ' ')}`);
      return true;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
      return false;
    }
  }

  async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('family_appointments')
        .update({ 
          appointment_date: newDate,
          status: 'scheduled',
          reminder_sent: false
        })
        .eq('id', appointmentId)
        .select('family_group_id, title')
        .single();

      if (error) throw error;

      // Recreate reminders for new date
      await this.createAutomaticReminders(appointmentId, newDate);

      // Log activity
      if (data) {
        await this.logAppointmentActivity(data.family_group_id, 'appointment_rescheduled', {
          appointment_id: appointmentId,
          title: data.title,
          new_date: newDate,
          reason
        });

        // Notify family members
        await this.notifyAppointmentRescheduled(data, newDate, reason);
      }

      toast.success('Appointment rescheduled successfully');
      return true;
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast.error('Failed to reschedule appointment');
      return false;
    }
  }

  async cancelAppointment(appointmentId: string, reason?: string): Promise<boolean> {
    return this.updateAppointmentStatus(appointmentId, 'cancelled', reason);
  }

  async getUpcomingAppointments(familyGroupId: string, days = 7): Promise<FamilyAppointment[]> {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const { data, error } = await supabase
        .from('family_appointments')
        .select(`
          *,
          patient:profiles!family_appointments_patient_id_fkey(display_name, email, avatar_url),
          creator:profiles!family_appointments_created_by_fkey(display_name, email, avatar_url)
        `)
        .eq('family_group_id', familyGroupId)
        .gte('appointment_date', new Date().toISOString())
        .lte('appointment_date', endDate.toISOString())
        .in('status', ['scheduled', 'confirmed'])
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as FamilyAppointment[];
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      return [];
    }
  }

  async searchAppointments(
    familyGroupId: string,
    query: string
  ): Promise<FamilyAppointment[]> {
    try {
      const { data, error } = await supabase
        .from('family_appointments')
        .select(`
          *,
          patient:profiles!family_appointments_patient_id_fkey(display_name, email, avatar_url),
          creator:profiles!family_appointments_created_by_fkey(display_name, email, avatar_url)
        `)
        .eq('family_group_id', familyGroupId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,provider_name.ilike.%${query}%`)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as FamilyAppointment[];
    } catch (error) {
      console.error('Error searching appointments:', error);
      return [];
    }
  }

  async getAppointmentsByType(
    familyGroupId: string,
    type: FamilyAppointment['appointment_type']
  ): Promise<FamilyAppointment[]> {
    try {
      const { data, error } = await supabase
        .from('family_appointments')
        .select(`
          *,
          patient:profiles!family_appointments_patient_id_fkey(display_name, email, avatar_url),
          creator:profiles!family_appointments_created_by_fkey(display_name, email, avatar_url)
        `)
        .eq('family_group_id', familyGroupId)
        .eq('appointment_type', type)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as FamilyAppointment[];
    } catch (error) {
      console.error('Error fetching appointments by type:', error);
      return [];
    }
  }

  private async createAutomaticReminders(
    appointmentId: string,
    appointmentDate: string
  ): Promise<void> {
    try {
      const date = new Date(appointmentDate);
      const reminders = [
        { hours: 24, type: 'push' as const },
        { hours: 2, type: 'push' as const },
        { hours: 0.5, type: 'push' as const }
      ];

      const reminderData = reminders.map(reminder => {
        const reminderTime = new Date(date);
        reminderTime.setHours(reminderTime.getHours() - reminder.hours);
        
        return {
          appointment_id: appointmentId,
          reminder_time: reminderTime.toISOString(),
          notification_type: reminder.type,
          is_sent: false
        };
      }).filter(r => new Date(r.reminder_time) > new Date()); // Only future reminders

      if (reminderData.length > 0) {
        // Note: This would be stored in a reminders table in a full implementation
        console.log('Would create reminders:', reminderData);
      }
    } catch (error) {
      console.error('Error creating automatic reminders:', error);
    }
  }

  private async notifyAppointmentCreated(appointment: FamilyAppointment): Promise<void> {
    try {
      // Get family members
      const { data: members } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_group_id', appointment.family_group_id)
        .eq('invitation_status', 'accepted');

      if (members) {
        for (const member of members) {
          if (member.user_id !== appointment.created_by) {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                user_id: member.user_id,
                title: '📅 New Appointment Scheduled',
                body: `${appointment.title} - ${new Date(appointment.appointment_date).toLocaleDateString()}`,
                data: {
                  type: 'appointment_created',
                  appointment_id: appointment.id,
                  family_group_id: appointment.family_group_id
                }
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error notifying appointment created:', error);
    }
  }

  private async notifyAppointmentStatusChange(
    appointment: any,
    status: string
  ): Promise<void> {
    try {
      // Get family members
      const { data: members } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_group_id', appointment.family_group_id)
        .eq('invitation_status', 'accepted');

      if (members) {
        for (const member of members) {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: member.user_id,
              title: '📅 Appointment Update',
              body: `${appointment.title} is now ${status.replace('_', ' ')}`,
              data: {
                type: 'appointment_status_changed',
                appointment_id: appointment.id,
                status
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error notifying appointment status change:', error);
    }
  }

  private async notifyAppointmentRescheduled(
    appointment: any,
    newDate: string,
    reason?: string
  ): Promise<void> {
    try {
      // Get family members
      const { data: members } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_group_id', appointment.family_group_id)
        .eq('invitation_status', 'accepted');

      if (members) {
        for (const member of members) {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: member.user_id,
              title: '📅 Appointment Rescheduled',
              body: `${appointment.title} moved to ${new Date(newDate).toLocaleDateString()}`,
              data: {
                type: 'appointment_rescheduled',
                appointment_id: appointment.id,
                new_date: newDate,
                reason
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error notifying appointment rescheduled:', error);
    }
  }

  private async logAppointmentActivity(
    familyGroupId: string,
    activityType: string,
    data: any
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('family_activity_log')
        .insert({
          user_id: user.id,
          family_group_id: familyGroupId,
          activity_type: activityType,
          activity_data: data,
          priority: 'normal'
        });
    } catch (error) {
      console.error('Error logging appointment activity:', error);
    }
  }
}

export const appointmentService = new AppointmentService();