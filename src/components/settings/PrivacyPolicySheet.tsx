import React from 'react';
import { Shield } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/hooks/useTranslation';

interface PrivacyPolicySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicySheet: React.FC<PrivacyPolicySheetProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t('legal.privacyPolicy')}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-full mt-6">
          <div className="space-y-6 pb-6">
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">{t('legal.privacy.section1.title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.privacy.section1.content')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">{t('legal.privacy.section2.title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.privacy.section2.content')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">{t('legal.privacy.section3.title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.privacy.section3.content')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">{t('legal.privacy.section4.title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.privacy.section4.content')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">{t('legal.privacy.section5.title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.privacy.section5.content')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">{t('legal.privacy.section6.title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.privacy.section6.content')}
              </p>
            </section>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                {t('legal.privacy.lastUpdated')}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};