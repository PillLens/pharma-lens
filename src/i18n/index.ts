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
  'en': { translation: enTranslation },
  'en-US': { translation: enTranslation },
  'en-GB': { translation: enTranslation },
  'en-AU': { translation: enTranslation },
  'en-CA': { translation: enTranslation },
  RU: { translation: ruTranslation },
  TR: { translation: trTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: ['EN', 'en', 'en-US'],
    debug: true, // Enable debug to see what's happening
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'selectedLanguage',
      convertDetectedLanguage: (lng) => {
        console.log('Detected browser language:', lng);
        // Convert any English variant to our base English
        if (lng.startsWith('en')) {
          console.log('Converting to EN');
          return 'EN';
        }
        return lng;
      }
    },
    
    react: {
      useSuspense: false,
    },
  });

// Debug logging
console.log('i18n initialized with resources:', Object.keys(resources));
console.log('Final language after init:', i18n.language);
console.log('Available languages:', i18n.languages);
console.log('EN authPage translations:', resources.EN?.translation?.authPage);
console.log('Testing direct key access:', i18n.t('authPage.dataEncryption'));
console.log('All authPage keys:', Object.keys(resources.EN?.translation?.authPage || {}));

export default i18n;