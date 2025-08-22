import React from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  MessageCircle, 
  Share2, 
  Trash2, 
  Mail,
  MoreVertical 
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
import { FamilyGroup, FamilyMember } from '@/services/familySharingService';

interface GroupDetailsSheetProps {
  group: FamilyGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onInviteMember: () => void;
  onMemberAction: (memberId: string, action: 'call' | 'message' | 'share' | 'remove') => void;
}

const GroupDetailsSheet: React.FC<GroupDetailsSheetProps> = ({
  group,
  isOpen,
  onClose,
  onInviteMember,
  onMemberAction,
}) => {
  const { t } = useTranslation();

  if (!group) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-medical-success/20 text-medical-success">{t('family.status.active')}</Badge>;
      case 'pending':
        return <Badge className="bg-medical-warning/20 text-medical-warning">{t('family.status.pending')}</Badge>;
      case 'invited':
        return <Badge className="bg-medical-info/20 text-medical-info">{t('family.status.invited')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'patient':
        return <Badge variant="outline" className="text-medical-info border-medical-info/30">{t('family.roles.patient')}</Badge>;
      case 'caregiver':
        return <Badge variant="outline" className="text-medical-success border-medical-success/30">{t('family.roles.caregiver')}</Badge>;
      case 'family':
        return <Badge variant="outline">{t('family.roles.family')}</Badge>;
      case 'emergency':
        return <Badge variant="outline" className="text-medical-error border-medical-error/30">{t('family.roles.emergency')}</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-md p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-left">{group.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {group.members?.length || 0} {group.members?.length === 1 ? t('family.group.member') : t('family.group.members')}
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Invite Member Button */}
            <div className="px-6 pb-4">
              <Button 
                onClick={onInviteMember} 
                className="w-full rounded-xl"
                size="lg"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {t('family.member.invite')}
              </Button>
            </div>

            <Separator />

            {/* Members List */}
            <div className="p-6">
              <h3 className="font-medium text-foreground mb-4">
                {t('family.group.members')} ({group.members?.length || 0})
              </h3>

              {group.members && group.members.length > 0 ? (
                <div className="space-y-4">
                  {group.members.map((member: FamilyMember) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(member.display_name || member.user_email || 'U')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm text-foreground truncate">
                            {member.display_name || member.user_email}
                          </p>
                          {getStatusBadge(member.invitation_status)}
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(member.role)}
                          {member.user_email && member.display_name && (
                            <span className="text-xs text-muted-foreground truncate">
                              {member.user_email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Member Actions */}
                      <div className="flex items-center gap-1">
                        {member.invitation_status === 'accepted' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-full"
                              onClick={() => onMemberAction(member.id, 'call')}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-full"
                              onClick={() => onMemberAction(member.id, 'message')}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-full"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.invitation_status === 'pending' && (
                              <DropdownMenuItem onClick={() => onMemberAction(member.id, 'share')}>
                                <Mail className="w-4 h-4 mr-2" />
                                {t('family.member.resend')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onMemberAction(member.id, 'share')}>
                              <Share2 className="w-4 h-4 mr-2" />
                              {t('family.member.share')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onMemberAction(member.id, 'remove')}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('family.member.remove')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{t('family.group.noMembers')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GroupDetailsSheet;