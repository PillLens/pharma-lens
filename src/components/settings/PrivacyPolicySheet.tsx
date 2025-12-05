import React from 'react';
import { Shield, Heart, Lock, Database } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/hooks/useTranslation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PrivacyPolicySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicySheet: React.FC<PrivacyPolicySheetProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleViewFullPolicy = () => {
    onClose();
    navigate('/privacy-policy');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t('legal.privacyPolicy')}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-full mt-4">
          <div className="space-y-6 pb-8 pr-2">
            {/* Medical Disclaimer - Prominent */}
            <Card className="p-4 bg-warning/10 border-warning/30">
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    {t('legal.privacy.medicalDisclaimer.title', 'Medical Disclaimer')}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('legal.privacy.medicalDisclaimer.content', 'PillLens is a medication management tool and does NOT provide medical diagnosis or replace professional medical advice. Always consult your healthcare provider for medical decisions.')}
                  </p>
                </div>
              </div>
            </Card>

            <section>
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  {t('legal.privacy.section1.title', 'Information We Collect')}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.privacy.section1.content', 'We collect account information, medication data, health metrics (vital signs, checkups), scan history, and usage data to provide medication management services.')}
              </p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  {t('legal.privacy.section2.title', 'How We Use Information')}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.privacy.section2.content', 'Your data is used for medication identification, reminders, safety alerts, adherence tracking, and family coordination. We do NOT sell your health data.')}
              </p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  {t('legal.privacy.section3.title', 'Data Security')}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.privacy.section3.content', 'All data is encrypted in transit and at rest. We use industry-standard security measures including TLS 1.3 and AES-256 encryption.')}
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {t('legal.privacy.section4.title', 'Data Retention')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.privacy.section4.content', 'Data is retained while your account is active. Upon deletion request, all personal data is permanently removed within 30 days.')}
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {t('legal.privacy.section5.title', 'Your Rights')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.privacy.section5.content', 'You can access, correct, export, or delete your data at any time through the app settings.')}
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {t('legal.privacy.section6.title', "Children's Privacy")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.privacy.section6.content', 'Users must be 13+ to create an account. Children under 18 should use the app under parental supervision.')}
              </p>
            </section>

            <div className="pt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleViewFullPolicy}
              >
                {t('legal.viewFullPolicy', 'View Full Privacy Policy')}
              </Button>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                {t('legal.privacy.lastUpdated', 'Last updated: December 5, 2024')}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
