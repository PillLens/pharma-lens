import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/hooks/useTranslation';

interface TermsOfServiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfServiceSheet: React.FC<TermsOfServiceSheetProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            {t('legal.termsOfService')}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-full mt-6">
          <div className="space-y-6 pb-6">
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By using PillLens, you agree to these Terms of Service. If you do not agree to these terms, please do not use our application.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">2. Medical Disclaimer</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PillLens is a medication information and reminder tool. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals regarding your medical conditions and treatments.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">3. Accuracy of Information</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                While we strive to provide accurate medication information extracted from official sources, we cannot guarantee the completeness or accuracy of all information. Users are responsible for verifying medication details with healthcare providers.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">4. User Responsibilities</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You are responsible for maintaining the confidentiality of your account, providing accurate information, and using the service in compliance with applicable laws and regulations.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">5. Limitation of Liability</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PillLens and its developers shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the application or reliance on the information provided.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">6. Service Availability</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We strive to maintain service availability but do not guarantee uninterrupted access. We reserve the right to modify or discontinue services with appropriate notice.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">7. Termination</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Either party may terminate the service agreement at any time. Upon termination, your right to use the service will cease immediately.
              </p>
            </section>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Last updated: December 2024. These terms may be updated from time to time. Continued use of the service constitutes acceptance of any changes.
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};