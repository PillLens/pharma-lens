import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ArrowLeft, Users, Calendar, ClipboardList, Activity, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { FamilyGroup } from '@/services/familySharingService';

// Lazy load the heavy components
const CareTasksManager = lazy(() => import('./CareTasksManager'));
const AppointmentManager = lazy(() => import('./AppointmentManager'));
const HealthInsightsDashboard = lazy(() => import('./HealthInsightsDashboard').then(module => ({ default: module.HealthInsightsDashboard })));
const EmergencyFeaturesManager = lazy(() => import('./EmergencyFeaturesManager').then(module => ({ default: module.EmergencyFeaturesManager })));
const FamilyAnalyticsDashboard = lazy(() => import('../analytics/FamilyAnalyticsDashboard').then(module => ({ default: module.FamilyAnalyticsDashboard })));
const AdvancedFamilyInsights = lazy(() => import('./AdvancedFamilyInsights').then(module => ({ default: module.AdvancedFamilyInsights })));

interface FamilyGroupDetailsProps {
  group: FamilyGroup;
  onBack: () => void;
  onEditGroup: (group: FamilyGroup) => void;
  currentUserId: string;
}

const FamilyGroupDetails: React.FC<FamilyGroupDetailsProps> = ({
  group,
  onBack,
  onEditGroup,
  currentUserId
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  // Get active family members
  const activeMembers = group.members?.filter(m => m.invitation_status === 'accepted') || [];

  const TabLoadingSkeleton = () => (
    <div className="space-y-3 p-3">
      <div className="grid grid-cols-1 gap-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-3">
              <Skeleton className="h-3 w-3/4 mb-2" />
              <Skeleton className="h-2 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="shrink-0 h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold truncate">{group.name}</h1>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onEditGroup(group)}
            className="shrink-0 h-8 w-8"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2">
          <Card className="border-primary/20">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{activeMembers.length}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground">Events</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compact Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="border-b bg-background sticky top-[49px] z-40">
          <TabsList className="w-full h-auto p-0 bg-transparent justify-start">
            <div className="flex overflow-x-auto w-full">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 min-w-0 flex-1 h-10 px-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">Overview</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="tasks" 
                className="flex items-center gap-2 min-w-0 flex-1 h-10 px-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <ClipboardList className="w-4 h-4" />
                <span className="text-sm font-medium">Tasks</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 min-w-0 flex-1 h-10 px-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Analytics</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="insights" 
                className="flex items-center gap-2 min-w-0 flex-1 h-10 px-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Insights</span>
              </TabsTrigger>
            </div>
          </TabsList>
        </div>

        <div className="flex-1">
          <TabsContent value="overview" className="mt-0 p-0">
            <div className="p-3 space-y-3">
              {/* Family Members - Compact */}
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Family Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  {activeMembers.length > 0 ? (
                    activeMembers.map((member) => (
                      <div key={member.user_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {member.user_id?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-xs">
                              Member {member.user_id?.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {member.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="text-xs text-muted-foreground">Online</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No family members yet</p>
                      <p className="text-xs opacity-60">Invite members to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity - Compact */}
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-center py-4 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No recent activity</p>
                    <p className="text-xs opacity-60">Family activities will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            <Suspense fallback={<TabLoadingSkeleton />}>
              <CareTasksManager
                familyGroupId={group.id}
                familyMembers={activeMembers}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <Suspense fallback={<TabLoadingSkeleton />}>
              <FamilyAnalyticsDashboard
                familyGroupId={group.id}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="insights" className="mt-0">
            <Suspense fallback={<TabLoadingSkeleton />}>
              <AdvancedFamilyInsights
                familyGroupId={group.id}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="appointments" className="mt-0">
            <Suspense fallback={<TabLoadingSkeleton />}>
              <AppointmentManager
                familyGroupId={group.id}
                familyMembers={activeMembers}
              />
            </Suspense>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default FamilyGroupDetails;