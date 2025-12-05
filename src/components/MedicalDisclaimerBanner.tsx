import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

const DISMISSAL_KEY = 'medical_disclaimer_dismissed';
const DISMISSAL_EXPIRY_DAYS = 7;

export const MedicalDisclaimerBanner: React.FC = () => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const checkDismissal = () => {
      const dismissedAt = localStorage.getItem(DISMISSAL_KEY);
      if (!dismissedAt) {
        setIsDismissed(false);
        return;
      }
      
      const dismissedDate = new Date(dismissedAt);
      const now = new Date();
      const daysSinceDismissal = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDismissal >= DISMISSAL_EXPIRY_DAYS) {
        localStorage.removeItem(DISMISSAL_KEY);
        setIsDismissed(false);
      }
    };
    
    checkDismissal();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSAL_KEY, new Date().toISOString());
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground mb-1">
            {t('disclaimer.medical.title', 'Medical Information Disclaimer')}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('disclaimer.medical.message', 'This app does not provide medical diagnosis and is not a substitute for professional medical advice. Always consult your healthcare provider before making any decisions about your medications.')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="flex-shrink-0 h-8 w-8 p-0 hover:bg-warning/20"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">{t('common.dismiss', 'Dismiss')}</span>
        </Button>
      </div>
    </div>
  );
};
