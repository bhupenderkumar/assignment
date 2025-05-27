import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage, getLanguageFlag } from '../../context/LanguageContext';
import { useConfiguration } from '../../context/ConfigurationContext';
import { motion, AnimatePresence } from 'framer-motion';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'compact';
  showFlags?: boolean;
  showNativeNames?: boolean;
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  showFlags = true,
  showNativeNames = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const { 
    currentLanguage, 
    supportedLanguages, 
    changeLanguage, 
    loading,
    getNativeLanguageName,
    getLanguageName 
  } = useLanguage();
  const { config } = useConfiguration();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode !== currentLanguage) {
      await changeLanguage(languageCode);
      setIsOpen(false);
    }
  };

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);

  // Compact variant - just a flag/icon
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300
            ${config.darkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-white' 
              : 'bg-white hover:bg-gray-50 text-gray-700'
            }
            border border-gray-200 dark:border-gray-600
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
          `}
          title={t('common.language')}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
          ) : (
            <span className="text-lg">{showFlags ? getLanguageFlag(currentLanguage) : '🌐'}</span>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`
                absolute top-full mt-2 right-0 z-50 min-w-48
                ${config.darkMode ? 'bg-gray-800' : 'bg-white'}
                rounded-lg shadow-lg border border-gray-200 dark:border-gray-600
                py-2
              `}
            >
              {supportedLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`
                    w-full px-4 py-2 text-left flex items-center space-x-3
                    transition-colors duration-200
                    ${currentLanguage === language.code
                      ? `${config.darkMode ? 'bg-gray-700' : 'bg-gray-100'} font-medium`
                      : `${config.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`
                    }
                    ${config.darkMode ? 'text-white' : 'text-gray-700'}
                  `}
                >
                  {showFlags && (
                    <span className="text-lg">{getLanguageFlag(language.code)}</span>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {showNativeNames ? language.nativeName : language.name}
                    </span>
                    {showNativeNames && language.nativeName !== language.name && (
                      <span className="text-xs opacity-70">{language.name}</span>
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Button variant - horizontal buttons
  if (variant === 'buttons') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {supportedLanguages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            disabled={loading}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
              flex items-center space-x-2
              ${currentLanguage === language.code
                ? `text-white shadow-md`
                : `${config.darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={currentLanguage === language.code ? {
              background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
            } : {}}
          >
            {showFlags && (
              <span className="text-sm">{getLanguageFlag(language.code)}</span>
            )}
            <span>
              {showNativeNames ? language.nativeName : language.name}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300
          ${config.darkMode 
            ? 'bg-gray-800 hover:bg-gray-700 text-white' 
            : 'bg-white hover:bg-gray-50 text-gray-700'
          }
          border border-gray-200 dark:border-gray-600
          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
          min-w-32
        `}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
        ) : (
          <>
            {showFlags && (
              <span className="text-lg">{getLanguageFlag(currentLanguage)}</span>
            )}
            <span className="text-sm font-medium">
              {showNativeNames && currentLang 
                ? currentLang.nativeName 
                : getLanguageName(currentLanguage)
              }
            </span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`
              absolute top-full mt-2 left-0 z-50 min-w-full
              ${config.darkMode ? 'bg-gray-800' : 'bg-white'}
              rounded-lg shadow-lg border border-gray-200 dark:border-gray-600
              py-2
            `}
          >
            {supportedLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`
                  w-full px-4 py-2 text-left flex items-center space-x-3
                  transition-colors duration-200
                  ${currentLanguage === language.code
                    ? `${config.darkMode ? 'bg-gray-700' : 'bg-gray-100'} font-medium`
                    : `${config.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`
                  }
                  ${config.darkMode ? 'text-white' : 'text-gray-700'}
                `}
              >
                {showFlags && (
                  <span className="text-lg">{getLanguageFlag(language.code)}</span>
                )}
                <div className="flex flex-col">
                  <span className="text-sm">
                    {showNativeNames ? language.nativeName : language.name}
                  </span>
                  {showNativeNames && language.nativeName !== language.name && (
                    <span className="text-xs opacity-70">{language.name}</span>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
