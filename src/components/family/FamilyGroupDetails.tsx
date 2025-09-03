import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ArrowLeft, Users, MessageCircle, Calendar, ClipboardList, Activity, Settings, Shield, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
import { FamilyGroup, familySharingService } from '@/services/familySharingService';
import { toast } from '@/hooks/use-toast';

// Lazy load the heavy components
const CareTasksManager = lazy(() => import('./CareTasksManager'));
const HealthInsightsDashboard = lazy(() => import('./HealthInsightsDashboard').then(module => ({ default: module.HealthInsightsDashboard })));
const EmergencyFeaturesManager = lazy(() => import('./EmergencyFeaturesManager').then(module => ({ default: module.EmergencyFeaturesManager })));
const RealTimeCommunication = lazy(() => import('./RealTimeCommunication').then(module => ({ default: module.RealTimeCommunication })));
const VoiceCommunication = lazy(() => import('./VoiceCommunication').then(module => ({ default: module.VoiceCommunication })));
const MobileVoiceInterface = lazy(() => import('../voice/MobileVoiceInterface'));
const FamilyAnalyticsDashboard = lazy(() => import('../analytics/FamilyAnalyticsDashboard').then(module => ({ default: module.FamilyAnalyticsDashboard })));
const AdvancedFamilyInsights = lazy(() => import('./AdvancedFamilyInsights').then(module => ({ default: module.AdvancedFamilyInsights })));

interface FamilyGroupDetailsProps {
  group: FamilyGroup;
  onBack: () => void;
  onEditGroup: (group: FamilyGroup) => void;
  currentUserId: string;
  onMemberRemoved?: () => void;
}

const FamilyGroupDetails: React.FC<FamilyGroupDetailsProps> = ({
  group,
  onBack,
  onEditGroup,
  currentUserId,
  onMemberRemoved
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  // Get active family members
  const activeMembers = group.members?.filter(m => m.invitation_status === 'accepted') || [];

  const TabLoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{group.name}</h2>
            <p className="text-sm text-muted-foreground">
              {activeMembers.length} active members
            </p>
          </div>
        </div>
        
        <Button
          variant="outline" 
          size="sm"
          onClick={() => onEditGroup(group)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Group Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-background border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <div className="min-w-0">
                <p className="text-lg font-semibold">{activeMembers.length}</p>
                <p className="text-xs text-muted-foreground truncate">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-warning" />
              <div className="min-w-0">
                <p className="text-lg font-semibold">0</p>
                <p className="text-xs text-muted-foreground truncate">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <div className="min-w-0">
                <p className="text-lg font-semibold">0</p>
                <p className="text-xs text-muted-foreground truncate">Upcoming Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              <div className="min-w-0">
                <p className="text-lg font-semibold">0</p>
                <p className="text-xs text-muted-foreground truncate">Unread Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="flex w-max min-w-full">
            <TabsTrigger value="overview" className="flex flex-col items-center gap-1 py-2 px-4 text-xs whitespace-nowrap">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:block">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex flex-col items-center gap-1 py-2 px-4 text-xs whitespace-nowrap">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:block">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex flex-col items-center gap-1 py-2 px-4 text-xs whitespace-nowrap">
              <Users className="w-4 h-4" />
              <span className="hidden sm:block">Voice AI</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col items-center gap-1 py-2 px-4 text-xs whitespace-nowrap">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:block">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex flex-col items-center gap-1 py-2 px-4 text-xs whitespace-nowrap">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:block">Insights</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Family Members */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Family Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeMembers.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                         <span className="text-sm font-medium">
                           {(member.user_profile?.display_name || 
                             member.user_profile?.email || 
                             member.display_name || 
                             member.user_email || 
                             member.invited_email)?.charAt(0)?.toUpperCase() || 
                             member.user_id?.charAt(0) || '?'}
                         </span>
                       </div>
                       <div>
                         <p className="font-medium text-sm">
                           {member.user_profile?.display_name || 
                            member.user_profile?.email || 
                            member.display_name || 
                            member.user_email || 
                            member.invited_email ||
                            `Member ${member.user_id?.slice(0, 8)}`}
                         </p>
                         <p className="text-xs text-muted-foreground capitalize">
                           {member.role}
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                       <span className="text-xs text-muted-foreground">Online</span>
                       {member.user_id !== currentUserId && (
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                               <MoreVertical className="h-4 w-4" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem
                               onClick={async () => {
                                 const success = await familySharingService.removeFamilyMember(group.id, member.user_id);
                                 if (success && onMemberRemoved) {
                                   onMemberRemoved();
                                 }
                               }}
                               className="text-destructive focus:text-destructive"
                             >
                               <Trash2 className="mr-2 h-4 w-4" />
                               Remove Member
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       )}
                     </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs">Family activities will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <CareTasksManager
              familyGroupId={group.id}
              familyMembers={activeMembers}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="voice">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <MobileVoiceInterface
              familyGroupId={group.id}
              onSpeakingChange={(speaking) => console.log('Voice speaking:', speaking)}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <FamilyAnalyticsDashboard
              familyGroupId={group.id}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="insights">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <AdvancedFamilyInsights
              familyGroupId={group.id}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FamilyGroupDetails;