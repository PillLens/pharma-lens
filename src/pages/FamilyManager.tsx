import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Users, Bell, Phone, MessageCircle, Share2, BarChart3, Activity, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';
import { familySharingService, FamilyGroup, FamilyInvitation } from '@/services/familySharingService';
import EnhancedFamilyEmptyState, { FamilyGroupTemplate } from '@/components/family/enhanced/EnhancedFamilyEmptyState';
import AdvancedFamilyGroupCard from '@/components/family/enhanced/AdvancedFamilyGroupCard';

// Lazy load components that aren't immediately visible
const EnhancedFamilyDashboard = lazy(() => import('@/components/family/enhanced/EnhancedFamilyDashboard'));
const InteractiveFamilyCareTimeline = lazy(() => import('@/components/family/enhanced/InteractiveFamilyCareTimeline'));
const FamilyAnalyticsDashboard = lazy(() => import('@/components/family/enhanced/FamilyAnalyticsDashboard'));
const FamilyGroupDetails = lazy(() => import('@/components/family/FamilyGroupDetails'));
import GroupSettingsSheet from '@/components/family/GroupSettingsSheet';
import InviteMemberSheet from '@/components/family/InviteMemberSheet';
import CreateGroupSheet from '@/components/family/CreateGroupSheet';
import FamilyFloatingActionButton from '@/components/family/FamilyFloatingActionButton';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';

const FamilyManager: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { checkFeatureAccess } = useSubscription();

  // State management
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<FamilyInvitation[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Sheet states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FamilyGroupTemplate | undefined>(undefined);
  const [editingGroup, setEditingGroup] = useState<FamilyGroup | null>(null);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Load family data
  const loadFamilyData = async () => {
    try {
      setLoading(true);
      const [groups, invitations] = await Promise.all([
        familySharingService.getUserFamilyGroups(),
        familySharingService.getUserPendingInvitations(),
      ]);
      setFamilyGroups(groups);
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Error loading family data:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load family data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    loadFamilyData();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  // Handlers
  const handleCreateGroup = async (groupName: string, template?: FamilyGroupTemplate) => {
    try {
      setIsCreatingGroup(true);
      const newGroup = await familySharingService.createFamilyGroup(groupName);
      if (newGroup) {
        setFamilyGroups(prev => [...prev, newGroup]);
        setShowCreateGroup(false);
        setSelectedTemplate(undefined);
        toast({
          title: t('family.messages.groupCreated'),
          description: `${template ? `${template.name} group` : 'Group'} "${groupName}" created successfully`,
        });
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to create group',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleInviteMember = async (memberData: any) => {
    if (!selectedGroup) return;

    try {
      setIsInvitingMember(true);
      
      console.log('Inviting member with data:', memberData);
      console.log('Selected group:', selectedGroup);
      
      const success = await familySharingService.inviteFamilyMember(
        selectedGroup.id,
        memberData.email,
        memberData.role,
        {
          view_medications: memberData.permissions.canView,
          edit_medications: memberData.permissions.canEdit,
          receive_alerts: memberData.permissions.receiveNotifications,
          emergency_access: memberData.permissions.emergencyAccess,
        }
      );

      if (success) {
        setShowInviteMember(false);
        loadFamilyData(); // Refresh data
        toast({
          title: t('family.messages.memberInvited'),
          description: `Invitation sent to ${memberData.email}`,
        });
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to invite member',
        variant: 'destructive',
      });
    } finally {
      setIsInvitingMember(false);
    }
  };

  const handleInvitationResponse = async (familyGroupId: string, response: 'accepted' | 'declined') => {
    try {
      const success = await familySharingService.respondToInvitation(familyGroupId, response);
      if (success) {
        loadFamilyData(); // Refresh data
        toast({
          title: response === 'accepted' ? t('family.messages.invitationAccepted') : t('family.messages.invitationDeclined'),
          description: `Invitation ${response}`,
        });
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to respond to invitation',
        variant: 'destructive',
      });
    }
  };

  const handleMemberAction = (memberId: string, action: 'call' | 'message' | 'share' | 'remove') => {
    // Handle member actions
    switch (action) {
      case 'call':
      toast({
        title: t('toast.callFeature'),
        description: t('toast.callingMember'),
      });
      break;
    case 'message':
      toast({
        title: t('toast.messageFeature'),
        description: t('toast.openingMessages'),
      });
      break;
    case 'share':
      toast({
        title: t('toast.shareFeature'),
        description: t('toast.sharingInformation'),
      });
      break;
    case 'remove':
      toast({
        title: t('toast.removeMember'),
        description: t('toast.memberRemovalComingSoon'),
      });
        break;
    }
  };

  const handleGroupCardTap = (group: FamilyGroup) => {
    setSelectedGroup(group);
    setShowGroupDetails(true);
    setActiveTab('group-details');
  };

  const handleInviteFromGroup = (group: FamilyGroup) => {
    setSelectedGroup(group);
    setShowInviteMember(true);
  };

  const handleDeleteGroup = (group: FamilyGroup) => {
    // Handle group deletion
    toast({ 
      title: t('toast.deleteGroup'), 
      description: t('toast.groupDeletionComingSoon') 
    });
  };

  const handleEditGroup = (group: FamilyGroup) => {
    setEditingGroup(group);
    setIsGroupSettingsOpen(true);
  };

  const handleUpdateGroup = async (groupId: string, updates: { name: string; description?: string }) => {
    try {
      // TODO: Implement group update API call
      await familySharingService.updateFamilyGroup(groupId, updates);
      await loadFamilyData(); // Refresh data
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    try {
      // TODO: Implement member removal API call
      await familySharingService.removeFamilyMember(groupId, memberId);
      await loadFamilyData(); // Refresh data
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  };

  const handleDeleteGroupFromSettings = async (groupId: string) => {
    try {
      // TODO: Implement group deletion API call
      await familySharingService.deleteFamilyGroup(groupId);
      await loadFamilyData(); // Refresh data
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  };

  // Enhanced handlers for new features
  const handleEmergencyCall = () => {
    toast({ 
      title: t('toast.emergencyCall'), 
      description: t('toast.initiatingEmergencyContact') 
    });
  };

  const handleQuickAction = (action: string) => {
    toast({ 
      title: t('toast.quickAction'), 
      description: t('toast.featureComingSoon', { action }) 
    });
  };

  const handleCall = (memberId: string) => {
    toast({ 
      title: t('toast.callMember'), 
      description: t('toast.initiatingCall') 
    });
  };

  const handleMessage = (memberId: string) => {
    toast({ 
      title: t('toast.messageMember'), 
      description: t('toast.openingMessages') 
    });
  };

  const handleVideoCall = (memberId: string) => {
    toast({ 
      title: t('toast.videoCall'), 
      description: t('toast.startingVideoCall') 
    });
  };

  const handleExportReport = () => {
    toast({ 
      title: t('toast.exportReport'), 
      description: t('toast.preparingFamilyHealthReport') 
    });
  };

  const handleContactProvider = () => {
    toast({ 
      title: t('toast.contactProvider'), 
      description: t('toast.contactingHealthcareProvider') 
    });
  };

  const handleAddEvent = () => {
    toast({ 
      title: t('toast.addEvent'), 
      description: t('toast.addingNewCareEvent') 
    });
  };

  const handleScheduleReminder = () => {
    toast({ 
      title: t('toast.scheduleReminder'), 
      description: t('toast.settingUpReminder') 
    });
  };

  const handleImportContacts = () => {
    toast({ 
      title: t('toast.importContacts'), 
      description: t('toast.importingContacts') 
    });
  };

  const handleWatchDemo = () => {
    toast({ 
      title: t('toast.demo'), 
      description: t('toast.startingDemoVideo') 
    });
  };

  // Show group details view
  if (showGroupDetails && selectedGroup) {
    return (
      <ProfessionalMobileLayout 
        title={selectedGroup.name}
        showHeader={true}
        className="bg-gradient-surface"
      >
        <div className="px-4 py-2 w-full">
          <Suspense fallback={<LoadingSkeleton />}>
            <FamilyGroupDetails
              group={selectedGroup}
              onBack={() => {
                setShowGroupDetails(false);
                setSelectedGroup(null);
                setActiveTab('overview');
              }}
              onEditGroup={handleEditGroup}
              currentUserId={currentUserId}
            />
          </Suspense>
        </div>
      </ProfessionalMobileLayout>
    );
  }

  return (
    <ProfessionalMobileLayout 
      title={t('family.management')}
      showHeader={true}
      className="bg-gradient-surface"
    >
      {loading ? (
        <div className="p-6">
          <LoadingSkeleton />
        </div>
      ) : familyGroups.length === 0 ? (
        <EnhancedFamilyEmptyState 
          onCreateGroup={(template) => {
            setSelectedTemplate(template);
            setShowCreateGroup(true);
          }}
          onImportContacts={handleImportContacts}
          onWatchDemo={handleWatchDemo}
        />
      ) : (
        <div className="px-4 py-2 w-full">
          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {t('family.invitations.pending')} ({pendingInvitations.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingInvitations.map((invitation) => (
                  <Card key={invitation.familyGroupId} className="border border-border/50 hover:border-border transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {invitation.familyGroupName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('family.invitations.from')} {invitation.inviterName || invitation.invitedBy}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInvitationResponse(invitation.familyGroupId, 'declined')}
                            className="h-8"
                          >
                            {t('family.invitations.decline')}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleInvitationResponse(invitation.familyGroupId, 'accepted')}
                            className="h-8"
                          >
                            {t('family.invitations.accept')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Family Management with Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6 h-auto">
              <TabsTrigger value="overview" className="flex flex-col items-center gap-1 py-3 px-2 text-xs">
                <BarChart3 className="w-4 h-4" />
                <span>{t('family.tabs.overview')}</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex flex-col items-center gap-1 py-3 px-2 text-xs">
                <Users className="w-4 h-4" />
                <span>{t('family.tabs.groups')}</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex flex-col items-center gap-1 py-3 px-2 text-xs">
                <Calendar className="w-4 h-4" />
                <span>{t('family.tabs.timeline')}</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex flex-col items-center gap-1 py-3 px-2 text-xs">
                <Activity className="w-4 h-4" />
                <span>{t('family.tabs.analytics')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <EnhancedFamilyDashboard 
                  familyGroups={familyGroups}
                  onEmergencyCall={handleEmergencyCall}
                  onQuickAction={handleQuickAction}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="groups">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                    <span className="truncate">{t('family.yourGroups')} ({familyGroups.length})</span>
                  </h2>
                  <FeatureGate 
                    feature="can_create_family_group"
                    fallback={
                    <Button variant="outline" disabled size="sm" className="w-full sm:w-auto">
                        <Users className="w-4 h-4 mr-2" />
                        {t('family.actions.addGroupPro')}
                      </Button>
                    }
                  >
                    <Button onClick={() => setShowCreateGroup(true)} size="sm" className="w-full sm:w-auto">
                      <Users className="w-4 h-4 mr-2" />
                      {t('family.actions.addGroup')}
                    </Button>
                  </FeatureGate>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {familyGroups.map((group) => (
                    <AdvancedFamilyGroupCard
                      key={group.id}
                      group={group}
                      onTap={() => handleGroupCardTap(group)}
                      onInviteMember={() => handleInviteFromGroup(group)}
                      onEditGroup={() => handleEditGroup(group)}
                      onDeleteGroup={() => handleDeleteGroup(group)}
                      onCall={handleCall}
                      onMessage={handleMessage}
                      onVideoCall={handleVideoCall}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <InteractiveFamilyCareTimeline 
                  familyGroups={familyGroups}
                  onAddEvent={handleAddEvent}
                  onScheduleReminder={handleScheduleReminder}
                  onEmergencyCall={handleEmergencyCall}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="analytics">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <FamilyAnalyticsDashboard 
                  familyGroups={familyGroups}
                  onExportReport={handleExportReport}
                  onContactProvider={handleContactProvider}
                />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Floating Action Button */}
      <FamilyFloatingActionButton
        onClick={() => setShowCreateGroup(true)}
      />

      {/* Bottom Sheets */}
      <CreateGroupSheet
        isOpen={showCreateGroup}
        onClose={() => {
          setShowCreateGroup(false);
          setSelectedTemplate(undefined);
        }}
        onCreate={handleCreateGroup}
        isLoading={isCreatingGroup}
        template={selectedTemplate}
      />

      <InviteMemberSheet
        isOpen={showInviteMember}
        onClose={() => setShowInviteMember(false)}
        onInvite={handleInviteMember}
        isLoading={isInvitingMember}
      />

      {editingGroup && (
        <GroupSettingsSheet
          group={editingGroup}
          isOpen={isGroupSettingsOpen}
          onClose={() => setIsGroupSettingsOpen(false)}
          onUpdateGroup={handleUpdateGroup}
          onRemoveMember={handleRemoveMember}
          onDeleteGroup={handleDeleteGroupFromSettings}
        />
      )}
    </ProfessionalMobileLayout>
  );
};

const TabLoadingSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-24 w-full rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  </div>
);

// Loading Skeleton Component
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 max-w-4xl mx-auto">
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border border-border/50">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="w-8 h-8 rounded-full" />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

export default FamilyManager;