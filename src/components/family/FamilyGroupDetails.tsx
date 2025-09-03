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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="text-muted-foreground">
              Manage your family group and members
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => onEditGroup(group)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{activeMembers.length}</p>
                <p className="text-xs text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-warning" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Upcoming Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 md:grid-cols-5 sm:flex sm:w-auto sm:overflow-x-auto sm:justify-start">
          <TabsTrigger value="overview" className="flex flex-col items-center gap-1 py-3 px-3 text-xs min-w-fit">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:block">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex flex-col items-center gap-1 py-3 px-3 text-xs min-w-fit">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:block">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex flex-col items-center gap-1 py-3 px-3 text-xs min-w-fit">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:block">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex flex-col items-center gap-1 py-3 px-3 text-xs min-w-fit">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:block">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex flex-col items-center gap-1 py-3 px-3 text-xs min-w-fit">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:block">Calendar</span>
          </TabsTrigger>
        </TabsList>

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
                          {member.user_id?.charAt(0) || '?'}
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
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-xs text-muted-foreground">Online</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
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
                  <p className="text-sm">Family activities will appear here</p>
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

        <TabsContent value="appointments">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <AppointmentManager
              familyGroupId={group.id}
              familyMembers={activeMembers}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FamilyGroupDetails;