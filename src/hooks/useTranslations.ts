import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';

// Custom hook that provides enhanced translation functionality
export const useTranslations = () => {
  const { t, i18n } = useTranslation();
  const { currentLanguage, isRTL } = useLanguage();

  // Enhanced translation function with fallback
  const translate = (key: string, options?: any, fallback?: string): string => {
    const translation = t(key, options);

    // Ensure we always return a string
    const translationStr = typeof translation === 'string' ? translation : String(translation);

    // If translation is the same as key (not found), return fallback or key
    if (translationStr === key && fallback) {
      return fallback;
    }

    return translationStr;
  };

  // Translation function for toast messages
  const toastTranslate = {
    success: (key: string, fallback?: string) => translate(`toast.success.${key}`, undefined, fallback),
    error: (key: string, fallback?: string) => translate(`toast.error.${key}`, undefined, fallback),
    info: (key: string, fallback?: string) => translate(`toast.info.${key}`, undefined, fallback),
    warning: (key: string, fallback?: string) => translate(`toast.warning.${key}`, undefined, fallback),
  };

  // Translation function for form validation
  const validationTranslate = (key: string, options?: any, fallback?: string) =>
    translate(`forms.validation.${key}`, options, fallback);

  // Translation function for common UI elements
  const commonTranslate = (key: string, fallback?: string) =>
    translate(`common.${key}`, undefined, fallback);

  // Translation function for navigation
  const navTranslate = (key: string, fallback?: string) =>
    translate(`navigation.${key}`, undefined, fallback);

  // Translation function for authentication
  const authTranslate = (key: string, fallback?: string) =>
    translate(`auth.${key}`, undefined, fallback);

  // Translation function for assignments
  const assignmentTranslate = (key: string, options?: any, fallback?: string) =>
    translate(`assignments.${key}`, options, fallback);

  // Translation function for exercises
  const exerciseTranslate = (key: string, options?: any, fallback?: string) =>
    translate(`exercises.${key}`, options, fallback);

  // Function to get placeholder text
  const getPlaceholder = (key: string, fallback?: string) =>
    translate(`forms.placeholders.${key}`, undefined, fallback);

  // Function to format numbers according to locale
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
    try {
      return new Intl.NumberFormat(currentLanguage, options).format(number);
    } catch (error) {
      return number.toString();
    }
  };

  // Function to format dates according to locale
  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(currentLanguage, options).format(dateObj);
    } catch (error) {
      return date.toString();
    }
  };

  // Function to format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (date: Date | string): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return translate('common.justNow', undefined, 'Just now');
      }

      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return translate('common.minutesAgo', { count: diffInMinutes }, `${diffInMinutes} minutes ago`);
      }

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return translate('common.hoursAgo', { count: diffInHours }, `${diffInHours} hours ago`);
      }

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) {
        return translate('common.daysAgo', { count: diffInDays }, `${diffInDays} days ago`);
      }

      // For older dates, just format normally
      return formatDate(dateObj, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
      return date.toString();
    }
  };

  // Function to get text direction class
  const getDirectionClass = (): string => {
    return isRTL ? 'rtl' : 'ltr';
  };

  // Function to get text alignment class
  const getTextAlignClass = (): string => {
    return isRTL ? 'text-right' : 'text-left';
  };

  // Function to get margin/padding classes for RTL
  const getSpacingClass = (type: 'ml' | 'mr' | 'pl' | 'pr', size: string): string => {
    if (type === 'ml' || type === 'pl') {
      return isRTL ? `${type.replace('l', 'r')}-${size}` : `${type}-${size}`;
    } else {
      return isRTL ? `${type.replace('r', 'l')}-${size}` : `${type}-${size}`;
    }
  };

  // Function to check if a translation exists
  const hasTranslation = (key: string): boolean => {
    return i18n.exists(key);
  };

  // Function to get all translations for a namespace
  const getNamespaceTranslations = (namespace: string): Record<string, any> => {
    return i18n.getResourceBundle(currentLanguage, 'translation')?.[namespace] || {};
  };

  return {
    // Core translation functions
    t: translate,
    translate,

    // Specialized translation functions
    toastTranslate,
    validationTranslate,
    commonTranslate,
    navTranslate,
    authTranslate,
    assignmentTranslate,
    exerciseTranslate,
    getPlaceholder,

    // Formatting functions
    formatNumber,
    formatDate,
    formatRelativeTime,

    // RTL/Direction utilities
    isRTL,
    getDirectionClass,
    getTextAlignClass,
    getSpacingClass,

    // Utility functions
    hasTranslation,
    getNamespaceTranslations,
    currentLanguage,

    // Original i18n instance for advanced usage
    i18n,
  };
};

// Export individual specialized hooks for convenience
export const useToastTranslations = () => {
  const { toastTranslate } = useTranslations();
  return toastTranslate;
};

export const useValidationTranslations = () => {
  const { validationTranslate } = useTranslations();
  return validationTranslate;
};

export const useCommonTranslations = () => {
  const { commonTranslate } = useTranslations();
  return commonTranslate;
};

export const useAuthTranslations = () => {
  const { authTranslate } = useTranslations();
  return authTranslate;
};

export const useAssignmentTranslations = () => {
  const { assignmentTranslate } = useTranslations();
  return assignmentTranslate;
};

export const useExerciseTranslations = () => {
  const { exerciseTranslate } = useTranslations();
  return exerciseTranslate;
};
