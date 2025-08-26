import React from 'react';
import { Info, Mail, Clock, MessageCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
        
        <div className="mt-6 space-y-6">
          {/* Email Contact */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Email Support</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Get in touch with our support team for any questions or issues.
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
              Send Email
            </Button>
          </div>

          {/* Support Hours */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Support Hours</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('legal.supportHours')}
            </p>
          </div>

          {/* Response Time */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Response Time</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('legal.responseTime')}
            </p>
          </div>

          {/* Help Topics */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground mb-2">How can we help?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Medication scanning issues</li>
              <li>• Reminder setup and troubleshooting</li>
              <li>• Family sharing problems</li>
              <li>• Account and subscription questions</li>
              <li>• Privacy and security concerns</li>
              <li>• Feature requests and feedback</li>
            </ul>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Emergency Notice:</strong> PillLens is not for medical emergencies. If you're experiencing a medical emergency, please contact your local emergency services immediately.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};