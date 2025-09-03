import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { entitlementsService } from './entitlementsService';

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyGroup {
  id: string;
  name: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  members?: FamilyMember[];
  member_count?: number;
  creator_profile?: UserProfile;
}

export interface FamilyMember {
  id: string;
  family_group_id: string;
  user_id: string;
  role: 'caregiver' | 'patient' | 'emergency_contact' | 'family' | 'emergency';
  permissions: {
    view_medications: boolean;
    edit_medications: boolean;
    receive_alerts: boolean;
  };
  invited_by?: string;
  invitation_status: 'pending' | 'accepted' | 'declined';
  invited_at: string;
  accepted_at?: string;
  user_profile?: UserProfile;
  inviter_profile?: UserProfile;
  // Legacy properties for backwards compatibility
  display_name?: string;
  user_email?: string;
}

export interface SharedMedication {
  id: string;
  medication_id: string;
  family_group_id: string;
  shared_by: string;
  sharing_permissions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
  created_at: string;
  updated_at: string;
  medication?: any;
  shared_by_profile?: UserProfile;
}

export interface FamilyInvitation {
  id: string;
  familyGroupId: string;
  familyGroupName: string;
  invitedBy: string;
  inviterName?: string;
  role: 'caregiver' | 'patient' | 'emergency_contact' | 'family' | 'emergency';
  invitedAt: string;
}

// Templates for Quick Setup
export interface FamilyGroupTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  suggestedRoles: Array<{
    role: 'caregiver' | 'patient' | 'emergency_contact' | 'family' | 'emergency';
    permissions: {
      view_medications: boolean;
      edit_medications: boolean;
      receive_alerts: boolean;
    };
  }>;
}

export class FamilySharingService {
  
  // Profile Management
  async findUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      console.log('Looking for user with email:', email);
      
      // First try to find user in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error searching profiles:', profileError);
        throw profileError;
      }

      if (profileData) {
        console.log('Found user in profiles:', profileData);
        return profileData as UserProfile;
      }

      console.log('User not found in profiles table');
      return null;

    } catch (error) {
      console.error('Error in findUserByEmail:', error);
      throw error;
    }
  }

  // Family Group Management
  async createFamilyGroup(name: string, description?: string): Promise<FamilyGroup | null> {
    try {
      console.log('Creating family group:', name);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create a family group');
        return null;
      }

      // Check entitlements
      const canCreate = await entitlementsService.canCreateFamilyGroup(user.id);
      if (!canCreate) {
        toast.error('Upgrade to Pro to create family groups');
        return null;
      }

      const { data, error } = await supabase
        .from('family_groups')
        .insert([
          {
            name: name.trim(),
            creator_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating family group:', error);
        if (error.code === '23505') {
          toast.error('A family group with this name already exists');
        } else {
          toast.error('Failed to create family group');
        }
        return null;
      }

      console.log('Created family group:', data);
      toast.success('Family group created successfully');
      return data;
    } catch (error) {
      console.error('Error creating family group:', error);
      toast.error('Failed to create family group');
      return null;
    }
  }

  async getUserFamilyGroups(): Promise<FamilyGroup[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get groups where user is creator or member
      const { data: createdGroups, error: createdError } = await supabase
        .from('family_groups')
        .select('*')
        .eq('creator_id', user.id);

      const { data: memberGroups, error: memberError } = await supabase
        .from('family_members')
        .select('family_group:family_groups(*)')
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted');

      if (createdError) throw createdError;
      if (memberError) throw memberError;

      // Combine and deduplicate groups
      const allGroups = [
        ...(createdGroups || []),
        ...(memberGroups || []).map(m => m.family_group).filter(Boolean)
      ];

      const uniqueGroups = allGroups.filter((group, index, array) => 
        array.findIndex(g => g.id === group.id) === index
      );

      // Get full details for each group
      const groupsWithDetails = await Promise.all(
        uniqueGroups.map(async (group) => {
          // Get creator profile
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('id, email, display_name, avatar_url, created_at, updated_at')
            .eq('id', group.creator_id)
            .single();

          // Get all accepted members with their profiles
          const { data: membersData } = await supabase
            .from('family_members')
            .select(`
              *,
              user_profile:profiles(id, display_name, avatar_url, email)
            `)
            .eq('family_group_id', group.id)
            .eq('invitation_status', 'accepted');

          const members: FamilyMember[] = (membersData || []).map(member => ({
            ...member,
            role: member.role as FamilyMember['role'],
            invitation_status: member.invitation_status as FamilyMember['invitation_status'],
            permissions: typeof member.permissions === 'object' ? 
              member.permissions as FamilyMember['permissions'] : 
              { view_medications: true, edit_medications: false, receive_alerts: true },
            user_profile: member.user_profile && typeof member.user_profile === 'object' && 
              !('error' in member.user_profile) && member.user_profile !== null ? 
              member.user_profile as UserProfile : undefined
          }));

          return {
            ...group,
            creator_profile: creatorProfile || undefined,
            members: members,
            member_count: members.length + 1 // +1 for creator
          };
        })
      );

      return groupsWithDetails;
    } catch (error) {
      console.error('Error fetching family groups:', error);
      toast.error('Failed to load family groups');
      return [];
    }
  }

  async getFamilyGroupDetails(groupId: string): Promise<FamilyGroup | null> {
    try {
      console.log('Getting family group details for:', groupId);
      
      const { data, error } = await supabase
        .from('family_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) {
        console.error('Error fetching group:', error);
        throw error;
      }

      if (!data) {
        console.log('No group found with ID:', groupId);
        return null;
      }

      // Get group members with their profiles
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select(`
          *,
          user_profile:profiles(id, display_name, avatar_url, email),
          inviter_profile:profiles!family_members_invited_by_fkey(id, display_name, avatar_url, email)
        `)
        .eq('family_group_id', groupId);

      if (membersError) {
        console.error('Error fetching members:', membersError);
        throw membersError;
      }

      const members = membersData?.map(member => ({
        ...member,
        role: member.role as FamilyMember['role'],
        invitation_status: member.invitation_status as FamilyMember['invitation_status'],
        permissions: typeof member.permissions === 'object' ? 
          member.permissions as FamilyMember['permissions'] : 
          { view_medications: true, edit_medications: false, receive_alerts: true },
        user_profile: member.user_profile && typeof member.user_profile === 'object' && 
          !('error' in member.user_profile) && member.user_profile !== null ? 
          member.user_profile as UserProfile : undefined,
        inviter_profile: member.inviter_profile && typeof member.inviter_profile === 'object' && 
          !('error' in member.inviter_profile) && member.inviter_profile !== null ? 
          member.inviter_profile as UserProfile : undefined
      })) || [];

      // Get creator profile
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url, created_at, updated_at')
        .eq('id', data.creator_id)
        .single();

      return {
        ...data,
        members,
        creator_profile: creatorProfile || undefined
      };
    } catch (error) {
      console.error('Error getting family group details:', error);
      toast.error('Failed to load group details');
      return null;
    }
  }

  async inviteToFamilyGroup(
    familyGroupId: string, 
    email: string, 
    role: FamilyMember['role'],
    permissions?: Partial<FamilyMember['permissions']>
  ): Promise<boolean> {
    try {
      console.log('Inviting user to family group:', { familyGroupId, email, role });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to invite members');
        return false;
      }

      // Check if user can invite to this group
      const canInvite = await this.canUserInviteToGroup(user.id, familyGroupId);
      if (!canInvite) {
        toast.error('You do not have permission to invite members to this group');
        return false;
      }

      // Find the invited user
      let invitedUser = await this.findUserByEmail(email);
      
      // Check if user is already a member or has pending invitation
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_group_id', familyGroupId)
        .or(invitedUser ? `user_id.eq.${invitedUser.id},invited_email.eq.${email}` : `invited_email.eq.${email}`)
        .maybeSingle();

      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        console.error('Error checking existing membership:', memberCheckError);
        throw memberCheckError;
      }

      if (existingMember) {
        if (existingMember.invitation_status === 'accepted') {
          toast.error('User is already a member of this group');
          return false;
        } else if (existingMember.invitation_status === 'pending') {
          toast.error('User already has a pending invitation to this group');
          return false;
        }
      }

      // Set default permissions based on role
      const defaultPermissions = this.getDefaultPermissionsForRole(role);
      const finalPermissions = { ...defaultPermissions, ...permissions };

      // Create family member record
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .insert([{
          family_group_id: familyGroupId,
          user_id: invitedUser?.id || null,
          invited_email: email.toLowerCase().trim(),
          role,
          permissions: finalPermissions,
          invited_by: user.id,
          invitation_status: 'pending'
        }])
        .select()
        .single();

      if (memberError) {
        console.error('Error creating family member:', memberError);
        throw memberError;
      }

      console.log('Created family member:', memberData);

      // Send invitation via edge function
      const { error: inviteError } = await supabase.functions.invoke('send-family-invitation', {
        body: {
          familyGroupId,
          invitedEmail: email,
          role,
          invitedById: user.id
        }
      });

      if (inviteError) {
        console.error('Error sending invitation:', inviteError);
        // Don't fail the entire operation if just email sending fails
        toast.warning('Member added but email invitation failed to send');
      } else {
        toast.success('Family member invited successfully');
      }

      return true;

    } catch (error) {
      console.error('Error inviting family member:', error);
      toast.error('Failed to invite family member');
      return false;
    }
  }

  async respondToInvitation(familyGroupId: string, response: 'accepted' | 'declined'): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      console.log('Responding to invitation:', { familyGroupId, response, userId: user.id });

      const { error } = await supabase
        .from('family_members')
        .update({
          invitation_status: response,
          accepted_at: response === 'accepted' ? new Date().toISOString() : null,
          user_id: user.id // Ensure user_id is set when accepting
        })
        .or(`user_id.eq.${user.id},invited_email.eq.${user.email}`)
        .eq('family_group_id', familyGroupId)
        .eq('invitation_status', 'pending');

      if (error) {
        console.error('Error responding to invitation:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error responding to invitation:', error);
      return false;
    }
  }

  async getUserPendingInvitations(): Promise<FamilyInvitation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('family_members')
        .select(`
          family_group_id,
          role,
          invited_at,
          invited_by,
          family_group:family_groups(id, name),
          inviter_profile:profiles!family_members_invited_by_fkey(display_name)
        `)
        .or(`user_id.eq.${user.id},invited_email.eq.${user.email}`)
        .eq('invitation_status', 'pending');

      if (error) {
        console.error('Error fetching pending invitations:', error);
        return [];
      }

      return (data || []).map(invitation => ({
        id: invitation.family_group_id,
        familyGroupId: invitation.family_group_id,
        familyGroupName: invitation.family_group?.name || 'Unknown Group',
        invitedBy: invitation.invited_by,
        inviterName: invitation.inviter_profile && 
          typeof invitation.inviter_profile === 'object' && 
          invitation.inviter_profile !== null &&
          !('error' in invitation.inviter_profile) && 
          'display_name' in invitation.inviter_profile ? 
          invitation.inviter_profile.display_name : undefined,
        role: invitation.role as FamilyInvitation['role'],
        invitedAt: invitation.invited_at
      }));

    } catch (error) {
      console.error('Error getting pending invitations:', error);
      return [];
    }
  }

  private getDefaultPermissionsForRole(role: FamilyMember['role']): FamilyMember['permissions'] {
    switch (role) {
      case 'patient':
        return {
          view_medications: true,
          edit_medications: true,
          receive_alerts: true
        };
      case 'caregiver':
        return {
          view_medications: true,
          edit_medications: true,
          receive_alerts: true
        };
      case 'family':
        return {
          view_medications: true,
          edit_medications: false,
          receive_alerts: true
        };
      case 'emergency_contact':
      case 'emergency':
        return {
          view_medications: true,
          edit_medications: false,
          receive_alerts: true
        };
      default:
        return {
          view_medications: true,
          edit_medications: false,
          receive_alerts: true
        };
    }
  }

  private async canUserInviteToGroup(userId: string, groupId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('family_groups')
        .select('creator_id')
        .eq('id', groupId)
        .single();

      if (error || !data) return false;
      
      return data.creator_id === userId;
    } catch (error) {
      console.error('Error checking invite permissions:', error);
      return false;
    }
  }

  // Add missing methods that are called by components
  async inviteFamilyMember(
    familyGroupId: string, 
    email: string, 
    role: FamilyMember['role'],
    permissions?: Partial<FamilyMember['permissions']>
  ): Promise<boolean> {
    return this.inviteToFamilyGroup(familyGroupId, email, role, permissions);
  }

  async getSharedMedications(groupId: string): Promise<SharedMedication[]> {
    try {
      const { data, error } = await supabase
        .from('shared_medications')
        .select(`
          *,
          medication:user_medications(*),
          shared_by_profile:profiles(id, display_name, avatar_url, email)
        `)
        .eq('family_group_id', groupId);

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        sharing_permissions: typeof item.sharing_permissions === 'object' && item.sharing_permissions !== null ?
          item.sharing_permissions as SharedMedication['sharing_permissions'] :
          { view: true, edit: false, delete: false },
        shared_by_profile: item.shared_by_profile && typeof item.shared_by_profile === 'object' && 
          !('error' in item.shared_by_profile) && item.shared_by_profile !== null ? 
          item.shared_by_profile as UserProfile : undefined
      }));
    } catch (error) {
      console.error('Error fetching shared medications:', error);
      return [];
    }
  }

  async shareMedication(
    medicationId: string,
    familyGroupId: string,
    permissions: SharedMedication['sharing_permissions']
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('shared_medications')
        .insert({
          medication_id: medicationId,
          family_group_id: familyGroupId,
          shared_by: user.id,
          sharing_permissions: permissions
        });

      if (error) throw error;
      toast.success('Medication shared successfully');
      return true;
    } catch (error) {
      console.error('Error sharing medication:', error);
      toast.error('Failed to share medication');
      return false;
    }
  }

  async updateSharingPermissions(
    sharedMedicationId: string,
    permissions: SharedMedication['sharing_permissions']
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shared_medications')
        .update({ sharing_permissions: permissions })
        .eq('id', sharedMedicationId);

      if (error) throw error;
      toast.success('Sharing permissions updated');
      return true;
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
      return false;
    }
  }

  async stopSharingMedication(sharedMedicationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shared_medications')
        .delete()
        .eq('id', sharedMedicationId);

      if (error) throw error;
      toast.success('Medication sharing stopped');
      return true;
    } catch (error) {
      console.error('Error stopping medication sharing:', error);
      toast.error('Failed to stop sharing');
      return false;
    }
  }

  async updateFamilyGroup(groupId: string, updates: Partial<FamilyGroup>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('family_groups')
        .update(updates)
        .eq('id', groupId);

      if (error) throw error;
      toast.success('Family group updated');
      return true;
    } catch (error) {
      console.error('Error updating family group:', error);
      toast.error('Failed to update family group');
      return false;
    }
  }

  async removeFamilyMember(memberId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Family member removed');
      return true;
    } catch (error) {
      console.error('Error removing family member:', error);
      toast.error('Failed to remove family member');
      return false;
    }
  }

  async deleteFamilyGroup(groupId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('family_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      toast.success('Family group deleted');
      return true;
    } catch (error) {
      console.error('Error deleting family group:', error);
      toast.error('Failed to delete family group');
      return false;
    }
  }
}

export const familySharingService = new FamilySharingService();