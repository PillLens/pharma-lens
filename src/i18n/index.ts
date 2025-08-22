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

// Force set language to Azerbaijani and load immediately
const setLanguage = () => {
  const savedLang = localStorage.getItem('selectedLanguage') || 'az';
  localStorage.setItem('selectedLanguage', 'az');
  localStorage.setItem('i18nextLng', 'az');
  return 'az';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'az',
    lng: setLanguage(), // Force Azerbaijani
    debug: true,
    
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


export default i18n;