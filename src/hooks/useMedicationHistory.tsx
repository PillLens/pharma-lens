import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

// Use proper Supabase types
type MedicationRow = Database['public']['Tables']['user_medications']['Row'];
type MedicationInsert = Database['public']['Tables']['user_medications']['Insert'];
type MedicationUpdate = Database['public']['Tables']['user_medications']['Update'];

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
      const { data, error } = await supabase
        .from('user_medications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .returns<MedicationRow[]>();

      if (error) {
        console.error('Error fetching medications:', error);
        toast.error('Failed to load medication history');
        return;
      }

      setMedications(data?.map(item => ({
        id: item.id,
        medication_name: item.medication_name,
        generic_name: item.generic_name || '',
        dosage: item.dosage,
        frequency: item.frequency,
        start_date: item.start_date,
        end_date: item.end_date || undefined,
        prescriber: item.prescriber || undefined,
        notes: item.notes || undefined,
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
    if (!user) return null;

    try {
      const insertData: MedicationInsert = {
        medication_name: medication.medication_name,
        generic_name: medication.generic_name || null,
        dosage: medication.dosage,
        frequency: medication.frequency,
        start_date: medication.start_date,
        end_date: medication.end_date || null,
        prescriber: medication.prescriber || null,
        notes: medication.notes || null,
        is_active: medication.is_active,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('user_medications')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error adding medication:', error);
        toast.error('Failed to add medication');
        return null;
      }

      if (!data) {
        toast.error('Failed to add medication');
        return null;
      }

      const newMedication: UserMedication = {
        id: data.id,
        medication_name: data.medication_name,
        generic_name: data.generic_name || '',
        dosage: data.dosage,
        frequency: data.frequency,
        start_date: data.start_date,
        end_date: data.end_date || undefined,
        prescriber: data.prescriber || undefined,
        notes: data.notes || undefined,
        is_active: data.is_active,
        created_at: data.created_at
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
    if (!user) return null;

    try {
      const updateData: MedicationUpdate = {
        medication_name: updates.medication_name,
        generic_name: updates.generic_name || null,
        dosage: updates.dosage,
        frequency: updates.frequency,
        start_date: updates.start_date,
        end_date: updates.end_date || null,
        prescriber: updates.prescriber || null,
        notes: updates.notes || null,
        is_active: updates.is_active
      };

      const { data, error } = await supabase
        .from('user_medications')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating medication:', error);
        toast.error('Failed to update medication');
        return null;
      }

      if (!data) {
        toast.error('Failed to update medication');
        return null;
      }

      const updatedMedication: UserMedication = {
        id: data.id,
        medication_name: data.medication_name,
        generic_name: data.generic_name || '',
        dosage: data.dosage,
        frequency: data.frequency,
        start_date: data.start_date,
        end_date: data.end_date || undefined,
        prescriber: data.prescriber || undefined,
        notes: data.notes || undefined,
        is_active: data.is_active,
        created_at: data.created_at
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
    if (!user) return false;

    try {
      const { error } = await supabase
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