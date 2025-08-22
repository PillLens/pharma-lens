import React, { useState, useEffect } from 'react';
import { Plus, Users, UserPlus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EmptyStateIllustration from './EmptyStateIllustration';
import { MobileFamilyMemberCard } from './MobileFamilyMemberCard';
import { MobileFamilyInvitationWizard } from './MobileFamilyInvitationWizard';
import BottomSheet from '@/components/ui/mobile/BottomSheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  familySharingService, 
  FamilyGroup, 
  FamilyMember, 
  FamilyInvitation 
} from '@/services/familySharingService';

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
    } catch (error) {
      console.error('Error loading family data:', error);
      toast.error('Failed to load family data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    const group = await familySharingService.createFamilyGroup(newGroupName);
    if (group) {
      await loadFamilyData();
      setCreateGroupDialog(false);
      setNewGroupName('');
      toast.success('Family group created successfully!');
    }
  };

  const handleInvitationResponse = async (groupId: string, response: 'accepted' | 'declined') => {
    const success = await familySharingService.respondToInvitation(groupId, response);
    if (success) {
      await loadFamilyData();
      toast.success(`Invitation ${response === 'accepted' ? 'accepted' : 'declined'}`);
    }
  };

  const handleInviteMember = (group: FamilyGroup) => {
    setSelectedGroupForInvite(group);
    setInviteWizardOpen(true);
  };

  const handleMemberAction = (action: string, member: FamilyMember) => {
    switch (action) {
      case 'call':
        // Integrate with phone calling (phone property not available in FamilyMember type)
        toast.info('Phone integration coming soon!');
        break;
      case 'message':
        // Integrate with SMS or messaging (phone property not available in FamilyMember type)
        toast.info('Messaging integration coming soon!');
        break;
      case 'share':
        // Share member contact
        if (navigator.share) {
          navigator.share({
            title: `${member.display_name}'s Contact`,
            text: `Contact information for ${member.display_name}`,
            url: window.location.href
          });
        }
        break;
      case 'settings':
        // Open member settings
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
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card className="medical-surface border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
              <UserPlus className="h-4 w-4" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.familyGroupId} className="p-3 bg-white rounded-lg border border-amber-200">
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
                  <Button 
                    size="sm" 
                    onClick={() => handleInvitationResponse(invitation.familyGroupId, 'accepted')}
                    className="flex-1 h-9"
                  >
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleInvitationResponse(invitation.familyGroupId, 'declined')}
                    className="flex-1 h-9"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Family Groups */}
      {familyGroups.length === 0 ? (
        <Card className="medical-surface">
          <CardContent className="p-8 text-center">
            <EmptyStateIllustration 
              type="family"
              className="w-24 h-24 mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold mb-2">No Family Groups</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Create a family group to share medications and coordinate care with caregivers.
            </p>
            <Button 
              onClick={() => setCreateGroupDialog(true)} 
              className="w-full h-12"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {familyGroups.map((group) => (
            <Card key={group.id} className="medical-surface">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {group.member_count} members
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(group.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
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
                <Button
                  onClick={() => handleInviteMember(group)}
                  variant="outline"
                  className="w-full h-12 border-dashed"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Family Member
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-10">
        <Button
          onClick={() => setCreateGroupDialog(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

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
              <Button 
                variant="outline" 
                onClick={() => setCreateGroupDialog(false)}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateGroup} 
                disabled={!newGroupName.trim()}
                className="flex-1 h-12"
              >
                Create Group
              </Button>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Invitation Wizard */}
      {selectedGroupForInvite && (
        <MobileFamilyInvitationWizard
          isOpen={inviteWizardOpen}
          onClose={() => {
            setInviteWizardOpen(false);
            setSelectedGroupForInvite(null);
          }}
          familyGroup={selectedGroupForInvite}
          onInviteSent={() => {
            loadFamilyData();
            setInviteWizardOpen(false);
            setSelectedGroupForInvite(null);
          }}
        />
      )}
    </div>
  );
};