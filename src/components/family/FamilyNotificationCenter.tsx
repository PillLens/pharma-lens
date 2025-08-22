import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { familySharingService, FamilyGroup } from '@/services/familySharingService';

interface FamilyNotification {
  id: string;
  type: 'invitation' | 'medication_shared' | 'health_alert' | 'reminder' | 'emergency';
  title: string;
  message: string;
  timestamp: string;
  familyGroupId?: string;
  familyGroupName?: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: boolean;
  metadata?: {
    medicationName?: string;
    memberName?: string;
    inviterId?: string;
  };
}

interface FamilyNotificationCenterProps {
  familyGroups: FamilyGroup[];
  onInvitationResponse?: (groupId: string, response: 'accepted' | 'declined') => void;
}

export const FamilyNotificationCenter: React.FC<FamilyNotificationCenterProps> = ({
  familyGroups,
  onInvitationResponse
}) => {
  const [notifications, setNotifications] = useState<FamilyNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    invitations: true,
    medicationSharing: true,
    healthAlerts: true,
    reminders: true,
    emergency: true
  });

  useEffect(() => {
    loadNotifications();
    // Set up real-time notification listener
    const interval = setInterval(loadNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Get pending invitations
      const pendingInvitations = await familySharingService.getUserPendingInvitations();
      
      // Convert invitations to notifications
      const invitationNotifications: FamilyNotification[] = pendingInvitations.map(invitation => ({
        id: `invitation_${invitation.id}`,
        type: 'invitation',
        title: 'Family Group Invitation',
        message: `You've been invited to join "${invitation.familyGroupName}"`,
        timestamp: invitation.invitedAt,
        familyGroupId: invitation.familyGroupId,
        familyGroupName: invitation.familyGroupName,
        isRead: false,
        priority: 'medium',
        actionRequired: true,
        metadata: {
          inviterId: invitation.invitedBy
        }
      }));

      // Generate mock notifications for demonstration
      const mockNotifications: FamilyNotification[] = [
        {
          id: 'health_alert_1',
          type: 'health_alert',
          title: 'Medication Reminder Missed',
          message: 'John missed their evening medication dose',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          familyGroupId: familyGroups[0]?.id,
          familyGroupName: familyGroups[0]?.name,
          isRead: false,
          priority: 'high',
          metadata: {
            memberName: 'John',
            medicationName: 'Blood Pressure Medication'
          }
        },
        {
          id: 'medication_shared_1',
          type: 'medication_shared',
          title: 'Medication Shared',
          message: 'Sarah shared "Diabetes Medication" with the family group',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          familyGroupId: familyGroups[0]?.id,
          familyGroupName: familyGroups[0]?.name,
          isRead: true,
          priority: 'low',
          metadata: {
            memberName: 'Sarah',
            medicationName: 'Diabetes Medication'
          }
        }
      ];

      const allNotifications = [...invitationNotifications, ...mockNotifications]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleInvitationAction = async (notification: FamilyNotification, action: 'accepted' | 'declined') => {
    if (!notification.familyGroupId) return;

    try {
      const success = await familySharingService.respondToInvitation(notification.familyGroupId, action);
      if (success) {
        removeNotification(notification.id);
        onInvitationResponse?.(notification.familyGroupId, action);
        toast({
          title: 'Invitation Response',
          description: `Invitation ${action} successfully`,
        });
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to respond to invitation',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: FamilyNotification['type']) => {
    switch (type) {
      case 'invitation': return <Bell className="w-4 h-4" />;
      case 'medication_shared': return <Info className="w-4 h-4" />;
      case 'health_alert': return <AlertTriangle className="w-4 h-4" />;
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: FamilyNotification['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toDateString();
  };

  return (
    <div className="relative">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Family Notifications
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Notification Settings</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 mt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="invitations">Family Invitations</Label>
                          <Switch
                            id="invitations"
                            checked={notificationSettings.invitations}
                            onCheckedChange={(checked) => 
                              setNotificationSettings(prev => ({ ...prev, invitations: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="medication-sharing">Medication Sharing</Label>
                          <Switch
                            id="medication-sharing"
                            checked={notificationSettings.medicationSharing}
                            onCheckedChange={(checked) => 
                              setNotificationSettings(prev => ({ ...prev, medicationSharing: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="health-alerts">Health Alerts</Label>
                          <Switch
                            id="health-alerts"
                            checked={notificationSettings.healthAlerts}
                            onCheckedChange={(checked) => 
                              setNotificationSettings(prev => ({ ...prev, healthAlerts: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="reminders">Medication Reminders</Label>
                          <Switch
                            id="reminders"
                            checked={notificationSettings.reminders}
                            onCheckedChange={(checked) => 
                              setNotificationSettings(prev => ({ ...prev, reminders: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="emergency">Emergency Alerts</Label>
                          <Switch
                            id="emergency"
                            checked={notificationSettings.emergency}
                            onCheckedChange={(checked) => 
                              setNotificationSettings(prev => ({ ...prev, emergency: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            {loading ? (
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
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    All caught up! No new notifications.
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications.map(notification => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/10 border-blue-200' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex items-center gap-2 mt-1">
                          {getNotificationIcon(notification.type)}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            {notification.familyGroupName && (
                              <span className="text-xs text-muted-foreground">
                                • {notification.familyGroupName}
                              </span>
                            )}
                          </div>

                          {notification.actionRequired && notification.type === 'invitation' && (
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInvitationAction(notification, 'accepted');
                                }}
                              >
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInvitationAction(notification, 'declined');
                                }}
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="p-1 h-6 w-6"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FamilyNotificationCenter;