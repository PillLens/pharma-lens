import { supabase } from '@/integrations/supabase/client';

interface SendMessageParams {
  family_group_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'location' | 'medication_reminder' | 'emergency' | 'system';
  recipient_id?: string;
  metadata?: any;
}

class RealTimeCommunicationService {
  async sendMessage(params: SendMessageParams) {
    const { data, error } = await supabase
      .from('communication_logs')
      .insert({
        family_group_id: params.family_group_id,
        sender_id: params.sender_id,
        message_content: params.content,
        message_type: params.message_type,
        message_data: params.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      content: data.message_content,
      sender_id: data.sender_id,
      message_type: data.message_type,
      family_group_id: data.family_group_id,
      created_at: data.created_at
    };
  }

  async getRecentMessages(familyGroupId: string) {
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
      message_type: msg.message_type,
      family_group_id: msg.family_group_id,
      created_at: msg.created_at
    }));
  }
}

export const realTimeCommunicationService = new RealTimeCommunicationService();