import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  Smartphone, Vibrate, Volume2, VolumeX, Moon, Sun,
  Eye, Zap, Wifi, WifiOff, Battery, Settings, Bell, Accessibility,
  Palette, Type, Contrast, MousePointer
} from 'lucide-react';
import { mobileOptimizationService } from '@/services/mobileOptimizationService';
import { hapticService } from '@/services/hapticService';

interface EnhancedMobileExperienceProps {
  userId: string;
}

interface MobileSettings {
  hapticFeedback: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  darkMode: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationStrength: number;
  fontSize: number;
  gesturesEnabled: boolean;
  offlineMode: boolean;
  batteryOptimization: boolean;
  autoSync: boolean;
}

export const EnhancedMobileExperience: React.FC<EnhancedMobileExperienceProps> = ({
  userId
}) => {
  const [settings, setSettings] = useState<MobileSettings>({
    hapticFeedback: true,
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    darkMode: false,
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationStrength: 50,
    fontSize: 16,
    gesturesEnabled: true,
    offlineMode: false,
    batteryOptimization: false,
    autoSync: true
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMobileSettings();
    setupDeviceMonitoring();
  }, [userId]);

  useEffect(() => {
    applyAccessibilitySettings();
  }, [settings]);

  const loadMobileSettings = async () => {
    try {
      const userSettings = await mobileOptimizationService.getMobileSettings(userId);
      setSettings({ ...settings, ...userSettings });
    } catch (error) {
      console.error('Error loading mobile settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupDeviceMonitoring = () => {
    // Network monitoring
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    // Battery API (if supported)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(() => {
        console.log('Battery API not supported');
      });
    }

    // Connection type (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection?.effectiveType || 'unknown');
      
      connection?.addEventListener('change', () => {
        setConnectionType(connection?.effectiveType || 'unknown');
      });
    }
  };

  const applyAccessibilitySettings = () => {
    const root = document.documentElement;
    
    // Apply font size
    root.style.setProperty('--mobile-font-size', `${settings.fontSize}px`);
    
    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.setProperty('--animation-duration', '0.3s');
    }

    // Apply large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
  };

  const updateSetting = async <K extends keyof MobileSettings>(
    key: K, 
    value: MobileSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await mobileOptimizationService.updateMobileSettings(userId, { [key]: value });
      
      // Provide haptic feedback if enabled
      if (settings.hapticFeedback && key !== 'hapticFeedback') {
        hapticService.impact('light');
      }
      
      toast.success('Setting updated');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
      // Revert on error
      setSettings(settings);
    }
  };

  const testHapticFeedback = () => {
    if (settings.hapticFeedback) {
      hapticService.impact('medium');
      toast.success('Haptic feedback test');
    } else {
      toast.info('Enable haptic feedback first');
    }
  };

  const optimizeForBattery = async () => {
    const optimizations = {
      reducedMotion: true,
      batteryOptimization: true,
      autoSync: false,
      vibrationStrength: 20
    };
    
    Object.entries(optimizations).forEach(([key, value]) => {
      updateSetting(key as keyof MobileSettings, value);
    });
    
    toast.success('Battery optimization enabled');
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-destructive" />;
    
    switch (connectionType) {
      case '4g': return <Wifi className="w-4 h-4 text-green-500" />;
      case '3g': return <Wifi className="w-4 h-4 text-yellow-500" />;
      case '2g': return <Wifi className="w-4 h-4 text-red-500" />;
      default: return <Wifi className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getBatteryIcon = () => {
    if (batteryLevel === null) return <Battery className="w-4 h-4" />;
    
    const level = batteryLevel;
    if (level > 75) return <Battery className="w-4 h-4 text-green-500" />;
    if (level > 50) return <Battery className="w-4 h-4 text-yellow-500" />;
    if (level > 25) return <Battery className="w-4 h-4 text-orange-500" />;
    return <Battery className="w-4 h-4 text-red-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Device Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Device Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <div>
                <p className="text-sm font-medium">Connection</p>
                <p className="text-xs text-muted-foreground">
                  {isOnline ? connectionType.toUpperCase() : 'Offline'}
                </p>
              </div>
            </div>
            
            {batteryLevel !== null && (
              <div className="flex items-center gap-2">
                {getBatteryIcon()}
                <div>
                  <p className="text-sm font-medium">Battery</p>
                  <p className="text-xs text-muted-foreground">{batteryLevel}%</p>
                </div>
              </div>
            )}
          </div>
          
          {batteryLevel !== null && batteryLevel < 20 && !settings.batteryOptimization && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 w-full"
              onClick={optimizeForBattery}
            >
              <Zap className="w-4 h-4 mr-2" />
              Enable Battery Optimization
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Accessibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="w-5 h-5" />
            Accessibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              <span className="text-sm">Large Text</span>
            </div>
            <Switch
              checked={settings.largeText}
              onCheckedChange={(checked) => updateSetting('largeText', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Contrast className="w-4 h-4" />
              <span className="text-sm">High Contrast</span>
            </div>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={(checked) => updateSetting('highContrast', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Reduced Motion</span>
            </div>
            <Switch
              checked={settings.reducedMotion}
              onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              <span className="text-sm">Font Size: {settings.fontSize}px</span>
            </div>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([value]) => updateSetting('fontSize', value)}
              min={12}
              max={24}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Interaction Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="w-5 h-5" />
            Interaction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vibrate className="w-4 h-4" />
              <span className="text-sm">Haptic Feedback</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.hapticFeedback}
                onCheckedChange={(checked) => updateSetting('hapticFeedback', checked)}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={testHapticFeedback}
                className="px-2"
              >
                Test
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              <span className="text-sm">Gesture Navigation</span>
            </div>
            <Switch
              checked={settings.gesturesEnabled}
              onCheckedChange={(checked) => updateSetting('gesturesEnabled', checked)}
            />
          </div>

          {settings.hapticFeedback && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Vibrate className="w-4 h-4" />
                <span className="text-sm">Vibration Strength: {settings.vibrationStrength}%</span>
              </div>
              <Slider
                value={[settings.vibrationStrength]}
                onValueChange={([value]) => updateSetting('vibrationStrength', value)}
                min={0}
                max={100}
                step={10}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications & Sound */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications & Sound
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="text-sm">Push Notifications</span>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) => updateSetting('notificationsEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="text-sm">Sound Effects</span>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4" />
              <span className="text-sm">Battery Optimization</span>
            </div>
            <Switch
              checked={settings.batteryOptimization}
              onCheckedChange={(checked) => updateSetting('batteryOptimization', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              <span className="text-sm">Offline Mode</span>
            </div>
            <Switch
              checked={settings.offlineMode}
              onCheckedChange={(checked) => updateSetting('offlineMode', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Auto Sync</span>
            </div>
            <Switch
              checked={settings.autoSync}
              onCheckedChange={(checked) => updateSetting('autoSync', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};