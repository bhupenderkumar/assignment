import React, { useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { 
  assignmentToasts, 
  authToasts, 
  exerciseToasts, 
  toastUtils 
} from '../../utils/toastUtils';

/**
 * Example component demonstrating the multi-language implementation
 * This component shows how to:
 * - Use translation hooks
 * - Handle RTL/LTR layouts
 * - Use translation-aware toast notifications
 * - Integrate language switcher
 */
const TranslationExample: React.FC = () => {
  const [counter, setCounter] = useState(0);
  
  // Get translation functions
  const {
    commonTranslate,
    authTranslate,
    assignmentTranslate,
    exerciseTranslate,
    validationTranslate,
    getPlaceholder,
    formatNumber,
    formatDate,
    isRTL,
    getDirectionClass,
    getTextAlignClass,
    getSpacingClass
  } = useTranslations();

  // Get language context
  const { currentLanguage, supportedLanguages } = useLanguage();

  // Demo functions for toast notifications
  const showSuccessToast = () => {
    assignmentToasts.completed();
  };

  const showErrorToast = () => {
    authToasts.authenticationFailed();
  };

  const showInfoToast = () => {
    toastUtils.info('loading', undefined, 'Loading...');
  };

  const showWarningToast = () => {
    toastUtils.warning('unsavedChanges', undefined, 'You have unsaved changes');
  };

  const showCustomToast = () => {
    exerciseToasts.excellent();
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-8 ${getDirectionClass()}`}>
      {/* Header */}
      <div className={`${getTextAlignClass()}`}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {commonTranslate('language')} {commonTranslate('settings')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Multi-language implementation demonstration
        </p>
      </div>

      {/* Language Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Current Language Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Language:
            </label>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {supportedLanguages.find(lang => lang.code === currentLanguage)?.nativeName || currentLanguage}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Text Direction:
            </label>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {isRTL ? 'Right-to-Left (RTL)' : 'Left-to-Right (LTR)'}
            </p>
          </div>
        </div>
      </div>

      {/* Language Switcher Demo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Language Switcher Variants
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
              Dropdown Variant
            </h3>
            <LanguageSwitcher variant="dropdown" showFlags={true} showNativeNames={true} />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
              Button Variant
            </h3>
            <LanguageSwitcher variant="buttons" showFlags={true} showNativeNames={false} />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
              Compact Variant
            </h3>
            <LanguageSwitcher variant="compact" showFlags={true} />
          </div>
        </div>
      </div>

      {/* Translation Examples */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Translation Examples
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
              Common Translations
            </h3>
            <div className="space-y-2">
              <p><strong>{commonTranslate('loading')}:</strong> Loading indicator</p>
              <p><strong>{commonTranslate('save')}:</strong> Save button</p>
              <p><strong>{commonTranslate('cancel')}:</strong> Cancel button</p>
              <p><strong>{commonTranslate('success')}:</strong> Success message</p>
              <p><strong>{commonTranslate('error')}:</strong> Error message</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
              Authentication Translations
            </h3>
            <div className="space-y-2">
              <p><strong>{authTranslate('signIn')}:</strong> Sign in button</p>
              <p><strong>{authTranslate('signUp')}:</strong> Sign up button</p>
              <p><strong>{authTranslate('email')}:</strong> Email field</p>
              <p><strong>{authTranslate('password')}:</strong> Password field</p>
              <p><strong>{authTranslate('welcomeBack')}:</strong> Welcome message</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification Demo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Toast Notification Demo
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={showSuccessToast}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            {commonTranslate('success')}
          </button>
          <button
            onClick={showErrorToast}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            {commonTranslate('error')}
          </button>
          <button
            onClick={showInfoToast}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Info
          </button>
          <button
            onClick={showWarningToast}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Warning
          </button>
          <button
            onClick={showCustomToast}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Custom
          </button>
        </div>
      </div>

      {/* Formatting Examples */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Localization Examples
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
              Number Formatting
            </h3>
            <p>Counter: <strong>{formatNumber(counter)}</strong></p>
            <p>Large Number: <strong>{formatNumber(1234567.89)}</strong></p>
            <button
              onClick={() => setCounter(c => c + 1)}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {commonTranslate('next')}
            </button>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
              Date Formatting
            </h3>
            <p>Current Date: <strong>{formatDate(new Date())}</strong></p>
            <p>Long Format: <strong>{formatDate(new Date(), { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</strong></p>
          </div>
        </div>
      </div>

      {/* RTL Demo */}
      {isRTL && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-200">
            RTL Layout Active
          </h2>
          <p className="text-yellow-700 dark:text-yellow-300">
            This section demonstrates right-to-left text direction and layout adjustments.
            Notice how the text alignment, spacing, and overall layout adapt to RTL languages.
          </p>
        </div>
      )}

      {/* Form Example */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Form with Translations
        </h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {authTranslate('email')}
            </label>
            <input
              type="email"
              placeholder={getPlaceholder('enterEmail')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {authTranslate('password')}
            </label>
            <input
              type="password"
              placeholder={getPlaceholder('enterPassword')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            type="button"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {authTranslate('signIn')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TranslationExample;
