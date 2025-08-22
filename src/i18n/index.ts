import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import azTranslation from './locales/az.json';
import enTranslation from './locales/en.json';
import ruTranslation from './locales/ru.json';
import trTranslation from './locales/tr.json';

const resources = {
  az: { translation: azTranslation },
  en: { translation: enTranslation },
  ru: { translation: ruTranslation },
  tr: { translation: trTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'az', // Changed to Azerbaijani as fallback
    lng: 'az', // Default to Azerbaijani
    debug: true, // Enable debug mode temporarily
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'selectedLanguage', // Match the key used by language selector
    },
    
    react: {
      useSuspense: false,
    },
  });


export default i18n;