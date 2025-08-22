import { useTranslation as useReactI18next } from 'react-i18next';

export const useTranslation = (namespace?: string) => {
  const { t, i18n } = useReactI18next(namespace);
  
  const changeLanguage = (language: string) => {
    localStorage.setItem('selectedLanguage', language);
    i18n.changeLanguage(language);
  };

  return {
    t,
    i18n,
    language: i18n.language,
    changeLanguage,
    isRTL: false, // Add RTL support later if needed
  };
};