import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings } from 'lucide-react';

interface VoiceSettings {
  transcription_enabled: boolean;
  auto_save_conversations: boolean;
  history_retention_days: number;
}

interface VoiceSettingsPanelProps {
  userId?: string;
}

export const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({ userId }) => {
  const [settings, setSettings] = useState<VoiceSettings>({
    transcription_enabled: true,
    auto_save_conversations: false,
    history_retention_days: 30
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('dashboard_preferences')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data?.dashboard_preferences?.voice) {
        setSettings({
          transcription_enabled: data.dashboard_preferences.voice.transcription_enabled ?? true,
          auto_save_conversations: data.dashboard_preferences.voice.auto_save_conversations ?? false,
          history_retention_days: data.dashboard_preferences.voice.history_retention_days ?? 30
        });
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
    }
  };

  const saveSettings = async (newSettings: VoiceSettings) => {
    if (!userId) return;

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('user_settings')
        .select('dashboard_preferences')
        .eq('user_id', userId)
        .single();

      const updatedPreferences = {
        ...(existing?.dashboard_preferences || {}),
        voice: newSettings
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          dashboard_preferences: updatedPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Voice settings saved');
    } catch (error) {
      console.error('Error saving voice settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof VoiceSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleRetentionChange = (value: string) => {
    const newSettings = { ...settings, history_retention_days: parseInt(value) };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Voice Settings
        </CardTitle>
        <CardDescription>
          Customize your AI voice assistant experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="transcription">Show Real-time Transcription</Label>
            <p className="text-sm text-muted-foreground">
              Display live transcription during voice conversations
            </p>
          </div>
          <Switch
            id="transcription"
            checked={settings.transcription_enabled}
            onCheckedChange={(checked) => handleToggle('transcription_enabled', checked)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-save">Auto-save Conversations</Label>
            <p className="text-sm text-muted-foreground">
              Automatically save all conversations to family group
            </p>
          </div>
          <Switch
            id="auto-save"
            checked={settings.auto_save_conversations}
            onCheckedChange={(checked) => handleToggle('auto_save_conversations', checked)}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="retention">History Retention</Label>
          <Select 
            value={settings.history_retention_days.toString()} 
            onValueChange={handleRetentionChange}
            disabled={saving}
          >
            <SelectTrigger id="retention">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
              <SelectItem value="99999">Forever</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            How long to keep conversation history
          </p>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Speech rate and pitch adjustments are not supported by the OpenAI Realtime API. 
            Voice characteristics are determined by the selected voice profile.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
