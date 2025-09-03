import { supabase } from '@/integrations/supabase/client';

export interface CommunicationMessage {
  id: string;
  content: string;
  sender_id: string;
  message_type: 'text' | 'location' | 'medication_reminder' | 'emergency' | 'system';
  created_at: string;
  read_by?: string[];
  metadata?: any;
  family_group_id: string;
  sender_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface SendMessageParams {
  family_group_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'location' | 'medication_reminder' | 'emergency' | 'system';
  recipient_id?: string;
  metadata?: any;
}

class RealTimeCommunicationService {
  private activeChannels: any[] = [];
  async sendMessage(params: SendMessageParams) {
    try {
      console.log('Sending message:', params);
      
      const { data, error } = await supabase
        .from('communication_logs')
        .insert({
          family_group_id: params.family_group_id,
          sender_id: params.sender_id,
          message_content: params.content,
          message_type: params.message_type,
          recipient_id: params.recipient_id || null,
          message_data: params.metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Database error in sendMessage:', error);
        throw new Error(`Failed to send message: ${error.message}`);
      }

      console.log('Message sent successfully:', data);
      return {
        id: data.id,
        content: data.message_content,
        sender_id: data.sender_id,
        message_type: data.message_type as 'text' | 'location' | 'medication_reminder' | 'emergency' | 'system',
        family_group_id: data.family_group_id,
        created_at: data.created_at,
        read_by: []
      };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  async getRecentMessages(familyGroupId: string): Promise<CommunicationMessage[]> {
    const { data } = await supabase
      .from('communication_logs')
      .select('*')
      .eq('family_group_id', familyGroupId)
      .order('created_at', { ascending: false })
      .limit(50);

    return (data || []).reverse().map(msg => ({
      id: msg.id,
      content: msg.message_content,
      sender_id: msg.sender_id,
      message_type: msg.message_type as 'text' | 'location' | 'medication_reminder' | 'emergency' | 'system',
      family_group_id: msg.family_group_id,
      created_at: msg.created_at,
      read_by: []
    }));
  }

  async getMessages(familyGroupId: string): Promise<CommunicationMessage[]> {
    return this.getRecentMessages(familyGroupId);
  }

  subscribeToFamilyUpdates(familyGroupId: string, callback: (message: CommunicationMessage) => void) {
    const channel = supabase
      .channel(`family_updates_${familyGroupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communication_logs',
          filter: `family_group_id=eq.${familyGroupId}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          callback({
            id: newMessage.id,
            content: newMessage.message_content,
            sender_id: newMessage.sender_id,
            message_type: newMessage.message_type as 'text' | 'location' | 'medication_reminder' | 'emergency' | 'system',
            family_group_id: newMessage.family_group_id,
            created_at: newMessage.created_at,
            read_by: []
          });
        }
      )
      .subscribe();

    this.activeChannels.push(channel);
    return channel;
  }

  cleanup() {
    this.activeChannels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.activeChannels = [];
  }
}

export const realTimeCommunicationService = new RealTimeCommunicationService();