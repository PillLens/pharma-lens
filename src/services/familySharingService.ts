import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FamilyGroup {
  id: string;
  name: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  members?: FamilyMember[];
  member_count?: number;
}

export interface FamilyMember {
  id: string;
  family_group_id: string;
  user_id: string;
  role: 'caregiver' | 'patient' | 'emergency_contact';
  permissions: {
    view_medications: boolean;
    edit_medications: boolean;
    receive_alerts: boolean;
  };
  invited_by?: string;
  invitation_status: 'pending' | 'accepted' | 'declined';
  invited_at: string;
  accepted_at?: string;
  user_email?: string; // For display purposes
  display_name?: string;
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
  medication?: any; // Will contain medication details
}

export interface FamilyInvitation {
  familyGroupId: string;
  familyGroupName: string;
  invitedBy: string;
  inviterName?: string;
  role: 'caregiver' | 'patient' | 'emergency_contact';
  invitedAt: string;
}

export class FamilySharingService {
  
  // Family Group Management
  async createFamilyGroup(name: string): Promise<FamilyGroup | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('family_groups')
        .insert({
          name: name.trim(),
          creator_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

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

      const { data, error } = await supabase
        .from('family_groups')
        .select(`
          *,
          members:family_members!family_members_family_group_id_fkey(count)
        `)
        .or(`creator_id.eq.${user.id},id.in.(${await this.getUserFamilyGroupIds()})`);

      if (error) throw error;

      return data?.map(group => ({
        ...group,
        members: undefined,
        member_count: (group.members as any)?.[0]?.count || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching family groups:', error);
      return [];
    }
  }

  private async getUserFamilyGroupIds(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return '';

      const { data } = await supabase
        .from('family_members')
        .select('family_group_id')
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted');

      return data?.map(m => m.family_group_id).join(',') || '';
    } catch {
      return '';
    }
  }

  async getFamilyGroupDetails(groupId: string): Promise<FamilyGroup | null> {
    try {
      const { data, error } = await supabase
        .from('family_groups')
        .select(`
          *,
          members:family_members!family_members_family_group_id_fkey(
            id,
            user_id,
            role,
            permissions,
            invitation_status,
            invited_at,
            accepted_at,
            invited_by
          )
        `)
        .eq('id', groupId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching family group details:', error);
      return null;
    }
  }

  async updateFamilyGroup(groupId: string, updates: { name?: string }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('family_groups')
        .update(updates)
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Family group updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating family group:', error);
      toast.error('Failed to update family group');
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

      toast.success('Family group deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting family group:', error);
      toast.error('Failed to delete family group');
      return false;
    }
  }

  // Family Member Management
  async inviteFamilyMember(
    groupId: string, 
    userEmail: string, 
    role: 'caregiver' | 'patient' | 'emergency_contact',
    permissions: {
      view_medications: boolean;
      edit_medications: boolean;
      receive_alerts: boolean;
    }
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // For now, we'll use email as user_id (in a real app, you'd look up the user by email)
      // This is a simplified implementation
      const { error } = await supabase
        .from('family_members')
        .insert({
          family_group_id: groupId,
          user_id: userEmail, // In production, resolve email to user_id
          role,
          permissions,
          invited_by: user.id,
          invitation_status: 'pending'
        });

      if (error) throw error;

      toast.success(`Invitation sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Error inviting family member:', error);
      toast.error('Failed to send invitation');
      return false;
    }
  }

  async respondToInvitation(
    groupId: string, 
    response: 'accepted' | 'declined'
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updates: any = {
        invitation_status: response
      };

      if (response === 'accepted') {
        updates.accepted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('family_members')
        .update(updates)
        .eq('family_group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`Invitation ${response}`);
      return true;
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast.error('Failed to respond to invitation');
      return false;
    }
  }

  async removeFamilyMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('family_group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Family member removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing family member:', error);
      toast.error('Failed to remove family member');
      return false;
    }
  }

  async updateMemberPermissions(
    groupId: string, 
    userId: string, 
    permissions: {
      view_medications: boolean;
      edit_medications: boolean;
      receive_alerts: boolean;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('family_members')
        .update({ permissions })
        .eq('family_group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Member permissions updated');
      return true;
    } catch (error) {
      console.error('Error updating member permissions:', error);
      toast.error('Failed to update permissions');
      return false;
    }
  }

  // Medication Sharing
  async shareMedication(
    medicationId: string, 
    groupId: string,
    permissions: {
      view: boolean;
      edit: boolean;
      delete: boolean;
    }
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('shared_medications')
        .insert({
          medication_id: medicationId,
          family_group_id: groupId,
          shared_by: user.id,
          sharing_permissions: permissions
        });

      if (error) throw error;

      toast.success('Medication shared with family');
      return true;
    } catch (error) {
      console.error('Error sharing medication:', error);
      toast.error('Failed to share medication');
      return false;
    }
  }

  async getSharedMedications(groupId: string): Promise<SharedMedication[]> {
    try {
      const { data, error } = await supabase
        .from('shared_medications')
        .select(`
          *,
          medication:user_medications!shared_medications_medication_id_fkey(
            id,
            medication_name,
            generic_name,
            dosage,
            frequency,
            start_date,
            end_date,
            is_active,
            prescriber,
            notes
          )
        `)
        .eq('family_group_id', groupId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shared medications:', error);
      return [];
    }
  }

  async updateSharingPermissions(
    sharedMedicationId: string,
    permissions: {
      view: boolean;
      edit: boolean;
      delete: boolean;
    }
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
      console.error('Error updating sharing permissions:', error);
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

  // Utility Methods
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
          family_groups!family_members_family_group_id_fkey(
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('invitation_status', 'pending');

      if (error) throw error;

      return data?.map(invitation => ({
        familyGroupId: invitation.family_group_id,
        familyGroupName: invitation.family_groups?.name || 'Unknown Group',
        invitedBy: '',
        role: invitation.role as any,
        invitedAt: invitation.invited_at
      })) || [];
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      return [];
    }
  }

  async canUserAccessMedication(
    medicationId: string, 
    requiredPermission: 'view' | 'edit' | 'delete'
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user owns the medication
      const { data: ownedMedication } = await supabase
        .from('user_medications')
        .select('id')
        .eq('id', medicationId)
        .eq('user_id', user.id)
        .single();

      if (ownedMedication) return true;

      // Check if user has access through family sharing
      const { data: sharedMedication } = await supabase
        .from('shared_medications')
        .select(`
          sharing_permissions,
          family_group_id,
          family_members!family_members_family_group_id_fkey(
            user_id,
            invitation_status
          )
        `)
        .eq('medication_id', medicationId);

      if (!sharedMedication) return false;

      // Check if user is a member of the family group with the required permission
      for (const shared of sharedMedication) {
        const isMember = shared.family_members.some(
          (member: any) => 
            member.user_id === user.id && 
            member.invitation_status === 'accepted'
        );

        if (isMember && shared.sharing_permissions[requiredPermission]) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking medication access:', error);
      return false;
    }
  }
}

// Singleton instance
export const familySharingService = new FamilySharingService();