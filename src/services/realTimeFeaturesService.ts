import { supabase } from '@/integrations/supabase/client';

interface EnhancedInsight {
  id: string;
  type: 'medication_adherence' | 'family_health' | 'emergency_preparedness' | 'wellness_trend';
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionable: boolean;
  recommendations: string[];
  data: any;
  expires_at?: string;
}

interface FamilyAnalytics {
  adherence_rate: number;
  missed_doses_week: number;
  active_members: number;
  emergency_contacts_count: number;
  recent_activities: any[];
  health_trends: any[];
}

class RealTimeFeaturesService {
  // Generate AI-powered family health insights
  async generateFamilyInsights(familyGroupId: string): Promise<EnhancedInsight[]> {
    try {
      // Get family analytics data
      const analytics = await this.getFamilyAnalytics(familyGroupId);
      const insights: EnhancedInsight[] = [];

      // Medication adherence insights
      if (analytics.adherence_rate < 80) {
        insights.push({
          id: `adherence_${Date.now()}`,
          type: 'medication_adherence',
          title: 'Medication Adherence Needs Attention',
          description: `Family adherence rate is ${analytics.adherence_rate}%. Consider setting up reminders or checking in with family members.`,
          priority: analytics.adherence_rate < 60 ? 'high' : 'normal',
          actionable: true,
          recommendations: [
            'Set up additional medication reminders',
            'Review medication schedules with family members',
            'Consider using pill organizers',
            'Schedule a family health check-in'
          ],
          data: { adherence_rate: analytics.adherence_rate },
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      // Emergency preparedness insights
      if (analytics.emergency_contacts_count < 2) {
        insights.push({
          id: `emergency_${Date.now()}`,
          type: 'emergency_preparedness',
          title: 'Emergency Preparedness Incomplete',
          description: 'Your family has insufficient emergency contacts set up.',
          priority: 'normal',
          actionable: true,
          recommendations: [
            'Add at least 2 emergency contacts per family member',
            'Verify emergency contact information is current',
            'Set up emergency medical information',
            'Review family emergency plan'
          ],
          data: { contacts_count: analytics.emergency_contacts_count },
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      // Wellness trend insights
      if (analytics.missed_doses_week > 5) {
        insights.push({
          id: `wellness_${Date.now()}`,
          type: 'wellness_trend',
          title: 'Increasing Missed Doses Trend',
          description: `${analytics.missed_doses_week} doses were missed this week. This is above the recommended threshold.`,
          priority: analytics.missed_doses_week > 10 ? 'high' : 'normal',
          actionable: true,
          recommendations: [
            'Review medication schedule timing',
            'Consider simplifying medication routines',
            'Set up additional reminder methods',
            'Consult with healthcare provider about dosing'
          ],
          data: { missed_doses: analytics.missed_doses_week },
          expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      // Store insights in database
      if (insights.length > 0) {
        await supabase.from('family_health_insights').insert(
          insights.map(insight => ({
            family_group_id: familyGroupId,
            insight_type: insight.type,
            insight_data: {
              title: insight.title,
              description: insight.description,
              priority: insight.priority,
              actionable: insight.actionable,
              recommendations: insight.recommendations,
              data: insight.data
            },
            priority: insight.priority,
            is_actionable: insight.actionable,
            expires_at: insight.expires_at
          }))
        );
      }

      return insights;
    } catch (error) {
      console.error('Error generating family insights:', error);
      return [];
    }
  }

  // Get comprehensive family analytics
  async getFamilyAnalytics(familyGroupId: string): Promise<FamilyAnalytics> {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get family members
      const { data: members } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_group_id', familyGroupId)
        .eq('invitation_status', 'accepted');

      const memberIds = members?.map(m => m.user_id) || [];

      // Calculate adherence rate
      const { data: adherenceData } = await supabase
        .from('medication_adherence_log')
        .select('status')
        .in('user_id', memberIds)
        .gte('created_at', weekAgo.toISOString());

      const totalDoses = adherenceData?.length || 0;
      const takenDoses = adherenceData?.filter(log => log.status === 'taken').length || 0;
      const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

      // Get missed doses
      const { data: missedDoses } = await supabase
        .from('medication_adherence_log')
        .select('id')
        .in('user_id', memberIds)
        .eq('status', 'missed')
        .gte('created_at', weekAgo.toISOString());

      // Get emergency contacts count
      const { data: emergencyContacts } = await supabase
        .from('emergency_contacts')
        .select('id')
        .in('user_id', memberIds)
        .eq('is_active', true);

      // Get recent activities
      const { data: activities } = await supabase
        .from('family_activity_log')
        .select('*')
        .eq('family_group_id', familyGroupId)
        .order('created_at', { ascending: false })
        .limit(20);

      return {
        adherence_rate: adherenceRate,
        missed_doses_week: missedDoses?.length || 0,
        active_members: memberIds.length,
        emergency_contacts_count: emergencyContacts?.length || 0,
        recent_activities: activities || [],
        health_trends: []
      };
    } catch (error) {
      console.error('Error getting family analytics:', error);
      return {
        adherence_rate: 0,
        missed_doses_week: 0,
        active_members: 0,
        emergency_contacts_count: 0,
        recent_activities: [],
        health_trends: []
      };
    }
  }

  // Setup real-time family activity monitoring
  setupFamilyActivityMonitoring(familyGroupId: string, callback: (activity: any) => void) {
    const channel = supabase
      .channel(`family_activity_${familyGroupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_activity_log',
          filter: `family_group_id=eq.${familyGroupId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medication_adherence_log'
        },
        (payload) => {
          // Check if this user is part of the family group
          const newRecord = payload.new as any;
          if (newRecord?.user_id) {
            this.checkUserInFamily(familyGroupId, newRecord.user_id).then(isMember => {
              if (isMember) {
                callback({
                  type: 'medication_update',
                  data: newRecord,
                  user_id: newRecord.user_id
                });
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Check if user is family member
  private async checkUserInFamily(familyGroupId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_group_id', familyGroupId)
      .eq('user_id', userId)
      .eq('invitation_status', 'accepted')
      .single();

    return !!data;
  }

  // Send real-time notification to family members
  async sendFamilyNotification(
    familyGroupId: string,
    notification: {
      title: string;
      message: string;
      type: string;
      priority: string;
      data?: any;
    }
  ) {
    try {
      // Get all family members
      const { data: members } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_group_id', familyGroupId)
        .eq('invitation_status', 'accepted');

      if (!members) return;

      // Send notification to each member
      const notifications = members.map(member => ({
        user_id: member.user_id,
        notification_type: notification.type,
        notification_data: {
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          family_group_id: familyGroupId,
          ...notification.data
        },
        delivery_method: 'push',
        success: true
      }));

      await supabase
        .from('notification_delivery_logs')
        .insert(notifications);

    } catch (error) {
      console.error('Error sending family notification:', error);
    }
  }

  // Log family activity
  async logFamilyActivity(
    familyGroupId: string,
    userId: string,
    activityType: string,
    activityData: any,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) {
    try {
      await supabase.from('family_activity_log').insert({
        family_group_id: familyGroupId,
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData,
        priority: priority
      });
    } catch (error) {
      console.error('Error logging family activity:', error);
    }
  }
}

export const realTimeFeaturesService = new RealTimeFeaturesService();