import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CommunicationMessage {
  id: string;
  sender_id: string;
  recipient_id?: string;
  family_group_id: string;
  message_type: 'text' | 'emergency' | 'medication_alert' | 'appointment_reminder' | 'status_update';
  message_content?: string;
  message_data: any;
  is_emergency: boolean;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export interface FamilyActivityEvent {
  id: string;
  user_id: string;
  family_group_id: string;
  activity_type: 'medication_taken' | 'appointment_scheduled' | 'emergency_alert' | 'location_shared' | 'status_update';
  activity_data: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
}

export class RealTimeCommunicationService {
  private activeChannels: Map<string, any> = new Map();

  async sendMessage(
    familyGroupId: string,
    messageType: CommunicationMessage['message_type'],
    content: string,
    data?: any,
    recipientId?: string,
    isEmergency = false
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('communication_logs')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          family_group_id: familyGroupId,
          message_type: messageType,
          message_content: content,
          message_data: data || {},
          is_emergency: isEmergency
        });

      if (error) throw error;

      // Send push notification for emergency messages
      if (isEmergency) {
        await this.sendEmergencyNotification(familyGroupId, content, data);
      }

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }
  }

  async getMessages(familyGroupId: string, limit = 50): Promise<CommunicationMessage[]> {
    try {
      const { data, error } = await supabase
        .from('communication_logs')
        .select(`
          *,
          sender:profiles!communication_logs_sender_id_fkey(display_name, email, avatar_url),
          recipient:profiles!communication_logs_recipient_id_fkey(display_name, email, avatar_url)
        `)
        .eq('family_group_id', familyGroupId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('communication_logs')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  async logFamilyActivity(
    familyGroupId: string,
    activityType: FamilyActivityEvent['activity_type'],
    data: any,
    priority: FamilyActivityEvent['priority'] = 'normal'
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('family_activity_log')
        .insert({
          user_id: user.id,
          family_group_id: familyGroupId,
          activity_type: activityType,
          activity_data: data,
          priority
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error logging family activity:', error);
      return false;
    }
  }

  async getFamilyActivity(familyGroupId: string, limit = 100): Promise<FamilyActivityEvent[]> {
    try {
      const { data, error } = await supabase
        .from('family_activity_log')
        .select(`
          *,
          user:profiles!family_activity_log_user_id_fkey(display_name, email, avatar_url)
        `)
        .eq('family_group_id', familyGroupId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching family activity:', error);
      return [];
    }
  }

  // Real-time subscriptions
  subscribeToFamilyUpdates(familyGroupId: string, onUpdate: (payload: any) => void): () => void {
    const channelName = `family_updates_${familyGroupId}`;
    
    if (this.activeChannels.has(channelName)) {
      this.activeChannels.get(channelName).unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communication_logs',
          filter: `family_group_id=eq.${familyGroupId}`
        },
        onUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_activity_log',
          filter: `family_group_id=eq.${familyGroupId}`
        },
        onUpdate
      )
      .subscribe();

    this.activeChannels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.activeChannels.delete(channelName);
    };
  }

  subscribeToPresence(familyGroupId: string, onPresenceChange: (presence: any) => void): () => void {
    const channelName = `presence_${familyGroupId}`;
    
    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        onPresenceChange(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Member joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Member left:', key, leftPresences);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  async updateUserPresence(familyGroupId: string, status: 'online' | 'away' | 'busy' | 'offline'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase.channel(`presence_${familyGroupId}`);
      
      await channel.track({
        user_id: user.id,
        status,
        last_seen: new Date().toISOString()
      });

      // Update profile last_seen
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  }

  private async sendEmergencyNotification(familyGroupId: string, message: string, data?: any): Promise<void> {
    try {
      // Get all family members
      const { data: members } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_group_id', familyGroupId)
        .eq('invitation_status', 'accepted');

      if (!members) return;

      // Send push notifications to all members
      for (const member of members) {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: member.user_id,
            title: '🚨 Emergency Alert',
            body: message,
            data: {
              type: 'emergency',
              family_group_id: familyGroupId,
              ...data
            },
            priority: 'high'
          }
        });
      }
    } catch (error) {
      console.error('Error sending emergency notification:', error);
    }
  }

  cleanup(): void {
    // Unsubscribe from all channels
    this.activeChannels.forEach(channel => {
      channel.unsubscribe();
    });
    this.activeChannels.clear();
  }
}

export const realTimeCommunicationService = new RealTimeCommunicationService();