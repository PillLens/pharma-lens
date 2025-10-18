import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Bell, BellOff, Clock, AlertTriangle, Heart, Pill, 
  Users, MessageCircle, Settings, Check, X, Volume2, 
  Smartphone, Mail, Calendar, Activity
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'medication' | 'emergency' | 'family' | 'appointment' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  created_at: string;
  data?: any;
}

interface NotificationSettings {
  medication_reminders: boolean;
  family_updates: boolean;
  emergency_alerts: boolean;
  appointment_reminders: boolean;
  system_notifications: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export const EnhancedNotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    medication_reminders: true,
    family_updates: true,
    emergency_alerts: true,
    appointment_reminders: true,
    system_notifications: true,
    sound_enabled: true,
    vibration_enabled: true,
    email_notifications: true,
    push_notifications: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadSettings();
      setupRealtimeSubscription();
    }
  }, [user?.id]);

  useEffect(() => {
    const count = notifications.filter(n => !n.is_read).length;
    setUnreadCount(count);
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_delivery_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedNotifications: Notification[] = data?.map(log => {
        const notificationData = log.notification_data as any;
        return {
          id: log.id,
          title: notificationData?.title || 'Notification',
          message: notificationData?.message || log.notification_type,
          type: log.notification_type as any,
          priority: notificationData?.priority || 'normal',
          is_read: notificationData?.is_read || false,
          created_at: log.created_at,
          data: notificationData
        };
      }) || [];

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          medication_reminders: data.medication_reminders,
          family_updates: data.family_invitations,
          emergency_alerts: data.emergency_notifications,
          appointment_reminders: data.health_alerts,
          system_notifications: true,
          sound_enabled: true,
          vibration_enabled: true,
          email_notifications: true,
          push_notifications: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00'
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('notification_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_delivery_logs',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            title: payload.new.notification_data?.title || 'New Notification',
            message: payload.new.notification_data?.message || payload.new.notification_type,
            type: payload.new.notification_type,
            priority: payload.new.notification_data?.priority || 'normal',
            is_read: false,
            created_at: payload.new.created_at,
            data: payload.new.notification_data
          };

          setNotifications(prev => [newNotification, ...prev]);
          
          // Show browser notification if enabled
          if (settings.push_notifications && 'Notification' in window) {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/pilllens-logo.png?v=2025'
            });
          }

          // Play sound if enabled
          if (settings.sound_enabled) {
            const audio = new Audio('/notification-sound.mp3');
            audio.play().catch(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );

      // In a real app, you'd update the notification status in the database
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean | string) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      
      // Update in database  
      if (user?.id) {
        const updateData = {
          medication_reminders: key === 'medication_reminders' ? value as boolean : settings.medication_reminders,
          family_invitations: key === 'family_updates' ? value as boolean : settings.family_updates,
          emergency_notifications: key === 'emergency_alerts' ? value as boolean : settings.emergency_alerts,
          health_alerts: key === 'appointment_reminders' ? value as boolean : settings.appointment_reminders
        };

        const { error } = await supabase
          .from('notification_preferences')
          .upsert({
            ...updateData,
            user_id: user.id
          });

        if (error) throw error;
      }
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill className="w-4 h-4" />;
      case 'emergency':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'family':
        return <Users className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'normal':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      notification.is_read 
                        ? 'bg-background' 
                        : 'bg-muted/50 border-primary/20'
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                            {notification.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        {!notification.is_read && (
                          <Button
                            onClick={() => markAsRead(notification.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                          >
                            Mark Read
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteNotification(notification.id)}
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Types */}
          <div className="space-y-4">
            <h4 className="font-medium">Notification Types</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  <Label>Medication Reminders</Label>
                </div>
                <Switch
                  checked={settings.medication_reminders}
                  onCheckedChange={(checked) => updateSetting('medication_reminders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <Label>Family Updates</Label>
                </div>
                <Switch
                  checked={settings.family_updates}
                  onCheckedChange={(checked) => updateSetting('family_updates', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <Label>Emergency Alerts</Label>
                </div>
                <Switch
                  checked={settings.emergency_alerts}
                  onCheckedChange={(checked) => updateSetting('emergency_alerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <Label>Appointment Reminders</Label>
                </div>
                <Switch
                  checked={settings.appointment_reminders}
                  onCheckedChange={(checked) => updateSetting('appointment_reminders', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery Methods */}
          <div className="space-y-4">
            <h4 className="font-medium">Delivery Methods</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <Label>Push Notifications</Label>
                </div>
                <Switch
                  checked={settings.push_notifications}
                  onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <Label>Email Notifications</Label>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <Label>Sound Alerts</Label>
                </div>
                <Switch
                  checked={settings.sound_enabled}
                  onCheckedChange={(checked) => updateSetting('sound_enabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <Label>Vibration</Label>
                </div>
                <Switch
                  checked={settings.vibration_enabled}
                  onCheckedChange={(checked) => updateSetting('vibration_enabled', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};