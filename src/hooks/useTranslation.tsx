import { useTranslation as useReactI18next } from 'react-i18next';

export const useTranslation = (namespace?: string) => {
  const { t, i18n } = useReactI18next(namespace);
  
  const changeLanguage = (language: string) => {
    // Clear any existing language cache
    localStorage.removeItem('selectedLanguage');
    localStorage.removeItem('i18nextLng');
    // Set the new language
    localStorage.setItem('selectedLanguage', language);
    localStorage.setItem('i18nextLng', language);
    i18n.changeLanguage(language);
    // Force page reload to ensure clean state
    window.location.reload();
  };

  return {
    t,
    i18n,
    language: i18n.language,
    changeLanguage,
    isRTL: false, // Add RTL support later if needed
  };
};