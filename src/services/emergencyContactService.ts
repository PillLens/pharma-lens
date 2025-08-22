import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class EmergencyContactService {
  async getUserEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      return [];
    }
  }

  async addEmergencyContact(contact: Omit<EmergencyContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<EmergencyContact | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          ...contact,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Emergency contact added successfully');
      return data;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      toast.error('Failed to add emergency contact');
      return null;
    }
  }

  async updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Emergency contact updated');
      return true;
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      toast.error('Failed to update emergency contact');
      return false;
    }
  }

  async deleteEmergencyContact(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast.success('Emergency contact removed');
      return true;
    } catch (error) {
      console.error('Error removing emergency contact:', error);
      toast.error('Failed to remove emergency contact');
      return false;
    }
  }

  async triggerEmergencyCall(contactId?: string): Promise<boolean> {
    try {
      const contacts = await this.getUserEmergencyContacts();
      if (contacts.length === 0) {
        toast.error('No emergency contacts configured');
        return false;
      }

      const contact = contactId 
        ? contacts.find(c => c.id === contactId)
        : contacts[0]; // Use highest priority contact

      if (!contact) {
        toast.error('Emergency contact not found');
        return false;
      }

      // In a real implementation, this would integrate with phone/calling APIs
      // For now, we'll show the contact details
      toast.success(`Emergency contact: ${contact.name} - ${contact.phone}`);
      
      // Log the emergency call
      await this.logEmergencyEvent('emergency_call', { contactId: contact.id });
      
      return true;
    } catch (error) {
      console.error('Error triggering emergency call:', error);
      toast.error('Failed to initiate emergency call');
      return false;
    }
  }

  private async logEmergencyEvent(eventType: string, data: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Log to security audit logs
      await supabase
        .from('security_audit_logs')
        .insert({
          user_id: user.id,
          action: eventType,
          resource_type: 'emergency_contact',
          additional_context: data,
          sensitive_data_accessed: true
        });
    } catch (error) {
      console.error('Error logging emergency event:', error);
    }
  }
}

export const emergencyContactService = new EmergencyContactService();