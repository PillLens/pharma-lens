import React from 'react';
import { Users, MoreVertical, UserPlus, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
import { FamilyGroup } from '@/services/familySharingService';

interface FamilyGroupCardProps {
  group: FamilyGroup;
  onTap: () => void;
  onInviteMember: () => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
}

const FamilyGroupCard: React.FC<FamilyGroupCardProps> = ({
  group,
  onTap,
  onInviteMember,
  onEditGroup,
  onDeleteGroup,
}) => {
  const { t } = useTranslation();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMemberCountText = (count: number) => {
    return count === 1 ? t('family.group.member') : t('family.group.members');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'patient':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'caregiver':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  return (
    <Card className="border border-border/50 hover:border-border hover:shadow-sm transition-all duration-200 cursor-pointer">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex-1" onClick={onTap}>
              <h3 className="font-semibold text-foreground mb-1">{group.name}</h3>
              <p className="text-sm text-muted-foreground">
                {group.member_count || 0} {getMemberCountText(group.member_count || 0)}
                {group.members && group.member_count > 0 && (
                  <>
                    {' • '}
                    {group.members.filter(m => m.role === 'caregiver' && m.invitation_status === 'accepted').length > 0 && (
                      <span>
                        {group.members.filter(m => m.role === 'caregiver' && m.invitation_status === 'accepted').length} {t('family.roles.caregiver').toLowerCase()}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="rounded-md w-8 h-8 hover:bg-muted"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50">
                <DropdownMenuItem onClick={onInviteMember}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('family.member.invite')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEditGroup}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t('family.group.settings')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDeleteGroup} className="text-destructive">
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Member Avatars */}
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {group.members && group.members.filter(m => m.invitation_status === 'accepted').length > 0 ? (
                <>
                  {group.members.filter(m => m.invitation_status === 'accepted').slice(0, 4).map((member, index) => (
                    <Avatar key={member.id} className="w-8 h-8 border-2 border-background shadow-sm">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                        {getInitials(member.display_name || member.user_email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                    {group.members.filter(m => m.invitation_status === 'accepted').length > 4 && (
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center shadow-sm">
                        <span className="text-xs text-muted-foreground font-medium">
                          +{group.members.filter(m => m.invitation_status === 'accepted').length - 4}
                        </span>
                      </div>
                    )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">{t('family.group.noMembers')}</span>
                </div>
              )}
            </div>

            {/* Status Badges */}
            <div className="flex gap-2">
              {group.members && group.members.some(m => m.invitation_status === 'pending') && (
                <Badge className="text-xs px-2 py-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                  {t('family.status.pending')}
                </Badge>
              )}
              {group.members && group.members.some(m => m.invitation_status === 'accepted') && (
                <Badge className="text-xs px-2 py-1 bg-green-500/10 text-green-600 border-green-500/20">
                  {t('family.status.active')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FamilyGroupCard;