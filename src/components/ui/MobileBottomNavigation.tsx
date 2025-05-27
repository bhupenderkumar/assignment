import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import AnonymousUserCertificates from '../certificates/AnonymousUserCertificates';
import { scrollToTop } from '../../lib/utils/scrollUtils';

interface MobileBottomNavigationProps {
  // Navigation props
  currentQuestionIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isSubmitting: boolean;

  // Audio props
  hasAudioInstructions: boolean;
  onPlayAudio: () => void;

  // Certificate props
  showCertificateButton?: boolean;
}

const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  currentQuestionIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onFinish,
  canGoNext,
  canGoPrevious,
  isSubmitting,
  hasAudioInstructions,
  onPlayAudio,
  showCertificateButton = true
}) => {
  const { config } = useConfiguration();
  const { commonTranslate } = useTranslations();
  const { anonymousUser } = useInteractiveAssignment();
  const [showCertificates, setShowCertificates] = useState(false);

  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

  const handleCertificateClick = () => {
    scrollToTop(0, 300);
    setTimeout(() => {
      setShowCertificates(true);
    }, 100);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 backdrop-filter backdrop-blur-lg border-t border-gray-700 slide-in-up mobile-safe-area-bottom">
        <div className="px-4 py-4">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex space-x-1">
              {Array.from({ length: totalQuestions }, (_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index < currentQuestionIndex
                      ? 'bg-emerald-400'
                      : index === currentQuestionIndex
                      ? 'bg-indigo-400 w-6'
                      : 'bg-gray-500'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                />
              ))}
            </div>
            <span className="ml-3 text-sm font-medium text-gray-300">
              {currentQuestionIndex + 1} / {totalQuestions}
            </span>
          </div>

          {/* Navigation and Action Buttons */}
          <div className="flex items-center justify-between space-x-4">
            {/* Previous Button */}
            <motion.button
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                !canGoPrevious
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-500 active:scale-95'
              }`}
              whileTap={{ scale: canGoPrevious ? 0.95 : 1 }}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>{commonTranslate('previous', 'Previous')}</span>
              </div>
            </motion.button>

            {/* TTS/Speak Button - Always show */}
            <motion.button
              onClick={() => {
                // This will be handled by the parent component
                window.dispatchEvent(new CustomEvent('speakQuestion'));
              }}
              className="floating-action-button bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              whileTap={{ scale: 0.9 }}
              title={commonTranslate('speakQuestion', 'Speak Question')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12l2 2 4-4" />
              </svg>
            </motion.button>

            {/* Audio Button */}
            {hasAudioInstructions && (
              <motion.button
                onClick={onPlayAudio}
                className="floating-action-button bg-gradient-to-r from-blue-500 to-blue-600 text-white pulse-glow"
                whileTap={{ scale: 0.9 }}
                title={commonTranslate('playAudio', 'Play Audio')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 001.06-7.072l5.658-5.657a1 1 0 011.414 0l5.657 5.657a1 1 0 010 1.414l-5.657 5.657a1 1 0 01-1.414 0l-5.657-5.657a1 1 0 010-1.414z" />
                </svg>
              </motion.button>
            )}

            {/* Certificate Button */}
            {showCertificateButton && anonymousUser && (
              <motion.button
                onClick={handleCertificateClick}
                className="floating-action-button bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
                whileTap={{ scale: 0.9 }}
                title={commonTranslate('myCertificates', 'My Certificates')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </motion.button>
            )}

            {/* Next/Finish Button */}
            <motion.button
              onClick={isLastQuestion ? onFinish : onNext}
              disabled={!canGoNext || isSubmitting}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                !canGoNext || isSubmitting
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
              }`}
              whileTap={{ scale: canGoNext && !isSubmitting ? 0.95 : 1 }}
            >
              <div className="flex items-center justify-center space-x-2">
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                )}
                <span>
                  {isSubmitting
                    ? commonTranslate('processing', 'Processing...')
                    : isLastQuestion
                    ? commonTranslate('finish', 'Finish')
                    : commonTranslate('next', 'Next')
                  }
                </span>
                {!isSubmitting && !isLastQuestion && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Certificate Gallery Modal */}
      <AnonymousUserCertificates
        isOpen={showCertificates}
        onClose={() => setShowCertificates(false)}
      />
    </>
  );
};

export default MobileBottomNavigation;
