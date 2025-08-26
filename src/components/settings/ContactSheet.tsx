import React from 'react';
import { Info, Mail, Clock, MessageCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface ContactSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactSheet: React.FC<ContactSheetProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();

  const handleEmailContact = () => {
    const subject = encodeURIComponent('PillLens Support Request');
    const body = encodeURIComponent(`Hello PillLens Support Team,

I need assistance with:

[Please describe your issue or question here]

App Version: 1.0.0
Device: [Your device information]

Thank you!`);
    
    window.open(`mailto:${t('legal.contactEmail')}?subject=${subject}&body=${body}`, '_self');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            {t('legal.contact')}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-full mt-6">
          <div className="space-y-6 pb-6">
            {/* Email Contact */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">{t('legal.emailSupport')}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t('legal.emailSupportDesc')}
              </p>
              <p className="text-sm font-medium text-foreground mb-3">
                {t('legal.contactEmail')}
              </p>
              <Button 
                onClick={handleEmailContact}
                className="w-full"
                variant="outline"
              >
                <Mail className="w-4 h-4 mr-2" />
                {t('legal.sendEmail')}
              </Button>
            </div>

            {/* Support Hours */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">{t('legal.supportHoursTitle')}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('legal.supportHours')}
              </p>
            </div>

            {/* Response Time */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">{t('legal.responseTimeTitle')}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('legal.responseTime')}
              </p>
            </div>

            {/* Help Topics */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-semibold text-foreground mb-2">{t('legal.howCanWeHelp')}</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {t('legal.helpTopic1')}</li>
                <li>• {t('legal.helpTopic2')}</li>
                <li>• {t('legal.helpTopic3')}</li>
                <li>• {t('legal.helpTopic4')}</li>
                <li>• {t('legal.helpTopic5')}</li>
                <li>• {t('legal.helpTopic6')}</li>
              </ul>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>{t('legal.emergencyNotice')}</strong> {t('legal.emergencyNoticeDesc')}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};