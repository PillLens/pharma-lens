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
              <h3 className="text-lg font-semibold text-foreground mb-3">1. Information We Collect</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PillLens collects medication information that you scan or manually enter, personal health data for reminder purposes, and account information for authentication. All medication scanning is performed locally on your device to protect your privacy.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">2. How We Use Your Information</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your data is used to provide medication reminders, enable family sharing features, and improve our services. We never sell or share your personal health information with third parties without your explicit consent.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">3. Data Security</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We implement industry-standard encryption and security measures to protect your data. All communication between your device and our servers is encrypted using TLS. Your medication images are processed locally and not transmitted to our servers.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">4. Medical Compliance</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PillLens follows healthcare privacy standards and is designed with HIPAA compliance principles in mind. We maintain audit logs and implement appropriate safeguards for protected health information.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">5. Your Rights</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You have the right to access, update, or delete your personal information at any time. You can export all your data or permanently delete your account through the Settings page.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-3">6. Contact Us</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or how we handle your data, please contact us at privacy@pilllens.com.
              </p>
            </section>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Last updated: December 2024. This privacy policy may be updated from time to time. We will notify you of any significant changes.
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};