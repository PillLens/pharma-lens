import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface VitalSign {
  id: string;
  user_id: string;
  recorded_at: string;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  weight?: number;
  temperature?: number;
  blood_glucose?: number;
  oxygen_saturation?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useVitalSigns(daysBack: number = 30) {
  const { user } = useAuth();
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVitalSigns = async () => {
    if (!user) return;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setVitalSigns(data || []);
    } catch (error) {
      console.error('Error fetching vital signs:', error);
      toast.error('Failed to load vital signs');
    } finally {
      setLoading(false);
    }
  };

  const addVitalSign = async (vitalSign: Omit<VitalSign, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vital_signs')
        .insert({
          ...vitalSign,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setVitalSigns([data, ...vitalSigns]);
      toast.success('Vital signs recorded');
      return data;
    } catch (error) {
      console.error('Error adding vital sign:', error);
      toast.error('Failed to record vital signs');
      throw error;
    }
  };

  const updateVitalSign = async (id: string, updates: Partial<VitalSign>) => {
    try {
      const { data, error } = await supabase
        .from('vital_signs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setVitalSigns(vitalSigns.map(vs => vs.id === id ? data : vs));
      toast.success('Vital signs updated');
      return data;
    } catch (error) {
      console.error('Error updating vital sign:', error);
      toast.error('Failed to update vital signs');
      throw error;
    }
  };

  const deleteVitalSign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vital_signs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVitalSigns(vitalSigns.filter(vs => vs.id !== id));
      toast.success('Vital signs deleted');
    } catch (error) {
      console.error('Error deleting vital sign:', error);
      toast.error('Failed to delete vital signs');
      throw error;
    }
  };

  useEffect(() => {
    fetchVitalSigns();
  }, [user?.id, daysBack]);

  return {
    vitalSigns,
    loading,
    addVitalSign,
    updateVitalSign,
    deleteVitalSign,
    refetch: fetchVitalSigns,
  };
}
