import React from 'react';
import { Phone, MessageCircle, Share2, Settings, Crown, Shield, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FamilyMember } from '@/services/familySharingService';

interface MobileFamilyMemberCardProps {
  member: FamilyMember;
  isOwner?: boolean;
  onCall?: (member: FamilyMember) => void;
  onMessage?: (member: FamilyMember) => void;
  onShare?: (member: FamilyMember) => void;
  onSettings?: (member: FamilyMember) => void;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'caregiver': return Crown;
    case 'emergency_contact': return Shield;
    default: return AlertCircle;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'caregiver': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'patient': return 'bg-green-100 text-green-700 border-green-200';
    case 'emergency_contact': return 'bg-orange-100 text-orange-700 border-orange-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const MobileFamilyMemberCard: React.FC<MobileFamilyMemberCardProps> = ({
  member,
  isOwner = false,
  onCall,
  onMessage,
  onShare,
  onSettings
}) => {
  const RoleIcon = getRoleIcon(member.role);
  const isOnline = true; // Simulate online status (status not in FamilyMember type)

  return (
    <Card className="medical-surface border-border/50 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar with Status Indicator */}
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={''} alt={member.display_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(member.display_name || 'User')}
              </AvatarFallback>
            </Avatar>
            
            {/* Online Status Indicator */}
            <div 
              className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background ${
                isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
          </div>

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground truncate">
                {member.display_name || 'Family Member'}
              </h3>
              {isOwner && (
                <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline" 
                className={`text-xs px-2 py-0.5 ${getRoleColor(member.role)}`}
              >
                <RoleIcon className="h-3 w-3 mr-1" />
                {member.role.replace('_', ' ')}
              </Badge>
              
              <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Permissions Summary */}
            <div className="flex flex-wrap gap-1 mb-3">
              {member.permissions?.view_medications && (
                <Badge variant="secondary" className="text-xs">View Meds</Badge>
              )}
              {member.permissions?.edit_medications && (
                <Badge variant="secondary" className="text-xs">Edit Meds</Badge>
              )}
              {member.permissions?.receive_alerts && (
                <Badge variant="secondary" className="text-xs">Alerts</Badge>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-9"
                onClick={() => onCall?.(member)}
              >
                <Phone className="h-3 w-3 mr-1" />
                Call
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-9"
                onClick={() => onMessage?.(member)}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Text
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-3"
                onClick={() => onShare?.(member)}
              >
                <Share2 className="h-3 w-3" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-3"
                onClick={() => onSettings?.(member)}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};