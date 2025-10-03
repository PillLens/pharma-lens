import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AIInsight {
  id: string;
  user_id: string;
  insight_type: 'adherence_pattern' | 'medication_timing' | 'refill_reminder' | 'health_trend';
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionable: boolean;
  action_url?: string;
  data: any;
  dismissed_at?: string;
  expires_at?: string;
  created_at: string;
}

export function useAIInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .is('dismissed_at', null)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsights((data || []) as AIInsight[]);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const dismissInsight = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setInsights(insights.filter(i => i.id !== id));
      toast.success('Insight dismissed');
    } catch (error) {
      console.error('Error dismissing insight:', error);
      toast.error('Failed to dismiss insight');
    }
  };

  const generateInsights = async () => {
    if (!user) return;

    try {
      // Fetch adherence data
      const { data: adherenceData } = await supabase
        .from('medication_adherence_log')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Fetch medications
      const { data: medications } = await supabase
        .from('user_medications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const newInsights: Omit<AIInsight, 'id' | 'created_at'>[] = [];

      // Analyze adherence patterns
      if (adherenceData && adherenceData.length > 0) {
        const takenCount = adherenceData.filter(log => log.status === 'taken').length;
        const adherenceRate = (takenCount / adherenceData.length) * 100;

        if (adherenceRate < 80) {
          newInsights.push({
            user_id: user.id,
            insight_type: 'adherence_pattern',
            title: 'Low Adherence Detected',
            description: `Your medication adherence is at ${adherenceRate.toFixed(1)}%. Consider setting up reminders to improve consistency.`,
            priority: adherenceRate < 50 ? 'urgent' : 'high',
            actionable: true,
            action_url: '/reminders',
            data: { adherence_rate: adherenceRate },
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      }

      // Check refill reminders
      if (medications) {
        medications.forEach(med => {
          if (med.quantity_remaining && med.quantity_remaining < (med.daily_dose_count || 1) * 7) {
            newInsights.push({
              user_id: user.id,
              insight_type: 'refill_reminder',
              title: 'Refill Needed Soon',
              description: `${med.medication_name} is running low. You have approximately ${Math.floor(med.quantity_remaining / (med.daily_dose_count || 1))} days remaining.`,
              priority: med.quantity_remaining < (med.daily_dose_count || 1) * 3 ? 'high' : 'normal',
              actionable: true,
              action_url: '/medications',
              data: { medication_id: med.id, quantity_remaining: med.quantity_remaining },
              expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            });
          }
        });
      }

      // Insert new insights
      if (newInsights.length > 0) {
        const { error } = await supabase
          .from('ai_insights')
          .insert(newInsights);

        if (error) throw error;
        
        await fetchInsights();
        toast.success(`${newInsights.length} new insight${newInsights.length > 1 ? 's' : ''} generated`);
      } else {
        toast.info('No new insights at this time');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate insights');
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [user?.id]);

  return {
    insights,
    loading,
    dismissInsight,
    generateInsights,
    refetch: fetchInsights,
  };
}
