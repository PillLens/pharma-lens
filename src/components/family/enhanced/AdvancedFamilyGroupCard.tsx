import React, { useState, useEffect } from 'react';
import { 
  Users, MoreVertical, UserPlus, Settings, Phone, MessageCircle, 
  Video, Heart, Shield, Activity, Clock, Zap, TrendingUp, Wifi, WifiOff
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileActionSheet } from '../MobileActionSheet';
import { FamilyGroup } from '@/services/familySharingService';

interface AdvancedFamilyGroupCardProps {
  group: FamilyGroup;
  onTap: () => void;
  onInviteMember: () => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  onCall?: (memberId: string) => void;
  onMessage?: (memberId: string) => void;
  onVideoCall?: (memberId: string) => void;
}

const AdvancedFamilyGroupCard: React.FC<AdvancedFamilyGroupCardProps> = ({
  group,
  onTap,
  onInviteMember,
  onEditGroup,
  onDeleteGroup,
  onCall,
  onMessage,
  onVideoCall,
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [memberStatuses, setMemberStatuses] = useState<{[key: string]: 'online' | 'offline' | 'away'}>({});

  // Mock real-time status updates
  useEffect(() => {
    if (group.members) {
      const statuses: {[key: string]: 'online' | 'offline' | 'away'} = {};
      group.members.forEach(member => {
        statuses[member.id] = Math.random() > 0.7 ? 'online' : Math.random() > 0.5 ? 'away' : 'offline';
      });
      setMemberStatuses(statuses);
    }
  }, [group.members]);

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

  const getStatusColor = (status: 'online' | 'offline' | 'away') => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'away': return 'bg-warning';
      default: return 'bg-muted-foreground';
    }
  };

  const getStatusIcon = (status: 'online' | 'offline' | 'away') => {
    switch (status) {
      case 'online': return <Wifi className="w-3 h-3" />;
      case 'away': return <Clock className="w-3 h-3" />;
      default: return <WifiOff className="w-3 h-3" />;
    }
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

  // Live data calculations
  const groupAdherence = 85; // TODO: Calculate from real adherence data
  const activeAlerts = 0; // TODO: Calculate from real alert data
  const sharedMedications = 0; // TODO: Calculate from real shared medications
  const onlineMembers = Object.values(memberStatuses).filter(status => status === 'online').length;

  return (
    <Card className="border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Header with gradient background based on group health */}
      <CardHeader className={`p-4 pb-2 bg-gradient-to-r ${
        groupAdherence >= 90 ? 'from-success/5 to-success/10' :
        groupAdherence >= 70 ? 'from-warning/5 to-warning/10' :
        'from-destructive/5 to-destructive/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 cursor-pointer" onClick={onTap}>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{group.name}</h3>
              <Badge className={`text-xs px-2 py-0.5 ${
                groupAdherence >= 90 ? 'bg-success/10 text-success' :
                groupAdherence >= 70 ? 'bg-warning/10 text-warning' :
                'bg-destructive/10 text-destructive'
              }`}>
                {groupAdherence}%
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {group.members?.length || 0} {getMemberCountText(group.members?.length || 0)}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {onlineMembers} {t('family.status.online')}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {sharedMedications} {t('family.status.shared')}
              </span>
            </div>
          </div>

          {/* Actions Menu */}
          {isMobile ? (
            <MobileActionSheet
              onInviteMember={onInviteMember}
              onVideoCall={() => onVideoCall?.(group.id)}
              onMessage={() => onMessage?.(group.id)}
              onEditGroup={onEditGroup}
              onDeleteGroup={onDeleteGroup}
              groupName={group.name}
            >
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-md w-8 h-8 hover:bg-background/80"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </MobileActionSheet>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="rounded-md w-8 h-8 hover:bg-background/80"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                side="bottom"
                sideOffset={8}
                avoidCollisions={true}
                className="w-56 bg-background border shadow-lg z-50"
              >
                <DropdownMenuItem onClick={onInviteMember} className="py-2 px-3">
                  <UserPlus className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('family.member.invite')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onVideoCall?.(group.id)} className="py-2 px-3">
                  <Video className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('family.actions.groupVideoCall')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMessage?.(group.id)} className="py-2 px-3">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('family.actions.groupMessage')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEditGroup} className="py-2 px-3">
                  <Settings className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('family.group.settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDeleteGroup} className="text-destructive py-2 px-3">
                  <span className="text-sm">{t('common.delete')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <div className="space-y-4">
          {/* Group Health Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-medium text-foreground">{groupAdherence}%</p>
              <p className="text-xs text-muted-foreground">{t('family.status.adherence')}</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs font-medium text-foreground">{activeAlerts}</p>
              <p className="text-xs text-muted-foreground">{t('family.status.alerts')}</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-green-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs font-medium text-foreground">{onlineMembers}</p>
              <p className="text-xs text-muted-foreground">{t('family.status.active')}</p>
            </div>
          </div>

          {/* Adherence Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{t('family.status.groupAdherence')}</span>
              <span className="text-xs font-medium text-foreground">{groupAdherence}%</span>
            </div>
            <Progress value={groupAdherence} className="h-2" />
          </div>

          {/* Member Avatars with Status */}
          <div className="flex items-center justify-between">
            <div className="flex -space-x-3">
              {group.members && group.members.length > 0 ? (
                <>
                  {group.members.slice(0, 4).map((member, index) => (
                    <div key={member.id} className="relative">
                      <Avatar className="w-10 h-10 border-2 border-background shadow-sm ring-2 ring-background">
                        <AvatarFallback className={`text-xs font-medium ${
                          member.role === 'caregiver' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {getInitials(member.display_name || member.user_email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      {/* Status indicator */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-background ${
                        getStatusColor(memberStatuses[member.id] || 'offline')
                      } flex items-center justify-center`}>
                        <div className="w-1.5 h-1.5 text-white">
                          {getStatusIcon(memberStatuses[member.id] || 'offline')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {group.members.length > 4 && (
                    <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center shadow-sm">
                      <span className="text-xs text-muted-foreground font-medium">
                        +{group.members.length - 4}
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

            {/* Quick Actions */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => onCall?.(group.id)}
              >
                <Phone className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => onMessage?.(group.id)}
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => onVideoCall?.(group.id)}
              >
                <Video className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-1">
            {activeAlerts > 0 && (
              <Badge className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive border-destructive/20">
                {activeAlerts} {activeAlerts > 1 ? t('family.status.alerts') : t('family.status.alert')}
              </Badge>
            )}
            {group.members && group.members.some(m => m.invitation_status === 'pending') && (
              <Badge className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                {t('family.status.pending')}
              </Badge>
            )}
            {onlineMembers > 0 && (
              <Badge className="text-xs px-2 py-0.5 bg-success/10 text-success border-success/20">
                {onlineMembers} {t('family.status.online')}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedFamilyGroupCard;