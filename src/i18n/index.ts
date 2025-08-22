import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import azTranslation from './locales/az.json';
import enTranslation from './locales/en.json';
import ruTranslation from './locales/ru.json';
import trTranslation from './locales/tr.json';

const resources = {
  AZ: { translation: azTranslation },
  EN: { translation: enTranslation },
  RU: { translation: ruTranslation },
  TR: { translation: trTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'EN',
    lng: 'AZ', // Default to Azerbaijani
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;