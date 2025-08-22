import { supabase } from '@/integrations/supabase/client';
import { medicationAdherenceService } from './medicationAdherenceService';
import { careTaskService } from './careTaskService';

export interface HealthInsight {
  id: string;
  family_group_id: string;
  insight_type: 'adherence_pattern' | 'medication_interaction' | 'health_trend' | 'care_recommendation' | 'emergency_pattern';
  insight_data: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  is_actionable: boolean;
  expires_at?: string;
  created_at: string;
}

export interface FamilyHealthScore {
  overall_score: number;
  adherence_score: number;
  task_completion_score: number;
  communication_score: number;
  emergency_preparedness_score: number;
  trends: {
    weekly_change: number;
    monthly_change: number;
  };
}

export interface HealthTrend {
  metric: string;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  trend_direction: 'up' | 'down' | 'stable';
  time_period: string;
}

export class FamilyHealthInsightsService {
  async generateFamilyHealthInsights(familyGroupId: string): Promise<HealthInsight[]> {
    try {
      const insights: HealthInsight[] = [];

      // Generate adherence insights
      const adherenceInsights = await this.generateAdherenceInsights(familyGroupId);
      insights.push(...adherenceInsights);

      // Generate task completion insights
      const taskInsights = await this.generateTaskInsights(familyGroupId);
      insights.push(...taskInsights);

      // Generate communication insights
      const communicationInsights = await this.generateCommunicationInsights(familyGroupId);
      insights.push(...communicationInsights);

      // Store insights in database
      if (insights.length > 0) {
        await this.storeInsights(insights);
      }

      return insights;
    } catch (error) {
      console.error('Error generating family health insights:', error);
      return [];
    }
  }

  async getFamilyHealthScore(familyGroupId: string): Promise<FamilyHealthScore> {
    try {
      // Calculate adherence score
      const adherenceData = await medicationAdherenceService.getFamilyAdherenceOverview(familyGroupId);
      const adherenceScore = adherenceData.length > 0 
        ? adherenceData.reduce((sum, d) => sum + d.adherenceRate, 0) / adherenceData.length
        : 100;

      // Calculate task completion score
      const tasks = await careTaskService.getFamilyTasks(familyGroupId);
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const taskCompletionScore = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 100;

      // Calculate communication score (based on recent activity)
      const { data: recentActivity } = await supabase
        .from('family_activity_log')
        .select('*')
        .eq('family_group_id', familyGroupId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const communicationScore = Math.min((recentActivity?.length || 0) * 10, 100);

      // Calculate emergency preparedness score
      const { data: emergencyContacts } = await supabase
        .from('emergency_contacts')
        .select('user_id')
        .eq('is_active', true);

      const { data: members } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_group_id', familyGroupId)
        .eq('invitation_status', 'accepted');

      const membersWithContacts = new Set(emergencyContacts?.map(c => c.user_id) || []).size;
      const totalMembers = members?.length || 1;
      const emergencyPreparednessScore = (membersWithContacts / totalMembers) * 100;

      // Overall score
      const overallScore = (
        adherenceScore * 0.4 +
        taskCompletionScore * 0.25 +
        communicationScore * 0.2 +
        emergencyPreparednessScore * 0.15
      );

      // Calculate trends (mock for now - would need historical data)
      const trends = {
        weekly_change: Math.random() * 10 - 5, // -5 to +5
        monthly_change: Math.random() * 20 - 10 // -10 to +10
      };

      return {
        overall_score: Math.round(overallScore),
        adherence_score: Math.round(adherenceScore),
        task_completion_score: Math.round(taskCompletionScore),
        communication_score: Math.round(communicationScore),
        emergency_preparedness_score: Math.round(emergencyPreparednessScore),
        trends
      };
    } catch (error) {
      console.error('Error calculating family health score:', error);
      return {
        overall_score: 0,
        adherence_score: 0,
        task_completion_score: 0,
        communication_score: 0,
        emergency_preparedness_score: 0,
        trends: { weekly_change: 0, monthly_change: 0 }
      };
    }
  }

  async getHealthTrends(familyGroupId: string): Promise<HealthTrend[]> {
    try {
      const trends: HealthTrend[] = [];

      // Adherence trend
      const currentAdherence = await this.calculateCurrentAdherence(familyGroupId);
      const previousAdherence = await this.calculatePreviousAdherence(familyGroupId);
      
      if (currentAdherence !== null && previousAdherence !== null) {
        trends.push({
          metric: 'Medication Adherence',
          current_value: currentAdherence,
          previous_value: previousAdherence,
          change_percentage: ((currentAdherence - previousAdherence) / previousAdherence) * 100,
          trend_direction: currentAdherence > previousAdherence ? 'up' : 
                          currentAdherence < previousAdherence ? 'down' : 'stable',
          time_period: 'Last 7 days vs Previous 7 days'
        });
      }

      // Task completion trend
      const currentTaskCompletion = await this.calculateCurrentTaskCompletion(familyGroupId);
      const previousTaskCompletion = await this.calculatePreviousTaskCompletion(familyGroupId);

      if (currentTaskCompletion !== null && previousTaskCompletion !== null) {
        trends.push({
          metric: 'Task Completion Rate',
          current_value: currentTaskCompletion,
          previous_value: previousTaskCompletion,
          change_percentage: previousTaskCompletion > 0 ? 
            ((currentTaskCompletion - previousTaskCompletion) / previousTaskCompletion) * 100 : 0,
          trend_direction: currentTaskCompletion > previousTaskCompletion ? 'up' : 
                          currentTaskCompletion < previousTaskCompletion ? 'down' : 'stable',
          time_period: 'Last 7 days vs Previous 7 days'
        });
      }

      return trends;
    } catch (error) {
      console.error('Error calculating health trends:', error);
      return [];
    }
  }

  async getStoredInsights(familyGroupId: string): Promise<HealthInsight[]> {
    try {
      const { data, error } = await supabase
        .from('family_health_insights')
        .select('*')
        .eq('family_group_id', familyGroupId)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as HealthInsight[];
    } catch (error) {
      console.error('Error fetching stored insights:', error);
      return [];
    }
  }

  private async generateAdherenceInsights(familyGroupId: string): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];
    
    try {
      const adherenceData = await medicationAdherenceService.getFamilyAdherenceOverview(familyGroupId);
      
      // Low adherence insight
      const lowAdherenceMembers = adherenceData.filter(d => d.adherenceRate < 80);
      if (lowAdherenceMembers.length > 0) {
        insights.push({
          id: `adherence_low_${Date.now()}`,
          family_group_id: familyGroupId,
          insight_type: 'adherence_pattern',
          insight_data: {
            type: 'low_adherence',
            affected_members: lowAdherenceMembers.map(m => ({
              name: m.userName,
              medication: m.medicationName,
              rate: m.adherenceRate
            })),
            recommendation: 'Consider setting up additional reminders or reaching out to affected members'
          },
          priority: 'high',
          is_actionable: true,
          created_at: new Date().toISOString()
        });
      }

      // Improvement insight
      const improvingMembers = adherenceData.filter(d => d.streak >= 7);
      if (improvingMembers.length > 0) {
        insights.push({
          id: `adherence_improvement_${Date.now()}`,
          family_group_id: familyGroupId,
          insight_type: 'adherence_pattern',
          insight_data: {
            type: 'improvement',
            improving_members: improvingMembers.map(m => ({
              name: m.userName,
              medication: m.medicationName,
              streak: m.streak
            })),
            message: 'Great progress! Some family members are maintaining excellent adherence streaks'
          },
          priority: 'normal',
          is_actionable: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error generating adherence insights:', error);
    }

    return insights;
  }

  private async generateTaskInsights(familyGroupId: string): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];
    
    try {
      const overdueTasks = await careTaskService.getOverdueTasks(familyGroupId);
      
      if (overdueTasks.length > 0) {
        insights.push({
          id: `tasks_overdue_${Date.now()}`,
          family_group_id: familyGroupId,
          insight_type: 'care_recommendation',
          insight_data: {
            type: 'overdue_tasks',
            count: overdueTasks.length,
            tasks: overdueTasks.map(t => ({
              title: t.title,
              assignee: t.assignee?.display_name,
              due_date: t.due_date,
              priority: t.priority
            })),
            recommendation: 'Follow up on overdue tasks to ensure continuity of care'
          },
          priority: 'high',
          is_actionable: true,
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error generating task insights:', error);
    }

    return insights;
  }

  private async generateCommunicationInsights(familyGroupId: string): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];
    
    try {
      // Check for inactive members
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const { data: inactiveMembers } = await supabase
        .from('profiles')
        .select('display_name, email, last_seen')
        .lt('last_seen', sevenDaysAgo.toISOString());

      if (inactiveMembers && inactiveMembers.length > 0) {
        insights.push({
          id: `communication_inactive_${Date.now()}`,
          family_group_id: familyGroupId,
          insight_type: 'care_recommendation',
          insight_data: {
            type: 'inactive_members',
            members: inactiveMembers.map(m => ({
              name: m.display_name || m.email,
              last_seen: m.last_seen
            })),
            recommendation: 'Consider reaching out to inactive family members to check on their wellbeing'
          },
          priority: 'normal',
          is_actionable: true,
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error generating communication insights:', error);
    }

    return insights;
  }

  private async storeInsights(insights: HealthInsight[]): Promise<void> {
    try {
      const insightsToStore = insights.map(insight => ({
        family_group_id: insight.family_group_id,
        insight_type: insight.insight_type,
        insight_data: insight.insight_data,
        priority: insight.priority,
        is_actionable: insight.is_actionable,
        expires_at: insight.expires_at
      }));

      await supabase
        .from('family_health_insights')
        .insert(insightsToStore);
    } catch (error) {
      console.error('Error storing insights:', error);
    }
  }

  private async calculateCurrentAdherence(familyGroupId: string): Promise<number | null> {
    try {
      const adherenceData = await medicationAdherenceService.getFamilyAdherenceOverview(familyGroupId);
      return adherenceData.length > 0 
        ? adherenceData.reduce((sum, d) => sum + d.adherenceRate, 0) / adherenceData.length
        : null;
    } catch (error) {
      console.error('Error calculating current adherence:', error);
      return null;
    }
  }

  private async calculatePreviousAdherence(familyGroupId: string): Promise<number | null> {
    // This would need historical data calculation
    // For now, return a mock value
    return 85; // Mock previous adherence rate
  }

  private async calculateCurrentTaskCompletion(familyGroupId: string): Promise<number | null> {
    try {
      const tasks = await careTaskService.getFamilyTasks(familyGroupId);
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      return tasks.length > 0 ? (completedTasks / tasks.length) * 100 : null;
    } catch (error) {
      console.error('Error calculating current task completion:', error);
      return null;
    }
  }

  private async calculatePreviousTaskCompletion(familyGroupId: string): Promise<number | null> {
    // This would need historical data calculation
    // For now, return a mock value
    return 75; // Mock previous task completion rate
  }
}

export const familyHealthInsightsService = new FamilyHealthInsightsService();