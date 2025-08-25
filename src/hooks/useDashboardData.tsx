import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMedicationHistory } from '@/hooks/useMedicationHistory';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DashboardStats {
  medications: {
    total: number;
    active: number;
    lowStock: number;
  };
  scans: {
    total: number;
    recent: any[];
    recentCount: number;
  };
  reminders: {
    total: number;
    active: number;
    todaysDoses: number;
    nextReminder?: {
      medication: string;
      time: string;
    };
  };
  adherence: {
    rate: number;
    streak: number;
    completedToday: number;
    totalToday: number;
    missedToday: number;
  };
  family: {
    groups: number;
    members: number;
  };
}

export const useDashboardData = () => {
  const { user } = useAuth();
  const { medications, loading: medicationsLoading } = useMedicationHistory();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    medications: { total: 0, active: 0, lowStock: 0 },
    scans: { total: 0, recent: [], recentCount: 0 },
    reminders: { total: 0, active: 0, todaysDoses: 0 },
    adherence: { rate: 0, streak: 0, completedToday: 0, totalToday: 0, missedToday: 0 },
    family: { groups: 0, members: 0 }
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user || medicationsLoading) return;

    try {
      setLoading(true);

      // Fetch scan history
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          created_at,
          barcode_value,
          language,
          extraction_id,
          selected_product_id,
          extractions (extracted_json, quality_score, risk_flags),
          products (brand_name, generic_name, strength, form)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (sessionsError) throw sessionsError;

      // Fetch reminders
      const { data: reminders, error: remindersError } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('user_id', user.id);

      if (remindersError) throw remindersError;

      // Fetch adherence data
      const { data: adherenceData, error: adherenceError } = await supabase
        .from('medication_adherence_log')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_time', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .lte('scheduled_time', new Date(new Date().setHours(23, 59, 59, 999)).toISOString());

      if (adherenceError) throw adherenceError;

      // Fetch family groups
      const { data: familyGroups, error: familyError } = await supabase
        .from('family_members')
        .select(`
          family_group_id,
          family_groups (name, creator_id),
          user_id
        `)
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted');

      if (familyError) throw familyError;

      // Calculate stats
      const activeMedications = medications.filter(m => m.is_active);
      const activeReminders = reminders?.filter(r => r.is_active) || [];
      const todaysDoses = activeReminders.reduce((total, r) => total + r.days_of_week.length, 0);
      
      // Calculate adherence rate
      const takenToday = adherenceData?.filter(a => a.status === 'taken').length || 0;
      const totalToday = adherenceData?.length || 1;
      const adherenceRate = Math.round((takenToday / totalToday) * 100);

      // Get next reminder
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      let nextReminder;
      
      for (const reminder of activeReminders) {
        const reminderTime = reminder.reminder_time;
        const [hours, minutes] = reminderTime.split(':').map(Number);
        const reminderMinutes = hours * 60 + minutes;
        
        if (reminderMinutes > currentTime) {
          const medication = medications.find(m => m.id === reminder.medication_id);
          nextReminder = {
            medication: medication?.medication_name || 'Unknown',
            time: reminderTime
          };
          break;
        }
      }

      setDashboardStats({
        medications: {
          total: medications.length,
          active: activeMedications.length,
          lowStock: 0 // This would need additional logic based on expiry dates
        },
        scans: {
          total: sessions?.length || 0,
          recent: sessions?.slice(0, 5) || [],
          recentCount: sessions?.length || 0
        },
        reminders: {
          total: reminders?.length || 0,
          active: activeReminders.length,
          todaysDoses,
          nextReminder
        },
        adherence: {
          rate: adherenceRate || 0,
          streak: 0, // This would need streak calculation logic
          completedToday: takenToday,
          totalToday,
          missedToday: totalToday - takenToday
        },
        family: {
          groups: new Set(familyGroups?.map(fg => fg.family_group_id)).size || 0,
          members: familyGroups?.length || 0
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, medications, medicationsLoading]);

  return {
    dashboardStats,
    loading: loading || medicationsLoading,
    refetch: fetchDashboardData
  };
};