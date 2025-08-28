import React, { useState, useEffect } from 'react';
import { Plus, Users, UserPlus, Settings, Heart } from 'lucide-react';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from '@/components/ui/mobile/MobileCard';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { EnhancedMobileButton } from '@/components/mobile/EnhancedMobileButton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PullToRefreshWrapper from '@/components/mobile/PullToRefreshWrapper';
import { GestureNavigationWrapper } from '@/components/mobile/GestureNavigationWrapper';
import { MobileFamilyMemberCard } from './MobileFamilyMemberCard';
import { MobileFamilyInvitationWizard } from './MobileFamilyInvitationWizard';
import BottomSheet from '@/components/ui/mobile/BottomSheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { hapticService } from '@/services/hapticService';
import { 
  familySharingService, 
  FamilyGroup, 
  FamilyMember, 
  FamilyInvitation 
} from '@/services/familySharingService';

const LoadingSkeleton = () => (
  <div className="p-4 space-y-4">
    <Skeleton className="h-6 w-48" />
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <MobileCard key={i} className="animate-pulse">
          <MobileCardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-9 w-16" />
                </div>
              </div>
            </div>
          </MobileCardContent>
        </MobileCard>
      ))}
    </div>
  </div>
);

const SimpleMobileEmptyState = ({ onCreateGroup }: { onCreateGroup: () => void }) => (
  <MobileCard variant="medical" className="mx-4">
    <MobileCardContent className="p-8 text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
        <Users className="w-10 h-10 text-primary animate-pulse" />
      </div>
      <h3 className="text-lg font-semibold mb-3 text-foreground">Start Your Care Network</h3>
      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
        Connect with family members and caregivers to share medication information safely.
      </p>
      <EnhancedMobileButton
        onClick={() => {
          hapticService.buttonPress();
          onCreateGroup();
        }}
        variant="default"
        size="lg"
        className="w-full h-12 shadow-medical"
        hapticPattern="medium"
        rippleEffect={true}
      >
        <Plus className="h-5 w-5 mr-2" />
        Create Family Group
      </EnhancedMobileButton>
    </MobileCardContent>
  </MobileCard>
);

export const MobileFamilyManagement: React.FC = () => {
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<FamilyInvitation[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [createGroupDialog, setCreateGroupDialog] = useState(false);
  const [inviteWizardOpen, setInviteWizardOpen] = useState(false);
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<FamilyGroup | null>(null);
  
  // Form states
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    loadFamilyData();
  }, []);

  const loadFamilyData = async () => {
    setLoading(true);
    try {
      const [groups, invitations] = await Promise.all([
        familySharingService.getUserFamilyGroups(),
        familySharingService.getUserPendingInvitations()
      ]);
      
      setFamilyGroups(groups);
      setPendingInvitations(invitations);
      
      if (groups.length > 0 || invitations.length > 0) {
        hapticService.feedback('success');
      }
    } catch (error) {
      console.error('Error loading family data:', error);
      hapticService.errorOccurred();
      toast.error('Failed to load family data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    hapticService.feedback('medium');
    const group = await familySharingService.createFamilyGroup(newGroupName);
    if (group) {
      await loadFamilyData();
      setCreateGroupDialog(false);
      setNewGroupName('');
      hapticService.actionCompleted();
      toast.success('Family group created successfully!');
    } else {
      hapticService.errorOccurred();
    }
  };

  const handleInvitationResponse = async (groupId: string, response: 'accepted' | 'declined') => {
    hapticService.feedback('medium');
    const success = await familySharingService.respondToInvitation(groupId, response);
    if (success) {
      await loadFamilyData();
      hapticService.actionCompleted();
      toast.success(`Invitation ${response === 'accepted' ? 'accepted' : 'declined'}`);
    } else {
      hapticService.errorOccurred();
    }
  };

  const handleInviteMember = (group: FamilyGroup) => {
    hapticService.buttonPress();
    setSelectedGroupForInvite(group);
    setInviteWizardOpen(true);
  };

  const handleMemberAction = (action: string, member: FamilyMember) => {
    hapticService.feedback('light');
    switch (action) {
      case 'call':
        toast.info('Phone integration coming soon!');
        break;
      case 'message':
        toast.info('Messaging integration coming soon!');
        break;
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: `${member.display_name}'s Contact`,
            text: `Contact information for ${member.display_name}`,
            url: window.location.href
          });
        }
        break;
      case 'settings':
        toast.info('Member settings coming soon!');
        break;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'caregiver': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'patient': return 'bg-green-100 text-green-800 border-green-200';
      case 'emergency_contact': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <GestureNavigationWrapper className="min-h-screen bg-background">
      <PullToRefreshWrapper onRefresh={loadFamilyData}>
        <div className="space-y-6">
          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="px-4 pt-4">
              <MobileCard variant="warning" className="animate-fade-in">
                <MobileCardHeader className="pb-3">
                  <MobileCardTitle className="text-sm flex items-center gap-2 text-warning-foreground">
                    <UserPlus className="h-4 w-4" />
                    Pending Invitations ({pendingInvitations.length})
                  </MobileCardTitle>
                </MobileCardHeader>
                <MobileCardContent className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <MobileCard key={invitation.familyGroupId} variant="glass" className="p-3">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-sm">{invitation.familyGroupName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">Invited as:</span>
                            <Badge className={`text-xs ${getRoleBadgeColor(invitation.role)}`}>
                              {invitation.role.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <EnhancedMobileButton 
                          size="sm" 
                          onClick={() => handleInvitationResponse(invitation.familyGroupId, 'accepted')}
                          className="flex-1 h-10 bg-green-500 hover:bg-green-600 text-white"
                          variant="default"
                          hapticPattern="success"
                          rippleEffect={true}
                        >
                          Accept
                        </EnhancedMobileButton>
                        <EnhancedMobileButton 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleInvitationResponse(invitation.familyGroupId, 'declined')}
                          className="flex-1 h-10"
                          hapticPattern="light"
                          rippleEffect={true}
                        >
                          Decline
                        </EnhancedMobileButton>
                      </div>
                    </MobileCard>
                  ))}
                </MobileCardContent>
              </MobileCard>
            </div>
          )}

          {/* Family Groups */}
          <div className="px-4">
            {familyGroups.length === 0 ? (
              <SimpleMobileEmptyState onCreateGroup={() => setCreateGroupDialog(true)} />
            ) : (
              <div className="space-y-4">
                {familyGroups.map((group, index) => (
                  <MobileCard 
                    key={group.id} 
                    variant="elevated" 
                    interactive={true}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <MobileCardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <MobileCardTitle className="text-base">{group.name}</MobileCardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {group.member_count} members
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Created {new Date(group.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <EnhancedMobileButton
                          size="sm"
                          variant="ghost"
                          className="h-10 w-10 p-0"
                          hapticPattern="light"
                        >
                          <Settings className="h-4 w-4" />
                        </EnhancedMobileButton>
                      </div>
                    </MobileCardHeader>
                    
                    <MobileCardContent className="space-y-3">
                      {/* Members List */}
                      {group.members && group.members.length > 0 && (
                        <div className="space-y-3">
                          {group.members.map((member) => (
                            <MobileFamilyMemberCard
                              key={member.id}
                              member={member}
                              isOwner={group.creator_id === member.user_id}
                              onCall={(member) => handleMemberAction('call', member)}
                              onMessage={(member) => handleMemberAction('message', member)}
                              onShare={(member) => handleMemberAction('share', member)}
                              onSettings={(member) => handleMemberAction('settings', member)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Invite Button */}
                      <EnhancedMobileButton
                        onClick={() => handleInviteMember(group)}
                        variant="outline"
                        className="w-full h-12 border-dashed hover:bg-primary/5"
                        hapticPattern="medium"
                        rippleEffect={true}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Family Member
                      </EnhancedMobileButton>
                    </MobileCardContent>
                  </MobileCard>
                ))}
              </div>
            )}
          </div>

          {/* Floating Action Button */}
          <div className="fixed bottom-20 right-4 z-10">
            <EnhancedMobileButton
              onClick={() => {
                hapticService.buttonPress();
                setCreateGroupDialog(true);
              }}
              size="lg"
              className="h-16 w-16 rounded-full shadow-floating hover:shadow-glow hover:scale-110 transition-all duration-300 bg-gradient-to-r from-primary to-primary-light"
              variant="default"
              hapticPattern="medium"
              rippleEffect={true}
            >
              <Plus className="h-6 w-6" />
            </EnhancedMobileButton>
          </div>
        </div>
      </PullToRefreshWrapper>

      {/* Create Group Bottom Sheet */}
      <BottomSheet isOpen={createGroupDialog} onClose={() => setCreateGroupDialog(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create Family Group</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Smith Family, Mom's Care Team"
                className="h-12 mt-2"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <EnhancedMobileButton 
                variant="outline" 
                onClick={() => {
                  hapticService.navigationBack();
                  setCreateGroupDialog(false);
                }}
                className="flex-1 h-12"
                hapticPattern="light"
              >
                Cancel
              </EnhancedMobileButton>
              <EnhancedMobileButton 
                onClick={handleCreateGroup} 
                disabled={!newGroupName.trim()}
                className="flex-1 h-12"
                variant="default"
                hapticPattern="success"
                rippleEffect={true}
              >
                Create Group
              </EnhancedMobileButton>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Invitation Wizard */}
      {selectedGroupForInvite && (
        <MobileFamilyInvitationWizard
          isOpen={inviteWizardOpen}
          onClose={() => {
            hapticService.navigationBack();
            setInviteWizardOpen(false);
            setSelectedGroupForInvite(null);
          }}
          familyGroup={selectedGroupForInvite}
          onInviteSent={() => {
            hapticService.actionCompleted();
            loadFamilyData();
            setInviteWizardOpen(false);
            setSelectedGroupForInvite(null);
          }}
        />
      )}
    </GestureNavigationWrapper>
  );
};
