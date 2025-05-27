import React from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useTranslations } from '../../hooks/useTranslations';

interface MobileQuestionNavigationProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  completedQuestions: boolean[];
  onQuestionSelect: (index: number) => void;
  disabled?: boolean;
}

const MobileQuestionNavigation: React.FC<MobileQuestionNavigationProps> = ({
  currentQuestionIndex,
  totalQuestions,
  completedQuestions,
  onQuestionSelect,
  disabled = false
}) => {
  const { config } = useConfiguration();
  const { commonTranslate } = useTranslations();

  // Show only a subset of questions on mobile for better UX
  const maxVisibleQuestions = 7;
  const shouldShowSubset = totalQuestions > maxVisibleQuestions;

  const getVisibleQuestions = () => {
    if (!shouldShowSubset) {
      return Array.from({ length: totalQuestions }, (_, i) => i);
    }

    const halfVisible = Math.floor(maxVisibleQuestions / 2);
    let start = Math.max(0, currentQuestionIndex - halfVisible);
    let end = Math.min(totalQuestions, start + maxVisibleQuestions);

    // Adjust start if we're near the end
    if (end - start < maxVisibleQuestions) {
      start = Math.max(0, end - maxVisibleQuestions);
    }

    return Array.from({ length: end - start }, (_, i) => start + i);
  };

  const visibleQuestions = getVisibleQuestions();

  const getQuestionStatus = (index: number) => {
    if (index === currentQuestionIndex) return 'current';
    if (completedQuestions[index]) return 'completed';
    if (index < currentQuestionIndex) return 'visited';
    return 'upcoming';
  };

  const getQuestionStyles = (index: number) => {
    const status = getQuestionStatus(index);
    
    switch (status) {
      case 'current':
        return 'bg-indigo-500 text-white border-indigo-500 scale-110 shadow-lg shadow-indigo-500/50';
      case 'completed':
        return 'bg-green-500 text-white border-green-500 shadow-md';
      case 'visited':
        return 'bg-yellow-500 text-white border-yellow-500 shadow-md';
      default:
        return config.darkMode
          ? 'bg-gray-700 text-gray-300 border-gray-600'
          : 'bg-gray-200 text-gray-600 border-gray-300';
    }
  };

  const getQuestionIcon = (index: number) => {
    const status = getQuestionStatus(index);
    
    switch (status) {
      case 'current':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'visited':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return <span className="text-sm font-medium">{index + 1}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          {commonTranslate('questionNavigation', 'Question Navigation')}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentQuestionIndex + 1} / {totalQuestions}
        </span>
      </div>

      {/* Question Grid */}
      <div className="flex flex-wrap gap-2 justify-center">
        {/* Show previous indicator if we're showing a subset */}
        {shouldShowSubset && visibleQuestions[0] > 0 && (
          <motion.button
            onClick={() => onQuestionSelect(Math.max(0, visibleQuestions[0] - 1))}
            disabled={disabled}
            className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-400 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-600 disabled:opacity-50"
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
        )}

        {/* Visible Questions */}
        {visibleQuestions.map((questionIndex) => (
          <motion.button
            key={questionIndex}
            onClick={() => onQuestionSelect(questionIndex)}
            disabled={disabled}
            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-300 disabled:opacity-50 ${getQuestionStyles(questionIndex)}`}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: questionIndex === currentQuestionIndex ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
            title={`${commonTranslate('question', 'Question')} ${questionIndex + 1}`}
          >
            {getQuestionIcon(questionIndex)}
          </motion.button>
        ))}

        {/* Show next indicator if we're showing a subset */}
        {shouldShowSubset && visibleQuestions[visibleQuestions.length - 1] < totalQuestions - 1 && (
          <motion.button
            onClick={() => onQuestionSelect(Math.min(totalQuestions - 1, visibleQuestions[visibleQuestions.length - 1] + 1))}
            disabled={disabled}
            className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-400 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-600 disabled:opacity-50"
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-4 mt-3 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-gray-600 dark:text-gray-400">{commonTranslate('completed', 'Completed')}</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-indigo-500"></div>
          <span className="text-gray-600 dark:text-gray-400">{commonTranslate('current', 'Current')}</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-gray-400"></div>
          <span className="text-gray-600 dark:text-gray-400">{commonTranslate('upcoming', 'Upcoming')}</span>
        </div>
      </div>
    </div>
  );
};

export default MobileQuestionNavigation;
