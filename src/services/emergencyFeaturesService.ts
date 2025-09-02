import { supabase } from '@/integrations/supabase/client';

interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  priority: number;
  is_active: boolean;
  user_id: string;
}

interface EmergencyProtocol {
  id: string;
  name: string;
  type: 'medical' | 'safety' | 'general';
  description: string;
  steps: string[];
  emergency_contacts: string[];
  family_group_id: string;
  is_active: boolean;
}

interface EmergencyAlert {
  id?: string;
  type: 'medical' | 'safety' | 'location' | 'general';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'resolved' | 'cancelled';
  created_by: string;
  family_group_id: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_at?: string;
  resolved_at?: string;
}

class EmergencyFeaturesService {

  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      return [];
    }
  }

  async createEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact | null> {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert(contact)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating emergency contact:', error);
      throw error;
    }
  }

  async updateEmergencyContact(
    contactId: string, 
    updates: Partial<EmergencyContact>
  ): Promise<EmergencyContact | null> {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .update(updates)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      throw error;
    }
  }

  async deleteEmergencyContact(contactId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .update({ is_active: false })
        .eq('id', contactId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      throw error;
    }
  }

  async getEmergencyProtocols(familyGroups: any[]): Promise<EmergencyProtocol[]> {
    if (!familyGroups?.length) return [];

    try {
      const groupIds = familyGroups.map(g => g.id);
      
      // For now, return mock protocols as the table doesn't exist yet
      // In production, this would query the emergency_protocols table
      return this.getMockEmergencyProtocols(groupIds);
    } catch (error) {
      console.error('Error fetching emergency protocols:', error);
      return [];
    }
  }

  async sendEmergencyAlert(alert: Omit<EmergencyAlert, 'id' | 'created_at' | 'status'>): Promise<void> {
    try {
      // Insert the emergency alert (mock implementation)
      // In production, this would:
      // 1. Insert into emergency_alerts table
      // 2. Send push notifications to family members
      // 3. Send SMS/email notifications to emergency contacts
      // 4. Update location sharing if location-based emergency

      // For now, we'll log the emergency activity
      const { error } = await supabase
        .from('family_activity_log')
        .insert({
          family_group_id: alert.family_group_id,
          user_id: alert.created_by,
          activity_type: 'emergency_alert',
          priority: alert.priority,
          activity_data: {
            alert_type: alert.type,
            title: alert.title,
            message: alert.message,
            location: alert.location
          }
        });

      if (error) throw error;

      // Send push notifications to family members
      await this.notifyFamilyMembers(alert);

    } catch (error) {
      console.error('Error sending emergency alert:', error);
      throw error;
    }
  }

  async getRecentEmergencyAlerts(familyGroups: any[]): Promise<EmergencyAlert[]> {
    if (!familyGroups?.length) return [];

    try {
      const groupIds = familyGroups.map(g => g.id);
      
      // Get recent emergency activities from family_activity_log
      const { data, error } = await supabase
        .from('family_activity_log')
        .select(`
          id,
          user_id,
          activity_data,
          priority,
          created_at,
          family_group_id,
          profiles:user_id (display_name, email)
        `)
        .in('family_group_id', groupIds)
        .eq('activity_type', 'emergency_alert')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Transform activity logs into alert format
      return (data || []).map(activity => ({
        id: activity.id,
        type: activity.activity_data?.alert_type || 'general',
        title: activity.activity_data?.title || 'Emergency Alert',
        message: activity.activity_data?.message || 'Emergency alert sent',
        priority: activity.priority as 'low' | 'medium' | 'high' | 'critical',
        status: 'resolved' as const, // For historical alerts, assume resolved
        created_by: activity.user_id,
        family_group_id: activity.family_group_id,
        location: activity.activity_data?.location,
        created_at: activity.created_at,
        resolved_at: activity.created_at // Mock resolved time
      }));

    } catch (error) {
      console.error('Error fetching recent emergency alerts:', error);
      return [];
    }
  }

  async resolveEmergencyAlert(alertId: string): Promise<void> {
    try {
      // In production, this would update the emergency_alerts table
      // For now, we'll update the activity log
      const { error } = await supabase
        .from('family_activity_log')
        .update({
          activity_data: supabase.raw('activity_data || ?', [{ resolved_at: new Date().toISOString() }])
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resolving emergency alert:', error);
      throw error;
    }
  }

  async getLocationBasedEmergencyFeatures(userId: string): Promise<{
    nearbyHospitals: any[];
    nearbyPharmacies: any[];
    emergencyServices: any[];
  }> {
    // This would integrate with location services and emergency databases
    // For now, return mock data
    return {
      nearbyHospitals: [],
      nearbyPharmacies: [],
      emergencyServices: [
        { name: 'Emergency Services', phone: '911', type: 'emergency' },
        { name: 'Poison Control', phone: '1-800-222-1222', type: 'poison' },
        { name: 'Mental Health Crisis', phone: '988', type: 'mental_health' }
      ]
    };
  }

  private async notifyFamilyMembers(alert: Omit<EmergencyAlert, 'id' | 'created_at' | 'status'>): Promise<void> {
    try {
      // Get family members
      const { data: members } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_group_id', alert.family_group_id)
        .eq('invitation_status', 'accepted');

      if (!members?.length) return;

      // Send push notification via edge function
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_ids: members.map(m => m.user_id),
          title: `🚨 ${alert.title}`,
          body: alert.message,
          data: {
            type: 'emergency_alert',
            alert_type: alert.type,
            priority: alert.priority,
            family_group_id: alert.family_group_id,
            location: alert.location
          }
        }
      });

      if (error) {
        console.error('Error sending push notifications:', error);
      }
    } catch (error) {
      console.error('Error notifying family members:', error);
    }
  }

  private getMockEmergencyProtocols(groupIds: string[]): EmergencyProtocol[] {
    return [
      {
        id: 'protocol-medical-1',
        name: 'Medical Emergency Response',
        type: 'medical',
        description: 'Protocol for handling medical emergencies',
        steps: [
          'Call 911 immediately',
          'Notify family emergency contacts',
          'Share current location with family',
          'Provide first aid if trained',
          'Stay with patient until help arrives'
        ],
        emergency_contacts: [],
        family_group_id: groupIds[0] || '',
        is_active: true
      },
      {
        id: 'protocol-safety-1',
        name: 'Home Safety Emergency',
        type: 'safety',
        description: 'Protocol for home safety emergencies',
        steps: [
          'Ensure personal safety first',
          'Call appropriate emergency services',
          'Evacuate if necessary',
          'Alert family members',
          'Meet at designated safe location'
        ],
        emergency_contacts: [],
        family_group_id: groupIds[0] || '',
        is_active: true
      }
    ];
  }
}

export const emergencyFeaturesService = new EmergencyFeaturesService();