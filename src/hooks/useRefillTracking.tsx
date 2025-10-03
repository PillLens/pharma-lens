import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RefillData {
  id: string;
  medicationName: string;
  quantityRemaining: number;
  dailyDoseCount: number;
  daysUntilRefill: number;
  refillReminderDate?: Date;
  lastRefillDate?: Date;
}

export const useRefillTracking = () => {
  const { user } = useAuth();

  const fetchRefillData = async (): Promise<RefillData[]> => {
    if (!user) return [];

    const { data: medications, error } = await supabase
      .from('user_medications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('quantity_remaining', 'is', null);

    if (error) throw error;

    return (medications || []).map(med => {
      const daysUntilRefill = med.quantity_remaining && med.daily_dose_count
        ? Math.floor(med.quantity_remaining / med.daily_dose_count)
        : 0;

      return {
        id: med.id,
        medicationName: med.medication_name,
        quantityRemaining: med.quantity_remaining || 0,
        dailyDoseCount: med.daily_dose_count || 1,
        daysUntilRefill,
        refillReminderDate: med.refill_reminder_date ? new Date(med.refill_reminder_date) : undefined,
        lastRefillDate: med.last_refill_date ? new Date(med.last_refill_date) : undefined,
      };
    });
  };

  const { data: refillData, isLoading, error, refetch } = useQuery<RefillData[]>({
    queryKey: ['refill-tracking', user?.id],
    queryFn: fetchRefillData,
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });

  const updateRefill = async (medicationId: string, quantityAdded: number) => {
    if (!user) return;

    try {
      // Get current medication data
      const { data: medication, error: fetchError } = await supabase
        .from('user_medications')
        .select('quantity_remaining')
        .eq('id', medicationId)
        .single();

      if (fetchError) throw fetchError;

      // Update quantity and refill date
      const newQuantity = (medication.quantity_remaining || 0) + quantityAdded;
      
      const { error: updateError } = await supabase
        .from('user_medications')
        .update({
          quantity_remaining: newQuantity,
          last_refill_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', medicationId);

      if (updateError) throw updateError;

      toast.success('Refill recorded', {
        description: `Added ${quantityAdded} doses`
      });

      refetch();
    } catch (err) {
      console.error('Error updating refill:', err);
      toast.error('Failed to record refill');
    }
  };

  const decrementDose = async (medicationId: string) => {
    if (!user) return;

    try {
      const { data: medication, error: fetchError } = await supabase
        .from('user_medications')
        .select('quantity_remaining')
        .eq('id', medicationId)
        .single();

      if (fetchError) throw fetchError;

      const newQuantity = Math.max(0, (medication.quantity_remaining || 0) - 1);
      
      const { error: updateError } = await supabase
        .from('user_medications')
        .update({ quantity_remaining: newQuantity })
        .eq('id', medicationId);

      if (updateError) throw updateError;

      refetch();
    } catch (err) {
      console.error('Error decrementing dose:', err);
    }
  };

  return {
    refillData: refillData || [],
    loading: isLoading,
    error,
    refetch,
    updateRefill,
    decrementDose
  };
};
