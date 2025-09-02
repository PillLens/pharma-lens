import { supabase } from '@/integrations/supabase/client';

interface AnalyticsParams {
  user_id: string;
  family_group_ids: string[];
  time_range: string;
}

interface ComprehensiveAnalytics {
  adherenceMetrics: {
    overall_rate: number;
    trend: 'up' | 'down' | 'stable';
    weekly_data: Array<{ date: string; rate: number }>;
    by_medication: Array<{ name: string; rate: number; count: number }>;
  };
  familyInsights: {
    active_members: number;
    total_interactions: number;
    emergency_alerts: number;
    completed_tasks: number;
    engagement_scores: Array<{ member: string; score: number; avatar?: string }>;
  };
  healthTrends: {
    missed_doses: Array<{ date: string; count: number }>;
    appointment_adherence: number;
    symptom_reports: number;
    medication_changes: number;
  };
  performanceMetrics: {
    app_usage: Array<{ date: string; sessions: number; duration: number }>;
    feature_adoption: Array<{ feature: string; usage: number; growth: number }>;
    user_satisfaction: number;
    error_rate: number;
  };
}

class AdvancedAnalyticsService {

  async getComprehensiveAnalytics(params: AnalyticsParams): Promise<ComprehensiveAnalytics> {
    try {
      const [adherence, family, health, performance] = await Promise.all([
        this.getAdherenceMetrics(params),
        this.getFamilyInsights(params),
        this.getHealthTrends(params),
        this.getPerformanceMetrics(params)
      ]);

      return {
        adherenceMetrics: adherence,
        familyInsights: family,
        healthTrends: health,
        performanceMetrics: performance
      };

    } catch (error) {
      console.error('Error getting comprehensive analytics:', error);
      throw error;
    }
  }

  private async getAdherenceMetrics(params: AnalyticsParams) {
    try {
      const daysAgo = this.getDaysFromRange(params.time_range);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get overall adherence rate
      const { data: adherenceData } = await supabase
        .from('medication_adherence_log')
        .select('status, scheduled_time, user_medications(medication_name)')
        .eq('user_id', params.user_id)
        .gte('created_at', startDate.toISOString());

      const totalDoses = adherenceData?.length || 0;
      const takenDoses = adherenceData?.filter(log => log.status === 'taken').length || 0;
      const overallRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

      // Calculate trend (compare with previous period)
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - daysAgo);

      const { data: previousData } = await supabase
        .from('medication_adherence_log')
        .select('status')
        .eq('user_id', params.user_id)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const previousTotal = previousData?.length || 0;
      const previousTaken = previousData?.filter(log => log.status === 'taken').length || 0;
      const previousRate = previousTotal > 0 ? (previousTaken / previousTotal) * 100 : 0;

      const trend: 'up' | 'down' | 'stable' = 
        overallRate > previousRate + 5 ? 'up' :
        overallRate < previousRate - 5 ? 'down' : 'stable';

      // Generate weekly data
      const weeklyData = this.generateWeeklyAdherenceData(adherenceData || [], daysAgo);

      // Group by medication
      const medicationGroups = this.groupAdherenceByMedication(adherenceData || []);

      return {
        overall_rate: overallRate,
        trend,
        weekly_data: weeklyData,
        by_medication: medicationGroups
      };

    } catch (error) {
      console.error('Error getting adherence metrics:', error);
      return {
        overall_rate: 0,
        trend: 'stable' as const,
        weekly_data: [],
        by_medication: []
      };
    }
  }

  private async getFamilyInsights(params: AnalyticsParams) {
    try {
      const daysAgo = this.getDaysFromRange(params.time_range);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get family members count
      const { data: members } = await supabase
        .from('family_members')
        .select('user_id, profiles:user_id(display_name, avatar_url)')
        .in('family_group_id', params.family_group_ids)
        .eq('invitation_status', 'accepted');

      // Get family interactions
      const { data: interactions } = await supabase
        .from('communication_logs')
        .select('id, message_type')
        .in('family_group_id', params.family_group_ids)
        .gte('created_at', startDate.toISOString());

      // Get emergency alerts
      const emergencyAlerts = interactions?.filter(i => i.message_type === 'emergency').length || 0;

      // Get completed tasks
      const { data: tasks } = await supabase
        .from('care_tasks')
        .select('id')
        .in('family_group_id', params.family_group_ids)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString());

      // Calculate engagement scores
      const engagementScores = await this.calculateEngagementScores(
        members || [], 
        params.family_group_ids, 
        startDate
      );

      return {
        active_members: members?.length || 0,
        total_interactions: interactions?.length || 0,
        emergency_alerts: emergencyAlerts,
        completed_tasks: tasks?.length || 0,
        engagement_scores: engagementScores
      };

    } catch (error) {
      console.error('Error getting family insights:', error);
      return {
        active_members: 0,
        total_interactions: 0,
        emergency_alerts: 0,
        completed_tasks: 0,
        engagement_scores: []
      };
    }
  }

  private async getHealthTrends(params: AnalyticsParams) {
    try {
      const daysAgo = this.getDaysFromRange(params.time_range);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get missed doses over time
      const { data: missedDoses } = await supabase
        .from('medication_adherence_log')
        .select('created_at, status')
        .eq('user_id', params.user_id)
        .eq('status', 'missed')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      const missedDosesTrend = this.groupByDate(missedDoses || [], 'created_at');

      // Get appointment adherence
      const { data: appointments } = await supabase
        .from('family_appointments')
        .select('status')
        .in('family_group_id', params.family_group_ids)
        .gte('appointment_date', startDate.toISOString());

      const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0;
      const totalAppointments = appointments?.length || 0;
      const appointmentAdherence = totalAppointments > 0 ? 
        Math.round((completedAppointments / totalAppointments) * 100) : 0;

      return {
        missed_doses: missedDosesTrend,
        appointment_adherence: appointmentAdherence,
        symptom_reports: 0, // Would integrate with symptom tracking
        medication_changes: 0 // Would track medication modifications
      };

    } catch (error) {
      console.error('Error getting health trends:', error);
      return {
        missed_doses: [],
        appointment_adherence: 0,
        symptom_reports: 0,
        medication_changes: 0
      };
    }
  }

  private async getPerformanceMetrics(params: AnalyticsParams) {
    try {
      const daysAgo = this.getDaysFromRange(params.time_range);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Mock app usage data (would come from analytics service)
      const appUsage = this.generateMockUsageData(daysAgo);

      // Mock feature adoption data
      const featureAdoption = [
        { feature: 'Medication Tracking', usage: 95, growth: 5 },
        { feature: 'Family Messaging', usage: 78, growth: 12 },
        { feature: 'Reminders', usage: 89, growth: 3 },
        { feature: 'Emergency Alerts', usage: 67, growth: 8 },
        { feature: 'Health Reports', usage: 45, growth: 15 }
      ];

      return {
        app_usage: appUsage,
        feature_adoption: featureAdoption,
        user_satisfaction: 87, // Would come from feedback data
        error_rate: 0.3 // Would come from error monitoring
      };

    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {
        app_usage: [],
        feature_adoption: [],
        user_satisfaction: 0,
        error_rate: 0
      };
    }
  }

  async generateReport(params: AnalyticsParams & { format: 'pdf' | 'csv' }) {
    try {
      const analytics = await this.getComprehensiveAnalytics(params);
      
      if (params.format === 'csv') {
        return this.generateCSVReport(analytics);
      } else {
        return this.generatePDFReport(analytics);
      }

    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  async generateInsightsSummary(params: AnalyticsParams) {
    try {
      const analytics = await this.getComprehensiveAnalytics(params);
      
      const insights = [
        `📊 Health Analytics Summary (${params.time_range})`,
        '',
        `💊 Medication Adherence: ${analytics.adherenceMetrics.overall_rate}%`,
        `👥 Active Family Members: ${analytics.familyInsights.active_members}`,
        `✅ Completed Tasks: ${analytics.familyInsights.completed_tasks}`,
        `🚨 Emergency Alerts: ${analytics.familyInsights.emergency_alerts}`,
        '',
        '📈 Key Insights:',
        analytics.adherenceMetrics.trend === 'up' ? 
          '• Medication adherence is improving' : 
          analytics.adherenceMetrics.trend === 'down' ?
          '• Medication adherence needs attention' :
          '• Medication adherence is stable',
        `• Family engagement is ${analytics.familyInsights.total_interactions > 50 ? 'high' : 'moderate'}`,
        `• App satisfaction: ${analytics.performanceMetrics.user_satisfaction}%`
      ];

      return {
        summary: insights.join('\n'),
        data: analytics
      };

    } catch (error) {
      console.error('Error generating insights summary:', error);
      throw error;
    }
  }

  private getDaysFromRange(range: string): number {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }

  private generateWeeklyAdherenceData(data: any[], days: number) {
    const weeks = Math.min(Math.ceil(days / 7), 12);
    const weeklyData = [];

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekData = data.filter(d => {
        const date = new Date(d.scheduled_time);
        return date >= weekStart && date < weekEnd;
      });

      const taken = weekData.filter(d => d.status === 'taken').length;
      const total = weekData.length;
      const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

      weeklyData.unshift({
        date: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rate
      });
    }

    return weeklyData;
  }

  private groupAdherenceByMedication(data: any[]) {
    const groups: { [key: string]: { taken: number; total: number } } = {};

    data.forEach(d => {
      const medName = d.user_medications?.medication_name || 'Unknown';
      if (!groups[medName]) {
        groups[medName] = { taken: 0, total: 0 };
      }
      groups[medName].total++;
      if (d.status === 'taken') {
        groups[medName].taken++;
      }
    });

    return Object.entries(groups).map(([name, stats]) => ({
      name,
      rate: stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0,
      count: stats.total
    })).sort((a, b) => b.rate - a.rate);
  }

  private async calculateEngagementScores(members: any[], groupIds: string[], startDate: Date) {
    const scores = [];

    for (const member of members) {
      try {
        // Get member activities
        const { data: activities } = await supabase
          .from('family_activity_log')
          .select('activity_type')
          .in('family_group_id', groupIds)
          .eq('user_id', member.user_id)
          .gte('created_at', startDate.toISOString());

        // Get messages sent
        const { data: messages } = await supabase
          .from('communication_logs')
          .select('id')
          .in('family_group_id', groupIds)
          .eq('sender_id', member.user_id)
          .gte('created_at', startDate.toISOString());

        // Calculate score based on activities
        const activityCount = activities?.length || 0;
        const messageCount = messages?.length || 0;
        const score = Math.min(100, (activityCount * 5) + (messageCount * 2));

        const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;

        scores.push({
          member: profile?.display_name || 'Unknown Member',
          score: Math.round(score),
          avatar: profile?.avatar_url
        });

      } catch (error) {
        console.error('Error calculating engagement for member:', member.user_id, error);
      }
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  private groupByDate(data: any[], dateField: string) {
    const groups: { [key: string]: number } = {};

    data.forEach(item => {
      const date = new Date(item[dateField]).toLocaleDateString();
      groups[date] = (groups[date] || 0) + 1;
    });

    return Object.entries(groups).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private generateMockUsageData(days: number) {
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sessions: Math.floor(Math.random() * 10) + 5,
        duration: Math.floor(Math.random() * 30) + 10
      });
    }
    return data;
  }

  private generateCSVReport(data: any) {
    // Generate CSV format report
    const csv = [
      'Date,Metric,Value',
      `${new Date().toISOString()},Adherence Rate,${data.adherenceMetrics.overall_rate}%`,
      `${new Date().toISOString()},Active Members,${data.familyInsights.active_members}`,
      `${new Date().toISOString()},Completed Tasks,${data.familyInsights.completed_tasks}`,
      `${new Date().toISOString()},Emergency Alerts,${data.familyInsights.emergency_alerts}`,
    ].join('\n');

    return { data: csv, filename: 'health-analytics.csv' };
  }

  private generatePDFReport(data: any) {
    // Would generate PDF using a library like jsPDF
    // For now, return HTML that could be converted to PDF
    const html = `
      <html>
        <body>
          <h1>Health Analytics Report</h1>
          <h2>Medication Adherence: ${data.adherenceMetrics.overall_rate}%</h2>
          <h2>Family Members: ${data.familyInsights.active_members}</h2>
          <h2>Completed Tasks: ${data.familyInsights.completed_tasks}</h2>
        </body>
      </html>
    `;

    return { data: html, filename: 'health-analytics.pdf' };
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();