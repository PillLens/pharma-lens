import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
// import azTranslation from './locales/az.json';
import enTranslation from './locales/en.json';
// import ruTranslation from './locales/ru.json';
// import trTranslation from './locales/tr.json';

const resources = {
  // AZ: { translation: azTranslation },
  EN: { translation: enTranslation },
  'en': { translation: enTranslation },
  'en-US': { translation: enTranslation },
  'en-GB': { translation: enTranslation },
  'en-AU': { translation: enTranslation },
  'en-CA': { translation: enTranslation },
  // RU: { translation: ruTranslation },
  // TR: { translation: trTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: ['EN', 'en', 'en-US'],
    debug: false, // Disable debug logging for production
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'selectedLanguage',
      convertDetectedLanguage: (lng) => {
        // Convert any English variant to our base English
        if (lng.startsWith('en')) {
          return 'EN';
        }
        return lng;
      }
    },
    
    react: {
      useSuspense: false,
    },
  });

console.log('i18n initialized with resources:', Object.keys(resources));

export default i18n;