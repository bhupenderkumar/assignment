import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';
import hiTranslations from './locales/hi.json';
import zhTranslations from './locales/zh.json';
import arTranslations from './locales/ar.json';

// Define available languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

// Default language
export const DEFAULT_LANGUAGE = 'en';

// Language detection options
const detectionOptions = {
  // Order of language detection methods
  order: ['localStorage', 'navigator', 'htmlTag'],
  
  // Cache user language
  caches: ['localStorage'],
  
  // Optional: exclude certain languages from detection
  excludeCacheFor: ['cimode'],
  
  // Optional: only detect languages that are in the whitelist
  checkWhitelist: true,
};

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Language resources
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      fr: { translation: frTranslations },
      de: { translation: deTranslations },
      hi: { translation: hiTranslations },
      zh: { translation: zhTranslations },
      ar: { translation: arTranslations },
    },
    
    // Language detection
    detection: detectionOptions,
    
    // Fallback language
    fallbackLng: DEFAULT_LANGUAGE,
    
    // Whitelist of supported languages
    supportedLngs: SUPPORTED_LANGUAGES.map(lang => lang.code),
    
    // Debug mode (disable in production)
    debug: process.env.NODE_ENV === 'development',
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React options
    react: {
      useSuspense: false, // Disable suspense for better error handling
    },
    
    // Namespace options
    defaultNS: 'translation',
    
    // Key separator
    keySeparator: '.',
    
    // Nested separator
    nsSeparator: ':',
    
    // Return objects for nested keys
    returnObjects: true,
  });

export default i18n;
