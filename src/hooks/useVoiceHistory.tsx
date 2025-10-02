import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SavedResponse {
  id: string;
  content: string;
  timestamp: Date;
  voice: string;
  starred: boolean;
}

export function useVoiceHistory() {
  const { user } = useAuth();
  const [savedResponses, setSavedResponses] = useState<SavedResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSavedResponses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const saved = localStorage.getItem(`voice_history_${user.id}`);
      if (saved) {
        setSavedResponses(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading voice history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedResponses();
  }, [user]);

  const saveResponse = (content: string, voice: string) => {
    if (!user) return;
    
    const newResponse: SavedResponse = {
      id: crypto.randomUUID(),
      content,
      timestamp: new Date(),
      voice,
      starred: false
    };

    const updated = [newResponse, ...savedResponses].slice(0, 50); // Keep last 50
    setSavedResponses(updated);
    localStorage.setItem(`voice_history_${user.id}`, JSON.stringify(updated));
  };

  const toggleStar = (id: string) => {
    if (!user) return;
    
    const updated = savedResponses.map(r => 
      r.id === id ? { ...r, starred: !r.starred } : r
    );
    setSavedResponses(updated);
    localStorage.setItem(`voice_history_${user.id}`, JSON.stringify(updated));
  };

  const deleteResponse = (id: string) => {
    if (!user) return;
    
    const updated = savedResponses.filter(r => r.id !== id);
    setSavedResponses(updated);
    localStorage.setItem(`voice_history_${user.id}`, JSON.stringify(updated));
  };

  return {
    savedResponses,
    loading,
    saveResponse,
    toggleStar,
    deleteResponse,
    reload: loadSavedResponses
  };
}
