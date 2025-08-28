import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserMedication {
  id: string;
  medication_name: string;
  generic_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  prescriber?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export const useMedicationHistory = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<UserMedication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Direct table access with type assertion
      const { data, error } = await (supabase as any)
        .from('user_medications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching medications:', error);
        toast.error('Failed to load medication history');
        return;
      }

      setMedications((data as any[])?.map(item => ({
        id: item.id,
        medication_name: item.medication_name,
        generic_name: item.generic_name || '',
        dosage: item.dosage,
        frequency: item.frequency,
        start_date: item.start_date,
        end_date: item.end_date,
        prescriber: item.prescriber,
        notes: item.notes,
        is_active: item.is_active,
        created_at: item.created_at
      })) || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load medication history');
    } finally {
      setLoading(false);
    }
  };

  const addMedication = async (medication: Omit<UserMedication, 'id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_medications' as any)
        .insert([{
          ...medication,
          user_id: user.id
        } as any])
        .select()
        .single();

      if (error) {
        console.error('Error adding medication:', error);
        toast.error('Failed to add medication');
        return null;
      }

      const newMedication: UserMedication = {
        id: (data as any).id,
        medication_name: (data as any).medication_name,
        generic_name: (data as any).generic_name || '',
        dosage: (data as any).dosage,
        frequency: (data as any).frequency,
        start_date: (data as any).start_date,
        end_date: (data as any).end_date,
        prescriber: (data as any).prescriber,
        notes: (data as any).notes,
        is_active: (data as any).is_active,
        created_at: (data as any).created_at
      };

      setMedications(prev => [newMedication, ...prev]);
      toast.success('Medication added successfully');
      return newMedication;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add medication');
      return null;
    }
  };

  const updateMedication = async (id: string, updates: Partial<UserMedication>) => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('user_medications')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating medication:', error);
        toast.error('Failed to update medication');
        return null;
      }

      const updatedMedication: UserMedication = {
        id: (data as any).id,
        medication_name: (data as any).medication_name,
        generic_name: (data as any).generic_name || '',
        dosage: (data as any).dosage,
        frequency: (data as any).frequency,
        start_date: (data as any).start_date,
        end_date: (data as any).end_date,
        prescriber: (data as any).prescriber,
        notes: (data as any).notes,
        is_active: (data as any).is_active,
        created_at: (data as any).created_at
      };

      setMedications(prev => 
        prev.map(med => med.id === id ? updatedMedication : med)
      );
      toast.success('Medication updated successfully');
      return updatedMedication;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update medication');
      return null;
    }
  };

  const removeMedication = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from('user_medications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing medication:', error);
        toast.error('Failed to remove medication');
        return false;
      }

      setMedications(prev => prev.filter(med => med.id !== id));
      toast.success('Medication removed successfully');
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to remove medication');
      return false;
    }
  };

  const getActiveMedications = () => {
    return medications.filter(med => med.is_active);
  };

  const getMedicationNames = () => {
    return medications.map(med => med.generic_name || med.medication_name);
  };

  useEffect(() => {
    fetchMedications();
  }, [user]);

  return {
    medications,
    loading,
    addMedication,
    updateMedication,
    removeMedication,
    getActiveMedications,
    getMedicationNames,
    refetch: fetchMedications
  };
};