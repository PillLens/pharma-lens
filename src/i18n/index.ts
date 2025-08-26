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
  'en-US': { translation: enTranslation },
  RU: { translation: ruTranslation },
  TR: { translation: trTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'EN',
    debug: true, // Enable debug to see what's happening
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'selectedLanguage',
    },
    
    react: {
      useSuspense: false,
    },
  });

// Debug logging
console.log('i18n initialized with resources:', Object.keys(resources));
console.log('Detected language:', i18n.language);
console.log('Available languages:', i18n.languages);

export default i18n;