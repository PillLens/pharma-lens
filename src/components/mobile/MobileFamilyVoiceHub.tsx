import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EnhancedMobileVoiceInterface } from './EnhancedMobileVoiceInterface';
import { hapticService } from '@/services/hapticService';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import {
  Mic, Bot, Users, MessageCircle, Settings, 
  Smartphone, Headphones, Phone, Waves,
  Battery, Wifi, Signal, Volume2
} from 'lucide-react';

interface MobileFamilyVoiceHubProps {
  familyGroupId: string;
  familyMembers: any[];
}

export const MobileFamilyVoiceHub: React.FC<MobileFamilyVoiceHubProps> = ({
  familyGroupId,
  familyMembers
}) => {
  const { isMobile } = useIsMobile();
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [quickActions, setQuickActions] = useState<string[]>([]);
  const [recentInteractions, setRecentInteractions] = useState<any[]>([]);

  // Mobile-specific state
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [signalStrength, setSignalStrength] = useState<'weak' | 'medium' | 'strong'>('strong');

  useEffect(() => {
    // Monitor battery level for mobile optimization
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    // Monitor online/offline status
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        toast.success('Connection restored');
      } else {
        toast.error('Connection lost');
        hapticService.feedback('error');
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Simulate signal strength (in a real app, this would use actual network APIs)
    const updateSignalStrength = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g' || effectiveType === '5g') {
          setSignalStrength('strong');
        } else if (effectiveType === '3g') {
          setSignalStrength('medium');
        } else {
          setSignalStrength('weak');
        }
      }
    };

    updateSignalStrength();
    const signalInterval = setInterval(updateSignalStrength, 10000);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      clearInterval(signalInterval);
    };
  }, []);

  const handleVoiceStatusChange = (status: string) => {
    setConnectionStatus(status);
    setIsVoiceActive(status === 'connected');
    
    // Add haptic feedback for status changes
    switch (status) {
      case 'connected':
        hapticService.feedback('success');
        break;
      case 'connecting':
        hapticService.feedback('light');
        break;
      case 'error':
        hapticService.feedback('error');
        break;
    }
  };

  const getQuickActionSuggestions = () => {
    const actions = [
      'Ask about medication reminders',
      'Check family health status',
      'Schedule appointment reminder',
      'Send emergency alert',
      'Get medication information',
      'Review today\'s tasks'
    ];
    return actions.slice(0, 4);
  };

  const handleQuickAction = async (action: string) => {
    hapticService.buttonPress();
    toast.info(`Quick action: ${action}`);
    // In a real implementation, this would trigger the voice assistant with the action
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <Wifi className="w-4 h-4 text-red-500" />;
    
    switch (signalStrength) {
      case 'strong':
        return <Signal className="w-4 h-4 text-green-500" />;
      case 'medium':
        return <Signal className="w-4 h-4 text-yellow-500" />;
      case 'weak':
        return <Signal className="w-4 h-4 text-red-500" />;
    }
  };

  const getBatteryColor = () => {
    if (batteryLevel === null) return 'text-muted-foreground';
    if (batteryLevel > 50) return 'text-green-500';
    if (batteryLevel > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const shouldOptimizeForBattery = () => {
    return batteryLevel !== null && batteryLevel < 20;
  };

  if (!isMobile) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Mobile Voice Hub is optimized for mobile devices</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      {/* Mobile Status Bar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium">Family Voice Hub</span>
              <Badge variant={isVoiceActive ? 'default' : 'secondary'} className="text-xs">
                {isVoiceActive ? 'Active' : 'Standby'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              {batteryLevel !== null && (
                <div className="flex items-center gap-1">
                  <Battery className={`w-4 h-4 ${getBatteryColor()}`} />
                  <span className={getBatteryColor()}>{batteryLevel}%</span>
                </div>
              )}
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Battery Optimization Warning */}
      {shouldOptimizeForBattery() && (
        <Card className="border-orange-500/20 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700">
              <Battery className="w-4 h-4" />
              <span className="text-sm font-medium">Battery Optimization Active</span>
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Voice features are using reduced power mode to preserve battery.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Family Status Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            Family Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{familyMembers.length} Members Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Voice Assistant Ready</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mic className="w-5 h-5" />
            Quick Voice Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {getQuickActionSuggestions().map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start h-auto p-3 text-left"
                onClick={() => handleQuickAction(action)}
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="text-sm">{action}</span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Interface Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Headphones className="w-5 h-5" />
            Voice Chat Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span>Speak naturally - the AI understands conversational language</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span>Ask about medications, health, or family coordination</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span>The AI can send notifications to family members</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span>Use "Play with premium voice" for high-quality audio</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      {!isOnline && (
        <Card className="border-red-500/20 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <Wifi className="w-4 h-4" />
              <span className="font-medium">Offline Mode</span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Voice features require internet connection. Please check your network.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Mobile Voice Interface */}
      <EnhancedMobileVoiceInterface
        familyGroupId={familyGroupId}
        onStatusChange={handleVoiceStatusChange}
      />
    </div>
  );
};