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

      console.log('Profile search result:', { profileData, profileError });

      if (profileData) {
        return profileData;
      }

      // If not found in profiles, user doesn't exist yet - they need to create an account
      // For invitations, we'll allow the invitation to be sent anyway

      console.log('User not found');
      return null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error getting current user profile:', error);
      return null;
    }
  }

  // Family Group Management
  async createFamilyGroup(name: string, template?: FamilyGroupTemplate): Promise<FamilyGroup | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create the family group
      const { data, error } = await supabase
        .from('family_groups')
        .insert({
          name: name.trim(),
          creator_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add the creator as a family member with accepted status
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_group_id: data.id,
          user_id: user.id,
          role: 'caregiver', // Creator is typically the primary caregiver
          invitation_status: 'accepted',
          invited_by: user.id,
          permissions: {
            view_medications: true,
            edit_medications: true,
            receive_alerts: true,
            emergency_access: true
          },
          accepted_at: new Date().toISOString()
        });

      if (memberError) {
        console.error('Error adding creator as family member:', memberError);
        // Don't fail the entire operation, just log the error
      }

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
        .select('*');

      if (error) throw error;

      // Get creator profiles and member counts
      const groupsWithDetails = await Promise.all(
        (data || []).map(async (group) => {
          // Get creator profile
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('id, email, display_name, avatar_url, created_at, updated_at')
            .eq('id', group.creator_id)
            .single();

          // Count members
          const { count } = await supabase
            .from('family_members')
            .select('*', { count: 'exact', head: true })
            .eq('family_group_id', group.id)
            .eq('invitation_status', 'accepted');

          return {
            ...group,
            creator_profile: creatorProfile || undefined,
            member_count: (count || 0) + 1 // +1 for creator
          };
        })
      );

      return groupsWithDetails;
    } catch (error) {
      console.error('Error fetching family groups:', error);
      return [];
    }
  }

  async getFamilyGroupDetails(groupId: string): Promise<FamilyGroup | null> {
    try {
      const { data, error } = await supabase
        .from('family_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;

      // Get creator profile
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url, created_at, updated_at')
        .eq('id', data.creator_id)
        .single();

      // Get members
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_group_id', groupId);

      if (membersError) {
        console.error('Error fetching members:', membersError);
      }

      // Get profiles for each member
      const membersWithProfiles = await Promise.all(
        (members || []).map(async (member) => {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('id, email, display_name, avatar_url, created_at, updated_at')
            .eq('id', member.user_id)
            .single();

          const { data: inviterProfile } = member.invited_by ? await supabase
            .from('profiles')
            .select('id, email, display_name, avatar_url, created_at, updated_at')
            .eq('id', member.invited_by)
            .single() : { data: null };

          return {
            ...member,
            role: member.role as 'caregiver' | 'patient' | 'emergency_contact' | 'family' | 'emergency',
            invitation_status: member.invitation_status as 'pending' | 'accepted' | 'declined',
            permissions: member.permissions as {
              view_medications: boolean;
              edit_medications: boolean;
              receive_alerts: boolean;
            },
            user_profile: userProfile || undefined,
            inviter_profile: inviterProfile || undefined,
            display_name: userProfile?.display_name || userProfile?.email,
            user_email: userProfile?.email
          };
        })
      );

      return {
        ...data,
        creator_profile: creatorProfile || undefined,
        members: membersWithProfiles
      };
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
    role: 'caregiver' | 'patient' | 'emergency_contact' | 'family' | 'emergency',
    permissions: {
      view_medications: boolean;
      edit_medications: boolean;
      receive_alerts: boolean;
      emergency_access?: boolean;
    }
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Invitation request:', { groupId, userEmail, role, permissions, currentUser: user.id });

      // Clear cache and get fresh entitlements
      entitlementsService.clearCache(user.id);
      
      // Get user entitlements (includes trial check)
      const entitlements = await entitlementsService.getUserEntitlements(user.id);
      const maxFamilyMembers = entitlements.max_family_members || 0;
      
      console.log('Family invite check:', {
        userId: user.id,
        maxFamilyMembers,
        entitlements
      });

      // Get current family member count for this group
      const { data: currentMembers, error: membersError } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_group_id', groupId)
        .eq('invitation_status', 'accepted');

      if (membersError) {
        console.error('Error counting family members:', membersError);
      }

      const currentCount = currentMembers?.length || 0;

      if (maxFamilyMembers === 0) {
        toast.error('Your trial has expired. Upgrade to Pro Family to invite members.');
        return false;
      }

      if (maxFamilyMembers > 0 && currentCount >= maxFamilyMembers) {
        toast.error(`You've reached your plan's limit of ${maxFamilyMembers} family members. Upgrade to Pro Family for more members.`);
        return false;
      }

      // Find user by email
      const invitedUser = await this.findUserByEmail(userEmail);
      console.log('Found invited user:', invitedUser);
      
      // Check if user or email is already invited/member
      if (invitedUser) {
        const { data: existingMember } = await supabase
          .from('family_members')
          .select('id')
          .eq('family_group_id', groupId)
          .eq('user_id', invitedUser.id)
          .single();

        if (existingMember) {
          toast.error('User is already a member of this group');
          return false;
        }
      } else {
        const { data: existingInvite } = await supabase
          .from('family_members')
          .select('id')
          .eq('family_group_id', groupId)
          .eq('invited_email', userEmail.toLowerCase().trim())
          .single();

        if (existingInvite) {
          toast.error('An invitation has already been sent to this email');
          return false;
        }
      }
      
      // For users not found in profiles, create invitation with email instead of user_id
      const { error } = await supabase
        .from('family_members')
        .insert({
          family_group_id: groupId,
          user_id: invitedUser?.id || null,
          invited_email: invitedUser ? null : userEmail.toLowerCase().trim(),
          role,
          permissions,
          invited_by: user.id,
          invitation_status: 'pending'
        });

      if (error) {
        console.error('Database insertion error:', error);
        throw error;
      }

      // Send invitation email
      try {
        const { data: inviterProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        const { data: familyGroup } = await supabase
          .from('family_groups')
          .select('name')
          .eq('id', groupId)
          .single();

        const inviterName = inviterProfile?.display_name || user.email || 'Someone';
        
        // Create invitation link with encoded data
        const invitationData = {
          groupId,
          inviterName,
          familyGroupName: familyGroup?.name || 'Family Group',
          role,
          invitedEmail: userEmail
        };
        
        const encodedData = btoa(JSON.stringify(invitationData));
        const invitationLink = `https://pilllens.com/family/invite?data=${encodedData}`;

        // Send email via edge function
        const { error: emailError } = await supabase.functions.invoke('send-family-invitation', {
          body: {
            invitedEmail: userEmail,
            inviterName,
            familyGroupName: familyGroup?.name || 'Family Group',
            role,
            invitationLink,
            groupId
          }
        });

        if (emailError) {
          console.error('Error sending invitation email:', emailError);
          // Don't fail the invitation creation if email fails
        } else {
          console.log('Invitation email sent successfully to:', userEmail);
        }
      } catch (emailError) {
        console.error('Error in email sending process:', emailError);
        // Don't fail the invitation creation if email fails
      }

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

      // Find ALL pending invitations for this user in this group (by both user_id and email)
      const { data: invitations, error: findError } = await supabase
        .from('family_members')
        .select('id, user_id, invited_email')
        .eq('family_group_id', groupId)
        .eq('invitation_status', 'pending')
        .or(`user_id.eq.${user.id},invited_email.eq.${user.email?.toLowerCase().trim()}`);

      if (findError) throw findError;

      if (!invitations || invitations.length === 0) {
        console.error('No pending invitation found for user:', user.email);
        throw new Error('No pending invitation found for your account');
      }

      const updates: any = {
        invitation_status: response
      };

      if (response === 'accepted') {
        updates.accepted_at = new Date().toISOString();
        updates.user_id = user.id;
        updates.invited_email = null;
      }

      // Update ALL duplicate invitations for this user
      const { error } = await supabase
        .from('family_members')
        .update(updates)
        .eq('family_group_id', groupId)
        .eq('invitation_status', 'pending')
        .or(`user_id.eq.${user.id},invited_email.eq.${user.email?.toLowerCase().trim()}`);

      if (error) throw error;

      console.log(`Updated ${invitations.length} invitation(s) with status: ${response}`);
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
      emergency_access?: boolean;
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
          ),
          shared_by_profile:profiles!shared_medications_shared_by_fkey(
            id,
            email,
            display_name,
            avatar_url
          )
        `)
        .eq('family_group_id', groupId);

      if (error) throw error;
      
      return data?.map((item: any) => ({
        ...item,
        sharing_permissions: item.sharing_permissions as {
          view: boolean;
          edit: boolean;
          delete: boolean;
        }
      })) || [];
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

      // Look for invitations by both user_id and email
      const { data, error } = await supabase
        .from('family_members')
        .select('id, family_group_id, role, invited_at, invited_by')
        .eq('invitation_status', 'pending')
        .or(`user_id.eq.${user.id},invited_email.eq.${user.email?.toLowerCase().trim()}`);

      if (error) throw error;

      // Get group names and inviter profiles
      const invitationsWithDetails = await Promise.all(
        (data || []).map(async (invitation) => {
          const { data: group } = await supabase
            .from('family_groups')
            .select('name')
            .eq('id', invitation.family_group_id)
            .single();

          const { data: inviterProfile } = invitation.invited_by ? await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('id', invitation.invited_by)
            .single() : { data: null };

          return {
            id: invitation.id,
            familyGroupId: invitation.family_group_id,
            familyGroupName: group?.name || 'Unknown Group',
            invitedBy: invitation.invited_by || '',
            inviterName: inviterProfile?.display_name || inviterProfile?.email,
            role: invitation.role as 'caregiver' | 'patient' | 'emergency_contact' | 'family' | 'emergency',
            invitedAt: invitation.invited_at
          };
        })
      );

      return invitationsWithDetails;
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
      const { data: sharedMedications, error } = await supabase
        .from('shared_medications')
        .select(`
          sharing_permissions,
          family_group_id
        `)
        .eq('medication_id', medicationId);

      if (error || !sharedMedications) return false;

      // Check if user is a member of any family group with the required permission
      for (const shared of sharedMedications) {
        const { data: membership } = await supabase
          .from('family_members')
          .select('id')
          .eq('family_group_id', shared.family_group_id)
          .eq('user_id', user.id)
          .eq('invitation_status', 'accepted')
          .single();

        if (membership) {
          const permissions = shared.sharing_permissions as {
            view: boolean;
            edit: boolean;
            delete: boolean;
          };

          if (permissions[requiredPermission]) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking medication access:', error);
      return false;
    }
  }

  // Real-time features
  async subscribeFamilyUpdates(
    groupId: string,
    onUpdate: (payload: any) => void
  ): Promise<() => void> {
    const channel = supabase
      .channel(`family_group_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_members',
          filter: `family_group_id=eq.${groupId}`
        },
        onUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_medications',
          filter: `family_group_id=eq.${groupId}`
        },
        onUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Family Templates
  getFamilyTemplates(): FamilyGroupTemplate[] {
    return [
      {
        id: 'eldercare',
        name: 'Elder Care',
        description: 'Perfect for families caring for elderly parents or grandparents',
        icon: '👴',
        suggestedRoles: [
          {
            role: 'patient',
            permissions: {
              view_medications: true,
              edit_medications: false,
              receive_alerts: true
            }
          },
          {
            role: 'caregiver',
            permissions: {
              view_medications: true,
              edit_medications: true,
              receive_alerts: true
            }
          }
        ]
      },
      {
        id: 'chronic_care',
        name: 'Chronic Condition',
        description: 'Manage chronic conditions with family support',
        icon: '🏥',
        suggestedRoles: [
          {
            role: 'patient',
            permissions: {
              view_medications: true,
              edit_medications: true,
              receive_alerts: true
            }
          },
          {
            role: 'caregiver',
            permissions: {
              view_medications: true,
              edit_medications: false,
              receive_alerts: true
            }
          }
        ]
      },
      {
        id: 'child_care',
        name: 'Child Care',
        description: 'Coordinate care for children with multiple caregivers',
        icon: '👶',
        suggestedRoles: [
          {
            role: 'caregiver',
            permissions: {
              view_medications: true,
              edit_medications: true,
              receive_alerts: true
            }
          },
          {
            role: 'emergency_contact',
            permissions: {
              view_medications: true,
              edit_medications: false,
              receive_alerts: true
            }
          }
        ]
      }
    ];
  }
}

// Singleton instance
export const familySharingService = new FamilySharingService();