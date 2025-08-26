import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2, UserMinus, Settings2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { FamilyGroup } from '@/services/familySharingService';
import { toast } from '@/hooks/use-toast';

interface GroupSettingsSheetProps {
  group: FamilyGroup;
  isOpen: boolean;
  onClose: () => void;
  onUpdateGroup: (groupId: string, updates: { name: string; description?: string }) => void;
  onRemoveMember: (groupId: string, memberId: string) => void;
  onDeleteGroup: (groupId: string) => void;
}

const GroupSettingsSheet: React.FC<GroupSettingsSheetProps> = ({
  group,
  isOpen,
  onClose,
  onUpdateGroup,
  onRemoveMember,
  onDeleteGroup,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [groupDescription, setGroupDescription] = useState('');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  const handleSaveChanges = async () => {
    if (!groupName.trim()) {
      toast({
        title: t('common.error'),
        description: t('family.validation.groupNameRequired'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateGroup(group.id, {
        name: groupName.trim(),
        description: groupDescription.trim(),
      });
      toast({
        title: t('common.success'),
        description: t('family.messages.groupUpdated'),
      });
      onClose();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setIsLoading(true);
    try {
      await onRemoveMember(group.id, memberId);
      toast({
        title: t('common.success'),
        description: t('family.messages.memberRemoved'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm(t('family.group.confirmDelete'))) {
      setIsLoading(true);
      try {
        await onDeleteGroup(group.id);
        toast({
          title: t('common.success'),
          description: t('family.messages.groupDeleted'),
        });
        onClose();
      } catch (error) {
        toast({
          title: t('common.error'),
          description: t('common.tryAgain'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Settings2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-left">{t('family.group.settings')}</SheetTitle>
              <SheetDescription className="text-left">{group.name}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Group Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('family.group.information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">{t('family.group.name')}</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={t('family.group.enterName')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupDescription">{t('family.group.description')}</Label>
                <Textarea
                  id="groupDescription"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder={t('family.group.enterDescription')}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Members Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('family.group.members')} ({group.members?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.members && group.members.length > 0 ? (
                  group.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className={`text-sm font-medium ${getRoleBadgeColor(member.role)}`}>
                            {getInitials(member.display_name || member.user_email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.display_name || member.user_email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(member.role)}`}>
                              {member.role}
                            </Badge>
                            {member.invitation_status === 'pending' && (
                              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                                {t('family.status.pending')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={isLoading}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">{t('family.group.noMembers')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={handleSaveChanges} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? t('common.saving') : t('common.saveChanges')}
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={isLoading}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('family.group.delete')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GroupSettingsSheet;