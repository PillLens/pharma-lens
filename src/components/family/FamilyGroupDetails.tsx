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
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map(i => (
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
    <div className="min-h-screen bg-background">
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="shrink-0 h-9 w-9"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold truncate">{group.name}</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Manage your family group and members
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEditGroup(group)}
            className="shrink-0 h-9"
          >
            <Settings className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>

      {/* Mobile-Optimized Stats */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-foreground">{activeMembers.length}</p>
                  <p className="text-sm text-muted-foreground">Active Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">Pending Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">Appointments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile-Friendly Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="border-b bg-background/95 backdrop-blur sticky top-16 z-40">
          <TabsList className="w-full h-auto p-1 bg-transparent justify-start">
            <div className="flex overflow-x-auto pb-1 w-full">
              <TabsTrigger 
                value="overview" 
                className="flex flex-col items-center gap-1 min-w-[80px] h-16 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg mx-1"
              >
                <Activity className="w-5 h-5" />
                <span className="text-xs font-medium">Overview</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="tasks" 
                className="flex flex-col items-center gap-1 min-w-[80px] h-16 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg mx-1"
              >
                <ClipboardList className="w-5 h-5" />
                <span className="text-xs font-medium">Tasks</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="analytics" 
                className="flex flex-col items-center gap-1 min-w-[80px] h-16 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg mx-1"
              >
                <Settings className="w-5 h-5" />
                <span className="text-xs font-medium">Analytics</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="insights" 
                className="flex flex-col items-center gap-1 min-w-[80px] h-16 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg mx-1"
              >
                <Shield className="w-5 h-5" />
                <span className="text-xs font-medium">Insights</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="appointments" 
                className="flex flex-col items-center gap-1 min-w-[80px] h-16 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg mx-1"
              >
                <Calendar className="w-5 h-5" />
                <span className="text-xs font-medium">Calendar</span>
              </TabsTrigger>
            </div>
          </TabsList>
        </div>

        <div className="flex-1">
          <TabsContent value="overview" className="mt-0 p-0">
            <div className="p-4 space-y-4">
              {/* Family Members - Mobile Optimized */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Family Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeMembers.length > 0 ? (
                    activeMembers.map((member) => (
                      <div key={member.user_id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {member.user_id?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              Member {member.user_id?.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {member.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-xs text-muted-foreground">Online</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No family members yet</p>
                      <p className="text-xs">Invite members to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity - Mobile Optimized */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No recent activity</p>
                    <p className="text-xs">Family activities will appear here</p>
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