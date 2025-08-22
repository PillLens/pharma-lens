import { useTranslation } from "@/hooks/useTranslation";

interface TranslatedTextProps {
  translationKey: string;
  fallback?: string;
  values?: Record<string, string | number>;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const TranslatedText = ({ 
  translationKey, 
  fallback, 
  values = {},
  className,
  as: Component = 'span'
}: TranslatedTextProps) => {
  const { t } = useTranslation();
  
  const text = t(translationKey, fallback || translationKey, values);
  
  return <Component className={className}>{text}</Component>;
};

// Helper hook for common translation patterns
export const useCommonTranslations = () => {
  const { t } = useTranslation();
  
  return {
    // Common actions
    save: () => t('common.save'),
    cancel: () => t('common.cancel'),
    delete: () => t('common.delete'),
    edit: () => t('common.edit'),
    add: () => t('common.add'),
    close: () => t('common.close'),
    
    // Common states
    loading: () => t('common.loading'),
    error: () => t('common.error'),
    success: () => t('common.success'),
    
    // Medication related
    medications: () => t('navigation.medications'),
    scanner: () => t('navigation.scanner'),
    reminders: () => t('navigation.reminders'),
    
    // Common placeholders
    enterText: () => t('common.enterText'),
    selectOption: () => t('common.selectOption'),
  };
};