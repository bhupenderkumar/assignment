import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../i18n/config';

// Define the language context type
interface LanguageContextType {
  currentLanguage: string;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  changeLanguage: (languageCode: string) => Promise<void>;
  isRTL: boolean;
  getLanguageName: (code: string) => string;
  getNativeLanguageName: (code: string) => string;
  isLanguageSupported: (code: string) => boolean;
  loading: boolean;
}

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// RTL languages list
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || DEFAULT_LANGUAGE);

  // Update current language when i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
      
      // Update document direction for RTL languages
      const isRTL = RTL_LANGUAGES.includes(lng);
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
      
      // Update CSS classes for RTL support
      if (isRTL) {
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
      }
    };

    // Set initial direction and language
    handleLanguageChange(i18n.language);

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Change language function
  const changeLanguage = async (languageCode: string): Promise<void> => {
    if (!isLanguageSupported(languageCode)) {
      console.warn(`Language ${languageCode} is not supported`);
      return;
    }

    setLoading(true);
    try {
      await i18n.changeLanguage(languageCode);
      
      // Store language preference in localStorage
      localStorage.setItem('preferred-language', languageCode);
      
      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: languageCode } 
      }));
      
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if language is RTL
  const isRTL = RTL_LANGUAGES.includes(currentLanguage);

  // Get language name in English
  const getLanguageName = (code: string): string => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
    return language?.name || code;
  };

  // Get language name in native language
  const getNativeLanguageName = (code: string): string => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
    return language?.nativeName || code;
  };

  // Check if language is supported
  const isLanguageSupported = (code: string): boolean => {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    changeLanguage,
    isRTL,
    getLanguageName,
    getNativeLanguageName,
    isLanguageSupported,
    loading,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Export the context for advanced usage
export { LanguageContext };

// Utility function to get browser language
export const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.split('-')[0];
  return SUPPORTED_LANGUAGES.some(lang => lang.code === browserLang) 
    ? browserLang 
    : DEFAULT_LANGUAGE;
};

// Utility function to format text direction
export const getTextDirection = (languageCode: string): 'ltr' | 'rtl' => {
  return RTL_LANGUAGES.includes(languageCode) ? 'rtl' : 'ltr';
};

// Utility function to get language flag emoji (optional)
export const getLanguageFlag = (code: string): string => {
  const flags: Record<string, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    hi: '🇮🇳',
    zh: '🇨🇳',
    ar: '🇸🇦',
  };
  return flags[code] || '🌐';
};
