import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MedicationGoal {
  id: string;
  user_id: string;
  goal_type: 'adherence_rate' | 'streak' | 'refill_on_time' | 'daily_completion';
  target_value: number;
  current_value: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  achieved_at?: string;
  medication_id?: string;
  created_at: string;
  updated_at: string;
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<MedicationGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medication_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals((data || []) as MedicationGoal[]);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goal: Omit<MedicationGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_value' | 'is_active'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medication_goals')
        .insert({
          ...goal,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setGoals([data as MedicationGoal, ...goals]);
      toast.success('Goal created successfully');
      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
      throw error;
    }
  };

  const updateGoal = async (id: string, updates: Partial<MedicationGoal>) => {
    try {
      const { data, error } = await supabase
        .from('medication_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setGoals(goals.map(g => g.id === id ? (data as MedicationGoal) : g));
      toast.success('Goal updated');
      return data;
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
      throw error;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medication_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGoals(goals.filter(g => g.id !== id));
      toast.success('Goal deleted');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
      throw error;
    }
  };

  const updateGoalProgress = async (goalId: string, currentValue: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updates: Partial<MedicationGoal> = { current_value: currentValue };
    
    // Check if goal is achieved
    if (currentValue >= goal.target_value && !goal.achieved_at) {
      updates.achieved_at = new Date().toISOString();
      toast.success('🎉 Goal achieved!');
    }

    return updateGoal(goalId, updates);
  };

  useEffect(() => {
    fetchGoals();
  }, [user?.id]);

  return {
    goals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    refetch: fetchGoals,
  };
}
