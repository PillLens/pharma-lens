import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Clock, Shield, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NotificationPermissionDialogProps {
  isOpen: boolean;
  onAllow: () => Promise<void>;
  onDeny: () => void;
  loading: boolean;
}

export const NotificationPermissionDialog: React.FC<NotificationPermissionDialogProps> = ({
  isOpen,
  onAllow,
  onDeny,
  loading
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            {t('notifications.permissionTitle')}
          </DialogTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t('notifications.permissionDescription')}
          </p>
        </DialogHeader>

        <div className="space-y-4 my-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{t('notifications.benefit1Title')}</h4>
              <p className="text-muted-foreground text-xs">{t('notifications.benefit1Description')}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{t('notifications.benefit2Title')}</h4>
              <p className="text-muted-foreground text-xs">{t('notifications.benefit2Description')}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{t('notifications.benefit3Title')}</h4>
              <p className="text-muted-foreground text-xs">{t('notifications.benefit3Description')}</p>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 mb-6">
          <p className="text-xs text-muted-foreground">
            {t('notifications.privacyNote')}
          </p>
        </div>

        <div className="flex flex-col space-y-2">
          <Button 
            onClick={onAllow} 
            disabled={loading}
            className="w-full"
          >
            {loading ? t('common.processing') : t('notifications.allowButton')}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onDeny}
            disabled={loading}
            className="w-full"
          >
            {t('notifications.denyButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};