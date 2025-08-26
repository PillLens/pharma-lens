import React from 'react';
import { Video, MessageCircle, Settings, UserPlus, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

interface MobileActionSheetProps {
  children: React.ReactNode;
  onInviteMember: () => void;
  onVideoCall?: () => void;
  onMessage?: () => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  groupName: string;
}

export const MobileActionSheet: React.FC<MobileActionSheetProps> = ({
  children,
  onInviteMember,
  onVideoCall,
  onMessage,
  onEditGroup,
  onDeleteGroup,
  groupName
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl border-0 bg-background">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-lg font-semibold text-foreground">
            {groupName}
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-2 pb-6">
          {/* Primary Actions */}
          <Button
            variant="ghost"
            className="w-full justify-start h-14 px-4 text-left"
            onClick={() => handleAction(onInviteMember)}
          >
            <UserPlus className="w-5 h-5 mr-4 text-primary" />
            <span className="text-base font-medium">{t('family.member.invite')}</span>
          </Button>
          
          <Separator className="my-2" />
          
          {/* Communication Actions */}
          {onVideoCall && (
            <Button
              variant="ghost"
              className="w-full justify-start h-14 px-4 text-left"
              onClick={() => handleAction(onVideoCall)}
            >
              <Video className="w-5 h-5 mr-4 text-blue-500" />
              <span className="text-base font-medium">{t('family.actions.groupVideoCall')}</span>
            </Button>
          )}
          
          {onMessage && (
            <Button
              variant="ghost"
              className="w-full justify-start h-14 px-4 text-left"
              onClick={() => handleAction(onMessage)}
            >
              <MessageCircle className="w-5 h-5 mr-4 text-green-500" />
              <span className="text-base font-medium">{t('family.actions.groupMessage')}</span>
            </Button>
          )}
          
          <Separator className="my-2" />
          
          {/* Settings Actions */}
          <Button
            variant="ghost"
            className="w-full justify-start h-14 px-4 text-left"
            onClick={() => handleAction(onEditGroup)}
          >
            <Settings className="w-5 h-5 mr-4 text-muted-foreground" />
            <span className="text-base font-medium">{t('family.group.settings')}</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start h-14 px-4 text-left text-destructive hover:text-destructive"
            onClick={() => handleAction(onDeleteGroup)}
          >
            <Trash2 className="w-5 h-5 mr-4" />
            <span className="text-base font-medium">{t('common.delete')}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};