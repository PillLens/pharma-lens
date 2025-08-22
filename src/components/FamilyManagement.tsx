import React, { useState, useEffect } from 'react';
import { Users, Plus, Settings, UserPlus, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  familySharingService, 
  FamilyGroup, 
  FamilyMember, 
  FamilyInvitation 
} from '@/services/familySharingService';

export const FamilyManagement: React.FC = () => {
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<FamilyInvitation[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [createGroupDialog, setCreateGroupDialog] = useState(false);
  const [inviteMemberDialog, setInviteMemberDialog] = useState(false);
  
  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'caregiver' | 'patient' | 'emergency_contact'>('patient');
  const [invitePermissions, setInvitePermissions] = useState({
    view_medications: true,
    edit_medications: false,
    receive_alerts: true
  });

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
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !selectedGroup) return;

    const success = await familySharingService.inviteFamilyMember(
      selectedGroup.id,
      inviteEmail,
      inviteRole,
      invitePermissions
    );

    if (success) {
      setInviteMemberDialog(false);
      setInviteEmail('');
      toast.success('Invitation sent successfully');
    }
  };

  const handleInvitationResponse = async (groupId: string, response: 'accepted' | 'declined') => {
    const success = await familySharingService.respondToInvitation(groupId, response);
    if (success) {
      await loadFamilyData();
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
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Family & Caregivers</h2>
        </div>
        
        <Dialog open={createGroupDialog} onOpenChange={setCreateGroupDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Family Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Smith Family, Mom's Care Team"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateGroupDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                  Create Group
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.familyGroupId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{invitation.familyGroupName}</h4>
                  <p className="text-sm text-muted-foreground">
                    Invited as: <Badge className={getRoleBadgeColor(invitation.role)}>{invitation.role.replace('_', ' ')}</Badge>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleInvitationResponse(invitation.familyGroupId, 'accepted')}
                  >
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleInvitationResponse(invitation.familyGroupId, 'declined')}
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
      <div className="grid gap-4">
        {familyGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Family Groups</h3>
              <p className="text-muted-foreground mb-4">
                Create a family group to share medications and coordinate care with caregivers.
              </p>
              <Button onClick={() => setCreateGroupDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Group
              </Button>
            </CardContent>
          </Card>
        ) : (
          familyGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{group.member_count} members</Badge>
                    
                    <Dialog open={inviteMemberDialog && selectedGroup?.id === group.id} onOpenChange={(open) => {
                      setInviteMemberDialog(open);
                      if (open) setSelectedGroup(group);
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2">
                          <UserPlus className="w-4 h-4" />
                          Invite
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Family Member</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="invite-email">Email Address</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="Enter email address"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="invite-role">Role</Label>
                            <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="patient">Patient</SelectItem>
                                <SelectItem value="caregiver">Caregiver</SelectItem>
                                <SelectItem value="emergency_contact">Emergency Contact</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-3">
                            <Label>Permissions</Label>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="view-meds">View Medications</Label>
                                <Switch
                                  id="view-meds"
                                  checked={invitePermissions.view_medications}
                                  onCheckedChange={(checked) => 
                                    setInvitePermissions(prev => ({ ...prev, view_medications: checked }))
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="edit-meds">Edit Medications</Label>
                                <Switch
                                  id="edit-meds"
                                  checked={invitePermissions.edit_medications}
                                  onCheckedChange={(checked) => 
                                    setInvitePermissions(prev => ({ ...prev, edit_medications: checked }))
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="receive-alerts">Receive Safety Alerts</Label>
                                <Switch
                                  id="receive-alerts"
                                  checked={invitePermissions.receive_alerts}
                                  onCheckedChange={(checked) => 
                                    setInvitePermissions(prev => ({ ...prev, receive_alerts: checked }))
                                  }
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setInviteMemberDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleInviteMember} disabled={!inviteEmail.trim()}>
                              Send Invitation
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Created on {new Date(group.created_at).toLocaleDateString()}
                </div>
                {/* Add member list, shared medications, etc. here */}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};