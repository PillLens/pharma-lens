import { supabase } from '@/integrations/supabase/client';
import { FamilyMember } from './familySharingService';

interface MemberProfile {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string[];
  last_seen?: string;
  timezone?: string;
  notification_preferences?: {
    medication_reminders: boolean;
    family_updates: boolean;
    emergency_alerts: boolean;
    email_notifications: boolean;
  };
}

interface MemberActivity {
  id: string;
  user_id: string;
  activity_type: string;
  created_at: string;
  description: string;
}

interface MemberAnalytics {
  user_id: string;
  adherence_rate: number;
  active_medications: number;
  completed_tasks: number;
  family_interactions: number;
  last_activity: string;
  adherence_trend: 'improving' | 'stable' | 'declining';
  engagement_score: number;
}

class EnhancedMemberManagementService {

  async getAllFamilyMembers(familyGroups: any[]): Promise<FamilyMember[]> {
    if (!familyGroups?.length) return [];

    try {
      const groupIds = familyGroups.map(g => g.id);
      
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          *,
          profiles:user_id (display_name, email, avatar_url)
        `)
        .in('family_group_id', groupIds)
        .eq('invitation_status', 'accepted');

      if (error) throw error;

      return data?.map(member => ({
        ...member,
        user_profile: member.profiles
      })) || [];
    } catch (error) {
      console.error('Error fetching family members:', error);
      return [];
    }
  }

  async getMemberProfiles(userIds: string[]): Promise<Record<string, MemberProfile>> {
    if (!userIds.length) return {};

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (error) throw error;

      const profiles: Record<string, MemberProfile> = {};
      data?.forEach(profile => {
        profiles[profile.id] = {
          id: profile.id,
          display_name: profile.display_name || profile.email?.split('@')[0] || 'Unknown',
          email: profile.email,
          avatar_url: profile.avatar_url,
          phone: profile.phone,
          emergency_contact_name: profile.emergency_contact_name,
          emergency_contact_phone: profile.emergency_contact_phone,
          medical_conditions: profile.medical_conditions || [],
          last_seen: profile.last_seen,
          timezone: profile.timezone,
          notification_preferences: profile.notification_preferences || {
            medication_reminders: true,
            family_updates: true,
            emergency_alerts: true,
            email_notifications: false
          }
        };
      });

      return profiles;
    } catch (error) {
      console.error('Error fetching member profiles:', error);
      return {};
    }
  }

  async getMemberAnalytics(userIds: string[]): Promise<Record<string, MemberAnalytics>> {
    if (!userIds.length) return {};

    try {
      const analytics: Record<string, MemberAnalytics> = {};
      
      for (const userId of userIds) {
        const memberAnalytics = await this.calculateMemberAnalytics(userId);
        analytics[userId] = memberAnalytics;
      }

      return analytics;
    } catch (error) {
      console.error('Error fetching member analytics:', error);
      return {};
    }
  }

  async getMemberActivities(userIds: string[]): Promise<Record<string, MemberActivity[]>> {
    if (!userIds.length) return {};

    try {
      const { data, error } = await supabase
        .from('family_activity_log')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const activities: Record<string, MemberActivity[]> = {};
      
      // Initialize arrays for all users
      userIds.forEach(userId => {
        activities[userId] = [];
      });

      // Group activities by user
      data?.forEach(activity => {
        if (!activities[activity.user_id]) {
          activities[activity.user_id] = [];
        }
        
        activities[activity.user_id].push({
          id: activity.id,
          user_id: activity.user_id,
          activity_type: activity.activity_type,
          created_at: activity.created_at,
          description: this.formatActivityDescription(activity.activity_type, activity.activity_data)
        });
      });

      return activities;
    } catch (error) {
      console.error('Error fetching member activities:', error);
      return {};
    }
  }

  async updateMemberProfile(userId: string, updates: Partial<MemberProfile>): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.display_name,
          phone: updates.phone,
          emergency_contact_name: updates.emergency_contact_name,
          emergency_contact_phone: updates.emergency_contact_phone,
          medical_conditions: updates.medical_conditions,
          timezone: updates.timezone
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member profile:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(
    userId: string, 
    preferences: MemberProfile['notification_preferences']
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: preferences })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  private async calculateMemberAnalytics(userId: string): Promise<MemberAnalytics> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Calculate adherence rate
      const { data: adherenceData } = await supabase
        .from('medication_adherence_log')
        .select('status')
        .eq('user_id', userId)
        .gte('created_at', oneWeekAgo.toISOString());

      let adherenceRate = 0;
      if (adherenceData && adherenceData.length > 0) {
        const takenCount = adherenceData.filter(log => log.status === 'taken').length;
        adherenceRate = Math.round((takenCount / adherenceData.length) * 100);
      }

      // Get active medications count
      const { data: medicationsData } = await supabase
        .from('user_medications')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);

      const activeMedications = medicationsData?.length || 0;

      // Get completed tasks count
      const { data: tasksData } = await supabase
        .from('care_tasks')
        .select('id')
        .eq('assigned_to', userId)
        .eq('status', 'completed')
        .gte('completed_at', oneWeekAgo.toISOString());

      const completedTasks = tasksData?.length || 0;

      // Get family interactions count
      const { data: interactionsData } = await supabase
        .from('family_activity_log')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', oneWeekAgo.toISOString());

      const familyInteractions = interactionsData?.length || 0;

      // Get last activity
      const { data: lastActivityData } = await supabase
        .from('family_activity_log')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastActivity = lastActivityData?.created_at || oneWeekAgo.toISOString();

      // Calculate engagement score (simple formula)
      const engagementScore = Math.min(100, Math.round(
        (familyInteractions * 10) + 
        (completedTasks * 15) + 
        (adherenceRate * 0.5)
      ));

      // Determine adherence trend (simplified - would compare periods in production)
      const adherenceTrend: 'improving' | 'stable' | 'declining' = 
        adherenceRate > 80 ? 'improving' : 
        adherenceRate < 60 ? 'declining' : 'stable';

      return {
        user_id: userId,
        adherence_rate: adherenceRate,
        active_medications: activeMedications,
        completed_tasks: completedTasks,
        family_interactions: familyInteractions,
        last_activity: lastActivity,
        adherence_trend: adherenceTrend,
        engagement_score: engagementScore
      };
    } catch (error) {
      console.error('Error calculating member analytics:', error);
      return {
        user_id: userId,
        adherence_rate: 0,
        active_medications: 0,
        completed_tasks: 0,
        family_interactions: 0,
        last_activity: new Date().toISOString(),
        adherence_trend: 'stable',
        engagement_score: 0
      };
    }
  }

  private formatActivityDescription(activityType: string, activityData: any): string {
    switch (activityType) {
      case 'medication_taken':
        return `Took medication: ${activityData.medication_name || 'Unknown'}`;
      case 'task_completed':
        return `Completed task: ${activityData.task_title || 'Care task'}`;
      case 'family_message':
        return 'Sent a family message';
      case 'appointment_scheduled':
        return 'Scheduled an appointment';
      case 'emergency_alert':
        return 'Sent an emergency alert';
      case 'medication_shared':
        return 'Shared medication information';
      case 'location_shared':
        return 'Shared location with family';
      default:
        return `${activityType.replace('_', ' ')} activity`;
    }
  }
}

export const enhancedMemberManagementService = new EnhancedMemberManagementService();