import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  User, Activity, Heart, Clock, Phone, Mail, MapPin,
  Settings, Bell, Shield, Pill, Calendar, MessageCircle,
  TrendingUp, TrendingDown, Eye, Edit, MoreVertical
} from 'lucide-react';
import { enhancedMemberManagementService } from '@/services/enhancedMemberManagementService';
import { FamilyMember } from '@/services/familySharingService';

interface EnhancedMemberManagementProps {
  familyGroups: any[];
  currentUserId: string;
}

interface MemberProfile {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string[];
  last_seen?: string;
  timezone?: string;
  notification_preferences?: {
    medication_reminders: boolean;
    family_updates: boolean;
    emergency_alerts: boolean;
    email_notifications: boolean;
  };
}

interface MemberActivity {
  id: string;
  user_id: string;
  activity_type: string;
  created_at: string;
  description: string;
}

interface MemberAnalytics {
  user_id: string;
  adherence_rate: number;
  active_medications: number;
  completed_tasks: number;
  family_interactions: number;
  last_activity: string;
  adherence_trend: 'improving' | 'stable' | 'declining';
  engagement_score: number;
}

export const EnhancedMemberManagement: React.FC<EnhancedMemberManagementProps> = ({
  familyGroups,
  currentUserId
}) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, MemberProfile>>({});
  const [memberAnalytics, setMemberAnalytics] = useState<Record<string, MemberAnalytics>>({});
  const [memberActivities, setMemberActivities] = useState<Record<string, MemberActivity[]>>({});
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadMemberData();
  }, [familyGroups]);

  const loadMemberData = async () => {
    if (!familyGroups?.length) return;

    try {
      setLoading(true);
      
      // Get all family members
      const allMembers = await enhancedMemberManagementService.getAllFamilyMembers(familyGroups);
      setMembers(allMembers);

      // Load profiles for all members
      const profiles = await enhancedMemberManagementService.getMemberProfiles(
        allMembers.map(m => m.user_id)
      );
      setMemberProfiles(profiles);

      // Load analytics for all members
      const analytics = await enhancedMemberManagementService.getMemberAnalytics(
        allMembers.map(m => m.user_id)
      );
      setMemberAnalytics(analytics);

      // Load recent activities
      const activities = await enhancedMemberManagementService.getMemberActivities(
        allMembers.map(m => m.user_id)
      );
      setMemberActivities(activities);

    } catch (error) {
      console.error('Error loading member data:', error);
      toast.error('Failed to load member data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberProfile = async (userId: string, updates: Partial<MemberProfile>) => {
    try {
      await enhancedMemberManagementService.updateMemberProfile(userId, updates);
      
      setMemberProfiles(prev => ({
        ...prev,
        [userId]: { ...prev[userId], ...updates }
      }));
      
      toast.success('Member profile updated');
      setProfileDialogOpen(false);
    } catch (error) {
      console.error('Error updating member profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleUpdateNotificationPreferences = async (
    userId: string, 
    preferences: MemberProfile['notification_preferences']
  ) => {
    try {
      await enhancedMemberManagementService.updateNotificationPreferences(userId, preferences);
      
      setMemberProfiles(prev => ({
        ...prev,
        [userId]: { 
          ...prev[userId], 
          notification_preferences: preferences 
        }
      }));
      
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  const getStatusBadge = (lastSeen?: string) => {
    if (!lastSeen) return <Badge variant="secondary">Unknown</Badge>;
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) {
      return <Badge variant="default" className="bg-green-500">Online</Badge>;
    } else if (diffMinutes < 30) {
      return <Badge variant="secondary">Away</Badge>;
    } else {
      return <Badge variant="outline">Offline</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Family Member Management</h2>
        <Badge variant="outline">{members.length} Members</Badge>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => {
          const profile = memberProfiles[member.user_id];
          const analytics = memberAnalytics[member.user_id];
          
          if (!profile) return null;

          return (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{profile.display_name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(profile.last_seen)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMember(member);
                        setProfileDialogOpen(true);
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Quick Stats */}
                {analytics && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="text-lg font-semibold text-primary">
                        {analytics.adherence_rate}%
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        Adherence
                        {getTrendIcon(analytics.adherence_trend)}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="text-lg font-semibold text-primary">
                        {analytics.engagement_score}
                      </div>
                      <div className="text-xs text-muted-foreground">Engagement</div>
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>

                {/* Member info only - no action buttons */}
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    Family member
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Member Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedMember && memberProfiles[selectedMember.user_id] && (
                <>
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(memberProfiles[selectedMember.user_id].display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{memberProfiles[selectedMember.user_id].display_name}</div>
                    <div className="text-sm font-normal text-muted-foreground capitalize">
                      {selectedMember.role}
                    </div>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedMember && memberProfiles[selectedMember.user_id] && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <MemberOverviewTab
                  member={selectedMember}
                  profile={memberProfiles[selectedMember.user_id]}
                  analytics={memberAnalytics[selectedMember.user_id]}
                  onUpdateProfile={(updates) => 
                    handleUpdateMemberProfile(selectedMember.user_id, updates)
                  }
                />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6 mt-6">
                <MemberAnalyticsTab
                  member={selectedMember}
                  analytics={memberAnalytics[selectedMember.user_id]}
                />
              </TabsContent>

              <TabsContent value="activity" className="space-y-6 mt-6">
                <MemberActivityTab
                  member={selectedMember}
                  activities={memberActivities[selectedMember.user_id] || []}
                />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-6">
                <MemberSettingsTab
                  member={selectedMember}
                  profile={memberProfiles[selectedMember.user_id]}
                  onUpdatePreferences={(preferences) =>
                    handleUpdateNotificationPreferences(selectedMember.user_id, preferences)
                  }
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sub-components for dialog tabs
const MemberOverviewTab: React.FC<{
  member: FamilyMember;
  profile: MemberProfile;
  analytics?: MemberAnalytics;
  onUpdateProfile: (updates: Partial<MemberProfile>) => void;
}> = ({ member, profile, analytics, onUpdateProfile }) => {
  return (
    <div className="space-y-6">
      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
            <div>
              <Label>Phone</Label>
              <p className="text-sm text-muted-foreground">{profile.phone || 'Not provided'}</p>
            </div>
            <div>
              <Label>Emergency Contact</Label>
              <p className="text-sm text-muted-foreground">
                {profile.emergency_contact_name || 'Not set'}
              </p>
            </div>
            <div>
              <Label>Emergency Phone</Label>
              <p className="text-sm text-muted-foreground">
                {profile.emergency_contact_phone || 'Not set'}
              </p>
            </div>
          </div>
          
          {profile.medical_conditions && profile.medical_conditions.length > 0 && (
            <div>
              <Label>Medical Conditions</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.medical_conditions.map((condition, index) => (
                  <Badge key={index} variant="outline">{condition}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{analytics.adherence_rate}%</div>
                <p className="text-sm text-muted-foreground">Adherence Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{analytics.active_medications}</div>
                <p className="text-sm text-muted-foreground">Active Medications</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{analytics.completed_tasks}</div>
                <p className="text-sm text-muted-foreground">Completed Tasks</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{analytics.family_interactions}</div>
                <p className="text-sm text-muted-foreground">Family Interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const MemberAnalyticsTab: React.FC<{
  member: FamilyMember;
  analytics?: MemberAnalytics;
}> = ({ member, analytics }) => {
  if (!analytics) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground">Analytics data will appear here once the member becomes more active.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Medication Adherence</Label>
              <span className="text-sm text-muted-foreground">{analytics.adherence_rate}%</span>
            </div>
            <Progress value={analytics.adherence_rate} className="h-2" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Engagement Score</Label>
              <span className="text-sm text-muted-foreground">{analytics.engagement_score}/100</span>
            </div>
            <Progress value={analytics.engagement_score} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MemberActivityTab: React.FC<{
  member: FamilyMember;
  activities: MemberActivity[];
}> = ({ member, activities }) => {
  if (!activities.length) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
        <p className="text-muted-foreground">Member activity will appear here once they start using the app.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{activity.description}</p>
                <p className="text-sm text-muted-foreground capitalize">{activity.activity_type}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(activity.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const MemberSettingsTab: React.FC<{
  member: FamilyMember;
  profile: MemberProfile;
  onUpdatePreferences: (preferences: MemberProfile['notification_preferences']) => void;
}> = ({ member, profile, onUpdatePreferences }) => {
  const [preferences, setPreferences] = useState(
    profile.notification_preferences || {
      medication_reminders: true,
      family_updates: true,
      emergency_alerts: true,
      email_notifications: false
    }
  );

  const handleSavePreferences = () => {
    onUpdatePreferences(preferences);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Medication Reminders</Label>
              <p className="text-sm text-muted-foreground">Receive notifications for medication schedules</p>
            </div>
            <Switch
              checked={preferences.medication_reminders}
              onCheckedChange={(checked) =>
                setPreferences(prev => ({ ...prev, medication_reminders: checked }))
              }
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Family Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified about family group activities</p>
            </div>
            <Switch
              checked={preferences.family_updates}
              onCheckedChange={(checked) =>
                setPreferences(prev => ({ ...prev, family_updates: checked }))
              }
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Emergency Alerts</Label>
              <p className="text-sm text-muted-foreground">Receive emergency notifications</p>
            </div>
            <Switch
              checked={preferences.emergency_alerts}
              onCheckedChange={(checked) =>
                setPreferences(prev => ({ ...prev, emergency_alerts: checked }))
              }
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch
              checked={preferences.email_notifications}
              onCheckedChange={(checked) =>
                setPreferences(prev => ({ ...prev, email_notifications: checked }))
              }
            />
          </div>
          
          <div className="pt-4">
            <Button onClick={handleSavePreferences}>Save Preferences</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};