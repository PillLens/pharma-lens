import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DashboardCard {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

const DEFAULT_CARDS: DashboardCard[] = [
  { id: 'today', label: "Today's Focus", visible: true, order: 0 },
  { id: 'medications', label: 'Medications Overview', visible: true, order: 1 },
  { id: 'timeline', label: "Today's Schedule", visible: true, order: 2 },
  { id: 'trends', label: 'Adherence Trends', visible: true, order: 3 },
  { id: 'refill', label: 'Refill Tracker', visible: true, order: 4 },
  { id: 'reminders', label: 'Reminders', visible: true, order: 5 },
  { id: 'reports', label: 'Reports & Export', visible: true, order: 6 },
  { id: 'security', label: 'Security & Privacy', visible: true, order: 7 },
  { id: 'billing', label: 'Plan & Billing', visible: true, order: 8 },
];

export const useDashboardPreferences = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<DashboardCard[]>(DEFAULT_CARDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('dashboard_preferences')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data?.dashboard_preferences) {
          const prefs = data.dashboard_preferences as any;
          if (prefs?.cards_order) {
            const savedCards = prefs.cards_order as DashboardCard[];
            const mergedCards = DEFAULT_CARDS.map(defaultCard => {
              const savedCard = savedCards.find((c: any) => c.id === defaultCard.id);
              return savedCard ? { ...defaultCard, ...savedCard } : defaultCard;
            });
            setCards(mergedCards);
          }
        }
      } catch (err) {
        console.error('Error loading dashboard preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const savePreferences = async (updatedCards: DashboardCard[]) => {
    if (!user) return;

    try {
      // Check if user_settings record exists
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const dashboardPrefs = {
        cards_order: updatedCards
      } as any;

      if (existingSettings) {
        // Update existing record
        const { error } = await supabase
          .from('user_settings')
          .update({ dashboard_preferences: dashboardPrefs })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_settings')
          .insert([{
            user_id: user.id,
            dashboard_preferences: dashboardPrefs
          }]);

        if (error) throw error;
      }

      setCards(updatedCards);
    } catch (err) {
      console.error('Error saving dashboard preferences:', err);
      toast.error('Failed to save preferences');
    }
  };

  const resetPreferences = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ dashboard_preferences: { cards_order: DEFAULT_CARDS } as any })
        .eq('user_id', user.id);

      if (error) throw error;

      setCards(DEFAULT_CARDS);
    } catch (err) {
      console.error('Error resetting dashboard preferences:', err);
      toast.error('Failed to reset preferences');
    }
  };

  return {
    cards,
    loading,
    savePreferences,
    resetPreferences
  };
};
